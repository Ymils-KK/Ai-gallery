import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "content", "script-analysis.json");

const defaultData = {
  script: "",
  synopsis: "",
  targetAudience: "",
  style: "anime",
  characters: [],
  scenes: [],
  props: [],
};

export async function GET() {
  try {
    if (!fs.existsSync(dataPath)) {
      return NextResponse.json(defaultData);
    }
    const raw = fs.readFileSync(dataPath, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json({
      script: data.script || "",
      synopsis: data.synopsis || "",
      targetAudience: data.targetAudience || "",
      style: data.style || "anime",
      characters: data.characters || [],
      scenes: data.scenes || [],
      props: data.props || [],
    });
  } catch {
    return NextResponse.json({ error: "读取数据失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (
      !Array.isArray(body.characters) ||
      !Array.isArray(body.scenes) ||
      !Array.isArray(body.props)
    ) {
      return NextResponse.json({ error: "数据格式不正确" }, { status: 400 });
    }

    const data = {
      script: body.script || "",
      synopsis: body.synopsis || "",
      targetAudience: body.targetAudience || "",
      style: body.style || "anime",
      characters: body.characters,
      scenes: body.scenes,
      props: body.props,
    };

    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "保存数据失败" }, { status: 500 });
  }
}
