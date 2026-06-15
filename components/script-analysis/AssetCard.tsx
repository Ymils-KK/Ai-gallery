"use client";

import { useState } from "react";
import { Copy, Check, Sparkles, Loader2, ChevronDown, Plus, X, Trash2 } from "lucide-react";
import ImageUploadSlot from "./ImageUploadSlot";
import PromptChat from "./PromptChat";

export interface Outfit {
  id: string;
  name: string;
  description: string;
  imagePrompt: string;
  imagePromptCn: string;
  imageUrl: string;
}

export interface AssetItem {
  id: string;
  name: string;
  description: string;
  imagePrompt: string;
  imagePromptCn: string;
  imageUrl: string;
  tier?: "major" | "minor";
  outfits?: Outfit[];
}

interface AssetCardProps {
  asset: AssetItem;
  projectId: string;
  category: "characters" | "scenes" | "props";
  onImageUpload: (assetId: string, file: File) => Promise<void>;
  onImageRemove: (assetId: string) => void;
  onPromptUpdate: (assetId: string, newPrompt: string, newPromptCn?: string) => void;
  onGeneratePrompt: (assetId: string) => Promise<void>;
  // 服装相关
  onAddOutfit?: (charId: string, name: string, desc: string) => void;
  onOutfitImageUpload?: (charId: string, outfitId: string, file: File) => Promise<void>;
  onOutfitImageRemove?: (charId: string, outfitId: string) => void;
  onOutfitPromptUpdate?: (charId: string, outfitId: string, newPrompt: string, newPromptCn?: string) => void;
  onGenerateOutfitPrompt?: (charId: string, outfitId: string) => Promise<void>;
  onDeleteOutfit?: (charId: string, outfitId: string) => void;
}

