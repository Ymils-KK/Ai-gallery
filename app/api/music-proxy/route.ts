import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  try {
    // 网易云音乐外链
    const url = `https://music.163.com/song/media/outer/url?id=${id}.mp3`;
    const res = await fetch(url, {
      headers: {
        Referer: "https://music.163.com",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);

    // 流式转发，减少 Vercel 函数内存压力
    return new NextResponse(res.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Accept-Ranges": "bytes",
      },
    });
  } catch (e) {
    console.error("music proxy error:", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
