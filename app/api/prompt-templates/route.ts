import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "content", "prompt-templates.json");

export async function GET() {
  try {
    if (!fs.existsSync(dataPath)) {
      return NextResponse.json([]);
    }
    return NextResponse.json(JSON.parse(fs.readFileSync(dataPath, "utf-8")));
  } catch {
    return NextResponse.json({ error: "读取模板失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 支持批量保存（整个模板列表）
    if (Array.isArray(body)) {
      fs.writeFileSync(dataPath, JSON.stringify(body, null, 2), "utf-8");
      return NextResponse.json({ success: true });
    }

    // 单个新增
    const { name, instructions } = body;
    if (!name || !instructions) {
      return NextResponse.json({ error: "名称和说明不能为空" }, { status: 400 });
    }

    const list = fs.existsSync(dataPath)
      ? JSON.parse(fs.readFileSync(dataPath, "utf-8"))
      : [];

    list.push({
      id: "tpl_" + Date.now().toString(36),
      name: name.trim(),
      instructions: instructions.trim(),
    });

    fs.writeFileSync(dataPath, JSON.stringify(list, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "保存模板失败" }, { status: 500 });
  }
}
