import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const projectsDir = path.join(process.cwd(), "content", "projects");
const indexPath = path.join(projectsDir, "index.json");

interface ProjectMeta {
  id: string;
  name: string;
  createdAt: string;
}

// GET 获取项目列表
export async function GET() {
  try {
    if (!fs.existsSync(indexPath)) {
      return NextResponse.json([]);
    }
    const raw = fs.readFileSync(indexPath, "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "读取项目列表失败" }, { status: 500 });
  }
}

// POST 创建新项目
export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "项目名称不能为空" }, { status: 400 });
    }

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const meta: ProjectMeta = {
      id,
      name: name.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    };

    // 更新索引
    let list: ProjectMeta[] = [];
    if (fs.existsSync(indexPath)) {
      list = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    }
    list.unshift(meta);
    fs.writeFileSync(indexPath, JSON.stringify(list, null, 2), "utf-8");

    // 创建项目数据文件
    const projectPath = path.join(projectsDir, `${id}.json`);
    const projectData = {
      id,
      script: "",
      synopsis: "",
      targetAudience: "",
      style: "anime",
      characters: [],
      scenes: [],
      props: [],
    };
    fs.writeFileSync(projectPath, JSON.stringify(projectData, null, 2), "utf-8");

    return NextResponse.json({ success: true, project: meta });
  } catch {
    return NextResponse.json({ error: "创建项目失败" }, { status: 500 });
  }
}
