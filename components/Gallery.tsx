"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Play, Layers, ChevronDown, X } from "lucide-react";
import type { Work } from "@/content/works";
import type { Collection } from "./CollectionGrid";
import Lightbox from "./Lightbox";

interface GalleryProps {
  works: Work[];
  collections: Collection[];
  allWorks: Work[];
}

type Filter = "全部" | "图片" | "视频" | "合集";

export default function Gallery({ works, collections, allWorks }: GalleryProps) {
  const [filter, setFilter] = useState<Filter>("全部");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxWorks, setLightboxWorks] = useState<Work[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [expandedColId, setExpandedColId] = useState<string | null>(null);

  function openLightbox(ws: Work[], idx: number) {
    setLightboxWorks(ws);
    setLightboxIndex(idx);
  }

  const filters: Filter[] = ["全部", "图片", "视频", "合集"];

  // 根据合集ID获取作品
  function getColWorks(ids: string[]): Work[] {
    return ids.map((id) => allWorks.find((w) => w.id === id)).filter(Boolean) as Work[];
  }

  // 取合集封面
  function getColCover(col: Collection): string {
    if (col.thumbnail) return col.thumbnail;
    return getColWorks(col.workIds)[0]?.src || "";
  }

  // 取叠层预览图（最多3张）
  function getColPreviews(col: Collection): string[] {
    return getColWorks(col.workIds)
      .slice(0, 3)
      .map((w) => w.thumbnail || w.src)
      .filter(Boolean);
  }

  // 合并显示列表
  const displayList = useMemo(() => {
    if (filter === "合集") {
      // 只显示合集
      return {
        collections: collections,
        works: [] as Work[],
      };
    }

    const filteredWorks = filter === "全部"
      ? works
      : filter === "图片"
        ? works.filter((w) => w.type === "image")
        : works.filter((w) => w.type === "video");

    return {
      collections: collections,
      works: filteredWorks,
    };
  }, [works, collections, filter]);

  const totalItems = displayList.collections.length + displayList.works.length;

  return (
    <>
      {/* 筛选按钮 */}
      <div className="flex gap-2 mb-8">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
              filter === f
                ? "bg-white/15 text-white"
                : "text-muted border border-border hover:text-foreground hover:border-white/15"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 作品网格 — 合集卡片 + 独立作品混合 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* ====== 合集卡片 ====== */}
        {displayList.collections.map((col) => {
          const previews = getColPreviews(col);
          const cover = getColCover(col);
          const isExpanded = expandedColId === col.id;
          const colWorks = getColWorks(col.workIds);

          return (
            <div key={`col-${col.id}`} className="contents">
              <div
                onClick={() => setExpandedColId(isExpanded ? null : col.id)}
                className={`group relative cursor-pointer overflow-hidden rounded-xl border transition-all duration-300 ${
                  isExpanded
                    ? "border-white/15 shadow-lg "
                    : "border-border bg-card card-glow"
                }`}
              >
                {/* 叠层预览 */}
                <div className="relative aspect-[4/3] bg-card">
                  {/* 底层 */}
                  {previews.length >= 3 && (
                    <div
                      className="absolute inset-0"
                      style={{
                        transform: "rotate(-5deg) scale(0.82)",
                        transformOrigin: "bottom left",
                        opacity: 0.35,
                      }}
                    >
                      <img src={previews[2]} alt="" className="h-full w-full rounded-xl object-cover" />
                    </div>
                  )}
                  {/* 中层 */}
                  {previews.length >= 2 && (
                    <div
                      className="absolute inset-0"
                      style={{
                        transform: "rotate(2deg) scale(0.9)",
                        transformOrigin: "bottom right",
                        opacity: 0.5,
                      }}
                    >
                      <img src={previews[1]} alt="" className="h-full w-full rounded-xl object-cover" />
                    </div>
                  )}
                  {/* 顶层 */}
                  <div className="absolute inset-0 z-10">
                    <img src={cover} alt={col.title} className="h-full w-full rounded-xl object-cover shadow-lg" />
                  </div>

                  {/* 合集标签 */}
                  <div className="absolute top-3 right-3 z-20 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1 text-xs text-white">
                    <Layers className="inline h-3 w-3 mr-1" />
                    {col.workIds.length} 件
                  </div>
                </div>

                {/* 信息 */}
                <div className="relative z-20 p-4 bg-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground truncate group-hover:text-white/80 transition-colors">
                        {col.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted line-clamp-2">
                        {col.description || "暂无描述"}
                      </p>
                    </div>
                    <ChevronDown
                      className={`mt-1 h-4 w-4 text-muted shrink-0 transition-transform duration-300 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  {col.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {col.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-border bg-white/[0.03] px-2.5 py-0.5 text-xs text-muted">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          );
        })}

        {/* ====== 独立作品卡片 ====== */}
        {displayList.works.map((work, idx) => (
          <div
            key={work.id}
            onClick={() => openLightbox(displayList.works, displayList.works.indexOf(work))}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card card-glow transition-all duration-300"
          >
            <div className="aspect-[4/3] overflow-hidden">
              {work.type === "video" ? (
                <div className="relative h-full w-full">
                  <img
                    src={work.thumbnail || work.src}
                    alt={work.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 shadow-lg transition-transform duration-300 group-hover:scale-110">
                      <Play className="ml-1 h-5 w-5 fill-white text-white" />
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={work.src}
                  alt={work.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-foreground truncate">{work.title}</h3>
              <p className="mt-1 text-sm text-muted line-clamp-2">{work.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {work.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-border bg-white/[0.03] px-2.5 py-0.5 text-xs text-muted">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {totalItems === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted">
          <p className="text-lg">暂无作品</p>
          <p className="mt-1 text-sm">该分类下还没有内容</p>
        </div>
      )}

      {/* 灯箱 */}
      {lightboxIndex !== null && lightboxWorks.length > 0 && (
        <Lightbox
          works={lightboxWorks}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
      {/* 合集弹窗 — Portal 到 body */}
      {expandedColId !== null && mounted && createPortal(
        (() => {
          const col = displayList.collections.find((c) => c.id === expandedColId);
          if (!col) return null;
          const colWorks = getColWorks(col.workIds);
          return (
            <div
              className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-sm"
              onClick={() => setExpandedColId(null)}
            >
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/[0.06] bg-black/50 backdrop-blur-2xl p-8 shadow-2xl animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{col.title}</h3>
                    <p className="text-sm text-white/50 mt-1">{colWorks.length} 件作品</p>
                  </div>
                  <button
                    onClick={() => setExpandedColId(null)}
                    className="rounded-full p-2 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {colWorks.length === 0 ? (
                  <p className="text-white/40 text-center py-12">合集里还没有作品</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {colWorks.map((w) => (
                      <div
                        key={w.id}
                        onClick={() => {
                          setExpandedColId(null);
                          setTimeout(() => openLightbox(colWorks, colWorks.indexOf(w)), 200);
                        }}
                        className="group/item cursor-pointer overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03] transition-all hover:border-white/20 card-glow"
                      >
                        <div className="aspect-[4/3] overflow-hidden">
                          {w.type === "video" ? (
                            <video src={w.src} controls className="h-full w-full object-cover" poster={w.thumbnail} />
                          ) : (
                            <img src={w.src} alt={w.title} className="h-full w-full object-cover transition-transform duration-500 group-hover/item:scale-105" />
                          )}
                        </div>
                        <div className="p-4">
                          <h5 className="font-semibold text-white truncate">{w.title}</h5>
                          <p className="mt-1 text-xs text-white/50 line-clamp-1">{w.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })(),
        document.body
      )}
    </>
  );
}
