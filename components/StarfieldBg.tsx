"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  layer: number; // 0=慢 1=中 2=快
}

const COLORS = [
  "168, 85, 247",   // purple
  "99, 102, 241",   // indigo
  "59, 130, 246",   // blue
];

const PARTICLE_COUNT = 50;
const CONNECTION_DIST = 100;
const LAYER_SPEEDS = [0.3, 0.6, 1.0];

function createParticle(w: number, h: number): Particle {
  const layer = Math.floor(Math.random() * 3);
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    baseY: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.3,
    size: 1 + Math.random() * 2.5,
    opacity: 0.08 + Math.random() * 0.20,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    layer,
  };
}

export default function StarfieldBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationId: number;
    let scrollY = 0;
    let targetScrollY = 0;

    // 窗口大小变化时重建粒子
    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      particles = Array.from({ length: PARTICLE_COUNT }, () =>
        createParticle(canvas!.width, canvas!.height)
      );
    }

    resize();
    window.addEventListener("resize", resize);

    // 监听滚动
    function onScroll() {
      targetScrollY = window.scrollY;
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    // 动画循环
    function animate() {
      if (!canvas || !ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      // 平滑过渡滚动值
      scrollY += (targetScrollY - scrollY) * 0.08;
      const parallaxOffset = scrollY * 0.5;

      // 清屏（带拖尾效果）
      ctx.clearRect(0, 0, w, h);

      // 先画所有连线
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const py = p.baseY + parallaxOffset * LAYER_SPEEDS[p.layer];
        // 循环处理Y轴
        const wrappedY = ((py % h) + h) % h;

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const qy = q.baseY + parallaxOffset * LAYER_SPEEDS[q.layer];
          const wrappedQY = ((qy % h) + h) % h;

          const dx = Math.abs(p.x - q.x);
          const dy = Math.abs(wrappedY - wrappedQY);

          // 考虑循环连接
          const dist = Math.min(
            Math.sqrt(dx * dx + dy * dy),
            Math.sqrt((w - dx) * (w - dx) + dy * dy)
          );

          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.04;
            ctx.strokeStyle = `rgba(${p.color}, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, wrappedY);
            ctx.lineTo(q.x, wrappedQY);
            ctx.stroke();
          }
        }
      }

      // 画粒子
      for (const p of particles) {
        // 更新位置
        p.x += p.vx;
        p.baseY += p.vy;

        // 循环边界
        if (p.x < -20) p.x += w + 40;
        if (p.x > w + 20) p.x -= w + 40;
        if (p.baseY < -20) p.baseY += h + 40;
        if (p.baseY > h + 20) p.baseY -= h + 40;

        const py = p.baseY + parallaxOffset * LAYER_SPEEDS[p.layer];
        const wrappedY = ((py % (h + 40)) + (h + 40)) % (h + 40) - 20;

        // 光晕
        const gradient = ctx.createRadialGradient(
          p.x,
          wrappedY,
          0,
          p.x,
          wrappedY,
          p.size * 4
        );
        gradient.addColorStop(0, `rgba(${p.color}, ${p.opacity})`);
        gradient.addColorStop(0.3, `rgba(${p.color}, ${p.opacity * 0.5})`);
        gradient.addColorStop(1, `rgba(${p.color}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, wrappedY, p.size * 4, 0, Math.PI * 2);
        ctx.fill();

        // 中心亮点
        ctx.fillStyle = `rgba(100, 80, 140, ${p.opacity * 0.6})`;
        ctx.beginPath();
        ctx.arc(p.x, wrappedY, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
