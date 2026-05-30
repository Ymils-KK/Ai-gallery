import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "content", "music.json");

export async function GET() {
  try {
    if (!fs.existsSync(dataPath)) return NextResponse.json([]);
    return NextResponse.json(JSON.parse(fs.readFileSync(dataPath, "utf-8")));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const songs = await request.json();
    if (!Array.isArray(songs)) {
      return NextResponse.json({ error: "格式错误" }, { status: 400 });
    }
    fs.writeFileSync(dataPath, JSON.stringify(songs, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
