"use client";

import { useState, useEffect } from "react";
import { Sparkles, Copy, Check, Loader2, History, Trash2, PanelRight, X, Crown, ShieldAlert, UserRound, Skull, Shirt } from "lucide-react";
import ImageUploadSlot from "./ImageUploadSlot";

interface CastDrawPanelProps {
  projectId: string;
}

interface DrawRecord {
  id: string;
  roleType: string;
  roleLabel: string;
  roleIcon: string;
  prompt: string;
  promptCn: string;
  imageUrl: string;
  createdAt: string;
}

const roleTypes = [
  { key: "female_lead", label: "女主", icon: "👸" },
  { key: "female_villain", label: "女反派", icon: "🐍" },
  { key: "male_lead", label: "男主", icon: "🤴" },
  { key: "male_villain", label: "男反派", icon: "🦹" },
  { key: "medieval_costume", label: "中世纪女装", icon: "👗" },
  { key: "medieval_male_costume", label: "中世纪男装", icon: "⚔️" },
] as const;

const roleIconMap = {
  female_lead: Crown,
  female_villain: ShieldAlert,
  male_lead: UserRound,
  male_villain: Skull,
  medieval_costume: Shirt,
  medieval_male_costume: Shirt,
} as const;

function RoleTypeIcon({ roleType }: { roleType: keyof typeof roleIconMap }) {
  const Icon = roleIconMap[roleType];
  return <Icon className="size-4 shrink-0 text-white/65" aria-hidden="true" />;
}

const STORAGE_KEY = "kk_cast_draw_history";

function loadHistory(projectId: string): DrawRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: Record<string, DrawRecord[]> = raw ? JSON.parse(raw) : {};
    return all[projectId] || [];
  } catch { return []; }
}

function saveHistory(projectId: string, records: DrawRecord[]) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: Record<string, DrawRecord[]> = raw ? JSON.parse(raw) : {};
    all[projectId] = records;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

