"use client";

import { useState, useEffect, useRef } from "react";

const messages = [
  "你好呀！", "今天创作了什么？", "AI 让想象成真 ✨", "加油！",
  "看看我的新作品~", "休息一下也不错", "点击我试试？", "嘿嘿",
  "灵感来了吗？", "这个世界真美", "你真有品味",
];

const emotes = ["💖", "✨", "🌟", "💫", "🎨", "🔥", "💜", "🫧"];

export default function PixelPet() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [bubble, setBubble] = useState<string | null>(null);
  const [emote, setEmote] = useState<string | null>(null);
  const [mood, setMood] = useState<"idle" | "jump" | "happy" | "walk">("idle");
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [frame, setFrame] = useState(0);
  const petRef = useRef<HTMLDivElement>(null);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 待机呼吸帧循环
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % 60);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // 随机冒泡
  useEffect(() => {
    const showBubble = () => {
      const msg = messages[Math.floor(Math.random() * messages.length)];
      setBubble(msg);
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
      bubbleTimer.current = setTimeout(() => setBubble(null), 3000);
    };
    showBubble();
    const interval = setInterval(showBubble, 8000 + Math.random() * 8000);
    return () => clearInterval(interval);
  }, []);

  // 拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    setBubble(null);
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      setMood("walk");
    };
    const handleUp = () => { setDragging(false); setMood("idle"); };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging, dragStart]);

  // 点击
  const handleClick = () => {
    if (dragging) return;
    setMood("jump");
    setEmote(emotes[Math.floor(Math.random() * emotes.length)]);
    setTimeout(() => { setMood("happy"); }, 300);
    setTimeout(() => { setMood("idle"); setEmote(null); }, 800);

    const msg = messages[Math.floor(Math.random() * messages.length)];
    setBubble(msg);
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), 2500);
  };

  // 动画偏移
  const idleY = Math.sin(frame * 0.3) * 2;
  const walkOffset = frame % 8 < 4 ? -1 : 1;
  const jumpY = mood === "jump" ? -20 : mood === "happy" ? -4 : idleY;

  return (
    <div
      ref={petRef}
      className={`fixed z-[80] select-none ${dragging ? "cursor-grabbing" : "cursor-pointer"}`}
      style={{
        right: 24 - position.x,
        bottom: 24 - position.y,
        transform: `translateY(${jumpY}px)`,
        transition: mood === "jump" ? "transform 0.15s ease-out" : "transform 0.3s ease-out",
        imageRendering: "pixelated",
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* 气泡 */}
      {bubble && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 animate-fade-in z-10">
          <div className="whitespace-nowrap rounded-xl border border-border bg-card/95 backdrop-blur-md px-3 py-1.5 text-[11px] text-foreground shadow-lg">
            {bubble}
          </div>
          <div className="mx-auto h-2 w-2 rotate-45 border-b border-r border-border bg-card/95 -mt-0.5" />
        </div>
      )}

      {/* 表情 */}
      {emote && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 animate-float-up pointer-events-none z-10">
          <span className="text-xl">{emote}</span>
        </div>
      )}

      {/* 像素小人本体 */}
      <div className="relative" style={{ width: 64, height: 80 }}>
        {/* --- 头发（紫蓝色）--- */}
        {/* 头顶 */}
        <PixelRow
          y={0}
          colors={[null, null, "#6d28d9", "#7c3aed", "#6d28d9", null, null]}
          size={8}
        />
        <PixelRow
          y={1}
          colors={[null, "#6d28d9", "#7c3aed", "#8b5cf6", "#7c3aed", "#6d28d9", null]}
          size={8}
        />
        <PixelRow
          y={2}
          colors={["#5b21b6", "#7c3aed", "#fce7d8", "#fce7d8", "#fce7d8", "#7c3aed", "#5b21b6"]}
          size={8}
        />

        {/* --- 脸 --- */}
        <PixelRow
          y={3}
          colors={["#7c3aed", "#fce7d8", "#fce7d8", "#fce7d8", "#fce7d8", "#fce7d8", "#7c3aed"]}
          size={8}
        />
        {/* 眼睛行 */}
        <PixelRow
          y={4}
          colors={["#7c3aed", "#fce7d8", "#1d1d1f", "#fce7d8", "#fce7d8", "#1d1d1f", "#7c3aed"]}
          size={8}
        />
        {/* 腮红行 */}
        <PixelRow
          y={5}
          colors={["#7c3aed", "#fce7d8", "#fce7d8", "#fca5a5", "#fca5a5", "#fce7d8", "#7c3aed"]}
          size={8}
        />
        {/* 嘴巴行 */}
        <PixelRow
          y={6}
          colors={["#7c3aed", "#fce7d8", "#fce7d8", "#f87171", "#fce7d8", "#fce7d8", "#7c3aed"]}
          size={8}
        />

        {/* --- 脖子 --- */}
        <PixelRow
          y={7}
          colors={[null, "#fce7d8", "#fce7d8", "#fce7d8", "#fce7d8", "#fce7d8", null]}
          size={8}
        />

        {/* --- 身体（紫色裙子） --- */}
        <PixelRow
          y={8}
          colors={[null, "#7c3aed", "#8b5cf6", "#8b5cf6", "#8b5cf6", "#7c3aed", null]}
          size={8}
        />
        <PixelRow
          y={9}
          colors={[null, "#7c3aed", "#8b5cf6", "#a78bfa", "#8b5cf6", "#7c3aed", null]}
          size={8}
        />
        <PixelRow
          y={10}
          colors={["#7c3aed", "#8b5cf6", "#8b5cf6", "#a78bfa", "#8b5cf6", "#8b5cf6", "#7c3aed"]}
          size={8}
        />

        {/* 腿 */}
        <PixelRow
          y={11}
          colors={[null, "#fce7d8", null, null, null, "#fce7d8", null]}
          size={8}
        />
        <PixelRow
          y={12}
          colors={[null, "#fce7d8", null, null, null, "#fce7d8", null]}
          size={8}
        />
        {/* 鞋子 */}
        <PixelRow
          y={13}
          colors={[null, "#5b21b6", null, null, null, "#5b21b6", null]}
          size={8}
        />
      </div>

      {/* 脚下阴影 */}
      <div
        className="mx-auto rounded-full bg-black/[0.08] transition-all duration-300"
        style={{
          width: mood === "jump" ? 24 : 40,
          height: 4,
          marginTop: 2,
        }}
      />

      <p className="mt-1 text-center text-[10px] text-muted/40 select-none">拖我走~</p>
    </div>
  );
}

// 像素行组件
function PixelRow({
  y,
  colors,
  size,
}: {
  y: number;
  colors: (string | null)[];
  size: number;
}) {
  return (
    <div className="flex" style={{ position: "absolute", top: y * size, left: 0, right: 0 }}>
      {colors.map((color, i) => (
        <div
          key={i}
          style={{
            width: size,
            height: size,
            backgroundColor: color || "transparent",
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}
