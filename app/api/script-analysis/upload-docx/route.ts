import { NextResponse } from "next/server";
import mammoth from "mammoth";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "没有收到文件" }, { status: 400 });
    }

    // 只接受 .docx 文件
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "仅支持 .docx 格式的 Word 文件" },
        { status: 400 }
      );
    }

    // 限制文件大小 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "文件不能超过 5MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 使用 mammoth 提取文本
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value.trim();

    if (!text) {
      return NextResponse.json(
        { error: "未能从文件中提取到文字内容" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      text,
      filename: file.name,
    });
  } catch (err) {
    console.error("Word 解析失败:", err);
    return NextResponse.json(
      { error: "文件解析失败，请确认文件格式正确" },
      { status: 500 }
    );
  }
}
