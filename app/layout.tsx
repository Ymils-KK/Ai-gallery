import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";

import Pet from "@/components/Pet";
import PixelPet from "@/components/PixelPet";
import MusicPlayer from "@/components/MusicPlayer";
import VideoBg from "@/components/VideoBg";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "KK🐱 — AI 创作作品集",
    template: "%s | KK🐱",
  },
  description: "展示 AI 生成的图片、视频与创意作品",
};

function getSiteConfig() {
  try {
    const p = path.join(process.cwd(), "content", "site-config.json");
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {}
  return { navbar: { logo: "KK🐱" }, footer: { copyright: "AI Gallery. All rights reserved.", tagline: "用 AI 创作 · 用心分享" } };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = getSiteConfig();

  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-black text-white">
        <VideoBg />
        <Navbar logo={config.navbar?.logo || "KK🐱"} />
        <main className="flex-1 pt-14">{children}</main>
        <MusicPlayer />
        <Pet />
      </body>
    </html>
  );
}
