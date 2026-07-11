import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { isSupabaseConfigured, uploadCloudFile } from "@/lib/supabase-rest";

const MAX_UPLOAD_SIZE = 4 * 1024 * 1024;

function safeLocalName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

async function saveLocalFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), "public", "images");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const safeName = safeLocalName(file.name);
  let filename = safeName;
  let filePath = path.join(uploadDir, filename);

  let counter = 1;
  while (fs.existsSync(filePath)) {
    const ext = path.extname(safeName);
    const base = path.basename(safeName, ext);
    filename = `${base}_${counter}${ext}`;
    filePath = path.join(uploadDir, filename);
    counter++;
  }

  fs.writeFileSync(filePath, buffer);

  return {
    filename,
    path: `/images/${filename}`,
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "没有收到文件" }, { status: 400 });
    }

    const allowedTypes = ["image/", "video/"];
    if (!allowedTypes.some((type) => file.type.startsWith(type))) {
      return NextResponse.json({ error: "只支持图片和视频文件" }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json({ error: "文件太大，请先压缩到 4MB 以内再上传" }, { status: 413 });
    }

    const result = isSupabaseConfigured() ? await uploadCloudFile(file) : await saveLocalFile(file);

    return NextResponse.json({
      success: true,
      filename: result.filename,
      path: result.path,
      storage: isSupabaseConfigured() ? "supabase" : "file",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "未知错误";
    console.error("上传失败:", error);
    return NextResponse.json({ error: "上传失败", detail }, { status: 500 });
  }
}
