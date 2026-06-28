"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Search, Play, ListChecks } from "lucide-react";

interface ScanResult {
  totalEpisodes: number;
  episodes: { epNumber: number; title: string; approxLength: string }[];
  warnings?: string[];
}

interface EpData {
  epNumber: number;
  summary: string;
  oneLiner: string;
  emotionCurve: string;
  characterEmotions: { role: string; name: string; emotion: string }[];
  sTier: { scene: string; reason: string }[];
  aTier: { scene: string; reason: string }[];
  keyShots: string[];
  assetNeeds: { characters: string[]; costumes: string[]; scenes: string[]; props: string[] };
  endHook: string;
}

interface OverallData {
  seriesTitle: string;
  mainPlot: string;
  coreEmotion: string;
  characterRelationships: string;
  mainConflicts: string[];
  recurringScenes: string[];
  highFrequencyAssets: string;
  totalEpisodes: number;
}

interface Props { projectId: string; }

export default function EpisodeAnalysisPanel({ projectId }: Props) {
  const [script, setScript] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [selectedEps, setSelectedEps] = useState<Set<number>>(new Set());
  const [analyzedEps, setAnalyzedEps] = useState<Record<number, EpData>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [overall, setOverall] = useState<OverallData | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState("");
  const [expandedEps, setExpandedEps] = useState<Set<number>>(new Set());

  async function handleScan() {
    if (!script.trim() || script.trim().length < 100) { setError("剧本至少100字"); return; }
    setScanning(true); setError(""); setScanResult(null); setAnalyzedEps({}); setOverall(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/episode-analysis`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scan", script: script.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setScanResult(data);
    } catch (e: any) {
      setError(e.message || "扫描失败");
    } finally { setScanning(false); }
  }

  function toggleEp(ep: number) {
    setSelectedEps(prev => {
      const next = new Set(prev);
      if (next.has(ep)) next.delete(ep);
      else if (next.size < 3) next.add(ep);
      return next;
    });
  }

  async function handleAnalyze() {
    if (selectedEps.size === 0) return;
    const eps = Array.from(selectedEps).sort((a, b) => a - b);
    setAnalyzing(true); setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/episode-analysis`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze", script: script.trim(), epNumbers: eps }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const newEps = { ...analyzedEps };
      (data.episodes || []).forEach((ep: EpData) => { newEps[ep.epNumber] = ep; });
      setAnalyzedEps(newEps);
      setSelectedEps(new Set());
      setExpandedEps(prev => { const next = new Set(prev); eps.forEach(e => next.add(e)); return next; });
    } catch (e: any) { setError(e.message || "分析失败"); }
    finally { setAnalyzing(false); }
  }

  async function handleSummary() {
    const eps = Object.values(analyzedEps);
    if (eps.length === 0) { setError("请先分析至少一集"); return; }
    setSummarizing(true); setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/episode-analysis`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "summary", allEpisodes: eps }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOverall(data.overall);
    } catch (e: any) { setError(e.message || "总结失败"); }
    finally { setSummarizing(false); }
  }

  function toggleExpand(ep: number) {
    setExpandedEps(prev => { const next = new Set(prev); if (next.has(ep)) next.delete(ep); else next.add(ep); return next; });
  }

  const analyzedCount = Object.keys(analyzedEps).length;
  const totalEps = scanResult?.totalEpisodes || 0;
  const sortedAnalyzed = Object.values(analyzedEps).sort((a, b) => a.epNumber - b.epNumber);

  return (
    <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06] p-6 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-white">📺 剧本分集分析</h2>
      <div className="flex flex-col gap-2">
        <label className="text-sm text-white/40">粘贴剧本内容</label>
        <textarea value={script} onChange={e => setScript(e.target.value)} placeholder="粘贴完整剧本..." rows={6} className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-white/20 resize-none" />
      </div>

      <button onClick={handleScan} disabled={scanning || !script.trim()} className="flex items-center justify-center gap-2 rounded-full bg-white/[0.08] border border-white/[0.10] px-6 py-2.5 text-sm font-medium text-white/70 hover:bg-white/[0.12] disabled:opacity-30 transition-all">
        {scanning ? <><Loader2 className="h-4 w-4 animate-spin"/><span>扫描分集中...</span></> : <><Search className="h-4 w-4"/><span>步骤1：扫描分集</span></>}
      </button>

      {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5"><p className="text-sm text-red-400">{error}</p></div>}

      {scanResult && (
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-4">
          <p className="text-sm text-white/70 mb-3">识别到 <span className="font-bold text-white">{scanResult.totalEpisodes}</span> 集{(scanResult.warnings?.length ?? 0) > 0 && <span className="text-amber-400 ml-2">⚠️ {scanResult.warnings!.join(" / ")}</span>}</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 mb-3">
            {scanResult.episodes.map(ep => {
              const done = !!analyzedEps[ep.epNumber];
              return (
                <button key={ep.epNumber} onClick={() => !done && toggleEp(ep.epNumber)} disabled={done}
                  className={`rounded-lg border px-3 py-2 text-center text-sm transition-all ${done ? "bg-green-500/10 border-green-500/20 text-green-400 cursor-default" : selectedEps.has(ep.epNumber) ? "bg-white/[0.12] border-white/20 text-white" : "bg-white/[0.03] border-white/[0.06] text-white/50 hover:border-white/15"}`}>
                  <div className="font-medium">{done ? "✓" : `第${ep.epNumber}集`}</div>
                  <div className="text-[10px] opacity-50">{ep.approxLength}</div>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button onClick={handleAnalyze} disabled={analyzing || selectedEps.size === 0} className="flex items-center gap-2 rounded-full bg-white/[0.10] border border-white/[0.10] px-5 py-2 text-sm font-medium text-white hover:bg-white/[0.15] disabled:opacity-30 transition-all">
              {analyzing ? <><Loader2 className="h-4 w-4 animate-spin"/><span>分析中...</span></> : <><Play className="h-4 w-4"/><span>步骤2：分析选中集 ({selectedEps.size}/3)</span></>}
            </button>
            {analyzedCount > 0 && (
              <button onClick={handleSummary} disabled={summarizing} className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-5 py-2 text-sm font-medium text-amber-300 hover:bg-amber-500/20 disabled:opacity-30 transition-all">
                {summarizing ? <><Loader2 className="h-4 w-4 animate-spin"/><span>总结中...</span></> : <><ListChecks className="h-4 w-4"/><span>步骤3：全剧总结 ({analyzedCount}/{totalEps})</span></>}
              </button>
            )}
          </div>
        </div>
      )}

      {overall && (
        <div className="rounded-lg bg-amber-500/5 border border-amber-500/15 p-4">
          <h3 className="text-base font-semibold text-amber-300 mb-3">{overall.seriesTitle || "全剧总结"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="text-white/30">主线：</span><span className="text-white/70">{overall.mainPlot}</span></div>
            <div><span className="text-white/30">核心情绪：</span><span className="text-white/70">{overall.coreEmotion}</span></div>
            <div><span className="text-white/30">人物关系：</span><span className="text-white/70">{overall.characterRelationships}</span></div>
            <div><span className="text-white/30">高频资产：</span><span className="text-white/70">{overall.highFrequencyAssets}</span></div>
          </div>
        </div>
      )}

      {sortedAnalyzed.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-white/60">已分析 ({sortedAnalyzed.length} 集)</h3>
          {sortedAnalyzed.map(ep => {
            const open = expandedEps.has(ep.epNumber);
            return (
              <div key={ep.epNumber} className="rounded-xl bg-white/[0.02] border border-white/[0.05] overflow-hidden">
                <button onClick={() => toggleExpand(ep.epNumber)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] text-left">
                  <span className="rounded-full bg-green-500/15 w-7 h-7 flex items-center justify-center text-xs font-bold text-green-400 shrink-0">{ep.epNumber}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-white/80">{ep.oneLiner}</span>
                    <div className="flex gap-1 mt-0.5 flex-wrap">{ep.emotionCurve.split("→").map((s, i) => <span key={i} className="text-[10px] text-white/25">{s.trim()}{i < ep.emotionCurve.split("→").length - 1 ? " →" : ""}</span>)}</div>
                  </div>
                  {open ? <ChevronUp className="h-4 w-4 text-white/30 shrink-0" /> : <ChevronDown className="h-4 w-4 text-white/30 shrink-0" />}
                </button>
                {open && (
                  <div className="border-t border-white/[0.04] px-4 pb-4 pt-3 flex flex-col gap-3 text-sm">
                    <div><span className="text-white/30">剧情：</span><span className="text-white/70 whitespace-pre-wrap">{ep.summary}</span></div>
                    <div><span className="text-white/30">情绪曲线：</span><span className="text-white/60">{ep.emotionCurve}</span></div>
                    {ep.characterEmotions?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {ep.characterEmotions.map((ce, i) => <span key={i} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-white/50">{ce.role}: {ce.emotion.slice(0, 30)}</span>)}
                      </div>
                    )}
                    {ep.sTier?.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {ep.sTier.map((s, i) => <div key={i} className="rounded bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs"><span className="text-red-400 font-bold">S</span> <span className="text-red-300/80">{s.scene}</span></div>)}
                      </div>
                    )}
                    {ep.aTier?.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {ep.aTier.slice(0, 5).map((a, i) => <div key={i} className="rounded bg-amber-500/5 border border-amber-500/15 px-3 py-1.5 text-xs"><span className="text-amber-400 font-bold">A</span> <span className="text-amber-300/60">{a.scene}</span></div>)}
                      </div>
                    )}
                    {ep.keyShots?.length > 0 && <div><span className="text-white/30">关键镜头：</span><span className="text-white/50">{ep.keyShots.join(" / ")}</span></div>}
                    <div className="rounded bg-amber-500/5 border border-amber-500/15 px-3 py-2 text-xs text-amber-300/70">🪝 {ep.endHook}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
