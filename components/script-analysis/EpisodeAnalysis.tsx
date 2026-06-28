"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CharacterEmotion {
  role: string;
  name: string;
  emotion: string;
}

interface SceneTier {
  tier: "S" | "A" | "B";
  scene: string;
  reason: string;
}

interface AssetNeeds {
  characters?: string[];
  costumes?: string[];
  scenes?: string[];
  props?: string[];
}

interface EpisodeResult {
  epNumber: number;
  title: string;
  translationSummary: string;
  oneLiner: string;
  emotionCurve: string;
  characterEmotions: CharacterEmotion[];
  sceneTiers: SceneTier[];
  keyShots: string[];
  assetNeeds: AssetNeeds;
  endHook: string;
}

interface OverallResult {
  seriesTitle: string;
  mainPlot: string;
  coreEmotion: string;
  characterRelationships: string;
  mainConflicts: string[];
  recurringScenes: string[];
  highFrequencyAssets: string;
  totalEpisodes: number;
}

interface EpisodeAnalysisProps {
  data: {
    episodes: EpisodeResult[];
    overall: OverallResult;
  };
}

const tierColors: Record<string, string> = {
  S: "bg-red-500/15 border-red-500/30 text-red-400",
  A: "bg-amber-500/15 border-amber-500/30 text-amber-400",
  B: "bg-white/[0.04] border-white/[0.06] text-white/40",
};

const tierLabels: Record<string, string> = {
  S: "S级 · 必须精修",
  A: "A级 · 推动剧情",
  B: "B级 · 过渡信息",
};

