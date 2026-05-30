"use client";

import { useEffect, useRef } from "react";

export default function ShanshuiBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      draw();
    }

    function draw() {
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;

      // 底色
      ctx.fillStyle = "#f5f0e8";
      ctx.fillRect(0, 0, w, h);

      // 远山 — 最淡最远
      drawMountain(ctx, w, h, 0.22, "#c8c0b0", 0.5);
      drawMountain(ctx, w, h, 0.26, "#bfb8a8", 0.55);

      // 中景山
      drawMountain(ctx, w, h, 0.32, "#a09888", 0.6);
      drawMountain(ctx, w, h, 0.36, "#908878", 0.65);

      // 较近的山
      drawMountain(ctx, w, h, 0.42, "#787060", 0.72);
      drawMountain(ctx, w, h, 0.46, "#686058", 0.78);

      // 前景山 — 最深
      drawMountain(ctx, w, h, 0.52, "#484030", 0.85);
      drawMountain(ctx, w, h, 0.56, "#383028", 0.9);

      // 水面
      const waterY = h * 0.72;
      const waterGrad = ctx.createLinearGradient(0, waterY, 0, h);
      waterGrad.addColorStop(0, "rgba(200, 190, 170, 0.3)");
      waterGrad.addColorStop(0.5, "rgba(180, 170, 155, 0.5)");
      waterGrad.addColorStop(1, "rgba(220, 215, 200, 0.7)");
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, waterY, w, h - waterY);

      // 水面涟漪
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 6; i++) {
        const y = waterY + 30 + i * 25;
        ctx.beginPath();
        for (let x = 0; x < w; x += 4) {
          const ry = y + Math.sin(x * 0.01 + i * 1.5) * 3;
          if (x === 0) ctx.moveTo(x, ry);
          else ctx.lineTo(x, ry);
        }
        ctx.stroke();
      }

      // 雾气
      for (let i = 0; i < 3; i++) {
        const mistY = h * (0.3 + i * 0.15);
        const mistGrad = ctx.createLinearGradient(0, mistY - 20, 0, mistY + 40);
        mistGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
        mistGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.25)");
        mistGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = mistGrad;
        ctx.fillRect(0, mistY - 20, w, 60);
      }

      // 太阳/月亮
      const sunX = w * 0.78;
      const sunY = h * 0.18;
      const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 60);
      sunGrad.addColorStop(0, "rgba(255, 250, 240, 0.6)");
      sunGrad.addColorStop(0.3, "rgba(255, 240, 220, 0.2)");
      sunGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
      ctx.fill();

      // 小鸟
      drawBird(ctx, w * 0.35, h * 0.2, 8);
      drawBird(ctx, w * 0.38, h * 0.17, 6);
      drawBird(ctx, w * 0.42, h * 0.22, 5);
    }

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}

// 画出峰山形
function drawMountain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  baseYRatio: number,
  color: string,
  alpha: number
) {
  const baseY = h * baseYRatio;
  const peakH = h * 0.25 * Math.random() + h * 0.08;

  ctx.fillStyle = color.replace(")", `, ${alpha})`).replace("rgb", "rgba");
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  ctx.beginPath();
  ctx.moveTo(-10, baseY);

  const segments = 8;
  for (let i = 0; i <= segments; i++) {
    const x = (w / segments) * i;
    const variance = Math.sin(i * 1.3) * peakH * 0.5 + Math.sin(i * 2.7) * peakH * 0.3;
    const y = baseY - peakH * 0.5 - variance;
    ctx.lineTo(x, y);
  }

  ctx.lineTo(w + 10, baseY + 20);
  ctx.closePath();
  ctx.fill();
}

function drawBird(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.strokeStyle = "rgba(80, 70, 50, 0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.quadraticCurveTo(x - size * 0.4, y - size * 0.7, x, y);
  ctx.quadraticCurveTo(x + size * 0.4, y - size * 0.7, x + size, y);
  ctx.stroke();
}
