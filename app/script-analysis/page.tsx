"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import ProjectSidebar from "@/components/script-analysis/ProjectSidebar";
import ScriptInputForm from "@/components/script-analysis/ScriptInputForm";
import AnalysisResult from "@/components/script-analysis/AnalysisResult";
import WallpaperBackground from "@/components/script-analysis/WallpaperBackground";
import type { AssetItem } from "@/components/script-analysis/AssetCard";

interface ProjectMeta {
  id: string;
  name: string;
  createdAt: string;
}

interface ProjectData {
  id: string;
  script: string;
  synopsis: string;
  synopsisEn?: string;
  targetAudience: string;
  style: string;
  characters: AssetItem[];
  scenes: AssetItem[];
  props: AssetItem[];
}

export default function ScriptAnalysisPage() {
  // 项目管理
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // 当前项目数据
  const [script, setScript] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [synopsisEn, setSynopsisEn] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [style, setStyle] = useState("anime");
  const [templateIds, setTemplateIds] = useState<string[]>([]);
  const [characters, setCharacters] = useState<AssetItem[]>([]);
  const [scenes, setScenes] = useState<AssetItem[]>([]);
  const [props, setProps] = useState<AssetItem[]>([]);

  // UI 状态
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [pageError, setPageError] = useState("");
  const [pageLoading, setPageLoading] = useState(false);
  const [apiConfigured, setApiConfigured] = useState(true);

  // 加载项目列表
  const loadProjects = useCallback(async () => {
    const res = await fetch("/api/projects");
    if (res.ok) setProjects(await res.json());
  }, []);

  // 检查 API 配置
  useEffect(() => {
    async function init() {
      const configRes = await fetch("/api/script-analysis/settings");
      if (configRes.ok) {
        const config = await configRes.json();
        setApiConfigured(!!config.apiKey);
      }
    }
    init();
  }, []);

  // 初次加载项目列表
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // 加载选中项目的数据
  useEffect(() => {
    if (!activeId) {
      setScript(""); setSynopsis(""); setTargetAudience("");
      setStyle("anime"); setCharacters([]); setScenes([]); setProps([]);
      return;
    }
    async function loadProject() {
      setPageLoading(true);
      try {
        const res = await fetch(`/api/projects/${activeId}`);
        if (res.ok) {
          const data: ProjectData = await res.json();
          setScript(data.script || "");
          setSynopsis(data.synopsis || "");
          setSynopsisEn(data.synopsisEn || "");
          setTargetAudience(data.targetAudience || "");
          setStyle(data.style || "anime");
          setCharacters(data.characters || []);
          setScenes(data.scenes || []);
          setProps(data.props || []);
        }
      } catch {} finally {
        setPageLoading(false);
      }
    }
    loadProject();
  }, [activeId]);

  // 保存项目数据
  const saveProject = useCallback(
    async (data: ProjectData) => {
      if (!data.id) return;
      await fetch(`/api/projects/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    []
  );

  // 创建项目
  async function handleCreateProject(name: string) {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const result = await res.json();
    if (res.ok && result.success) {
      await loadProjects();
      setActiveId(result.project.id);
    } else {
      setPageError(result.error || "创建项目失败");
    }
  }

  // 重命名项目
  async function handleRenameProject(id: string, name: string) {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    await loadProjects();
  }

  // 删除项目
  async function handleDeleteProject(id: string) {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (activeId === id) setActiveId(null);
    await loadProjects();
  }

  // 分析剧本
  async function handleAnalyze(
    newScript: string,
    newTargetAudience: string,
    newStyle: string,
    newTemplateIds: string[]
  ) {
    if (!activeId) return;
    // 取消上一次请求
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setPageError("");

    try {
      const res = await fetch(`/api/projects/${activeId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: newScript,
          targetAudience: newTargetAudience,
          style: newStyle,
          templateIds: newTemplateIds,
        }),
        signal: controller.signal,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "分析失败");

      const { synopsis: newSynopsis, synopsisEn: newSynopsisEn, data } = result;

      setScript(newScript);
      setSynopsis(newSynopsis);
      setSynopsisEn(newSynopsisEn || "");
      setTargetAudience(newTargetAudience);
      setStyle(newStyle);
      setTemplateIds(newTemplateIds);
      setCharacters(data.characters);
      setScenes(data.scenes);
      setProps(data.props);

      // 持久化
      await saveProject({
        id: activeId,
        script: newScript,
        synopsis: newSynopsis,
        synopsisEn: newSynopsisEn || "",
        targetAudience: newTargetAudience,
        style: newStyle,
        characters: data.characters,
        scenes: data.scenes,
        props: data.props,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "分析失败";
      setPageError(msg);
      throw err;
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function handleCancel() {
    if (abortRef.current) {
      abortRef.current.abort();
      setLoading(false);
    }
  }

  // 上传图片
  async function handleImageUpload(category: string, assetId: string, file: File) {
    if (!activeId) return;
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || "上传失败");

    const imageUrl = result.path;
    const updater = (items: AssetItem[]) =>
      items.map((item) => (item.id === assetId ? { ...item, imageUrl } : item));

    let nc = characters, ns = scenes, np = props;
    if (category === "characters") { nc = updater(characters); setCharacters(nc); }
    else if (category === "scenes") { ns = updater(scenes); setScenes(ns); }
    else { np = updater(props); setProps(np); }

    await saveProject({ id: activeId, script, synopsis, synopsisEn, targetAudience, style, characters: nc, scenes: ns, props: np });
  }

  // 删除图片
  async function handleImageRemove(category: string, assetId: string) {
    if (!activeId) return;
    const updater = (items: AssetItem[]) =>
      items.map((item) => (item.id === assetId ? { ...item, imageUrl: "" } : item));

    let nc = characters, ns = scenes, np = props;
    if (category === "characters") { nc = updater(characters); setCharacters(nc); }
    else if (category === "scenes") { ns = updater(scenes); setScenes(ns); }
    else { np = updater(props); setProps(np); }

    await saveProject({ id: activeId, script, synopsis, synopsisEn, targetAudience, style, characters: nc, scenes: ns, props: np });
  }

  // 手动添加资产
  async function handleAddAsset(category: string, name: string, description: string, tier: "major" | "minor") {
    if (!activeId) return;
    const prefix = category === "characters" ? "char" : category === "scenes" ? "scene" : "prop";
    const newAsset: AssetItem = {
      id: `${prefix}_manual_${Date.now()}`,
      name,
      description,
      imagePrompt: "",
      imagePromptCn: "",
      imageUrl: "",
      tier,
    };

    let nc = characters, ns = scenes, np = props;
    if (category === "characters") { nc = [...characters, newAsset]; setCharacters(nc); }
    else if (category === "scenes") { ns = [...scenes, newAsset]; setScenes(ns); }
    else { np = [...props, newAsset]; setProps(np); }

    await saveProject({ id: activeId, script, synopsis, synopsisEn, targetAudience, style, characters: nc, scenes: ns, props: np });
  }

  // 为次要资产生成提示词
  async function handleGeneratePrompt(category: string, assetId: string) {
    if (!activeId) return;

    const asset = (category === "characters" ? characters : category === "scenes" ? scenes : props)
      .find((a) => a.id === assetId);
    if (!asset) return;

    const res = await fetch(`/api/projects/${activeId}/generate-prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetName: asset.name,
        assetType: category,
        description: asset.description,
        style,
        templateIds,
      }),
    });

    const result = await res.json();
    if (!result.success) throw new Error(result.error || "生成失败");

    const updater = (items: AssetItem[]) =>
      items.map((item) =>
        item.id === assetId
          ? { ...item, imagePrompt: result.imagePrompt, imagePromptCn: result.imagePromptCn, tier: "major" as const }
          : item
      );

    let nc = characters, ns = scenes, np = props;
    if (category === "characters") { nc = updater(characters); setCharacters(nc); }
    else if (category === "scenes") { ns = updater(scenes); setScenes(ns); }
    else { np = updater(props); setProps(np); }

    await saveProject({ id: activeId, script, synopsis, synopsisEn, targetAudience, style, characters: nc, scenes: ns, props: np });
  }

  // 更新提示词（来自对话修改）
  async function handlePromptUpdate(category: string, assetId: string, newPrompt: string, newPromptCn?: string) {
    if (!activeId) return;
    const updater = (items: AssetItem[]) =>
      items.map((item) =>
        item.id === assetId
          ? { ...item, imagePrompt: newPrompt, ...(newPromptCn ? { imagePromptCn: newPromptCn } : {}) }
          : item
      );

    let nc = characters, ns = scenes, np = props;
    if (category === "characters") { nc = updater(characters); setCharacters(nc); }
    else if (category === "scenes") { ns = updater(scenes); setScenes(ns); }
    else { np = updater(props); setProps(np); }

    await saveProject({ id: activeId, script, synopsis, synopsisEn, targetAudience, style, characters: nc, scenes: ns, props: np });
  }

  const hasResults = characters.length > 0 || scenes.length > 0 || props.length > 0;

  return (
    <div className="min-h-screen">
      {/* 壁纸背景 */}
      <WallpaperBackground />

      {/* 侧边栏（固定定位） */}
      <ProjectSidebar
        projects={projects}
        activeId={activeId}
        onSelect={setActiveId}
        onCreate={handleCreateProject}
        onDelete={handleDeleteProject}
        onRename={handleRenameProject}
      />

      {/* 主内容区（左边距留给固定侧边栏） */}
      <div className="ml-64 min-w-0 relative z-10">
        <div className="mx-auto max-w-7xl px-8 py-10">
          {/* 顶部 */}
          <div className="flex items-center gap-4 mb-8">
            <a
              href="/#hero"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-base text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>返回首页</span>
            </a>
            <h1 className="text-3xl font-bold text-white">📝 剧本分析</h1>
            {activeId && (
              <span className="text-base text-white/30">
                {projects.find((p) => p.id === activeId)?.name}
              </span>
            )}
          </div>

          {!apiConfigured && (
            <div className="mb-6 rounded-xl bg-amber-500/10 border border-amber-500/20 px-5 py-4 flex items-center gap-4">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="text-sm text-amber-300 font-medium">尚未配置 API Key</p>
                <p className="text-xs text-amber-400/70 mt-0.5">请前往管理后台配置</p>
              </div>
              <a href="/admin" className="shrink-0 rounded-full bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-500/30 transition-all">
                前往配置 →
              </a>
            </div>
          )}

          {!activeId ? (
            <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06] p-16 text-center">
              <p className="text-4xl mb-4">📂</p>
              <p className="text-white/40">在左侧创建一个项目开始分析</p>
            </div>
          ) : pageLoading ? (
            <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06] p-10 text-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-transparent mx-auto mb-3" />
              <p className="text-sm text-white/30">加载中...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {/* 输入区域 */}
              <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full">
                <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06] p-6">
                  <h2 className="text-xl font-semibold text-white mb-5">✍️ 完整剧本</h2>
                  <ScriptInputForm
                    initialScript={script}
                    initialAudience={targetAudience}
                    initialStyle={style}
                    initialTemplateIds={templateIds}
                    hasResults={hasResults}
                    onAnalyze={handleAnalyze}
                    onCancel={handleCancel}
                    loading={loading}
                  />
                </div>
                {pageError && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
                    <p className="text-sm text-red-400">{pageError}</p>
                  </div>
                )}
              </div>

              {/* 结果区域 */}
              {hasResults && (
                <div className="flex flex-col gap-4">
                  {synopsis && (
                    <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06] p-6">
                      <h2 className="text-xl font-semibold text-white mb-4">🤖 AI 提炼的剧本简介</h2>
                      <p className="text-base text-white/70 leading-relaxed whitespace-pre-wrap mb-5">{synopsis}</p>
                      {synopsisEn && (
                        <>
                          <div className="border-t border-white/[0.06] pt-5 mt-1">
                            <h3 className="text-sm font-semibold text-white/30 mb-2 uppercase tracking-wider">English Version</h3>
                            <p className="text-base text-white/50 leading-relaxed whitespace-pre-wrap italic">{synopsisEn}</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  <AnalysisResult
                    projectId={activeId}
                    data={{ characters, scenes, props }}
                    onImageUpload={handleImageUpload}
                    onImageRemove={handleImageRemove}
                    onPromptUpdate={handlePromptUpdate}
                    onGeneratePrompt={handleGeneratePrompt}
                    onAddAsset={handleAddAsset}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
