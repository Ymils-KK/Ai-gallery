"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Copy, Check, Loader2, History, Trash2 } from "lucide-react";
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
] as const;

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
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [promptCn, setPromptCn] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [showCn, setShowCn] = useState(false);
  const [tab, setTab] = useState<"draw" | "history">("draw");
  const [history, setHistory] = useState<DrawRecord[]>([]);

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
        body: JSON.stringify({ roleType: selectedRole }),
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
    setPrompt(record.prompt);
    setPromptCn(record.promptCn);
    setImageUrl(record.imageUrl);
    setSelectedRole(record.roleType);
    setTab("draw");
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
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-1 rounded-l-xl bg-black/80 backdrop-blur-xl border border-white/[0.12] border-r-0 px-2.5 py-4 text-sm text-white/60 hover:text-white hover:bg-black/90 transition-all shadow-lg"
        style={{ writingMode: "vertical-rl" }}
      >
        <span>🎴 抽卡</span>
        {open ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* 展开面板 */}
      {open && (
        <div className="fixed right-0 top-14 bottom-0 w-80 z-40 bg-black/85 backdrop-blur-xl border-l border-white/[0.12] shadow-2xl flex flex-col overflow-hidden">
          {/* 头部 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">🎴 角色抽卡</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTab("draw")}
                className={`rounded px-2 py-1 text-[11px] transition-all ${tab === "draw" ? "bg-white/[0.10] text-white" : "text-white/30 hover:text-white"}`}
              >
                抽卡
              </button>
              <button
                onClick={() => setTab("history")}
                className={`rounded px-2 py-1 text-[11px] transition-all flex items-center gap-1 ${tab === "history" ? "bg-white/[0.10] text-white" : "text-white/30 hover:text-white"}`}
              >
                <History className="h-3 w-3" />
                记录
                {history.length > 0 && (
                  <span className="text-[10px] text-white/40">({history.length})</span>
                )}
              </button>
              <button onClick={() => setOpen(false)} className="rounded p-1 text-white/30 hover:text-white ml-1">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 抽卡 Tab */}
          {tab === "draw" && (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {/* 角色类型选择 */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-white/40">角色类型</label>
                <div className="grid grid-cols-2 gap-2">
                  {roleTypes.map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setSelectedRole(r.key)}
                      className={`rounded-lg border px-3 py-2.5 text-center text-sm transition-all ${
                        selectedRole === r.key
                          ? "bg-white/[0.12] border-white/20 text-white"
                          : "bg-white/[0.03] border-white/[0.06] text-white/50 hover:border-white/15 hover:text-white/80"
                      }`}
                    >
                      <span className="mr-1">{r.icon}</span>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 抽卡按钮 */}
              <button
                onClick={handleDraw}
                disabled={!selectedRole || loading}
                className="flex items-center justify-center gap-2 rounded-full bg-white/[0.10] border border-white/[0.08] px-4 py-3 text-sm font-medium text-white hover:bg-white/[0.15] disabled:opacity-30 transition-all"
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

              {/* 结果 */}
              {prompt && (
                <>
                  <ImageUploadSlot
                    imageUrl={imageUrl}
                    onUpload={handleUpload}
                    onRemove={() => setImageUrl("")}
                  />

                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/30">🪄 抽卡提示词</span>
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
                    <p className="text-[11px] text-white/50 leading-relaxed break-words font-mono max-h-60 overflow-y-auto">
                      {showCn && promptCn ? promptCn : prompt}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 历史记录 Tab */}
          {tab === "history" && (
            <div className="flex-1 overflow-y-auto p-4">
              {history.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-3xl mb-2">🎴</p>
                  <p className="text-xs text-white/25">还没有抽卡记录</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {history.map((record) => (
                    <div
                      key={record.id}
                      className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-3 hover:bg-white/[0.05] cursor-pointer transition-all group"
                      onClick={() => loadRecord(record)}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{record.roleIcon}</span>
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
      )}
    </>
  );
}
