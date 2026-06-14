"use client";

import { useState } from "react";
import { Copy, Check, Sparkles, Loader2 } from "lucide-react";
import ImageUploadSlot from "./ImageUploadSlot";
import PromptChat from "./PromptChat";

export interface AssetItem {
  id: string;
  name: string;
  description: string;
  imagePrompt: string;
  imagePromptCn: string;
  imageUrl: string;
  tier?: "major" | "minor";
}

interface AssetCardProps {
  asset: AssetItem;
  projectId: string;
  category: "characters" | "scenes" | "props";
  onImageUpload: (assetId: string, file: File) => Promise<void>;
  onImageRemove: (assetId: string) => void;
  onPromptUpdate: (assetId: string, newPrompt: string, newPromptCn?: string) => void;
  onGeneratePrompt: (assetId: string) => Promise<void>;
}

export default function AssetCard({
  asset,
  projectId,
  category,
  onImageUpload,
  onImageRemove,
  onPromptUpdate,
  onGeneratePrompt,
}: AssetCardProps) {
  const [copied, setCopied] = useState(false);
  const [showCn, setShowCn] = useState(false);
  const [generating, setGenerating] = useState(false);

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
                onPromptUpdate={(newPrompt) => onPromptUpdate(asset.id, newPrompt)}
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
          <p className="text-sm text-white/60 leading-relaxed break-words font-mono">
            {displayPrompt}
          </p>
        </div>
      )}
    </div>
  );
}
