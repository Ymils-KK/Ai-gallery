"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Wallpaper {
  name: string;
}

export default function WallpaperBackground() {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState<number | null>(null);
  const [fading, setFading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 加载壁纸列表
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/wallpapers");
        if (res.ok) {
          const list = await res.json();
          if (list.length > 0) {
            setWallpapers(list);
            setCurrent(Math.floor(Math.random() * list.length));
          }
        }
      } catch {}
    }
    load();
  }, []);

  // 轮换
  const rotate = useCallback(() => {
    if (wallpapers.length <= 1) return;
    setFading(true);
    const nextIdx = (current + 1) % wallpapers.length;
    setNext(nextIdx);
    setTimeout(() => {
      setCurrent(nextIdx);
      setNext(null);
      setFading(false);
    }, 1200);
  }, [current, wallpapers.length]);

  useEffect(() => {
    if (wallpapers.length <= 1) return;
    timerRef.current = setTimeout(rotate, 30000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current, wallpapers, rotate]);

  if (wallpapers.length === 0) {
    return (
      <div className="fixed inset-0 z-0 bg-[#171918]" aria-hidden="true" />
    );
  }

  const currentImg = wallpapers[current]?.name;
  const nextImg = next !== null ? wallpapers[next]?.name : null;

  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      {/* 当前壁纸 */}
      {currentImg && (
        <img
          src={`/api/wallpapers/${currentImg}`}
          alt=""
          loading="eager"
          decoding="async"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ${
            fading ? "opacity-0" : "opacity-100"
          }`}
        />
      )}

      {/* 下一张壁纸（淡入） */}
      {nextImg && (
        <img
          src={`/api/wallpapers/${nextImg}`}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-100"
        />
      )}

      {/* 暗色叠加层，保证文字可读 */}
      <div className="absolute inset-0 bg-black/72" />

      {/* 渐变遮罩：顶部和底部更暗 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_34%),linear-gradient(180deg,rgba(10,10,10,0.35),rgba(10,10,10,0.92))]" />
    </div>
  );
}
