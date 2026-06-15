import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// 本地桌面壁纸文件夹（仅开发环境存在）
const localDir = "C:\\Users\\Administrator\\Desktop\\壁纸";
// 项目内置壁纸文件夹（本地和 Vercel 都可用）
const publicDir = path.join(process.cwd(), "public", "wallpapers");

const imageExts = new Set([".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"]);

function listDir(dir: string): string[] {
  try {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((f) => imageExts.has(path.extname(f).toLowerCase()));
  } catch {
    return [];
  }
}

export async function GET() {
  // 合并两个来源，去重
  const seen = new Set<string>();
  const images: { name: string; source: "local" | "public" }[] = [];

  for (const f of listDir(localDir)) {
    if (!seen.has(f)) {
      seen.add(f);
      images.push({ name: f, source: "local" });
    }
  }
  for (const f of listDir(publicDir)) {
    if (!seen.has(f)) {
      seen.add(f);
      images.push({ name: f, source: "public" });
    }
  }

  return NextResponse.json(images);
}
