import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "content", "notes.json");

interface Note {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

function readNotes(): Note[] {
  try {
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    }
  } catch {}
  return [];
}

function writeNotes(notes: Note[]) {
  fs.writeFileSync(dataPath, JSON.stringify(notes, null, 2), "utf-8");
}

export async function GET() {
  return NextResponse.json(readNotes());
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
    }

    const notes = readNotes();
    const note: Note = {
      id: "note_" + Date.now().toString(36),
      text: text.trim(),
      done: false,
      createdAt: new Date().toLocaleDateString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    notes.unshift(note);
    writeNotes(notes);

    return NextResponse.json({ success: true, note });
  } catch {
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, text, done } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "缺少 ID" }, { status: 400 });
    }

    const notes = readNotes();
    const note = notes.find((n) => n.id === id);
    if (!note) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }

    if (typeof text === "string") note.text = text.trim();
    if (typeof done === "boolean") note.done = done;
    writeNotes(notes);

    return NextResponse.json({ success: true, note });
  } catch {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "缺少 ID" }, { status: 400 });
    }

    let notes = readNotes();
    notes = notes.filter((n) => n.id !== id);
    writeNotes(notes);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
