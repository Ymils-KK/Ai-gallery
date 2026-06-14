"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus, Trash2, Check } from "lucide-react";

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

const STORAGE_KEY = "kk_notebook_notes";

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {}
}

function formatDate(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${m}/${d} ${h}:${min}`;
}

export default function Notebook({ open, onClose }: NotebookProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newText, setNewText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 每次打开时重新加载
  useEffect(() => {
    if (open) {
      setNotes(loadNotes());
      // 自动聚焦输入框
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  function addNote() {
    if (!newText.trim()) return;
    const note: Note = {
      id: "note_" + Date.now().toString(36),
      text: newText.trim(),
      done: false,
      createdAt: formatDate(),
    };
    const updated = [note, ...notes];
    setNotes(updated);
    saveNotes(updated);
    setNewText("");
  }

  function toggleDone(id: string) {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, done: !n.done } : n
    );
    setNotes(updated);
    saveNotes(updated);
  }

  function deleteNote(id: string) {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    saveNotes(updated);
  }

  if (!open) return null;

  const undone = notes.filter((n) => !n.done).length;

  return (
    <div className="fixed bottom-28 right-8 z-[90] animate-fade-in">
      <div className="w-80 max-h-[480px] rounded-2xl bg-black/85 backdrop-blur-xl border border-white/[0.12] shadow-2xl flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="text-lg">📝</span>
            <h3 className="text-sm font-semibold text-white">灵感记录本</h3>
            {undone > 0 && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                {undone} 待处理
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/30 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 输入区 */}
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  addNote();
                }
              }}
              placeholder="发现 bug 或好点子？记下来..."
              rows={2}
              maxLength={500}
              className="flex-1 rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none"
            />
            <button
              onClick={addNote}
              disabled={!newText.trim()}
              className="shrink-0 rounded-lg bg-white/[0.08] p-2 text-white/50 hover:text-white hover:bg-white/[0.12] transition-all disabled:opacity-30"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 列表 */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {notes.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-3xl mb-2">🐱</p>
              <p className="text-xs text-white/25">还没有记录，写点什么吧~</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`group flex items-start gap-2.5 rounded-lg px-3 py-2.5 transition-all ${
                    note.done
                      ? "bg-white/[0.02] opacity-50"
                      : "bg-white/[0.03] hover:bg-white/[0.05]"
                  }`}
                >
                  {/* 完成按钮 */}
                  <button
                    onClick={() => toggleDone(note.id)}
                    className={`shrink-0 mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      note.done
                        ? "bg-green-500/30 border-green-500/40"
                        : "border-white/[0.12] hover:border-white/30"
                    }`}
                  >
                    {note.done && <Check className="h-3 w-3 text-green-400" />}
                  </button>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs leading-relaxed break-words ${
                        note.done ? "text-white/30 line-through" : "text-white/70"
                      }`}
                    >
                      {note.text}
                    </p>
                    <p className="text-[10px] text-white/20 mt-0.5">{note.createdAt}</p>
                  </div>

                  {/* 删除 */}
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="shrink-0 rounded p-0.5 text-white/15 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="px-4 py-2 border-t border-white/[0.06]">
          <p className="text-[10px] text-white/15 text-center">
            Enter 发送 · 数据存于浏览器本地
          </p>
        </div>
      </div>
    </div>
  );
}
