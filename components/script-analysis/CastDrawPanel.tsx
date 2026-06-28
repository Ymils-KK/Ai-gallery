"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Copy, Check, Loader2 } from "lucide-react";
import ImageUploadSlot from "./ImageUploadSlot";

interface CastDrawPanelProps {
  projectId: string;
}

const roleTypes = [
  { key: "female_lead", label: "女主", icon: "👸" },
  { key: "female_villain", label: "女反派", icon: "🐍" },
  { key: "male_lead", label: "男主", icon: "🤴" },
  { key: "male_villain", label: "男反派", icon: "🦹" },
] as const;

export default function CastDrawPanel({ projectId }: CastDrawPanelProps) {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [promptCn, setPromptCn] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [showCn, setShowCn] = useState(false);

  async function handleDraw() {
    if (!selectedRole || loading) return;
    setLoading(true);
    setPrompt("");
    setPromptCn("");

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
      }
    } catch {} finally {
      setLoading(false);
    }
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
    if (result.success) setImageUrl(result.path);
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
            <h3 className="text-sm font-semibold text-white">🎴 角色抽卡</h3>
            <button onClick={() => setOpen(false)} className="rounded p-1 text-white/30 hover:text-white">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

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
        </div>
      )}
    </>
  );
}
