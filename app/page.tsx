import fs from "fs";
import path from "path";
import Link from "next/link";
import { Globe, Link2, ExternalLink, ArrowRight } from "lucide-react";
import Gallery from "@/components/Gallery";
import type { Collection } from "@/components/CollectionGrid";
import BlogCard from "@/components/BlogCard";
import { getAllPosts } from "@/lib/posts";
import profile from "@/content/profile";
import type { Work } from "@/content/works";
import PageSlider from "@/components/PageSlider";
import HeroClock from "@/components/HeroClock";
import HeroPlayer from "@/components/HeroPlayer";

const iconMap: Record<string, React.ReactNode> = {
  github: <Globe className="h-5 w-5" />,
  weibo: <Link2 className="h-5 w-5" />,
  bilibili: <ExternalLink className="h-5 w-5" />,
};

interface SiteConfig {
  hero: { title: string; titleHighlight: string; subtitle: string };
  gallery: { heading: string; subheading: string };
  about: { heading: string };
  blog: { heading: string; subheading: string };
  footer: { copyright: string; tagline: string };
  navbar: { logo: string };
}

function getSiteConfig(): SiteConfig {
  const p = path.join(process.cwd(), "content", "site-config.json");
  try { if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf-8")); } catch {}
  return {
    hero: { title: "KK个人站", titleHighlight: "AI 创作", subtitle: "随便玩玩" },
    gallery: { heading: "作品", subheading: "我的 AI 创作合集" },
    about: { heading: "关于我" },
    blog: { heading: "博客", subheading: "AI 创作心得、教程和思考" },
    footer: { copyright: "KK🐱. All rights reserved.", tagline: "用 AI 创作 · 用心分享" },
    navbar: { logo: "KK🐱" },
  };
}

async function getWorks(): Promise<Work[]> {
  const p = path.join(process.cwd(), "content", "works.json");
  try { if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf-8")); } catch {}
  return (await import("@/content/works")).default;
}

function getCollections(): Collection[] {
  const p = path.join(process.cwd(), "content", "collections.json");
  try { if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf-8")); } catch {}
  return [];
}

export default async function HomePage() {
  const config = getSiteConfig();
  const works = await getWorks();
  const collections = getCollections();
  const allPosts = getAllPosts();
  const collectedIds = new Set(collections.flatMap((c) => c.workIds));
  const soloWorks = works.filter((w) => !collectedIds.has(w.id));
  const recentPosts = allPosts.slice(0, 3);

  return (
    <PageSlider>
      {/* ===== 第1页: 氛围感首页 ===== */}
      <div id="hero" className="relative flex flex-col items-center justify-center h-full overflow-hidden">
        {/* 中央时钟 */}
        <div className="relative z-10">
          <HeroClock name={profile.name} />
        </div>
        {/* 底部播放器 */}
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10">
          <HeroPlayer src="/maybe.mp3" title="Maybe" />
        </div>
      </div>

      {/* ===== 第2页: 作品 ===== */}
      <div id="gallery" className="h-full overflow-y-auto relative">
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06] p-6 sm:p-8">
          <h2 className="section-heading mb-3">{config.gallery.heading}</h2>
          <p className="mb-10 text-center text-[15px] text-white/60">{config.gallery.subheading}</p>
          <Gallery works={soloWorks} collections={collections} allWorks={works} />
          </div>
        </div>
      </div>

      {/* ===== 第3页: 关于我 ===== */}
      <div id="about" className="h-full overflow-y-auto relative">
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06] p-6 sm:p-10">
          <h2 className="section-heading mb-12">{config.about.heading}</h2>

          <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:gap-8">
            <div className="mb-6 flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent via-accent-blue to-accent-cyan p-[2px] sm:mb-0">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white/90 text-4xl">🎨</div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground/80">{profile.name}</h3>
              <p className="mt-1 text-gradient text-base font-medium">{profile.tagline}</p>
            </div>
          </div>

          <div className="mt-10 space-y-3">
            {profile.bio.map((p, i) => (
              <p key={i} className="text-sm text-foreground/60 leading-relaxed">{p}</p>
            ))}
          </div>

          <div className="mt-10">
            <h4 className="text-sm font-semibold text-foreground/70">常用 AI 工具</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.tools.map((tool) => (
                <span key={tool} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/80">{tool}</span>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <h4 className="text-sm font-semibold text-foreground/70">找到我</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.socialLinks.map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/30 bg-white/50 backdrop-blur-sm px-3 py-2 text-xs text-foreground/60 transition-all hover:text-foreground hover:border-black/20">
                  {iconMap[link.icon]}{link.label}
                </a>
              ))}
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* ===== 第4页: 博客 ===== */}
      <div id="blog" className="h-full overflow-y-auto relative">
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <h2 className="section-heading mb-3 text-foreground/80">{config.blog.heading}</h2>
          <p className="mb-10 text-center text-[15px] text-muted/70">{config.blog.subheading}</p>

          {recentPosts.length === 0 ? (
            <div className="py-16 text-center text-muted/50"><p className="text-lg">还没有文章</p></div>
          ) : (
            <div className="grid gap-4">
              {recentPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          )}

          {allPosts.length > 3 && (
            <div className="mt-6 text-center">
              <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted/70 hover:text-white/80 transition-colors">
                查看全部 {allPosts.length} 篇文章 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageSlider>
  );
}
