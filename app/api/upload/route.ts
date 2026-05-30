import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "没有收到文件" }, { status: 400 });
    }

    // 只允许图片和视频
    const allowedTypes = ["image/", "video/"];
    if (!allowedTypes.some((t) => file.type.startsWith(t))) {
      return NextResponse.json({ error: "只支持图片和视频文件" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), "public", "images");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 处理文件名，避免重复和特殊字符
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_一-龥]/g, "_");
    let filename = safeName;
    let filePath = path.join(uploadDir, filename);

    // 重名时加序号
    let counter = 1;
    while (fs.existsSync(filePath)) {
      const ext = path.extname(safeName);
      const base = path.basename(safeName, ext);
      filename = `${base}_${counter}${ext}`;
      filePath = path.join(uploadDir, filename);
      counter++;
    }

    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      filename,
      path: `/images/${filename}`,
    });
  } catch (err) {
    console.error("上传失败:", err);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
