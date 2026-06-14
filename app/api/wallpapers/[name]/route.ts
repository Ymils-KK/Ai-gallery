import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const wallpaperDir = "C:\\Users\\Administrator\\Desktop\\壁纸";

const mimeMap: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".gif": "image/gif",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  // 安全检查：防止路径遍历
  if (name.includes("..") || name.includes("/") || name.includes("\\")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const filePath = path.join(wallpaperDir, name);

  if (!fs.existsSync(filePath)) {
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
