"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Work } from "@/content/works";

interface LightboxProps {
  works: Work[];
  initialIndex: number;
  onClose: () => void;
}

export default function Lightbox({
  works,
  initialIndex,
  onClose,
}: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const current = works[index];

  const goNext = useCallback(() => {
    setIndex((prev) => (prev + 1) % works.length);
  }, [works.length]);

  const goPrev = useCallback(() => {
    setIndex((prev) => (prev - 1 + works.length) % works.length);
  }, [works.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white transition-all"
        aria-label="关闭"
      >
        <X className="h-6 w-6" />
      </button>

      {/* 计数器 */}
      <div className="absolute top-4 left-4 z-10 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80">
        {index + 1} / {works.length}
      </div>

      {/* 上一张 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          goPrev();
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 p-3 text-white/80 hover:bg-white/20 hover:text-white transition-all"
        aria-label="上一张"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {/* 下一张 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          goNext();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 p-3 text-white/80 hover:bg-white/20 hover:text-white transition-all"
        aria-label="下一张"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* 内容 */}
      <div
        className="max-h-[90vh] max-w-[90vw] flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {current.type === "video" ? (
          <video
            src={current.src}
            controls
            autoPlay
            className="max-h-[80vh] max-w-full rounded-xl"
          />
        ) : (
          <img
            src={current.src}
            alt={current.title}
            className="max-h-[80vh] max-w-full rounded-xl object-contain"
          />
        )}

        {/* 作品信息 */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white">{current.title}</h3>
          <p className="mt-1 text-sm text-white/60">{current.description}</p>
          <div className="mt-2 flex justify-center gap-2">
            {current.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/20 bg-white/5 px-2.5 py-0.5 text-xs text-white/70"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
