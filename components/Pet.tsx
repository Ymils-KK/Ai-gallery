"use client";

import { useState, useEffect, useRef } from "react";

const messages = [
  "你好呀！",
  "今天创作了什么？",
  "AI 让想象成真 ✨",
  "加油！",
  "看看我的新作品~",
  "休息一下也不错",
  "点击我试试？",
  "嘿嘿",
  "灵感来了吗？",
  "这个世界真美",
  "你真有品味",
  "我是洛克希哟~",
];

const emotes = ["💖", "✨", "🌟", "💫", "🎨", "🔥", "💜", "🫧"];

export default function Pet() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [bubble, setBubble] = useState<string | null>(null);
  const [emote, setEmote] = useState<string | null>(null);
  const [bouncing, setBouncing] = useState(false);
  const [tilting, setTilting] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [idleOffset, setIdleOffset] = useState(0);
  const petRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- 空闲浮动 ----
  useEffect(() => {
    let frame: number;
    let t = 0;
    const animate = () => {
      t += 0.02;
      setIdleOffset(Math.sin(t) * 6);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // ---- 随机冒泡 ----
  useEffect(() => {
    const showRandomBubble = () => {
      const msg = messages[Math.floor(Math.random() * messages.length)];
      setBubble(msg);
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
      bubbleTimer.current = setTimeout(() => setBubble(null), 3000);
    };

    showRandomBubble();
    const interval = setInterval(showRandomBubble, 8000 + Math.random() * 8000);
    return () => clearInterval(interval);
  }, []);

  // ---- 拖拽（仅响应非透明像素） ----
  const isTransparentAt = (img: HTMLImageElement, x: number, y: number): boolean => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return true;
      ctx.drawImage(img, 0, 0);
      // 将点击坐标映射到图片原始分辨率
      const scaleX = img.naturalWidth / img.clientWidth;
      const scaleY = img.naturalHeight / img.clientHeight;
      const px = Math.floor(x * scaleX);
      const py = Math.floor(y * scaleY);
      if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) return true;
      const alpha = ctx.getImageData(px, py, 1, 1).data[3];
      return alpha < 10; // alpha 低于 10 视为透明
    } catch {
      return false; // 出错时允许拖拽
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    // 点在透明区域 → 不触发拖拽/点击
    if (isTransparentAt(img, clickX, clickY)) return;

    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    setBubble(null);
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };
    const handleUp = () => setDragging(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging, dragStart]);

  // ---- 点击反馈 ----
  const handleClick = () => {
    if (dragging) return;
    setBouncing(true);
    setTilting(Math.random() > 0.5 ? -8 : 8);
    const randEmote = emotes[Math.floor(Math.random() * emotes.length)];
    setEmote(randEmote);
    setTimeout(() => {
      setBouncing(false);
      setTilting(0);
    }, 400);
    setTimeout(() => setEmote(null), 800);

    const msg = messages[Math.floor(Math.random() * messages.length)];
    setBubble(msg);
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), 2500);
  };

  return (
    <div
      ref={petRef}
      className="fixed z-[80] select-none"
      style={{
        right: 24 - position.x,
        bottom: 0 - position.y,
        transform: `translateY(${idleOffset}px)`,
      }}
    >
      {/* 说话气泡 */}
      {bubble && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 animate-fade-in z-10">
          <div className="whitespace-nowrap rounded-xl border border-white/15 bg-card/95 backdrop-blur-md px-4 py-2 text-sm text-foreground shadow-lg">
            {bubble}
          </div>
          <div className="mx-auto h-2.5 w-2.5 rotate-45 border-b border-r border-white/15 bg-card/95 -mt-[3px]" />
        </div>
      )}

      {/* 飘出表情 */}
      {emote && (
        <div
          className="absolute left-1/2 -translate-x-1/2 animate-float-up pointer-events-none z-10"
          style={{ top: "30%" }}
        >
          <span className="text-3xl">{emote}</span>
        </div>
      )}

      {/* 脚下辉光 */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-5 w-[150px] rounded-full bg-gradient-to-r from-accent/25 via-accent-blue/15 to-accent-cyan/25 blur-xl pointer-events-none" />

      {/* 洛克希 — 图片即为可拖拽元素 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src="/images/KK.png"
        alt="洛克希"
        className={`transition-all duration-300 drop-shadow-[0_0_30px_rgba(168,85,247,0.2)] ${dragging ? "cursor-grabbing" : "cursor-pointer"}`}
        style={{
          width: 320,
          transform: bouncing
            ? `scale(1.08) rotate(${tilting}deg)`
            : `scale(1) rotate(${tilting}deg)`,
        }}
        draggable={false}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
      />
    </div>
  );
}
