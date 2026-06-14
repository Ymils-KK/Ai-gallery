"use client";

import { useState } from "react";
import { Users, Map, Wrench, ChevronDown, Plus, X } from "lucide-react";
import AssetCard from "./AssetCard";
import type { AssetItem } from "./AssetCard";

export interface AnalysisData {
  characters: AssetItem[];
  scenes: AssetItem[];
  props: AssetItem[];
}

interface AnalysisResultProps {
  projectId: string;
  data: AnalysisData;
  onImageUpload: (category: string, assetId: string, file: File) => Promise<void>;
  onImageRemove: (category: string, assetId: string) => void;
  onPromptUpdate: (category: string, assetId: string, newPrompt: string, newPromptCn?: string) => void;
  onGeneratePrompt: (category: string, assetId: string) => Promise<void>;
  onAddAsset: (category: string, name: string, description: string, tier: "major" | "minor") => void;
}

const sections = [
  { key: "characters" as const, label: "人物", icon: <Users className="h-5 w-5" /> },
  { key: "scenes" as const, label: "场景", icon: <Map className="h-5 w-5" /> },
  { key: "props" as const, label: "道具", icon: <Wrench className="h-5 w-5" /> },
];

export default function AnalysisResult({
  projectId,
  data,
  onImageUpload,
  onImageRemove,
  onPromptUpdate,
  onGeneratePrompt,
  onAddAsset,
}: AnalysisResultProps) {
  const firstOpen =
    data.characters.length > 0 ? "characters"
    : data.scenes.length > 0 ? "scenes"
    : "props";
  const [openSection, setOpenSection] = useState<string>(firstOpen);
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTier, setNewTier] = useState<"major" | "minor">("major");

  const totalCount = data.characters.length + data.scenes.length + data.props.length;

  if (totalCount === 0) {
    return (
      <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06] p-10 text-center">
        <p className="text-white/40">暂无分析结果</p>
      </div>
    );
  }

  function toggleSection(key: string) {
    setOpenSection((prev) => (prev === key ? "" : key));
  }

  function startAdd(key: string) {
    setAddingCategory(key);
    setNewName("");
    setNewDesc("");
    setNewTier("major");
  }

  function handleAdd() {
    if (!newName.trim() || !addingCategory) return;
    onAddAsset(addingCategory, newName.trim(), newDesc.trim(), newTier);
    setAddingCategory(null);
  }

  return (
    <div className="flex flex-col gap-5">
      {sections.map((section) => {
        const isOpen = openSection === section.key;
        const assets = data[section.key] || [];
        const isAdding = addingCategory === section.key;

        return (
          <div key={section.key} className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06] overflow-hidden">
            {/* 折叠头部 */}
            <div className="flex items-center">
              <button
                onClick={() => toggleSection(section.key)}
                className="flex-1 flex items-center gap-4 px-8 py-5 hover:bg-white/[0.02] transition-colors text-left"
              >
                <span className="text-white/60">{section.icon}</span>
                <span className="text-lg font-semibold text-white">{section.label}</span>
                <span className="rounded-full bg-white/[0.08] px-3 py-0.5 text-sm text-white/50">{assets.length}</span>
              </button>
              {/* 添加按钮 */}
              <button
                type="button"
                onClick={() => startAdd(section.key)}
                className="mr-5 flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] px-4 py-2 text-sm text-white/50 hover:text-white hover:bg-white/[0.10] transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>添加</span>
              </button>
              <ChevronDown className={`h-6 w-6 text-white/40 mr-8 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
            </div>

            {/* 折叠内容 */}
            {isOpen && (
              <div className="border-t border-white/[0.06] px-8 pb-8 pt-5">
                {/* 添加表单 */}
                {isAdding && (
                  <div className="mb-5 rounded-xl bg-white/[0.04] border border-white/[0.08] p-5 flex flex-col gap-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white/60">添加{section.label}</span>
                      <button type="button" onClick={() => setAddingCategory(null)} className="text-white/30 hover:text-white">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="名称"
                      maxLength={30}
                      className="w-full rounded-lg bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-base text-white placeholder:text-white/15 focus:outline-none focus:border-white/20"
                    />
                    <textarea
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="描述（可选）"
                      rows={3}
                      maxLength={200}
                      className="w-full rounded-lg bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-base text-white placeholder:text-white/15 focus:outline-none focus:border-white/20 resize-none"
                    />
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-white/30">级别：</span>
                      <button
                        type="button"
                        onClick={() => setNewTier("major")}
                        className={`rounded-full px-4 py-2 text-sm transition-all ${newTier === "major" ? "bg-amber-500/20 text-amber-400" : "bg-white/[0.04] text-white/40 hover:text-white/70"}`}
                      >
                        重要
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewTier("minor")}
                        className={`rounded-full px-4 py-2 text-sm transition-all ${newTier === "minor" ? "bg-white/[0.10] text-white/50" : "bg-white/[0.04] text-white/40 hover:text-white/70"}`}
                      >
                        次要
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleAdd}
                      disabled={!newName.trim()}
                      className="self-start rounded-full bg-white/[0.10] px-5 py-2.5 text-sm font-medium text-white hover:bg-white/[0.15] disabled:opacity-30 transition-all"
                    >
                      确认添加
                    </button>
                  </div>
                )}

                {assets.length === 0 && !isAdding ? (
                  <div className="rounded-xl bg-black/20 border border-white/[0.04] p-10 text-center">
                    <p className="text-base text-white/30">该类别暂无内容</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {assets.map((asset) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        projectId={projectId}
                        category={section.key}
                        onImageUpload={(assetId, file) => onImageUpload(section.key, assetId, file)}
                        onImageRemove={(assetId) => onImageRemove(section.key, assetId)}
                        onPromptUpdate={(assetId, newPrompt, newPromptCn) => onPromptUpdate(section.key, assetId, newPrompt, newPromptCn)}
                        onGeneratePrompt={(assetId) => onGeneratePrompt(section.key, assetId)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
