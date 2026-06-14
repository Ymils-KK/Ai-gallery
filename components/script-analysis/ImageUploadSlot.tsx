"use client";

import { useState, useRef } from "react";
import { Upload, X, Image } from "lucide-react";

interface ImageUploadSlotProps {
  imageUrl: string;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
}

export default function ImageUploadSlot({
  imageUrl,
  onUpload,
  onRemove,
}: ImageUploadSlotProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  const maxSize = 10 * 1024 * 1024; // 10MB

  function validateFile(file: File): string | null {
    if (!allowedTypes.includes(file.type)) {
      return "仅支持 PNG / JPEG / WebP / GIF 格式";
    }
    if (file.size > maxSize) {
      return "图片不能超过 10MB";
    }
    return null;
  }

  async function handleFile(file: File) {
    const err = validateFile(file);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setUploading(true);
    try {
      await onUpload(file);
    } catch {
      setError("上传失败，请重试");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  // 已有图片 → 显示预览
  if (imageUrl) {
    return (
      <div className="relative group rounded-lg overflow-hidden border border-white/[0.06] bg-white/[0.02]">
        <img
          src={imageUrl}
          alt="已上传图片"
          className="w-full h-32 object-cover"
        />
        <button
          onClick={onRemove}
          className="absolute top-1.5 right-1.5 rounded-full bg-black/70 p-1 text-white/60 hover:text-red-400 hover:bg-black/90 transition-all opacity-0 group-hover:opacity-100"
          title="删除图片"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // 无图片 → 显示上传区域
  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onClick={() => inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-all cursor-pointer min-h-[80px] ${
        dragOver
          ? "border-white/30 bg-white/[0.06]"
          : uploading
            ? "border-white/[0.06] bg-white/[0.01] opacity-50"
            : "border-white/[0.08] hover:border-white/20 hover:bg-white/[0.03]"
      }`}
    >
      {uploading ? (
        <>
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-transparent mb-1" />
          <p className="text-xs text-white/40">上传中...</p>
        </>
      ) : (
        <>
          <Upload className="h-4 w-4 text-white/30 mb-1" />
          <p className="text-xs text-white/30">点击或拖拽上传</p>
        </>
      )}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          // 重置以便重复选同一文件
          e.target.value = "";
        }}
      />
    </div>
  );
}
