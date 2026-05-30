"use client";

import { useState } from "react";
import { ChevronDown, Layers } from "lucide-react";
import type { Work } from "@/content/works";

export interface Collection {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  workIds: string[];
  tags: string[];
  date: string;
}

interface Props {
  collections: Collection[];
  works: Work[];
}

export default function CollectionGrid({ collections, works }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (collections.length === 0) return null;

  // 根据 workIds 查找作品
  function getWorks(ids: string[]): Work[] {
    return ids.map((id) => works.find((w) => w.id === id)).filter(Boolean) as Work[];
  }

  // 取合集封面：有缩略图用缩略图，否则用第一件作品图
  function getCover(col: Collection): string {
    if (col.thumbnail) return col.thumbnail;
    const colWorks = getWorks(col.workIds);
    return colWorks[0]?.src || "";
  }

  // 取预览图（叠层用，最多3张）
  function getPreviews(col: Collection): string[] {
    return getWorks(col.workIds)
      .slice(0, 3)
      .map((w) => w.thumbnail || w.src)
      .filter(Boolean);
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {collections.map((col) => {
        const previews = getPreviews(col);
        const cover = getCover(col);
        const isExpanded = expandedId === col.id;
        const colWorks = getWorks(col.workIds);

        return (
          <div key={col.id} className="contents">
            {/* 合集卡片 */}
            <div
              onClick={() => setExpandedId(isExpanded ? null : col.id)}
              className={`group relative cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 ${
                isExpanded
                  ? "border-white/15 shadow-lg "
                  : "border-border hover:border-white/15 card-glow"
              }`}
            >
              {/* 叠层预览 */}
              <div className="relative aspect-[4/3] bg-card">
                {/* 底层图片 — 堆叠效果 */}
                {previews.length >= 3 && (
                  <div
                    className="absolute inset-0 transition-transform duration-300 group-hover:translate-y-1"
                    style={{
                      transform: "rotate(-6deg) scale(0.85)",
                      transformOrigin: "bottom left",
                      opacity: 0.4,
                    }}
                  >
                    <img
                      src={previews[2]}
                      alt=""
                      className="h-full w-full rounded-xl object-cover"
                    />
                  </div>
                )}

                {/* 中层图片 */}
                {previews.length >= 2 && (
                  <div
                    className="absolute inset-0 transition-transform duration-300 group-hover:-translate-y-0.5"
                    style={{
                      transform: "rotate(3deg) scale(0.92)",
                      transformOrigin: "bottom right",
                      opacity: 0.55,
                    }}
                  >
                    <img
                      src={previews[1]}
                      alt=""
                      className="h-full w-full rounded-xl object-cover"
                    />
                  </div>
                )}

                {/* 顶层图片 */}
                <div className="absolute inset-0 transition-transform duration-300 group-hover:-translate-y-1 z-10">
                  <img
                    src={cover}
                    alt={col.title}
                    className="h-full w-full rounded-xl object-cover shadow-lg"
                  />
                </div>

                {/* 作品数标签 */}
                <div className="absolute top-3 right-3 z-20 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1 text-xs text-white">
                  <Layers className="inline h-3 w-3 mr-1" />
                  {col.workIds.length} 件作品
                </div>

                {/* 渐变遮罩 */}
                <div className="absolute bottom-0 left-0 right-0 z-20 h-1/2 bg-gradient-to-t from-card to-transparent pointer-events-none" />
              </div>

              {/* 信息区 */}
              <div className="relative z-20 p-5 pt-3 bg-card">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-foreground group-hover:text-white/80 transition-colors">
                      {col.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted line-clamp-2">
                      {col.description || "暂无描述"}
                    </p>
                  </div>
                  <ChevronDown
                    className={`mt-1 h-5 w-5 text-muted shrink-0 transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {/* 标签 */}
                {col.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {col.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border bg-white/[0.03] px-2 py-0.5 text-[10px] text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 展开区域 — 全宽网格 */}
            {isExpanded && (
              <div className="col-span-full animate-fade-in">
                <div className="rounded-2xl border border-white/10 bg-card/50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-foreground">
                      {col.title} — {colWorks.length} 件作品
                    </h4>
                    <button
                      onClick={() => setExpandedId(null)}
                      className="text-sm text-muted hover:text-foreground transition-colors"
                    >
                      收起
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {colWorks.map((work) => (
                      <div
                        key={work.id}
                        className="group/work overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-white/15"
                      >
                        <div className="aspect-[4/3] overflow-hidden">
                          {work.type === "video" ? (
                            <video
                              src={work.src}
                              controls
                              className="h-full w-full object-cover"
                              poster={work.thumbnail}
                            />
                          ) : (
                            <img
                              src={work.src}
                              alt={work.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover/work:scale-105"
                            />
                          )}
                        </div>
                        <div className="p-4">
                          <h5 className="font-semibold text-foreground truncate">
                            {work.title}
                          </h5>
                          <p className="mt-1 text-xs text-muted line-clamp-1">
                            {work.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
