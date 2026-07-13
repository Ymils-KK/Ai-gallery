import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

function safeDownloadName(value: string | null, fallback: string) {
  const name = (value || fallback).replace(/[^a-zA-Z0-9._-\u4e00-\u9fff]+/g, "-");
  return name || fallback;
}

function isAllowedCloudUrl(value: URL) {
  const configured = process.env.SUPABASE_URL?.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  if (!configured) return false;
  const base = new URL(configured);
  return value.origin === base.origin && value.pathname.startsWith("/storage/v1/object/public/");
}

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const source = requestUrl.searchParams.get("url");
    if (!source) return NextResponse.json({ error: "缺少下载地址" }, { status: 400 });

    const filename = safeDownloadName(requestUrl.searchParams.get("name"), "asset");
    let body: Buffer;
    let contentType = "application/octet-stream";

    if (source.startsWith("/images/")) {
      const relativePath = source.replace(/^\/+/, "");
      const imagesRoot = path.resolve(process.cwd(), "public", "images");
      const filePath = path.resolve(process.cwd(), "public", relativePath);
      if (!filePath.startsWith(`${imagesRoot}${path.sep}`)) {
        return NextResponse.json({ error: "无效的文件地址" }, { status: 400 });
      }
      body = await fs.readFile(filePath);
      contentType = "image/*";
    } else {
      const cloudUrl = new URL(source);
      if (!isAllowedCloudUrl(cloudUrl)) {
        return NextResponse.json({ error: "不允许下载此地址" }, { status: 403 });
      }
      const response = await fetch(cloudUrl);
      if (!response.ok) {
        return NextResponse.json({ error: "原图读取失败" }, { status: response.status });
      }
      body = Buffer.from(await response.arrayBuffer());
      contentType = response.headers.get("content-type") || contentType;
    }

    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(body.length),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("资产下载失败:", error);
    return NextResponse.json({ error: "资产下载失败" }, { status: 500 });
  }
}
