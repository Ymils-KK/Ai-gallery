"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Users, Map, Wrench, ChevronDown, Plus, X } from "lucide-react";
import AssetCard from "./AssetCard";
import type { AssetItem } from "./AssetCard";

export interface AnalysisData {
  characters: AssetItem[];
  scenes: AssetItem[];
  props: AssetItem[];
}

interface AnalysisResultProps {
  projectId: string;
  data: AnalysisData;
  onImageUpload: (category: string, assetId: string, file: File) => Promise<void>;
  onImageRemove: (category: string, assetId: string) => void;
  onPromptUpdate: (category: string, assetId: string, newPrompt: string, newPromptCn?: string) => void;
  onGeneratePrompt: (category: string, assetId: string) => Promise<void>;
  onAddAsset: (category: string, name: string, description: string, tier: "major" | "minor") => void;
  // 服装
  onAddOutfit?: (charId: string, name: string, desc: string) => void;
  onOutfitImageUpload?: (charId: string, outfitId: string, file: File) => Promise<void>;
  onOutfitImageRemove?: (charId: string, outfitId: string) => void;
  onOutfitPromptUpdate?: (charId: string, outfitId: string, newPrompt: string, newPromptCn?: string) => void;
  onGenerateOutfitPrompt?: (charId: string, outfitId: string) => Promise<void>;
  onDeleteOutfit?: (charId: string, outfitId: string) => void;
}

const sections = [
  { key: "characters" as const, label: "人物", icon: <Users className="h-5 w-5" /> },
  { key: "scenes" as const, label: "场景", icon: <Map className="h-5 w-5" /> },
  { key: "props" as const, label: "道具", icon: <Wrench className="h-5 w-5" /> },
];

const rankOrder = ["S", "A", "B", "C", "unranked"] as const;

const rankMeta: Record<(typeof rankOrder)[number], { label: string; desc: string; className: string }> = {
  S: { label: "S级", desc: "核心资产", className: "border-red-400/20 bg-red-500/8 text-red-300" },
  A: { label: "A级", desc: "重要资产", className: "border-amber-400/20 bg-amber-500/8 text-amber-300" },
  B: { label: "B级", desc: "功能资产", className: "border-sky-400/18 bg-sky-500/8 text-sky-300" },
  C: { label: "C级", desc: "补充资产", className: "border-white/[0.08] bg-white/[0.035] text-white/45" },
  unranked: { label: "未分级", desc: "旧数据", className: "border-white/[0.08] bg-white/[0.025] text-white/35" },
};

function includesEpisode(values: number[] | undefined, episode: number) {
  return Array.isArray(values) && values.includes(episode);
}

function collectEpisodeNumbers(data: AnalysisData) {
  const episodes = new Set<number>();
  const add = (values?: number[]) => values?.forEach((n) => Number.isFinite(n) && n > 0 && episodes.add(n));

  data.characters.forEach((asset) => {
    add(asset.appearances);
    asset.outfits?.forEach((outfit) => add(outfit.appearances));
  });
  data.scenes.forEach((asset) => add(asset.appearances));
  data.props.forEach((asset) => add(asset.appearances));

  return Array.from(episodes).sort((a, b) => a - b);
}

