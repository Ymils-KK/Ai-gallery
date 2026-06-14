import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// 本地桌面壁纸文件夹（仅开发环境存在）
const localDir = "C:\\Users\\Administrator\\Desktop\\壁纸";
// 项目内置壁纸文件夹（本地和 Vercel 都可用）
const publicDir = path.join(process.cwd(), "public", "wallpapers");

const mimeMap: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".gif": "image/gif",
};

function findFile(name: string): string | null {
  // 优先从 public/wallpapers 读取
  const publicPath = path.join(publicDir, name);
  if (fs.existsSync(publicPath)) return publicPath;

  // 其次从桌面壁纸文件夹读取
  const localPath = path.join(localDir, name);
  if (fs.existsSync(localPath)) return localPath;

  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  // 安全检查：防止路径遍历
  if (name.includes("..") || name.includes("/") || name.includes("\\")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const filePath = findFile(name);

  if (!filePath) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const ext = path.extname(name).toLowerCase();
  const contentType = mimeMap[ext] || "application/octet-stream";

  const buffer = fs.readFileSync(filePath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
