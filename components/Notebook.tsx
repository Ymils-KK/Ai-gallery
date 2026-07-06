"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Check, Plus, Trash2, X } from "lucide-react";

interface Note {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

interface NotebookProps {
  open: boolean;
  onClose: () => void;
}

type SyncMode = "checking" | "api" | "local";

const STORAGE_KEY = "kk_notebook_notes";

function loadLocalNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalNotes(notes: Note[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {}
}

function formatDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hour}:${minute}`;
}

async function fetchNotesFromApi(): Promise<Note[]> {
  const response = await fetch("/api/notes", { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load notes");
  return response.json();
}

export default function Notebook({ open, onClose }: NotebookProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newText, setNewText] = useState("");
  const [syncMode, setSyncMode] = useState<SyncMode>("checking");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setSyncMode("checking");

    fetchNotesFromApi()
      .then((remoteNotes) => {
        if (cancelled) return;
        setNotes(remoteNotes);
        setSyncMode("api");
      })
      .catch(() => {
        if (cancelled) return;
        setNotes(loadLocalNotes());
        setSyncMode("local");
      })
      .finally(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  async function addNote() {
    const text = newText.trim();
    if (!text || busy) return;

    setBusy(true);
    setNewText("");

    if (syncMode === "api") {
      try {
        const response = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!response.ok) throw new Error("Failed to save note");
        const data = await response.json();
        setNotes((current) => [data.note, ...current]);
        setBusy(false);
        return;
      } catch {
        setSyncMode("local");
      }
    }

    const note: Note = {
      id: `note_${Date.now().toString(36)}`,
      text,
      done: false,
      createdAt: formatDate(),
    };
    const updated = [note, ...notes];
    setNotes(updated);
    saveLocalNotes(updated);
    setBusy(false);
  }

  async function toggleDone(id: string) {
    const currentNote = notes.find((note) => note.id === id);
    if (!currentNote) return;

    const updated = notes.map((note) => (note.id === id ? { ...note, done: !note.done } : note));
    setNotes(updated);

    if (syncMode === "api") {
      try {
        const response = await fetch("/api/notes", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, done: !currentNote.done }),
        });
        if (!response.ok) throw new Error("Failed to update note");
        return;
      } catch {
        setSyncMode("local");
      }
    }

    saveLocalNotes(updated);
  }

  async function deleteNote(id: string) {
    const updated = notes.filter((note) => note.id !== id);
    setNotes(updated);

    if (syncMode === "api") {
      try {
        const response = await fetch(`/api/notes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete note");
        return;
      } catch {
        setSyncMode("local");
      }
    }

    saveLocalNotes(updated);
  }

  if (!open) return null;

  const undone = notes.filter((note) => !note.done).length;
  const syncText =
    syncMode === "checking"
      ? "正在检查线上存储..."
      : syncMode === "api"
        ? "已连接网站存储"
        : "当前为本地存储，不会跨设备同步";

  return (
    <div className="fixed bottom-28 right-8 z-[92] animate-fade-in">
      <div className="flex max-h-[480px] w-80 flex-col overflow-hidden rounded-lg border border-white/[0.12] bg-black/85 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-amber-200/80" />
            <h3 className="text-sm font-semibold text-white">灵感记录本</h3>
            {undone > 0 && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                {undone} 待处理
              </span>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-white/30 transition-all hover:bg-white/[0.06] hover:text-white" aria-label="关闭记事本">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-white/[0.06] px-4 py-3">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={newText}
              onChange={(event) => setNewText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void addNote();
                }
              }}
              placeholder="发现想法、待办或灵感，先记下来..."
              rows={2}
              maxLength={500}
              className="flex-1 resize-none rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-white outline-none placeholder:text-white/25 focus:border-white/20"
            />
            <button
              onClick={() => void addNote()}
              disabled={!newText.trim() || busy}
              className="shrink-0 rounded-lg bg-white/[0.08] p-2 text-white/50 transition-all hover:bg-white/[0.12] hover:text-white disabled:opacity-30"
              aria-label="新增记录"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {notes.length === 0 ? (
            <div className="py-8 text-center">
              <BookOpen className="mx-auto mb-2 h-7 w-7 text-white/20" />
              <p className="text-xs text-white/25">还没有记录，写点什么吧~</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`group flex items-start gap-2.5 rounded-lg px-3 py-2.5 transition-all ${
                    note.done ? "bg-white/[0.02] opacity-50" : "bg-white/[0.03] hover:bg-white/[0.05]"
                  }`}
                >
                  <button
                    onClick={() => void toggleDone(note.id)}
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                      note.done ? "border-green-500/40 bg-green-500/30" : "border-white/[0.12] hover:border-white/30"
                    }`}
                    aria-label="切换完成状态"
                  >
                    {note.done && <Check className="h-3 w-3 text-green-400" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className={`break-words text-xs leading-relaxed ${note.done ? "text-white/30 line-through" : "text-white/70"}`}>
                      {note.text}
                    </p>
                    <p className="mt-0.5 text-[10px] text-white/20">{note.createdAt}</p>
                  </div>

                  <button
                    onClick={() => void deleteNote(note.id)}
                    className="shrink-0 rounded p-0.5 text-white/15 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                    aria-label="删除记录"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-white/[0.06] px-4 py-2">
          <p className={`text-center text-[10px] ${syncMode === "api" ? "text-emerald-300/55" : "text-white/25"}`}>{syncText}</p>
        </div>
      </div>
    </div>
  );
}
