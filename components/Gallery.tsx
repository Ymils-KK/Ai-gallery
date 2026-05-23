"use client";

import { useState, useMemo } from "react";
import { Play } from "lucide-react";
import type { Work } from "@/content/works";
import Lightbox from "./Lightbox";

interface GalleryProps {
  works: Work[];
}

type Filter = "全部" | "图片" | "视频";

export default function Gallery({ works }: GalleryProps) {
  const [filter, setFilter] = useState<Filter>("全部");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filters: Filter[] = ["全部", "图片", "视频"];

  const filteredWorks = useMemo(() => {
    if (filter === "全部") return works;
    if (filter === "图片") return works.filter((w) => w.type === "image");
    return works.filter((w) => w.type === "video");
  }, [works, filter]);

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
                ? "bg-accent text-white shadow-lg shadow-accent/25"
                : "text-muted border border-border hover:text-foreground hover:border-white/15"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 作品网格 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredWorks.map((work, idx) => (
          <div
            key={work.id}
            onClick={() =>
              setLightboxIndex(filteredWorks.indexOf(work))
            }
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card card-glow transition-all duration-300"
          >
            {/* 图片/缩略图 */}
            <div className="aspect-[4/3] overflow-hidden">
              {work.type === "video" ? (
                <div className="relative h-full w-full">
                  <img
                    src={work.thumbnail || work.src}
                    alt={work.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/90 shadow-lg transition-transform duration-300 group-hover:scale-110">
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

            {/* 信息 */}
            <div className="p-4">
              <h3 className="font-semibold text-foreground truncate">
                {work.title}
              </h3>
              <p className="mt-1 text-sm text-muted line-clamp-2">
                {work.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {work.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border bg-white/[0.03] px-2.5 py-0.5 text-xs text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {filteredWorks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted">
          <p className="text-lg">暂无作品</p>
          <p className="mt-1 text-sm">该分类下还没有内容</p>
        </div>
      )}

      {/* 灯箱 */}
      {lightboxIndex !== null && (
        <Lightbox
          works={filteredWorks}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