function RankPill({ rank }: { rank?: AssetItem["importanceRank"] }) {
  if (!rank) return null;
  const meta = rankMeta[rank];
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${meta.className}`}>{rank}</span>;
}

function EpisodeAssetList({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-4">
      <h4 className="mb-3 text-sm font-semibold text-white/70">{title}</h4>
      {empty ? <p className="text-sm text-white/25">本集暂无</p> : <div className="flex flex-col gap-2">{children}</div>}
    </div>
  );
}

export default function AnalysisResult({
  projectId,
  data,
  onImageUpload,
  onImageRemove,
  onPromptUpdate,
  onGeneratePrompt,
  onAddAsset,
  onAddOutfit,
  onOutfitImageUpload,
  onOutfitImageRemove,
  onOutfitPromptUpdate,
  onGenerateOutfitPrompt,
  onDeleteOutfit,
}: AnalysisResultProps) {
  const firstOpen =
    data.characters.length > 0 ? "characters"
    : data.scenes.length > 0 ? "scenes"
    : "props";
  const [openSection, setOpenSection] = useState<string>(firstOpen);
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTier, setNewTier] = useState<"major" | "minor">("major");

  const totalCount = data.characters.length + data.scenes.length + data.props.length;
  const episodeNumbers = collectEpisodeNumbers(data);
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(episodeNumbers[0] || null);
  const activeEpisode = selectedEpisode && episodeNumbers.includes(selectedEpisode) ? selectedEpisode : episodeNumbers[0];
  const episodeCharacters = activeEpisode
    ? data.characters.filter((asset) => includesEpisode(asset.appearances, activeEpisode))
    : [];
  const episodeOutfits = activeEpisode
    ? data.characters.flatMap((character) =>
        (character.outfits || [])
          .filter((outfit) => includesEpisode(outfit.appearances, activeEpisode))
          .map((outfit) => ({ character, outfit }))
      )
    : [];
  const episodeScenes = activeEpisode
    ? data.scenes.filter((asset) => includesEpisode(asset.appearances, activeEpisode))
    : [];
  const episodeProps = activeEpisode
    ? data.props.filter((asset) => includesEpisode(asset.appearances, activeEpisode))
    : [];
  const episodeAssets = [...episodeCharacters, ...episodeScenes, ...episodeProps];
  const missingPromptCount = episodeAssets.filter((asset) => !asset.imagePrompt).length + episodeOutfits.filter(({ outfit }) => !outfit.imagePrompt).length;
  const missingImageCount = episodeAssets.filter((asset) => !asset.imageUrl).length + episodeOutfits.filter(({ outfit }) => !outfit.imageUrl).length;

  if (totalCount === 0) {
    return (
      <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06] p-10 text-center">
        <p className="text-white/40">暂无分析结果</p>
      </div>
    );
  }

  function toggleSection(key: string) {
    setOpenSection((prev) => (prev === key ? "" : key));
  }

  function startAdd(key: string) {
    setAddingCategory(key);
    setNewName("");
    setNewDesc("");
    setNewTier("major");
  }

  function handleAdd() {
    if (!newName.trim() || !addingCategory) return;
    onAddAsset(addingCategory, newName.trim(), newDesc.trim(), newTier);
    setAddingCategory(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-white/[0.06] bg-black/40 p-5 backdrop-blur-xl">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">按集制作包</h3>
            <p className="mt-1 text-sm text-white/38">
              选择集数后，自动过滤这一集出现的人物、服装、场景和道具。
            </p>
          </div>
          {activeEpisode && (
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <div className="rounded-md border border-white/[0.06] bg-white/[0.035] px-3 py-2">
                <p className="text-white/30">人物</p>
                <p className="mt-1 text-base font-semibold text-white">{episodeCharacters.length}</p>
              </div>
              <div className="rounded-md border border-white/[0.06] bg-white/[0.035] px-3 py-2">
                <p className="text-white/30">场景</p>
                <p className="mt-1 text-base font-semibold text-white">{episodeScenes.length}</p>
              </div>
              <div className="rounded-md border border-white/[0.06] bg-white/[0.035] px-3 py-2">
                <p className="text-white/30">缺提示词</p>
                <p className="mt-1 text-base font-semibold text-amber-200">{missingPromptCount}</p>
              </div>
              <div className="rounded-md border border-white/[0.06] bg-white/[0.035] px-3 py-2">
                <p className="text-white/30">缺图片</p>
                <p className="mt-1 text-base font-semibold text-white">{missingImageCount}</p>
              </div>
            </div>
          )}
        </div>

        {episodeNumbers.length === 0 ? (
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-4 py-5">
            <p className="text-sm text-white/35">
              当前资产还没有集数字段。重新分析后，系统会按每集自动生成制作包。
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {episodeNumbers.map((episode) => (
                <button
                  key={episode}
                  type="button"
                  onClick={() => setSelectedEpisode(episode)}
                  className={`shrink-0 rounded-md border px-4 py-2 text-sm transition-all ${
                    activeEpisode === episode
                      ? "border-white/24 bg-white/[0.14] text-white"
                      : "border-white/[0.08] bg-white/[0.035] text-white/45 hover:border-white/18 hover:text-white/75"
                  }`}
                >
                  第 {episode} 集
                </button>
              ))}
            </div>

            {activeEpisode && (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <EpisodeAssetList title="本集人物" empty={episodeCharacters.length === 0}>
                  {episodeCharacters.map((asset) => (
                    <div key={asset.id} className="rounded-md bg-black/20 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <RankPill rank={asset.importanceRank} />
                        <span className="text-sm font-medium text-white/78">{asset.name}</span>
                        {!asset.imagePrompt && <span className="ml-auto text-xs text-amber-200/70">缺提示词</span>}
                      </div>
                      {asset.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/40">{asset.description}</p>}
                    </div>
                  ))}
                </EpisodeAssetList>

                <EpisodeAssetList title="本集服装" empty={episodeOutfits.length === 0}>
                  {episodeOutfits.map(({ character, outfit }) => (
                    <div key={`${character.id}_${outfit.id}`} className="rounded-md bg-black/20 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white/78">{outfit.name}</span>
                        <span className="text-xs text-white/28">/ {character.name}</span>
                        {!outfit.imagePrompt && <span className="ml-auto text-xs text-amber-200/70">缺提示词</span>}
                      </div>
                      {outfit.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/40">{outfit.description}</p>}
                    </div>
                  ))}
                </EpisodeAssetList>

                <EpisodeAssetList title="本集场景" empty={episodeScenes.length === 0}>
                  {episodeScenes.map((asset) => (
                    <div key={asset.id} className="rounded-md bg-black/20 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <RankPill rank={asset.importanceRank} />
                        <span className="text-sm font-medium text-white/78">{asset.name}</span>
                        {!asset.imagePrompt && <span className="ml-auto text-xs text-amber-200/70">缺提示词</span>}
                      </div>
                      {asset.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/40">{asset.description}</p>}
                    </div>
                  ))}
                </EpisodeAssetList>

                <EpisodeAssetList title="本集道具" empty={episodeProps.length === 0}>
                  {episodeProps.map((asset) => (
                    <div key={asset.id} className="rounded-md bg-black/20 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <RankPill rank={asset.importanceRank} />
                        <span className="text-sm font-medium text-white/78">{asset.name}</span>
                        {!asset.imagePrompt && <span className="ml-auto text-xs text-amber-200/70">缺提示词</span>}
                      </div>
                      {asset.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/40">{asset.description}</p>}
                    </div>
                  ))}
                </EpisodeAssetList>
              </div>
            )}
          </div>
        )}
      </div>

      {sections.map((section) => {
        const isOpen = openSection === section.key;
        const assets = data[section.key] || [];
        const isAdding = addingCategory === section.key;

        return (
          <div key={section.key} className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06] overflow-hidden">
            {/* 折叠头部 */}
            <div className="flex items-center">
              <button
                onClick={() => toggleSection(section.key)}
                className="flex-1 flex items-center gap-4 px-8 py-5 hover:bg-white/[0.02] transition-colors text-left"
              >
                <span className="text-white/60">{section.icon}</span>
                <span className="text-lg font-semibold text-white">{section.label}</span>
                <span className="rounded-full bg-white/[0.08] px-3 py-0.5 text-sm text-white/50">{assets.length}</span>
              </button>
              {/* 添加按钮 */}
              <button
                type="button"
                onClick={() => startAdd(section.key)}
                className="mr-5 flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] px-4 py-2 text-sm text-white/50 hover:text-white hover:bg-white/[0.10] transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>添加</span>
              </button>
              <ChevronDown className={`h-6 w-6 text-white/40 mr-8 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
            </div>

            {/* 折叠内容 */}
            {isOpen && (
              <div className="border-t border-white/[0.06] px-8 pb-8 pt-5">
                {/* 添加表单 */}
                {isAdding && (
                  <div className="mb-5 rounded-xl bg-white/[0.04] border border-white/[0.08] p-5 flex flex-col gap-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white/60">添加{section.label}</span>
                      <button type="button" onClick={() => setAddingCategory(null)} className="text-white/30 hover:text-white">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="名称"
                      maxLength={30}
                      className="w-full rounded-lg bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-base text-white placeholder:text-white/15 focus:outline-none focus:border-white/20"
                    />
                    <textarea
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="描述（可选）"
                      rows={3}
                      maxLength={200}
                      className="w-full rounded-lg bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-base text-white placeholder:text-white/15 focus:outline-none focus:border-white/20 resize-none"
                    />
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-white/30">级别：</span>
                      <button
                        type="button"
                        onClick={() => setNewTier("major")}
                        className={`rounded-full px-4 py-2 text-sm transition-all ${newTier === "major" ? "bg-amber-500/20 text-amber-400" : "bg-white/[0.04] text-white/40 hover:text-white/70"}`}
                      >
                        重要
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewTier("minor")}
                        className={`rounded-full px-4 py-2 text-sm transition-all ${newTier === "minor" ? "bg-white/[0.10] text-white/50" : "bg-white/[0.04] text-white/40 hover:text-white/70"}`}
                      >
                        次要
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleAdd}
                      disabled={!newName.trim()}
                      className="self-start rounded-full bg-white/[0.10] px-5 py-2.5 text-sm font-medium text-white hover:bg-white/[0.15] disabled:opacity-30 transition-all"
                    >
                      确认添加
                    </button>
                  </div>
                )}

                {assets.length === 0 && !isAdding ? (
                  <div className="rounded-xl bg-black/20 border border-white/[0.04] p-10 text-center">
                    <p className="text-base text-white/30">该类别暂无内容</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-7">
                    {rankOrder.map((rank) => {
                      const groupedAssets = assets.filter((asset) =>
                        rank === "unranked" ? !asset.importanceRank : asset.importanceRank === rank
                      );
                      if (groupedAssets.length === 0) return null;
                      const meta = rankMeta[rank];

                      return (
                        <div key={rank} className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
                              {meta.label}
                            </span>
                            <span className="text-sm text-white/35">{meta.desc}</span>
                            <span className="h-px flex-1 bg-white/[0.06]" />
                            <span className="text-xs text-white/30">{groupedAssets.length}</span>
                          </div>
                          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                            {groupedAssets.map((asset) => (
                              <AssetCard
                                key={asset.id}
                                asset={asset}
                                projectId={projectId}
                                category={section.key}
                                onImageUpload={(assetId, file) => onImageUpload(section.key, assetId, file)}
                                onImageRemove={(assetId) => onImageRemove(section.key, assetId)}
                                onPromptUpdate={(assetId, newPrompt, newPromptCn) => onPromptUpdate(section.key, assetId, newPrompt, newPromptCn)}
                                onGeneratePrompt={(assetId) => onGeneratePrompt(section.key, assetId)}
                                onAddOutfit={onAddOutfit}
                                onOutfitImageUpload={onOutfitImageUpload}
                                onOutfitImageRemove={onOutfitImageRemove}
                                onOutfitPromptUpdate={onOutfitPromptUpdate}
                                onGenerateOutfitPrompt={onGenerateOutfitPrompt}
                                onDeleteOutfit={onDeleteOutfit}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
