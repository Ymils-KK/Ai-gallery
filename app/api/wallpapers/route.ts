import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const wallpaperDir = "C:\\Users\\Administrator\\Desktop\\壁纸";

const imageExts = new Set([".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"]);

export async function GET() {
  try {
    const files = fs.readdirSync(wallpaperDir);
    const images = files
      .filter((f) => imageExts.has(path.extname(f).toLowerCase()))
      .map((f) => ({ name: f }));
    return NextResponse.json(images);
  } catch {
    return NextResponse.json([]);
  }
}
