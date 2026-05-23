"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/", label: "作品" },
  { href: "/about", label: "关于" },
  { href: "/blog", label: "博客" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <Sparkles className="h-5 w-5 text-accent" />
          <span className="text-gradient">AI Gallery</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-white/[0.06] text-foreground"
                    : "text-muted hover:text-foreground hover:bg-white/[0.03]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile menu button */}
        <button
          className="rounded-lg p-2 text-muted hover:text-foreground hover:bg-white/[0.06] md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="切换菜单"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-b border-border bg-background/95 backdrop-blur-xl md:hidden">
          <div className="mx-auto max-w-6xl px-6 py-4 flex flex-col gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-white/[0.06] text-foreground"
                      : "text-muted hover:text-foreground hover:bg-white/[0.03]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