function formatTime(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${m}/${d} ${h}:${min}`;
}

export default function CastDrawPanel({ projectId }: CastDrawPanelProps) {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [customReq, setCustomReq] = useState("");
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [promptCn, setPromptCn] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [showCn, setShowCn] = useState(false);
  const [history, setHistory] = useState<DrawRecord[]>([]);
  const [panelView, setPanelView] = useState<"draw" | "history">("draw");

  useEffect(() => {
    if (open) setHistory(loadHistory(projectId));
  }, [open, projectId]);

  async function handleDraw() {
    if (!selectedRole || loading) return;
    setLoading(true);
    setPrompt("");
    setPromptCn("");
    setImageUrl("");

    try {
      const res = await fetch(`/api/projects/${projectId}/cast-draw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleType: selectedRole, customRequirement: customReq.trim() }),
      });
      const result = await res.json();
      if (result.success) {
        setPrompt(result.imagePrompt);
        setPromptCn(result.imagePromptCn);

        // 保存到历史
        const role = roleTypes.find((r) => r.key === selectedRole);
        const record: DrawRecord = {
          id: "draw_" + Date.now().toString(36),
          roleType: selectedRole,
          roleLabel: role?.label || selectedRole,
          roleIcon: role?.icon || "",
          prompt: result.imagePrompt,
          promptCn: result.imagePromptCn,
          imageUrl: "",
          createdAt: formatTime(),
        };
        const updated = [record, ...history];
        setHistory(updated);
        saveHistory(projectId, updated);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  function loadRecord(record: DrawRecord) {
    setPanelView("draw");
    setPrompt(record.prompt);
    setPromptCn(record.promptCn);
    setImageUrl(record.imageUrl);
    setSelectedRole(record.roleType);
  }

  function deleteRecord(id: string) {
    const updated = history.filter((r) => r.id !== id);
    setHistory(updated);
    saveHistory(projectId, updated);
  }

  async function handleCopy() {
    const text = showCn && promptCn ? promptCn : prompt;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  async function handleUpload(file: File) {
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const result = await res.json();
    if (result.success) {
      const url = result.path;
      setImageUrl(url);
      // 同步更新历史中最新的记录
      if (history.length > 0) {
        const updated = history.map((r, i) => i === 0 ? { ...r, imageUrl: url } : r);
        setHistory(updated);
        saveHistory(projectId, updated);
      }
    }
  }

  return (
    <>
      {/* 折叠标签 */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-40 inline-flex size-11 items-center justify-center rounded-full border border-white/[0.14] bg-[#151817]/95 text-[0] text-white/75 shadow-2xl backdrop-blur-xl transition-all hover:bg-[#1d201f] hover:text-white md:bottom-auto md:right-0 md:top-1/2 md:-translate-y-1/2 md:rounded-r-none md:rounded-l-xl md:shadow-xl"
        aria-label="打开角色抽卡面板"
      >
        <span className="sr-only">角色抽卡</span>
        <PanelRight className="size-4" />
      </button>

      {/* 展开面板 */}
      {open && (
        <>
          <button type="button" className="fixed inset-0 top-14 z-40 bg-black/45 backdrop-blur-[2px] md:hidden" onClick={() => setOpen(false)} aria-label="关闭角色抽卡面板" />
        <div className="draw-panel-enter fixed inset-x-0 bottom-0 top-auto z-50 flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-white/[0.14] bg-[#151817]/[0.98] shadow-2xl backdrop-blur-xl md:inset-x-auto md:right-0 md:top-14 md:bottom-0 md:max-h-none md:w-[22rem] md:rounded-none md:rounded-l-2xl md:border-l md:border-t-0">
          {/* 头部 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] [&>h3]:sr-only">
            <h3 className="text-sm font-semibold text-white">🎴 角色抽卡</h3>
            <span className="text-sm font-semibold text-white">角色抽卡</span>
            <button onClick={() => setOpen(false)} className="rounded p-1 text-white/30 hover:text-white">
              <X className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1 border-b border-white/[0.06] bg-black/10 p-1.5">
            <button type="button" onClick={() => setPanelView("draw")} className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${panelView === "draw" ? "bg-white/[0.12] text-white" : "text-white/40 hover:bg-white/[0.06] hover:text-white/75"}`}>
              <Sparkles className="mr-1.5 inline-block size-3.5" />开始抽卡
            </button>
            <button type="button" onClick={() => setPanelView("history")} className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${panelView === "history" ? "bg-white/[0.12] text-white" : "text-white/40 hover:bg-white/[0.06] hover:text-white/75"}`}>
              <History className="mr-1.5 inline-block size-3.5" />历史记录
              {history.length > 0 && <span className="ml-1 rounded-full bg-white/[0.10] px-1.5 py-0.5 text-[10px]">{history.length}</span>}
            </button>
          </div>

          {/* 抽卡区域（始终可见） */}
          {panelView === "draw" && (
          <>
          <div className="draw-result-enter p-4 border-b border-white/[0.06] flex flex-col gap-3">
            {/* 角色类型选择 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40">角色类型</label>
              <div className="grid grid-cols-2 gap-2">
                {roleTypes.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setSelectedRole(r.key)}
                    className={`role-choice-card flex min-h-14 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm ${
                      selectedRole === r.key
                        ? "bg-white/[0.13] border-white/25 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                        : "bg-white/[0.035] border-white/[0.08] text-white/55 hover:border-white/18 hover:bg-white/[0.07] hover:text-white/85"
                    }`}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.10] bg-white/[0.06]">
                      <RoleTypeIcon roleType={r.key} />
                    </span>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 自定义要求 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40">自定义要求（可选）</label>
              <textarea
                value={customReq}
                onChange={(e) => setCustomReq(e.target.value)}
                placeholder="例如：银白色长发、20岁、蓝眼睛..."
                rows={2}
                maxLength={300}
                disabled={loading}
                className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-xs text-white placeholder:text-white/15 focus:outline-none focus:border-white/20 resize-none disabled:opacity-50"
              />
            </div>

            {/* 抽卡按钮 */}
            <button
              onClick={handleDraw}
              disabled={!selectedRole || loading}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/[0.14] bg-white/[0.12] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/[0.18] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>AI 抽卡中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>抽卡</span>
                </>
              )}
            </button>
          </div>

          {/* 当前结果 + 提示词 */}
          {prompt && (
            <div className="draw-card-flip-in p-4 border-b border-white/[0.06] flex flex-col gap-3">
              <ImageUploadSlot
                imageUrl={imageUrl}
                onUpload={handleUpload}
                onRemove={() => setImageUrl("")}
              />
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/30">🪄 当前提示词</span>
                  <div className="flex items-center gap-1">
                    {promptCn && (
                      <button
                        onClick={() => setShowCn(!showCn)}
                        className={`rounded px-1.5 py-0.5 text-[11px] ${showCn ? "bg-white/[0.10] text-white" : "text-white/30 hover:text-white"}`}
                      >
                        {showCn ? "中" : "EN"}
                      </button>
                    )}
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-white/30 hover:text-white"
                    >
                      {copied ? <><Check className="h-3 w-3 text-green-400"/><span className="text-green-400">已复制</span></> : <><Copy className="h-3 w-3"/><span>复制</span></>}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed break-words font-mono max-h-40 overflow-y-auto">
                  {showCn && promptCn ? promptCn : prompt}
                </p>
              </div>
            </div>
          )}

          {/* 历史记录 */}
          </>
          )}
          {panelView === "history" && (
          <div className="draw-result-enter flex-1 overflow-y-auto">
            <div className="px-4 py-2 border-b border-white/[0.06] flex items-center gap-2">
              <History className="h-3.5 w-3.5 text-white/40" />
              <span className="text-xs font-medium text-white/40">抽卡记录</span>
              {history.length > 0 && (
                <span className="rounded-full bg-white/[0.10] px-1.5 py-0.5 text-[10px] text-white/50">{history.length}</span>
              )}
            </div>

            {/* 历史记录列表 */}
            {history.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-3xl mb-2">🎴</p>
                <p className="text-xs text-white/25">还没有抽卡记录</p>
                <p className="text-[10px] text-white/15 mt-1">选择角色类型并点击抽卡后，记录会出现在这里</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 p-3">
                {history.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-3 hover:bg-white/[0.05] cursor-pointer transition-all group"
                    onClick={() => loadRecord(record)}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <RoleTypeIcon roleType={record.roleType as keyof typeof roleIconMap} />
                        <span className="text-xs font-medium text-white/70">{record.roleLabel}</span>
                        <span className="text-[10px] text-white/25">{record.createdAt}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }}
                        className="shrink-0 rounded p-0.5 text-white/15 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-[10px] text-white/35 leading-relaxed break-words line-clamp-2 font-mono">
                      {record.promptCn || record.prompt}
                    </p>
                    {record.imageUrl && (
                      <div className="mt-1.5 text-[10px] text-white/25">📷 已上传图片</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
        </div>
        </>
      )}
    </>
  );
}
