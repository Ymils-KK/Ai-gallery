"use client";

import { useState, useRef } from "react";
import { Sparkles, Loader2, FileText, UploadCloud } from "lucide-react";
import TemplatePicker from "./TemplatePicker";

const artStyles = [
  { key: "anime", label: "二次元", desc: "日系动漫风格" },
  { key: "2.5d", label: "2.5D", desc: "半写实渲染" },
  { key: "3d", label: "3D", desc: "三维CG质感" },
  { key: "realistic", label: "真人", desc: "写实电影感" },
] as const;

const eras = [
  { key: "any", label: "不限", desc: "AI 自行判断" },
  { key: "modern", label: "现代", desc: "21世纪都市" },
  { key: "medieval", label: "中世纪", desc: "欧洲中世纪" },
  { key: "ancient_east", label: "古代东方", desc: "古风仙侠" },
  { key: "victorian", label: "维多利亚", desc: "19世纪英伦" },
  { key: "fantasy", label: "奇幻", desc: "魔法异世界" },
  { key: "cyberpunk", label: "赛博朋克", desc: "未来科技都市" },
] as const;

interface ScriptInputFormProps {
  initialScript?: string;
  initialAudience?: string;
  initialStyle?: string;
  initialEra?: string;
  initialTemplateIds?: string[];
  hasResults?: boolean;
  onAnalyze: (script: string, targetAudience: string, style: string, era: string, templateIds: string[]) => Promise<void>;
  onCancel?: () => void;
  loading: boolean;
}

export default function ScriptInputForm({
  initialScript = "",
  initialStyle = "anime",
  initialEra = "any",
  initialTemplateIds = [],
  hasResults = false,
  onAnalyze,
  onCancel,
  loading,
}: ScriptInputFormProps) {
  const [script, setScript] = useState(initialScript);
  const [style, setStyle] = useState(initialStyle);
  const [era, setEra] = useState(initialEra);
  const [templateIds, setTemplateIds] = useState<string[]>(initialTemplateIds);
  const [error, setError] = useState("");
  const [docxUploading, setDocxUploading] = useState(false);
  const [docxName, setDocxName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_LENGTH = 200000;
  const DEFAULT_ANALYSIS_REQUIREMENT =
    "欧美 AI 短剧制作流程：面向欧美女性短剧观众，优先提取可直接用于 AI 生图和视频制作的人物、服装、场景、道具与关键镜头资产。";

  function validate(): string | null {
    if (!script.trim() || script.trim().length < 50) {
      return "剧本内容至少需要 50 个字";
    }
    if (script.length > MAX_LENGTH) {
      return `剧本内容不能超过 ${MAX_LENGTH} 字`;
    }
    return null;
  }

  // 上传 Word 文件并提取文本
  async function handleDocxFile(file: File) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".docx")) {
      setError("请上传 .docx 格式的 Word 文件");
      return;
    }

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

      const newText = result.text;
      setScript(newText);
      setDocxName(file.name);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "文件解析失败"
      );
    } finally {
      setDocxUploading(false);
    }
  }

  async function handleDocxUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await handleDocxFile(file);
    e.target.value = "";
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await handleDocxFile(file);
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
      await onAnalyze(script.trim(), DEFAULT_ANALYSIS_REQUIREMENT, style, era, templateIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析失败，请稍后重试");
    }
  }

  const charCount = script.length;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Word 剧本导入 */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-white/80">
            Word 剧本导入
          </label>
          <span className="text-xs text-white/35">{charCount} / {MAX_LENGTH}</span>
        </div>
        <div
          onClick={() => !loading && !docxUploading && fileInputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragActive(false);
          }}
          onDrop={handleDrop}
          className={`flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-8 text-center transition-all ${
            dragActive
              ? "border-white/35 bg-white/[0.10]"
              : "border-white/[0.12] bg-[#07120f]/80 hover:border-white/25 hover:bg-white/[0.06]"
          } ${loading || docxUploading ? "pointer-events-none opacity-60" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={handleDocxUpload}
          />
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-md border border-white/[0.10] bg-white/[0.06]">
            {docxUploading ? (
              <Loader2 className="h-7 w-7 animate-spin text-white/70" />
            ) : docxName ? (
              <FileText className="h-7 w-7 text-white/75" />
            ) : (
              <UploadCloud className="h-7 w-7 text-white/65" />
            )}
          </div>
          <p className="text-base font-semibold text-white">
            {docxUploading ? "正在解析 Word..." : docxName ? docxName : "拖拽 Word 剧本到这里"}
          </p>
          <p className="mt-2 text-sm leading-6 text-white/45">
            {docxName
              ? `已读取 ${charCount} 字，点击或拖入新文件可替换当前剧本。`
              : "支持 .docx 文件，也可以点击此区域选择文件。"}
          </p>
          {script && (
            <div className="mt-5 w-full rounded-md border border-white/[0.07] bg-black/20 px-4 py-3 text-left">
              <p className="mb-1 text-xs text-white/30">文本预览</p>
              <p className="line-clamp-3 text-sm leading-6 text-white/55">
                {script.slice(0, 220)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 画风选择 */}
      <div className="flex flex-col gap-2.5">
        <label className="text-base font-medium text-white/70">
          画风
        </label>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {artStyles.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStyle(s.key)}
              disabled={loading}
              className={`rounded-md border px-4 py-3 text-center transition-all disabled:opacity-50 ${
                style === s.key
                  ? "border-white/25 bg-white/[0.14] text-white"
                  : "border-white/[0.08] bg-white/[0.04] text-white/58 hover:border-white/18 hover:bg-white/[0.07] hover:text-white/85"
              }`}
            >
              <div className="text-base font-medium">{s.label}</div>
              <div className="text-xs text-white/35 mt-0.5">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 时代背景 */}
      <div className="flex flex-col gap-2.5">
        <label className="text-base font-medium text-white/70">
          时代背景
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
          {eras.map((e) => (
            <button
              key={e.key}
              type="button"
              onClick={() => setEra(e.key)}
              disabled={loading}
              className={`rounded-md border px-3 py-3 text-center transition-all disabled:opacity-50 ${
                era === e.key
                  ? "border-white/25 bg-white/[0.14] text-white"
                  : "border-white/[0.08] bg-white/[0.04] text-white/58 hover:border-white/18 hover:bg-white/[0.07] hover:text-white/85"
              }`}
            >
              <div className="text-sm font-medium">{e.label}</div>
              <div className="text-[10px] text-white/35 mt-0.5">{e.desc}</div>
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
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* 提交 + 取消按钮 */}
      {!hasResults || loading ? (
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-md border border-white/[0.12] bg-white/[0.13] px-8 py-3.5 text-base font-semibold text-white transition-all hover:border-white/[0.20] hover:bg-white/[0.18] disabled:cursor-not-allowed disabled:opacity-50"
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
              className="rounded-md border border-white/[0.10] px-6 py-3.5 text-base font-medium text-white/70 transition-all hover:bg-white/[0.08] hover:text-white"
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
          className="flex items-center justify-center gap-2 rounded-md border border-amber-400/30 bg-amber-400/12 px-8 py-3.5 text-base font-semibold text-amber-200 transition-all hover:border-amber-400/45 hover:bg-amber-400/20"
        >
          <Sparkles className="h-5 w-5" />
          <span>重新分析</span>
        </button>
      )}
    </form>
  );
}
