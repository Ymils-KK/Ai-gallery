"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const pageIds = ["hero", "gallery", "about", "blog"];

interface PageSliderProps {
  children: React.ReactNode[];
}

export default function PageSlider({ children }: PageSliderProps) {
  const [page, setPage] = useState(0);
  const [ready, setReady] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const total = children.length;

  // 客户端挂载后，读取 URL hash，瞬间跳到正确页，再启用过渡动画
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    const idx = pageIds.indexOf(hash);
    if (idx >= 0) setPage(idx);
    // 延迟启用 transition，避免初始跳转时的动画
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setReady(true));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const goTo = useCallback(
    (idx: number) => {
      const newPage = ((idx % total) + total) % total;
      setPage(newPage);
      // 同步 URL hash
      if (typeof window !== "undefined") {
        const id = pageIds[newPage];
        if (id && window.location.hash !== `#${id}`) {
          window.history.replaceState(null, "", `/#${id}`);
        }
      }
    },
    [total]
  );

  // 监听 hash 变化（用户点导航栏链接）
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      const idx = pageIds.indexOf(hash);
      if (idx >= 0 && idx !== page) {
        setPage(idx);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [page]);

  // 键盘
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goTo(page + 1);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goTo(page - 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [page, goTo]);

  // 触摸
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) {
      goTo(diff > 0 ? page + 1 : page - 1);
    }
    setTouchStart(null);
  };

  // 滚轮
  useEffect(() => {
    let wheelAccum = 0;
    const handleWheel = (e: WheelEvent) => {
      // 只拦截在主要内容区域
      wheelAccum += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(wheelAccum) > 80) {
        goTo(wheelAccum > 0 ? page + 1 : page - 1);
        wheelAccum = 0;
      }
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: true });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, [page, goTo]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{ height: "calc(100svh - 56px)" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 页面滑动容器 */}
      <div
        className={`flex h-full ease-[cubic-bezier(0.32,0.72,0,1)] ${ready ? "transition-transform duration-600" : ""}`}
        style={{
          width: `${total * 100}vw`,
          transform: `translateX(-${page * 100}vw)`,
        }}
      >
        {children.map((child, i) => (
          <div
            key={i}
            className={`h-full overflow-y-auto ${i === page ? "page-panel-active" : ""}`}
            style={{ width: "100vw" }}
          >
            {child}
          </div>
        ))}
      </div>

      {/* 左箭头 */}
      <button
        onClick={() => goTo(page - 1)}
        type="button"
        className="fixed left-6 top-1/2 z-40 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/60 shadow-lg backdrop-blur-md transition-all hover:bg-white/20 hover:text-white sm:flex"
        aria-label="上一页"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* 右箭头 */}
      <button
        onClick={() => goTo(page + 1)}
        type="button"
        className="fixed right-6 top-1/2 z-40 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/60 shadow-lg backdrop-blur-md transition-all hover:bg-white/20 hover:text-white sm:flex"
        aria-label="下一页"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* 底部指示点 */}
      <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md shadow-sm border border-border">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            type="button"
            aria-current={i === page ? "page" : undefined}
            className={`rounded-full transition-all duration-300 ${
              i === page
                ? "h-2 w-6 bg-white"
                : "h-2 w-2 bg-white/25 hover:bg-white/50"
            }`}
            aria-label={`第 ${i + 1} 页`}
          />
        ))}
      </div>
    </div>
  );
}
