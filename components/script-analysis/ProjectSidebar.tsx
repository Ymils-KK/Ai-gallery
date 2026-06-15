"use client";

import { useState } from "react";
import { Plus, Trash2, FileText, Edit3, Check, X, AlertTriangle } from "lucide-react";

interface ProjectMeta {
  id: string;
  name: string;
  createdAt: string;
}

interface ProjectSidebarProps {
  projects: ProjectMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => Promise<void>;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => Promise<void>;
}

export default function ProjectSidebar({
  projects,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
}: ProjectSidebarProps) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await onCreate(newName.trim());
      setNewName("");
    } finally {
      setCreating(false);
    }
  }

  function startRename(id: string, name: string) {
    setRenamingId(id);
    setRenameValue(name);
  }

  async function handleRename() {
    if (!renamingId || !renameValue.trim() || renaming) return;
    setRenaming(true);
    try {
      await onRename(renamingId, renameValue.trim());
      setRenamingId(null);
    } finally {
      setRenaming(false);
    }
  }

  return (
    <aside className="w-64 fixed left-0 top-14 bottom-0 flex flex-col gap-4 border-r-[3px] border-white/[0.15] bg-black/40 backdrop-blur-xl z-40 px-4 py-5 overflow-hidden">
      <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider px-2">
        📁 项目列表
      </h2>

      {/* 新建项目 */}
      <div className="flex gap-2 min-w-0">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="新项目名称"
          maxLength={30}
          className="flex-1 min-w-0 rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-white/20 transition-all"
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newName.trim()}
          className="rounded-lg bg-white/[0.08] p-2 text-white/50 hover:text-white hover:bg-white/[0.12] transition-all disabled:opacity-30"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* 项目列表 */}
      <div className="flex-1 flex flex-col gap-0.5 overflow-y-auto">
        {projects.length === 0 ? (
          <p className="text-sm text-white/20 px-2 py-4 text-center">
            还没有项目，创建一个吧
          </p>
        ) : (
          projects.map((p) => {
            const isActive = p.id === activeId;
            const isRenaming = renamingId === p.id;

            return (
              <div
                key={p.id}
                className={`group flex items-center gap-2.5 rounded-lg px-3 py-2.5 cursor-pointer transition-all ${
                  isActive
                    ? "bg-white/[0.10] text-white"
                    : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                }`}
                onClick={() => {
                  if (!isRenaming) onSelect(p.id);
                }}
              >
                <FileText className="h-4 w-4 shrink-0" />

                {isRenaming ? (
                  /* 重命名输入框 */
                  <div className="flex-1 min-w-0 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename();
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      maxLength={30}
                      autoFocus
                      className="flex-1 min-w-0 rounded bg-white/[0.08] border border-white/[0.12] px-2 py-1 text-xs text-white focus:outline-none"
                    />
                    <button onClick={handleRename} disabled={renaming} className="shrink-0 rounded p-0.5 text-green-400 hover:text-green-300">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setRenamingId(null)} className="shrink-0 rounded p-0.5 text-white/30 hover:text-white">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  /* 正常显示 */
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-white/25">{p.createdAt}</p>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(p.id, p.name);
                        }}
                        className="shrink-0 rounded p-0.5 text-white/20 hover:text-white/60"
                        title="重命名"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(p.id);
                        }}
                        className="shrink-0 rounded p-0.5 text-white/20 hover:text-red-400"
                        title="删除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 删除确认弹窗 */}
      {deletingId && (
        <div className="shrink-0 rounded-xl bg-red-500/10 border border-red-500/20 p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <p className="text-xs text-red-300 font-medium">
              确定删除「{projects.find((p) => p.id === deletingId)?.name}」？
            </p>
          </div>
          <p className="text-[10px] text-red-400/60">项目内所有分析数据将被永久删除</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onDelete(deletingId);
                setDeletingId(null);
              }}
              className="flex-1 rounded-md bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/30 transition-all"
            >
              确认删除
            </button>
            <button
              onClick={() => setDeletingId(null)}
              className="flex-1 rounded-md bg-white/[0.06] px-3 py-1.5 text-xs text-white/50 hover:text-white hover:bg-white/[0.10] transition-all"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
