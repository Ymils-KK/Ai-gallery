import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "content", "works.json");

export async function GET() {
  try {
    if (!fs.existsSync(dataPath)) {
      return NextResponse.json([]);
    }
    const raw = fs.readFileSync(dataPath, "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "读取失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const works = await request.json();
    if (!Array.isArray(works)) {
      return NextResponse.json({ error: "数据格式错误" }, { status: 400 });
    }
    fs.writeFileSync(dataPath, JSON.stringify(works, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
