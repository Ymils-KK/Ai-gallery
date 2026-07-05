"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AlertTriangle, ArrowLeft, FileText, Layers3, Map, Sparkles, Users, Wrench } from "lucide-react";
import Link from "next/link";
import ProjectSidebar from "@/components/script-analysis/ProjectSidebar";
import ScriptInputForm from "@/components/script-analysis/ScriptInputForm";
import AnalysisResult from "@/components/script-analysis/AnalysisResult";
import CastDrawPanel from "@/components/script-analysis/CastDrawPanel";
import EpisodeAnalysis from "@/components/script-analysis/EpisodeAnalysis";
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
  era: string;
  characters: AssetItem[];
  scenes: AssetItem[];
  props: AssetItem[];
  _cachedAt?: number;
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
  const [era, setEra] = useState("any");
  const [templateIds, setTemplateIds] = useState<string[]>([]);
  const [characters, setCharacters] = useState<AssetItem[]>([]);
  const [scenes, setScenes] = useState<AssetItem[]>([]);
  const [props, setProps] = useState<AssetItem[]>([]);

  // UI 状态
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [pageError, setPageError] = useState("");
  const [pageLoading, setPageLoading] = useState(false);
  const [showEpisodeAnalysis, setShowEpisodeAnalysis] = useState(false);
  const [apiConfigured, setApiConfigured] = useState(true);

  // 加载项目列表
  const loadProjects = useCallback(async () => {
    const res = await fetch("/api/projects");
    if (res.ok) setProjects(await res.json());
  }, []);

  // 从 localStorage 读取缓存（Vercel 环境文件写不入，用浏览器存储兜底）
  function getLocalCache(id: string): ProjectData | null {
    try {
      const cache = JSON.parse(localStorage.getItem("sa_projects") || "{}");
      return cache[id] || null;
    } catch {
      return null;
    }
  }

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

  // 加载选中项目的数据（API 优先，localStorage 兜底）
  useEffect(() => {
    if (!activeId) {
      setScript(""); setSynopsis(""); setTargetAudience("");
      setStyle("anime"); setCharacters([]); setScenes([]); setProps([]);
      return;
    }
    const projectId = activeId;

    async function loadProject() {
      setPageLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (res.ok) {
          const apiData: ProjectData = await res.json();
          // localStorage 如有更新的缓存则优先使用（Vercel 上文件写不入，数据在浏览器里）
          const local = getLocalCache(projectId);
          const useLocal = local && local._cachedAt && (!apiData.synopsis || local._cachedAt > Date.now() - 86400000);

          const data = useLocal ? local : apiData;
          setScript(data.script || "");
          setSynopsis(data.synopsis || "");
          setSynopsisEn(data.synopsisEn || "");
          setTargetAudience(data.targetAudience || "");
          setStyle(data.style || "anime");
          setEra(data.era || "any");
          setCharacters(data.characters || []);
          setScenes(data.scenes || []);
          setProps(data.props || []);
        } else {
          // API 404 → 可能是 Vercel 上新创建的项目，从 localStorage 读
          const local = getLocalCache(projectId);
          if (local) {
            setScript(local.script || "");
            setSynopsis(local.synopsis || "");
            setSynopsisEn(local.synopsisEn || "");
            setTargetAudience(local.targetAudience || "");
            setStyle(local.style || "anime");
            setEra(local.era || "any");
            setCharacters(local.characters || []);
            setScenes(local.scenes || []);
            setProps(local.props || []);
          }
        }
      } catch {} finally {
        setPageLoading(false);
      }
    }
    loadProject();
  }, [activeId]);

  // 保存项目数据（同时写 localStorage 兜底，Vercel 文件系统只读时刷新不丢数据）
  const saveProject = useCallback(
    async (data: ProjectData) => {
      if (!data.id) return;
      // localStorage 兜底（无论 API 是否成功都存）
      try {
        const cache = JSON.parse(localStorage.getItem("sa_projects") || "{}");
        cache[data.id] = { ...data, _cachedAt: Date.now() };
        localStorage.setItem("sa_projects", JSON.stringify(cache));
      } catch {}
      // 尝试写服务端文件
      try {
        await fetch(`/api/projects/${data.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } catch {}
    },
    []
  );

  // 创建项目
  async function handleCreateProject(name: string) {
    setPageError("");
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
    newEra: string,
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
          era: newEra,
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
      setEra(newEra);
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
        era: newEra,
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

    await saveProject({ id: activeId, script, synopsis, synopsisEn, targetAudience, style, era, characters: nc, scenes: ns, props: np });
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

    await saveProject({ id: activeId, script, synopsis, synopsisEn, targetAudience, style, era, characters: nc, scenes: ns, props: np });
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

    await saveProject({ id: activeId, script, synopsis, synopsisEn, targetAudience, style, era, characters: nc, scenes: ns, props: np });
  }

  // ---- 服装操作 ----

  // 手动添加服装
  async function handleAddOutfit(charId: string, name: string, desc: string) {
    if (!activeId) return;
    const updater = (items: AssetItem[]) =>
      items.map((item) => {
        if (item.id !== charId) return item;
        const outfit = {
          id: `outfit_${Date.now()}`,
          name,
          description: desc,
          imagePrompt: "",
          imagePromptCn: "",
          imageUrl: "",
        };
        return { ...item, outfits: [...(item.outfits || []), outfit] };
      });

    const nc = updater(characters);
    setCharacters(nc);
    await saveProject({ id: activeId, script, synopsis, synopsisEn, targetAudience, style, era, characters: nc, scenes, props });
  }

  // 上传服装图片
  async function handleOutfitImageUpload(charId: string, outfitId: string, file: File) {
    if (!activeId) return;
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || "上传失败");

    const imageUrl = result.path;
    const updater = (items: AssetItem[]) =>
      items.map((item) => {
        if (item.id !== charId || !item.outfits) return item;
        return {
          ...item,
          outfits: item.outfits.map((o) => (o.id === outfitId ? { ...o, imageUrl } : o)),
        };
      });

    const nc = updater(characters);
    setCharacters(nc);
    await saveProject({ id: activeId, script, synopsis, synopsisEn, targetAudience, style, era, characters: nc, scenes, props });
  }

  // 删除服装图片
  async function handleOutfitImageRemove(charId: string, outfitId: string) {
    if (!activeId) return;
    const updater = (items: AssetItem[]) =>
      items.map((item) => {
        if (item.id !== charId || !item.outfits) return item;
        return {
          ...item,
          outfits: item.outfits.map((o) => (o.id === outfitId ? { ...o, imageUrl: "" } : o)),
        };
      });

    const nc = updater(characters);
    setCharacters(nc);
    await saveProject({ id: activeId, script, synopsis, synopsisEn, targetAudience, style, era, characters: nc, scenes, props });
  }

  // 更新服装提示词
  async function handleOutfitPromptUpdate(charId: string, outfitId: string, newPrompt: string, newPromptCn?: string) {
    if (!activeId) return;
    const updater = (items: AssetItem[]) =>
      items.map((item) => {
        if (item.id !== charId || !item.outfits) return item;
        return {
          ...item,
          outfits: item.outfits.map((o) =>
            o.id === outfitId
              ? { ...o, imagePrompt: newPrompt, ...(newPromptCn ? { imagePromptCn: newPromptCn } : {}) }
              : o
          ),
        };
      });

    const nc = updater(characters);
    setCharacters(nc);
    await saveProject({ id: activeId, script, synopsis, synopsisEn, targetAudience, style, era, characters: nc, scenes, props });
  }

  // AI 生成服装提示词
  async function handleGenerateOutfitPrompt(charId: string, outfitId: string) {
    if (!activeId) return;

    const character = characters.find((c) => c.id === charId);
    const outfit = character?.outfits?.find((o) => o.id === outfitId);
    if (!character || !outfit) return;

    const res = await fetch(`/api/projects/${activeId}/generate-prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetName: `${character.name} - ${outfit.name}`,
        assetType: "outfit",
        description: `角色：${character.name}（${character.description}）\n服装：${outfit.name}（${outfit.description}）`,
        style,
        era,
        templateIds,
      }),
    });

    const result = await res.json();
    if (!result.success) throw new Error(result.error || "生成失败");

    const updater = (items: AssetItem[]) =>
      items.map((item) => {
        if (item.id !== charId || !item.outfits) return item;
        return {
          ...item,
          outfits: item.outfits.map((o) =>
            o.id === outfitId
              ? { ...o, imagePrompt: result.imagePrompt, imagePromptCn: result.imagePromptCn }
              : o
          ),
        };
      });

    const nc = updater(characters);
    setCharacters(nc);
    await saveProject({ id: activeId, script, synopsis, synopsisEn, targetAudience, style, era, characters: nc, scenes, props });
  }

  // 删除服装
  async function handleDeleteOutfit(charId: string, outfitId: string) {
    if (!activeId) return;
    const updater = (items: AssetItem[]) =>
      items.map((item) => {
        if (item.id !== charId || !item.outfits) return item;
        return { ...item, outfits: item.outfits.filter((o) => o.id !== outfitId) };
      });

    const nc = updater(characters);
    setCharacters(nc);
    await saveProject({ id: activeId, script, synopsis, synopsisEn, targetAudience, style, era, characters: nc, scenes, props });
  }

  // 按需为单个资产生成提示词
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
        era,
        templateIds,
      }),
    });

    const result = await res.json();
    if (!result.success) throw new Error(result.error || "生成失败");

    const updater = (items: AssetItem[]) =>
      items.map((item) =>
        item.id === assetId
          ? { ...item, imagePrompt: result.imagePrompt, imagePromptCn: result.imagePromptCn }
          : item
      );

    let nc = characters, ns = scenes, np = props;
    if (category === "characters") { nc = updater(characters); setCharacters(nc); }
    else if (category === "scenes") { ns = updater(scenes); setScenes(ns); }
    else { np = updater(props); setProps(np); }

    await saveProject({ id: activeId, script, synopsis, synopsisEn, targetAudience, style, era, characters: nc, scenes: ns, props: np });
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

    await saveProject({ id: activeId, script, synopsis, synopsisEn, targetAudience, style, era, characters: nc, scenes: ns, props: np });
  }

  const hasResults = characters.length > 0 || scenes.length > 0 || props.length > 0;
  const activeProject = projects.find((p) => p.id === activeId);
  const assetCount = characters.length + scenes.length + props.length;

  return (
    <div className="min-h-screen bg-[#07120f] text-white">
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

      {/* 主内容区（桌面左边距留给固定侧边栏，手机端改为上下布局） */}
      <div className="relative z-10 min-w-0 md:ml-72">
        <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 md:px-8 md:py-8">
          {/* 顶部 */}
          <div className="mb-5 flex flex-col gap-4 border-b border-white/[0.08] pb-5 md:mb-7 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <Link
                href="/#hero"
                className="mb-3 inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>返回首页</span>
              </Link>
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/[0.10] bg-white/[0.08]">
                  <FileText className="h-5 w-5 text-white/80" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-semibold tracking-normal text-white md:text-3xl">剧本分析</h1>
                  <p className="mt-1 max-w-3xl truncate text-sm text-white/45">
                    {activeProject ? activeProject.name : "选择或创建项目后开始分析"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm sm:flex">
              <div className="rounded-md border border-white/[0.08] bg-white/[0.05] px-3 py-2">
                <div className="text-[11px] text-white/35">人物</div>
                <div className="font-semibold text-white">{characters.length}</div>
              </div>
              <div className="rounded-md border border-white/[0.08] bg-white/[0.05] px-3 py-2">
                <div className="text-[11px] text-white/35">场景</div>
                <div className="font-semibold text-white">{scenes.length}</div>
              </div>
              <div className="rounded-md border border-white/[0.08] bg-white/[0.05] px-3 py-2">
                <div className="text-[11px] text-white/35">道具</div>
                <div className="font-semibold text-white">{props.length}</div>
              </div>
            </div>
          </div>

          {!apiConfigured && (
            <div className="mb-5 flex items-center gap-4 rounded-md border border-amber-400/25 bg-amber-400/10 px-4 py-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-300" />
              <div className="flex-1">
                <p className="text-sm text-amber-300 font-medium">尚未配置 API Key</p>
                <p className="text-xs text-amber-400/70 mt-0.5">请前往管理后台配置</p>
              </div>
              <Link href="/admin" className="shrink-0 rounded-md bg-amber-400/18 px-4 py-2 text-sm font-medium text-amber-200 transition-all hover:bg-amber-400/28">
                前往配置 →
              </Link>
            </div>
          )}

          {pageError && (
            <div className="mb-5 rounded-md border border-red-400/25 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-400">{pageError}</p>
            </div>
          )}

          {!activeId ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-white/[0.08] bg-[#07120f]/82 p-8 text-center shadow-2xl backdrop-blur-xl">
              <div className="max-w-sm">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-md border border-white/[0.10] bg-white/[0.06]">
                  <Layers3 className="h-7 w-7 text-white/70" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  {projects.length > 0 ? "选择一个项目" : "先创建一个项目"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  {projects.length > 0
                    ? "从左侧项目列表选择一个项目，然后继续编辑或分析剧本。"
                    : "左侧新建项目后，可以拖入 Word 剧本、选择画风和时代，并生成角色、场景和道具提示词。"}
                </p>
              </div>
            </div>
          ) : pageLoading ? (
            <div className="rounded-lg bg-[#07120f]/82 backdrop-blur-xl border border-white/[0.08] p-10 text-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-transparent mx-auto mb-3" />
              <p className="text-sm text-white/30">加载中...</p>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              {/* 输入区域 */}
              <div className="flex min-w-0 flex-col gap-6">
                <div className="rounded-lg border border-white/[0.08] bg-[#07120f]/88 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
                  <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-white">输入与分析设置</h2>
                      <p className="mt-1 text-sm text-white/40">拖入 Word 剧本后选择画风、时代和提示词模板。</p>
                    </div>
                    <Sparkles className="hidden h-5 w-5 text-white/35 sm:block" />
                  </div>
                  <ScriptInputForm
                    initialScript={script}
                    initialAudience={targetAudience}
                    initialStyle={style}
                    initialEra={era}
                    initialTemplateIds={templateIds}
                    hasResults={hasResults}
                    onAnalyze={handleAnalyze}
                    onCancel={handleCancel}
                    loading={loading}
                  />
                </div>

                {/* 结果区域 */}
                {hasResults && (
                <div className="flex flex-col gap-5">
                  {synopsis && (
                    <div className="rounded-lg bg-[#07120f]/88 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6">
                      <h2 className="text-lg font-semibold text-white mb-4">AI 提炼的剧本简介</h2>
                      <p className="text-base text-white/74 leading-8 whitespace-pre-wrap mb-5">{synopsis}</p>
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
                    onAddOutfit={handleAddOutfit}
                    onOutfitImageUpload={handleOutfitImageUpload}
                    onOutfitImageRemove={handleOutfitImageRemove}
                    onOutfitPromptUpdate={handleOutfitPromptUpdate}
                    onGenerateOutfitPrompt={handleGenerateOutfitPrompt}
                    onDeleteOutfit={handleDeleteOutfit}
                  />
                </div>
                )}
              </div>

              <aside className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-20 xl:self-start">
                <div className="rounded-lg border border-white/[0.08] bg-[#07120f]/88 p-5 shadow-2xl backdrop-blur-xl">
                  <h2 className="text-sm font-semibold text-white/80">项目概览</h2>
                  <div className="mt-4 grid grid-cols-3 gap-2 xl:grid-cols-1">
                    <div className="flex items-center gap-3 rounded-md border border-white/[0.07] bg-white/[0.04] px-3 py-3">
                      <Users className="h-4 w-4 text-white/45" />
                      <div>
                        <p className="text-xs text-white/35">人物资产</p>
                        <p className="text-lg font-semibold leading-tight text-white">{characters.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-md border border-white/[0.07] bg-white/[0.04] px-3 py-3">
                      <Map className="h-4 w-4 text-white/45" />
                      <div>
                        <p className="text-xs text-white/35">场景资产</p>
                        <p className="text-lg font-semibold leading-tight text-white">{scenes.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-md border border-white/[0.07] bg-white/[0.04] px-3 py-3">
                      <Wrench className="h-4 w-4 text-white/45" />
                      <div>
                        <p className="text-xs text-white/35">道具资产</p>
                        <p className="text-lg font-semibold leading-tight text-white">{props.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-md border border-white/[0.07] bg-white/[0.035] px-3 py-3">
                    <p className="text-xs text-white/35">当前状态</p>
                    <p className="mt-1 text-sm text-white/70">
                      {assetCount > 0 ? `已生成 ${assetCount} 个资产` : "等待分析结果"}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-white/[0.08] bg-[#07120f]/88 p-5 shadow-2xl backdrop-blur-xl">
                  <button
                    onClick={() => setShowEpisodeAnalysis(!showEpisodeAnalysis)}
                    className="flex w-full items-center justify-between rounded-md border border-white/[0.10] bg-white/[0.06] px-4 py-3 text-left text-sm font-semibold text-white/76 transition-all hover:border-white/[0.18] hover:bg-white/[0.10] hover:text-white"
                  >
                    <span>分集分析</span>
                    <span className="text-xs text-white/40">{showEpisodeAnalysis ? "收起" : "展开"}</span>
                  </button>
                  {showEpisodeAnalysis && (
                    <div className="mt-4">
                      <EpisodeAnalysis projectId={activeId} />
                    </div>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>

      {/* 抽卡面板 */}
      {activeId && (
        <CastDrawPanel projectId={activeId} />
      )}
    </div>
  );
}
