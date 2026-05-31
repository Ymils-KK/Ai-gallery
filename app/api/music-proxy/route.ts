import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  try {
    // 网易云外链 — 获取真实 CDN 地址后重定向
    const url = `https://music.163.com/song/media/outer/url?id=${id}.mp3`;
    const res = await fetch(url, {
      headers: {
        Referer: "https://music.163.com",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });

    // 网易云 302 到 CDN — 把 CDN 地址交给浏览器直连
    const location = res.headers.get("location");
    if (location) {
      return NextResponse.redirect(location, 302);
    }

    // 如果不是重定向，直接流式转发
    return new NextResponse(res.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    console.error("music proxy error:", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
