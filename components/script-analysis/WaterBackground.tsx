"use client";

import { useEffect, useRef } from "react";

export default function WaterBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 固定引用，避免嵌套函数中 TS 类型收窄丢失
    const canvasEl = canvas;
    const ctxEl = ctx;
    let animId = 0;

    const resize = () => {
      canvasEl.width = window.innerWidth;
      canvasEl.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // 水波模拟网格（低分辨率以保证性能）
    const SCALE = 6;
    const cols = Math.ceil(canvas.width / SCALE);
    const rows = Math.ceil(canvas.height / SCALE);

    let current = new Float32Array(cols * rows);
    let previous = new Float32Array(cols * rows);

    // 离屏 canvas 用于低分辨率渲染
    const offscreen = document.createElement("canvas");
    offscreen.width = cols;
    offscreen.height = rows;
    const offCtx = offscreen.getContext("2d")!;

    const DAMPING = 0.965;
    let mx = -100;
    let my = -100;
    let prevMx = -100;
    let prevMy = -100;

    const onMouseMove = (e: MouseEvent) => {
      prevMx = mx;
      prevMy = my;
      mx = e.clientX;
      my = e.clientY;
    };
    window.addEventListener("mousemove", onMouseMove);

    // 护眼绿底色
    const bgR = 36;
    const bgG = 52;
    const bgB = 42; // #24342a — 深护眼绿

    function animate() {
      // 交换缓冲区
      [current, previous] = [previous, current];

      // 波方程
      for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
          const i = y * cols + x;
          const sum =
            previous[(y - 1) * cols + x] +
            previous[(y + 1) * cols + x] +
            previous[y * cols + x - 1] +
            previous[y * cols + x + 1];
          current[i] = (sum / 2 - current[i]) * DAMPING;
        }
      }

      // 鼠标产生波纹
      const cx = Math.floor(mx / SCALE);
      const cy = Math.floor(my / SCALE);
      if (cx > 1 && cx < cols - 2 && cy > 1 && cy < rows - 2) {
        // 鼠标移动距离决定波纹强度
        const dx = mx - prevMx;
        const dy = my - prevMy;
        const speed = Math.sqrt(dx * dx + dy * dy);
        const strength = Math.min(120, 30 + speed * 2);

        current[cy * cols + cx] = strength;
        current[(cy - 1) * cols + cx] = strength * 0.65;
        current[(cy + 1) * cols + cx] = strength * 0.65;
        current[cy * cols + cx - 1] = strength * 0.65;
        current[cy * cols + cx + 1] = strength * 0.65;
        // 对角线
        current[(cy - 1) * cols + cx - 1] = strength * 0.35;
        current[(cy - 1) * cols + cx + 1] = strength * 0.35;
        current[(cy + 1) * cols + cx - 1] = strength * 0.35;
        current[(cy + 1) * cols + cx + 1] = strength * 0.35;
      }

      // 渲染到离屏 canvas
      const imageData = offCtx.createImageData(cols, rows);
      const data = imageData.data;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const h = current[i];
          const pixelI = i * 4;

          // 法线近似（用于光线折射感）
          const hL = x > 0 ? current[y * cols + x - 1] : h;
          const hR = x < cols - 1 ? current[y * cols + x + 1] : h;
          const hT = y > 0 ? current[(y - 1) * cols + x] : h;
          const hB = y < rows - 1 ? current[(y + 1) * cols + x] : h;

          const ndx = (hR - hL) * 0.35;
          const ndy = (hB - hT) * 0.35;
          const ripple = h * 0.55;

          data[pixelI] = Math.max(0, Math.min(255, bgR + ndx + ripple));
          data[pixelI + 1] = Math.max(0, Math.min(255, bgG + ndy + ripple));
          data[pixelI + 2] = Math.max(0, Math.min(255, bgB + ripple * 0.6));
          data[pixelI + 3] = 255;
        }
      }

      offCtx.putImageData(imageData, 0, 0);

      // 放大到完整分辨率（带平滑）
      ctxEl.imageSmoothingEnabled = true;
      ctxEl.imageSmoothingQuality = "medium";
      ctxEl.drawImage(offscreen, 0, 0, canvasEl.width, canvasEl.height);

      animId = requestAnimationFrame(animate);
    }

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
