"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles } from "lucide-react";

const links = [
  { href: "/#hero", label: "首页" },
  { href: "/#gallery", label: "作品" },
  { href: "/#about", label: "关于" },
  { href: "/#blog", label: "博客" },
];

export default function Navbar({ logo = "KK🐱" }: { logo?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  // 首页长页面 — IntersectionObserver 检测活跃区域
  useEffect(() => {
    if (pathname !== "/") {
      setActiveSection("");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveSection(`#${visible[0].target.id}`);
        }
      },
      { threshold: [0.1, 0.3, 0.5], rootMargin: "-80px 0px -40% 0px" }
    );

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((s) => observer.observe(s));

    return () => observer.disconnect();
  }, [pathname]);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    // 如果在其他页面（如 /blog/[slug]），让浏览器正常跳转回首页
    if (pathname !== "/") {
      return; // 用默认行为，跳回首页再锚点
    }
    e.preventDefault();
    const id = href.replace("/#", "#");
    const el = document.querySelector(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
    setOpen(false);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-black/20 backdrop-blur-2xl">
      <nav className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        <a
          href="/#hero"
          onClick={(e) => handleClick(e, "/#hero")}
          className="flex items-center gap-2 text-lg font-bold"
        >
          <Sparkles className="h-5 w-5 text-white/80" />
          <span className="text-gradient">{logo}</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const isActive =
              pathname === "/" && activeSection === link.href.replace("/", "");
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleClick(e, link.href)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-white/[0.12] text-white"
                    : "text-white/60 hover:text-white hover:bg-white/[0.08]"
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </div>

        {/* Mobile menu button */}
        <button
          className="rounded-lg p-2 text-white/60 hover:text-white hover:bg-white/[0.1] md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="切换菜单"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-b border-white/[0.06] bg-black/40 backdrop-blur-xl md:hidden">
          <div className="mx-auto max-w-6xl px-6 py-4 flex flex-col gap-1">
            {links.map((link) => {
              const isActive =
                pathname === "/" && activeSection === link.href.replace("/", "");
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleClick(e, link.href)}
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-white/[0.12] text-white"
                      : "text-white/60 hover:text-white hover:bg-white/[0.08]"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