export default function EpisodeAnalysis({ data }: EpisodeAnalysisProps) {
  const [expandAll, setExpandAll] = useState(false);
  const [expandedEps, setExpandedEps] = useState<Set<number>>(new Set());

  function toggleEp(ep: number) {
    setExpandedEps((prev) => {
      const next = new Set(prev);
      if (next.has(ep)) next.delete(ep);
      else next.add(ep);
      return next;
    });
  }

  function toggleAll() {
    if (expandAll) {
      setExpandedEps(new Set());
      setExpandAll(false);
    } else {
      setExpandedEps(new Set(data.episodes.map((e) => e.epNumber)));
      setExpandAll(true);
    }
  }

  const { episodes, overall } = data;

  return (
    <div className="flex flex-col gap-4">
      {/* 全剧总览 */}
      <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">📊 全剧总体分析</h2>
        {overall.seriesTitle && (
          <p className="text-base text-white/80 font-medium mb-3">{overall.seriesTitle}</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-white/40">主线：</span>
            <span className="text-white/70">{overall.mainPlot}</span>
          </div>
          <div>
            <span className="text-white/40">核心情绪：</span>
            <span className="text-white/70">{overall.coreEmotion}</span>
          </div>
          <div>
            <span className="text-white/40">人物关系：</span>
            <span className="text-white/70">{overall.characterRelationships}</span>
          </div>
          {overall.mainConflicts?.length > 0 && (
            <div>
              <span className="text-white/40">主要冲突：</span>
              <span className="text-white/70">{overall.mainConflicts.join(" / ")}</span>
            </div>
          )}
          {overall.recurringScenes?.length > 0 && (
            <div className="md:col-span-2">
              <span className="text-white/40">高频桥段：</span>
              <span className="text-white/70">{overall.recurringScenes.join(" / ")}</span>
            </div>
          )}
          <div className="md:col-span-2">
            <span className="text-white/40">高频资产：</span>
            <span className="text-white/70">{overall.highFrequencyAssets}</span>
          </div>
        </div>
        <p className="text-xs text-white/25 mt-3">共 {overall.totalEpisodes || episodes.length} 集</p>
      </div>

      {/* 展开/折叠全部 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">📺 分集分析 ({episodes.length} 集)</h2>
        <button
          onClick={toggleAll}
          className="text-sm text-white/40 hover:text-white transition-colors"
        >
          {expandAll ? "折叠全部" : "展开全部"}
        </button>
      </div>

      {/* 每集卡片 */}
      {episodes.map((ep) => {
        const isOpen = expandedEps.has(ep.epNumber);
        return (
          <div key={ep.epNumber} className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06] overflow-hidden">
            {/* 集数头部 */}
            <button
              onClick={() => toggleEp(ep.epNumber)}
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors text-left"
            >
              <span className="rounded-full bg-white/[0.08] w-8 h-8 flex items-center justify-center text-sm font-bold text-white shrink-0">
                {ep.epNumber}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-white">{ep.title}</h3>
                <p className="text-sm text-white/40 truncate">{ep.oneLiner}</p>
              </div>
              <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs text-white/30">
                {ep.emotionCurve.split("→").length} 段情绪
              </span>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-white/30 shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-white/30 shrink-0" />
              )}
            </button>

            {/* 展开内容 */}
            {isOpen && (
              <div className="border-t border-white/[0.06] px-6 pb-6 pt-4 flex flex-col gap-4">
                {/* 翻译复述 */}
                <div>
                  <h4 className="text-xs font-semibold text-white/30 mb-1.5 uppercase tracking-wider">中文翻译/剧情复述</h4>
                  <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{ep.translationSummary}</p>
                </div>

                {/* 情绪曲线 */}
                <div>
                  <h4 className="text-xs font-semibold text-white/30 mb-1.5 uppercase tracking-wider">情绪曲线</h4>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ep.emotionCurve.split("→").map((s, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {i > 0 && <span className="text-white/15 text-xs">→</span>}
                        <span className="rounded-full bg-white/[0.06] border border-white/[0.08] px-3 py-1 text-xs text-white/60">{s.trim()}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* 角色情绪 */}
                <div>
                  <h4 className="text-xs font-semibold text-white/30 mb-1.5 uppercase tracking-wider">角色情绪</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ep.characterEmotions.map((ce, i) => (
                      <div key={i} className="rounded-lg bg-white/[0.03] border border-white/[0.04] px-3 py-2">
                        <span className="text-xs font-medium text-white/60">{ce.role}：{ce.name}</span>
                        <p className="text-xs text-white/40 mt-0.5">{ce.emotion}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 桥段分级 */}
                <div>
                  <h4 className="text-xs font-semibold text-white/30 mb-1.5 uppercase tracking-wider">重要桥段分级</h4>
                  <div className="flex flex-col gap-2">
                    {ep.sceneTiers.map((st, i) => (
                      <div key={i} className={`rounded-lg border px-3 py-2.5 ${tierColors[st.tier]}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="rounded-full bg-current/20 px-2 py-0.5 text-[10px] font-bold">{tierLabels[st.tier]}</span>
                          <span className="text-sm font-medium">{st.scene}</span>
                        </div>
                        <p className="text-xs opacity-70">{st.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 关键镜头 */}
                <div>
                  <h4 className="text-xs font-semibold text-white/30 mb-1.5 uppercase tracking-wider">必须做好的关键镜头</h4>
                  <ul className="flex flex-col gap-1">
                    {ep.keyShots.map((shot, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                        <span className="text-white/20 shrink-0 mt-0.5">🎬</span>
                        {shot}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 资产需求 */}
                <div>
                  <h4 className="text-xs font-semibold text-white/30 mb-1.5 uppercase tracking-wider">资产需求</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(ep.assetNeeds.characters?.length ?? 0) > 0 && (
                      <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] px-3 py-2">
                        <span className="text-[10px] text-white/30">👤 角色</span>
                        <p className="text-xs text-white/50 mt-0.5">{ep.assetNeeds.characters!.join("、")}</p>
                      </div>
                    )}
                    {(ep.assetNeeds.costumes?.length ?? 0) > 0 && (
                      <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] px-3 py-2">
                        <span className="text-[10px] text-white/30">👗 服装</span>
                        <p className="text-xs text-white/50 mt-0.5">{ep.assetNeeds.costumes!.join("、")}</p>
                      </div>
                    )}
                    {(ep.assetNeeds.scenes?.length ?? 0) > 0 && (
                      <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] px-3 py-2">
                        <span className="text-[10px] text-white/30">🏠 场景</span>
                        <p className="text-xs text-white/50 mt-0.5">{ep.assetNeeds.scenes!.join("、")}</p>
                      </div>
                    )}
                    {(ep.assetNeeds.props?.length ?? 0) > 0 && (
                      <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] px-3 py-2">
                        <span className="text-[10px] text-white/30">🔧 道具</span>
                        <p className="text-xs text-white/50 mt-0.5">{ep.assetNeeds.props!.join("、")}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 结尾钩子 */}
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3">
                  <span className="text-xs font-semibold text-amber-400">🪝 结尾钩子</span>
                  <p className="text-sm text-amber-300/80 mt-1">{ep.endHook}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
