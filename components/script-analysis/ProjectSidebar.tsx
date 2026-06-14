"use client";

import { useState } from "react";
import { Plus, Trash2, FileText } from "lucide-react";

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
}

export default function ProjectSidebar({
  projects,
  activeId,
  onSelect,
  onCreate,
  onDelete,
}: ProjectSidebarProps) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

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
            return (
              <div
                key={p.id}
                className={`group flex items-center gap-2.5 rounded-lg px-3 py-2.5 cursor-pointer transition-all ${
                  isActive
                    ? "bg-white/[0.10] text-white"
                    : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                }`}
                onClick={() => onSelect(p.id)}
              >
                <FileText className="h-4 w-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-white/25">{p.createdAt}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`确定删除项目「${p.name}」？`)) {
                      onDelete(p.id);
                    }
                  }}
                  className="shrink-0 rounded p-0.5 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
