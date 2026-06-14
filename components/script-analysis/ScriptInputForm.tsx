"use client";

import { useState, useRef } from "react";
import { Sparkles, Loader2, FileText } from "lucide-react";
import TemplatePicker from "./TemplatePicker";

const artStyles = [
  { key: "anime", label: "二次元", desc: "日系动漫风格" },
  { key: "2.5d", label: "2.5D", desc: "半写实渲染" },
  { key: "3d", label: "3D", desc: "三维CG质感" },
  { key: "realistic", label: "真人", desc: "写实电影感" },
] as const;

interface ScriptInputFormProps {
  initialScript?: string;
  initialAudience?: string;
  initialStyle?: string;
  initialTemplateIds?: string[];
  hasResults?: boolean;
  onAnalyze: (script: string, targetAudience: string, style: string, templateIds: string[]) => Promise<void>;
  onCancel?: () => void;
  loading: boolean;
}

export default function ScriptInputForm({
  initialScript = "",
  initialAudience = "",
  initialStyle = "anime",
  initialTemplateIds = [],
  hasResults = false,
  onAnalyze,
  onCancel,
  loading,
}: ScriptInputFormProps) {
  const [script, setScript] = useState(initialScript);
  const [targetAudience, setTargetAudience] = useState(initialAudience);
  const [style, setStyle] = useState(initialStyle);
  const [templateIds, setTemplateIds] = useState<string[]>(initialTemplateIds);
  const [error, setError] = useState("");
  const [docxUploading, setDocxUploading] = useState(false);
  const [docxName, setDocxName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_LENGTH = 200000;

  function validate(): string | null {
    if (!script.trim() || script.trim().length < 50) {
      return "剧本内容至少需要 50 个字";
    }
    if (script.length > MAX_LENGTH) {
      return `剧本内容不能超过 ${MAX_LENGTH} 字`;
    }
    if (!targetAudience.trim()) {
      return "请填写目标受众";
    }
    return null;
  }

  // 上传 Word 文件并提取文本
  async function handleDocxUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocxUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/script-analysis/upload-docx", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "解析失败");
      }

      // 如果已有内容，追加到后面；否则直接填入
      const newText = result.text;
      setScript((prev) => {
        if (prev.trim()) {
          return prev + "\n\n" + newText;
        }
        return newText;
      });
      setDocxName(file.name);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "文件解析失败"
      );
    } finally {
      setDocxUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await onAnalyze(script.trim(), targetAudience.trim(), style, templateIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析失败，请稍后重试");
    }
  }

  const charCount = script.length;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* 完整剧本 */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <label className="text-base font-medium text-white/70">
            📖 完整剧本
          </label>
          <div className="flex items-center gap-2">
            {docxName && (
              <span className="text-sm text-white/30 truncate max-w-[200px]">
                {docxName}
              </span>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || docxUploading}
              className="flex items-center gap-1.5 rounded-full border border-white/[0.08] px-4 py-1.5 text-sm text-white/50 hover:text-white hover:border-white/20 hover:bg-white/[0.06] transition-all disabled:opacity-50"
            >
              {docxUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>解析中...</span>
                </>
              ) : (
                <>
                  <FileText className="h-3.5 w-3.5" />
                  <span>上传 Word</span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={handleDocxUpload}
            />
          </div>
        </div>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="在这里粘贴你的完整剧本内容...&#10;也可以点击右上角「上传 Word」按钮直接导入 .docx 文件&#10;&#10;AI 会先帮你提炼出剧本简介，再根据简介生成人物、场景、道具的生图提示词"
          rows={14}
          maxLength={MAX_LENGTH}
          disabled={loading}
          className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-5 py-4 text-base text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all resize-none disabled:opacity-50"
        />
        <p className="text-sm text-white/25 text-right">
          {charCount} / {MAX_LENGTH}
        </p>
      </div>

      {/* 目标受众 */}
      <div className="flex flex-col gap-2.5">
        <label className="text-base font-medium text-white/70">
          👥 目标受众
        </label>
        <input
          type="text"
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          placeholder="例如：青少年、都市白领、奇幻爱好者..."
          maxLength={200}
          disabled={loading}
          className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-5 py-4 text-base text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all disabled:opacity-50"
        />
      </div>

      {/* 画风选择 */}
      <div className="flex flex-col gap-2.5">
        <label className="text-base font-medium text-white/70">
          🎨 画风
        </label>
        <div className="grid grid-cols-4 gap-2.5">
          {artStyles.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStyle(s.key)}
              disabled={loading}
              className={`rounded-xl border px-4 py-3.5 text-center transition-all disabled:opacity-50 ${
                style === s.key
                  ? "bg-white/[0.12] border-white/20 text-white"
                  : "bg-white/[0.03] border-white/[0.06] text-white/50 hover:border-white/15 hover:text-white/80"
              }`}
            >
              <div className="text-base font-medium">{s.label}</div>
              <div className="text-xs text-white/35 mt-0.5">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 提示词模板 */}
      <TemplatePicker
        activeIds={templateIds}
        onChange={setTemplateIds}
        disabled={loading}
      />

      {/* 错误提示 */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-5 py-3.5">
          <p className="text-base text-red-400">{error}</p>
        </div>
      )}

      {/* 提交 + 取消按钮 */}
      {!hasResults || loading ? (
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-full bg-white/[0.10] border border-white/[0.08] px-8 py-3.5 text-base font-medium text-white hover:bg-white/[0.15] hover:border-white/[0.12] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>AI 分析中...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>开始分析</span>
              </>
            )}
          </button>
          {loading && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-white/[0.08] px-6 py-3.5 text-base font-medium text-white/60 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              取消
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (confirm("重新分析将覆盖当前所有结果，确定要重新分析吗？")) {
              handleSubmit(new Event("submit") as unknown as React.FormEvent);
            }
          }}
          className="flex items-center justify-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-8 py-3.5 text-base font-medium text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all"
        >
          <Sparkles className="h-5 w-5" />
          <span>重新分析</span>
        </button>
      )}
    </form>
  );
}
