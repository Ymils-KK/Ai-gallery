import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import MusicPlayer from "@/components/MusicPlayer";
import VideoBg from "@/components/VideoBg";
import MagicPixelPet from "@/components/MagicPixelPet";
import { PrivateModeProvider, PrivateRouteGate } from "@/components/PrivateMode";
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
    default: "KK | AI Gallery",
    template: "%s | KK",
  },
  description: "AI gallery and creative portfolio",
};

function getSiteConfig() {
  try {
    const p = path.join(process.cwd(), "content", "site-config.json");
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {}
  return {
    navbar: { logo: "KK" },
    footer: { copyright: "AI Gallery. All rights reserved.", tagline: "AI Gallery" },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = getSiteConfig();

  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="relative isolate flex min-h-full flex-col bg-black text-white">
        <VideoBg />
        <PrivateModeProvider>
          <Navbar logo={config.navbar?.logo || "KK"} />
          <main className="relative z-10 flex-1 pt-14">
            <PrivateRouteGate>{children}</PrivateRouteGate>
          </main>
          <MusicPlayer />
          <MagicPixelPet />
        </PrivateModeProvider>
      </body>
    </html>
  );
}
