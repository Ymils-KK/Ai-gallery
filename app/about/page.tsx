import { Globe, Link2, ExternalLink } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于我",
  description: "了解更多关于我和我的 AI 创作之旅",
};

// ============================================
// 👇 在这里修改你的个人信息
// ============================================

const profile = {
  name: "创作者",
  tagline: "AI 创意探索者",
  bio: [
    "你好！我是一名 AI 创作爱好者，热衷于用各种 AI 工具探索视觉艺术的边界。",
    "从 AI 绘画到视频生成，我不断尝试新的技术和工具，将脑海中的想象变为现实。这个网站就是我分享这些作品的地方。",
    "我相信 AI 不是要取代人类的创造力，而是为创意打开一扇新的窗户。希望你喜欢我的作品！",
  ],
  tools: [
    "Midjourney",
    "Stable Diffusion",
    "DALL-E",
    "Runway",
    "Pika Labs",
    "ComfyUI",
  ],
  socialLinks: [
    {
      label: "GitHub",
      href: "https://github.com",
      icon: "github",
    },
    {
      label: "微博",
      href: "https://weibo.com",
      icon: "weibo",
    },
    {
      label: "B站",
      href: "https://bilibili.com",
      icon: "bilibili",
    },
  ],
};

// ============================================

const iconMap: Record<string, React.ReactNode> = {
  github: <Globe className="h-5 w-5" />,
  weibo: <Link2 className="h-5 w-5" />,
  bilibili: <ExternalLink className="h-5 w-5" />,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      {/* 头像 & 名字 */}
      <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:gap-8">
        {/* 头像占位 */}
        <div className="mb-6 flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent via-accent-blue to-accent-cyan p-[2px] sm:mb-0">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-card text-4xl">
            🎨
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">{profile.name}</h1>
          <p className="mt-2 text-gradient text-lg font-medium">
            {profile.tagline}
          </p>
        </div>
      </div>

      {/* 简介 */}
      <div className="mt-12 space-y-4">
        {profile.bio.map((paragraph, i) => (
          <p key={i} className="text-base text-muted leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      {/* AI 工具标签 */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold">常用 AI 工具</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {profile.tools.map((tool) => (
            <span
              key={tool}
              className="rounded-full border border-accent/30 bg-accent/5 px-4 py-2 text-sm text-accent transition-all hover:border-accent/60 hover:bg-accent/10"
            >
              {tool}
            </span>
          ))}
        </div>
      </div>

      {/* 社交链接 */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold">找到我</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {profile.socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-muted transition-all duration-300 hover:text-foreground hover:border-white/15 card-glow"
            >
              {iconMap[link.icon]}
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