export default function AssetCard({
  asset,
  projectId,
  category,
  onImageUpload,
  onImageRemove,
  onPromptUpdate,
  onGeneratePrompt,
  onAddOutfit,
  onOutfitImageUpload,
  onOutfitImageRemove,
  onOutfitPromptUpdate,
  onGenerateOutfitPrompt,
  onDeleteOutfit,
}: AssetCardProps) {
  const [copied, setCopied] = useState(false);
  const [showCn, setShowCn] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  // 服装区状态
  const [outfitsOpen, setOutfitsOpen] = useState(false);
  const [addingOutfit, setAddingOutfit] = useState(false);
  const [newOutfitName, setNewOutfitName] = useState("");
  const [newOutfitDesc, setNewOutfitDesc] = useState("");
  const [outfitGenIdx, setOutfitGenIdx] = useState<number | null>(null);
  const [outfitCollapsed, setOutfitCollapsed] = useState<Record<string, boolean>>({});

  async function handleCopy() {
    const text = showCn && asset.imagePromptCn ? asset.imagePromptCn : asset.imagePrompt;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const displayPrompt = showCn && asset.imagePromptCn ? asset.imagePromptCn : asset.imagePrompt;

  const isMinor = asset.tier === "minor";
  const categoryLabel = category === "characters" ? "人物" : category === "scenes" ? "场景" : "道具";

  return (
    <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06] p-6 flex flex-col gap-5 transition-all hover:border-white/[0.10]">
      {/* 名称、分级、描述 */}
      <div>
        <div className="flex items-center gap-2">
          <h4 className="text-lg font-semibold text-white">{asset.name}</h4>
          {asset.tier === "major" && (
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-400">
              重要{categoryLabel}
            </span>
          )}
          {isMinor && (
            <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs text-white/40">
              次要{categoryLabel}
            </span>
          )}
        </div>
        {asset.description && (
          <p className="text-base text-white/50 mt-1.5 leading-relaxed">
            {asset.description}
          </p>
        )}
      </div>

      {/* 图片上传区域（仅重要人物或有提示词的才显示） */}
      {!isMinor && (
        <ImageUploadSlot
          imageUrl={asset.imageUrl}
          onUpload={(file) => onImageUpload(asset.id, file)}
          onRemove={() => onImageRemove(asset.id)}
        />
      )}

      {/* 次要资产：显示生成按钮 */}
      {isMinor && (
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.03] p-4 flex items-center justify-between">
          <p className="text-sm text-white/25">次要{categoryLabel}，暂无提示词</p>
          <button
            type="button"
            onClick={async () => {
              setGenerating(true);
              try {
                await onGeneratePrompt(asset.id);
              } finally {
                setGenerating(false);
              }
            }}
            disabled={generating}
            className="flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] px-4 py-1.5 text-sm text-white/50 hover:text-white hover:bg-white/[0.10] transition-all disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>生成中</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>生成提示词</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 重要人物/场景/道具的提示词 */}
      {!isMinor && asset.imagePrompt && (
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/30 font-medium">🪄 生图提示词</span>
            <div className="flex items-center gap-1">
              {/* 中英文切换 */}
              {asset.imagePromptCn && (
                <button
                  onClick={() => setShowCn(!showCn)}
                  className={`rounded-md px-2.5 py-1 text-sm transition-all ${
                    showCn
                      ? "bg-white/[0.10] text-white"
                      : "text-white/30 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  {showCn ? "中" : "EN"}
                </button>
              )}
              {/* 对话修改按钮 */}
              <PromptChat
                projectId={projectId}
                assetName={asset.name}
                assetType={categoryLabel}
                currentPrompt={asset.imagePrompt}
                onPromptUpdate={(newPrompt) => {
                  setCollapsed(false); // 修改后自动展开
                  onPromptUpdate(asset.id, newPrompt);
                }}
              />
              {/* 复制按钮 */}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-md px-2.5 py-1 text-sm text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
                title="复制提示词"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-green-400">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>复制</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 提示词内容（折叠/展开） */}
          <div>
            <p className="text-sm text-white/60 leading-relaxed break-words font-mono">
              {collapsed && displayPrompt.length > 200
                ? displayPrompt.slice(0, 200) + "…"
                : displayPrompt}
            </p>
            {displayPrompt.length > 200 && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="mt-1 flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                <span>{collapsed ? "展开全部" : "收起"}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===== 服装列表（仅重要人物） ===== */}
      {category === "characters" && !isMinor && (
        <div className="border-t border-white/[0.06] pt-4">
          {/* 折叠头部 */}
          <button
            type="button"
            onClick={() => setOutfitsOpen(!outfitsOpen)}
            className="flex items-center justify-between w-full hover:bg-white/[0.02] rounded-lg px-1 py-1 -mx-1 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white/60">👗 服装</span>
              {asset.outfits && asset.outfits.length > 0 && (
                <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-xs text-white/40">
                  {asset.outfits.length}
                </span>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 text-white/30 transition-transform duration-200 ${outfitsOpen ? "rotate-180" : ""}`} />
          </button>

          {outfitsOpen && (
            <div className="mt-3 flex flex-col gap-3">
              {/* 已有服装列表 */}
              {asset.outfits?.map((outfit, idx) => {
                const ocKey = outfit.id;
                const oc = outfitCollapsed[ocKey] ?? true;
                const hasPrompt = !!outfit.imagePrompt;

                return (
                  <div key={outfit.id} className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-3">
                    {/* 服装名称 + 操作 */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white/80">{outfit.name}</span>
                        {hasPrompt && (
                          <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/30">已生成</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {/* 生成/重生成按钮 */}
                        <button
                          type="button"
                          onClick={async () => {
                            setOutfitGenIdx(idx);
                            try {
                              await onGenerateOutfitPrompt?.(asset.id, outfit.id);
                            } finally {
                              setOutfitGenIdx(null);
                            }
                          }}
                          disabled={outfitGenIdx === idx}
                          className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-white/35 hover:text-white hover:bg-white/[0.06] transition-all disabled:opacity-50"
                        >
                          {outfitGenIdx === idx ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                          <span>{hasPrompt ? "重新生成" : "生成提示词"}</span>
                        </button>
                        {/* 删除服装 */}
                        <button
                          type="button"
                          onClick={() => onDeleteOutfit?.(asset.id, outfit.id)}
                          className="rounded p-0.5 text-white/15 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {outfit.description && (
                      <p className="text-xs text-white/40 mb-2">{outfit.description}</p>
                    )}

                    {/* 图片 + 提示词 */}
                    {hasPrompt ? (
                      <>
                        <ImageUploadSlot
                          imageUrl={outfit.imageUrl}
                          onUpload={(file) => onOutfitImageUpload ? onOutfitImageUpload(asset.id, outfit.id, file) : Promise.resolve()}
                          onRemove={() => onOutfitImageRemove?.(asset.id, outfit.id)}
                        />
                        <div className="mt-2 rounded bg-white/[0.02] border border-white/[0.03] p-2.5">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] text-white/25">提示词</span>
                            <div className="flex items-center gap-1">
                              {outfit.imagePromptCn && (
                                <button
                                  onClick={() => setOutfitCollapsed((prev) => ({ ...prev, [ocKey]: !oc }))}
                                  className={`rounded px-1.5 py-0.5 text-[10px] ${
                                    !oc ? "bg-white/[0.10] text-white" : "text-white/25 hover:text-white"
                                  }`}
                                >
                                  {!oc ? "中" : "EN"}
                                </button>
                              )}
                              <PromptChat
                                projectId={projectId}
                                assetName={`${asset.name} - ${outfit.name}`}
                                assetType="服装"
                                currentPrompt={outfit.imagePrompt}
                                onPromptUpdate={(newPrompt) => {
                                  setOutfitCollapsed((prev) => ({ ...prev, [ocKey]: false }));
                                  onOutfitPromptUpdate?.(asset.id, outfit.id, newPrompt);
                                }}
                              />
                              <button
                                onClick={() => {
                                  const text = !oc && outfit.imagePromptCn ? outfit.imagePromptCn : outfit.imagePrompt;
                                  navigator.clipboard.writeText(text);
                                }}
                                className="rounded px-1.5 py-0.5 text-[10px] text-white/25 hover:text-white"
                              >
                                复制
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-white/50 leading-relaxed break-words font-mono">
                            {oc && outfit.imagePrompt.length > 150
                              ? outfit.imagePrompt.slice(0, 150) + "…"
                              : !oc && outfit.imagePromptCn
                              ? (outfit.imagePromptCn.length > 150 ? outfit.imagePromptCn.slice(0, 150) + "…" : outfit.imagePromptCn)
                              : outfit.imagePrompt}
                          </p>
                          {outfit.imagePrompt.length > 150 && (
                            <button
                              onClick={() => setOutfitCollapsed((prev) => ({ ...prev, [ocKey]: !oc }))}
                              className="mt-1 flex items-center gap-0.5 text-[10px] text-white/20 hover:text-white/50 transition-colors"
                            >
                              <span>{oc ? "展开" : "收起"}</span>
                              <ChevronDown className={`h-3 w-3 transition-transform ${!oc ? "rotate-180" : ""}`} />
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="rounded bg-white/[0.02] border border-white/[0.03] p-2.5 text-center">
                        <p className="text-[11px] text-white/20">点击「生成提示词」创建服装图片提示词</p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 添加新服装表单 */}
              {addingOutfit ? (
                <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/50">添加服装</span>
                    <button type="button" onClick={() => { setAddingOutfit(false); setNewOutfitName(""); setNewOutfitDesc(""); }} className="text-white/25 hover:text-white">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input
                    value={newOutfitName}
                    onChange={(e) => setNewOutfitName(e.target.value)}
                    placeholder="场景标签，如：宴会、日常、战斗"
                    maxLength={30}
                    className="w-full rounded bg-white/[0.04] border border-white/[0.06] px-2.5 py-1.5 text-xs text-white placeholder:text-white/15 focus:outline-none"
                  />
                  <textarea
                    value={newOutfitDesc}
                    onChange={(e) => setNewOutfitDesc(e.target.value)}
                    placeholder="服装描述（可选）"
                    rows={2}
                    maxLength={100}
                    className="w-full rounded bg-white/[0.04] border border-white/[0.06] px-2.5 py-1.5 text-xs text-white placeholder:text-white/15 focus:outline-none resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newOutfitName.trim()) return;
                      onAddOutfit?.(asset.id, newOutfitName.trim(), newOutfitDesc.trim());
                      setNewOutfitName("");
                      setNewOutfitDesc("");
                      setAddingOutfit(false);
                    }}
                    disabled={!newOutfitName.trim()}
                    className="self-start rounded-full bg-white/[0.08] px-4 py-1.5 text-xs font-medium text-white/60 hover:bg-white/[0.12] disabled:opacity-30 transition-all"
                  >
                    确认添加
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingOutfit(true)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/[0.08] py-2.5 text-xs text-white/30 hover:text-white/50 hover:border-white/[0.15] transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>添加服装</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
