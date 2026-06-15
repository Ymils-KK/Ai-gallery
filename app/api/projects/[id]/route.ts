import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const projectsDir = path.join(process.cwd(), "content", "projects");
const indexPath = path.join(projectsDir, "index.json");

// GET 获取单个项目
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectPath = path.join(projectsDir, `${id}.json`);
    if (!fs.existsSync(projectPath)) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }
    const raw = fs.readFileSync(projectPath, "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "读取项目失败" }, { status: 500 });
  }
}

// PUT 保存项目数据
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const projectPath = path.join(projectsDir, `${id}.json`);
    if (!fs.existsSync(projectPath)) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }

    const data = {
      id,
      script: body.script || "",
      synopsis: body.synopsis || "",
      synopsisEn: body.synopsisEn || "",
      targetAudience: body.targetAudience || "",
      style: body.style || "anime",
      characters: body.characters || [],
      scenes: body.scenes || [],
      props: body.props || [],
    };

    fs.writeFileSync(projectPath, JSON.stringify(data, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "保存项目失败" }, { status: 500 });
  }
}

// PATCH 重命名项目
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "名称不能为空" }, { status: 400 });
    }

    // 更新索引中的名称
    if (fs.existsSync(indexPath)) {
      const list = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
      const updated = list.map((p: { id: string; name: string; createdAt: string }) =>
        p.id === id ? { ...p, name: name.trim() } : p
      );
      fs.writeFileSync(indexPath, JSON.stringify(updated, null, 2), "utf-8");
    }

    return NextResponse.json({ success: true, name: name.trim() });
  } catch {
    return NextResponse.json({ error: "重命名失败" }, { status: 500 });
  }
}

// DELETE 删除项目
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 删除项目文件
    const projectPath = path.join(projectsDir, `${id}.json`);
    if (fs.existsSync(projectPath)) {
      fs.unlinkSync(projectPath);
    }

    // 从索引中移除
    if (fs.existsSync(indexPath)) {
      const list = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
      const filtered = list.filter((p: { id: string }) => p.id !== id);
      fs.writeFileSync(indexPath, JSON.stringify(filtered, null, 2), "utf-8");
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除项目失败" }, { status: 500 });
  }
}
