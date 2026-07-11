"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LockKeyhole, LogOut, Menu, Sparkles, X } from "lucide-react";
import { usePrivateMode } from "@/components/PrivateMode";

const publicLinks = [
  { href: "/#hero", label: "首页" },
  { href: "/#gallery", label: "作品" },
  { href: "/#about", label: "关于" },
  { href: "/#blog", label: "博客" },
];

const privateLinks = [
  { href: "/script-analysis", label: "剧本分析" },
  { href: "/asset-library", label: "资产仓库" },
];

export default function Navbar({ logo = "KK" }: { logo?: string }) {
  const pathname = usePathname();
  const { ready, unlocked, unlock, lock } = usePrivateMode();
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const links = unlocked ? [...publicLinks, ...privateLinks] : [...publicLinks, { href: "/script-analysis", label: "私人入口" }];

  useEffect(() => {
    if (pathname !== "/") {
      setActiveSection("");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) setActiveSection(`#${visible[0].target.id}`);
      },
      { threshold: [0.1, 0.3, 0.5], rootMargin: "-80px 0px -40% 0px" }
    );

    const sections = document.querySelectorAll("#hero, #gallery, #about, #blog");
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [pathname]);

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    setOpen(false);
    if (!href.includes("#") || pathname !== "/") return;

    event.preventDefault();
    const hash = href.replace("/#", "#");
    if (window.location.hash !== hash) {
      window.history.pushState(null, "", hash);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }
  }

  function submitPassphrase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (unlock(passphrase)) {
      setPassphrase("");
      setError("");
      return;
    }
    setError("暗号不对");
  }

  function renderLinks() {
    return links.map((link) => {
      const isActive =
        (pathname === "/" && activeSection === link.href.replace("/", "")) ||
        (link.href.startsWith("/") && !link.href.includes("#") && pathname === link.href);
      return (
        <Link
          key={link.href}
          href={link.href}
          onClick={(event) => handleClick(event, link.href)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 ${
            isActive ? "bg-white/[0.12] text-white" : "text-white/60 hover:bg-white/[0.08] hover:text-white"
          }`}
        >
          {link.label}
        </Link>
      );
    });
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 h-14 bg-black/20 backdrop-blur-2xl">
      <nav className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        <Link href="/#hero" onClick={(event) => handleClick(event, "/#hero")} className="flex items-center gap-2 text-lg font-bold">
          <Sparkles className="h-5 w-5 text-white/80" />
          <span className="text-gradient">{logo}</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {renderLinks()}
          {ready && !unlocked && (
            <form onSubmit={submitPassphrase} className="ml-2 flex items-center gap-2">
              <input
                value={passphrase}
                onChange={(event) => {
                  setPassphrase(event.target.value);
                  setError("");
                }}
                type="password"
                placeholder={error || "暗号"}
                className={`h-9 w-24 rounded-md border bg-white/[0.06] px-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-white/35 ${
                  error ? "border-red-300/40" : "border-white/10"
                }`}
              />
              <button type="submit" className="rounded-lg p-2 text-white/60 transition hover:bg-white/[0.08] hover:text-white" aria-label="进入私人模式">
                <LockKeyhole className="h-4 w-4" />
              </button>
            </form>
          )}
          {ready && unlocked && (
            <button
              type="button"
              onClick={lock}
              className="ml-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white/60 transition hover:bg-white/[0.08] hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              退出
            </button>
          )}
        </div>

        <button className="rounded-lg p-2 text-white/60 hover:bg-white/[0.1] hover:text-white md:hidden" onClick={() => setOpen(!open)} aria-label="切换菜单">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-b border-white/[0.06] bg-black/55 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-4">
            {renderLinks()}
            {ready && !unlocked && (
              <form onSubmit={submitPassphrase} className="mt-2 flex gap-2">
                <input
                  value={passphrase}
                  onChange={(event) => {
                    setPassphrase(event.target.value);
                    setError("");
                  }}
                  type="password"
                  placeholder={error || "输入暗号"}
                  className={`min-w-0 flex-1 rounded-md border bg-white/[0.06] px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/35 ${
                    error ? "border-red-300/40" : "border-white/10"
                  }`}
                />
                <button type="submit" className="rounded-md bg-white px-3 py-2 text-sm font-medium text-black">
                  进入
                </button>
              </form>
            )}
            {ready && unlocked && (
              <button type="button" onClick={lock} className="rounded-lg px-4 py-3 text-left text-sm font-medium text-white/60 hover:bg-white/[0.08] hover:text-white">
                退出私人模式
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
