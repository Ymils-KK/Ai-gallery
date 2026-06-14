"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, Save, X, Check } from "lucide-react";

export interface Template {
  id: string;
  name: string;
  instructions: string;
}

interface TemplatePickerProps {
  activeIds: string[];
  onChange: (ids: string[]) => void;
  disabled: boolean;
}

export default function TemplatePicker({ activeIds, onChange, disabled }: TemplatePickerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showManager, setShowManager] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editInstructions, setEditInstructions] = useState("");

  async function loadTemplates() {
    const res = await fetch("/api/prompt-templates");
    if (res.ok) setTemplates(await res.json());
  }

  useEffect(() => { loadTemplates(); }, []);

  function toggle(id: string) {
    if (activeIds.includes(id)) {
      onChange(activeIds.filter((i) => i !== id));
    } else {
      onChange([...activeIds, id]);
    }
  }

  async function handleSave() {
    if (!editName.trim() || !editInstructions.trim()) return;

    let updated: Template[];
    if (editingId && editingId !== "new") {
      updated = templates.map((t) =>
        t.id === editingId ? { ...t, name: editName.trim(), instructions: editInstructions.trim() } : t
      );
    } else {
      updated = [...templates, {
        id: "tpl_" + Date.now().toString(36),
        name: editName.trim(),
        instructions: editInstructions.trim(),
      }];
    }

    await fetch("/api/prompt-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });

    setTemplates(updated);
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm(`确定要删除模板「${templates.find((t) => t.id === id)?.name}」吗？此操作不可撤销。`)) return;

    const updated = templates.filter((t) => t.id !== id);
    await fetch("/api/prompt-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setTemplates(updated);
    onChange(activeIds.filter((i) => i !== id));
  }

  const activeTemplates = templates.filter((t) => activeIds.includes(t.id));

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <label className="text-base font-medium text-white/70">📋 提示词模板</label>
        <button
          type="button"
          onClick={() => setShowManager(!showManager)}
          disabled={disabled}
          className="text-sm text-white/30 hover:text-white/60 transition-colors"
        >
          {showManager ? "收起" : "管理模板"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {activeTemplates.length === 0 ? (
          <span className="text-sm text-white/25 px-1">未选择模板</span>
        ) : (
          activeTemplates.map((t) => (
            <span key={t.id} className="flex items-center gap-1.5 rounded-full bg-white/[0.08] border border-white/[0.08] px-3 py-1 text-sm text-white/70">
              {t.name}
              <button type="button" onClick={() => toggle(t.id)} className="text-white/30 hover:text-white/70">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))
        )}
      </div>

      {activeTemplates.length > 0 && (
        <p className="text-xs text-white/30 leading-relaxed px-1">
          {activeTemplates.map((t) => t.name).join(" + ")} 已启用
          ({activeTemplates.length} 个模板)
        </p>
      )}

      {showManager && (
        <div className="rounded-xl bg-black/40 border border-white/[0.08] p-5 flex flex-col gap-3.5">
          <h4 className="text-sm font-semibold text-white/50">管理模板（可多选）</h4>

          <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
            {templates.map((t) => {
              const isActive = activeIds.includes(t.id);
              return (
                <div
                  key={t.id}
                  onClick={() => toggle(t.id)}
                  className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 cursor-pointer transition-all group ${
                    isActive ? "bg-white/[0.10] text-white" : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <div className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    isActive ? "bg-white/20 border-white/30" : "border-white/[0.12]"
                  }`}>
                    {isActive && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    <p className="text-xs text-white/25 truncate">{t.instructions.slice(0, 50)}...</p>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setEditingId(t.id); setEditName(t.name); setEditInstructions(t.instructions); }}
                      className="shrink-0 rounded p-0.5 text-white/20 hover:text-white/60"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                      className="shrink-0 rounded p-0.5 text-white/20 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {editingId !== null && (
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-4 flex flex-col gap-2.5">
              <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="模板名称" maxLength={40} className="w-full rounded-md bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/15 focus:outline-none" />
              <textarea value={editInstructions} onChange={(e) => setEditInstructions(e.target.value)} placeholder="告诉 AI 你想要的风格..." rows={5} maxLength={2000} className="w-full rounded-md bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/15 focus:outline-none resize-none" />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setEditingId(null)} className="rounded-md px-3.5 py-2 text-sm text-white/40 hover:text-white">取消</button>
                <button type="button" onClick={handleSave} disabled={!editName.trim() || !editInstructions.trim()} className="flex items-center gap-1 rounded-md bg-white/[0.10] px-3.5 py-2 text-sm text-white hover:bg-white/[0.15] disabled:opacity-30">
                  <Save className="h-4 w-4" />保存
                </button>
              </div>
            </div>
          )}

          {editingId === null && (
            <button type="button" onClick={() => { setEditingId("new"); setEditName(""); setEditInstructions(""); }} className="flex items-center gap-1.5 rounded-md px-4 py-2.5 text-sm text-white/40 hover:text-white hover:bg-white/[0.06] transition-all">
              <Plus className="h-4 w-4" />新建模板
            </button>
          )}
        </div>
      )}
    </div>
  );
}
