"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Edit3, Save, X, Image, Video, ArrowLeft, Sparkles, Upload, FileImage, Film, Layers, Music } from "lucide-react";
import Link from "next/link";

interface Work {
  id: string;
  title: string;
  description: string;
  type: "image" | "video";
  src: string;
  thumbnail?: string;
  tags: string[];
  date: string;
}

interface Collection {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  workIds: string[];
  tags: string[];
  date: string;
}

const emptyWork = (): Work => ({
  id: Date.now().toString(),
  title: "",
  description: "",
  type: "image",
  src: "",
  thumbnail: "",
  tags: [],
  date: new Date().toISOString().slice(0, 10),
});

export default function AdminPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [editing, setEditing] = useState<Work | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [tab, setTab] = useState<"works" | "collections" | "site" | "music" | "api">("works");

  // ---- 合集状态 ----
  const [collections, setCollections] = useState<Collection[]>([]);
  const [editCol, setEditCol] = useState<Collection | null>(null);
  const [showColForm, setShowColForm] = useState(false);
  const [colTagInput, setColTagInput] = useState("");
  const [selectedWorkIds, setSelectedWorkIds] = useState<Set<string>>(new Set());

  // 加载
  const loadWorks = useCallback(async () => {
    const res = await fetch("/api/works");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) setWorks(data);
    }
  }, []);

  const loadCollections = useCallback(async () => {
    const res = await fetch("/api/collections");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) setCollections(data);
    }
  }, []);

  // ---- 站点配置 ----
  const [siteConfig, setSiteConfig] = useState<Record<string, unknown>>({});

  const loadConfig = useCallback(async () => {
    const res = await fetch("/api/config");
    if (res.ok) setSiteConfig(await res.json());
  }, []);

  const saveConfig = async () => {
    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(siteConfig),
    });
    showMsg(res.ok ? "站点设置已保存！" : "保存失败");
  };

  // ---- 音乐管理 ----
  const [songs, setSongs] = useState<{ id: string; title: string; artist: string; src?: string; neteaseId?: string; cover?: string }[]>([]);
  const [editSong, setEditSong] = useState<{ id: string; title: string; artist: string; src?: string; neteaseId?: string; cover?: string } | null>(null);
  const [showSongForm, setShowSongForm] = useState(false);

  const loadSongs = useCallback(async () => {
    const res = await fetch("/api/music");
    if (res.ok) setSongs(await res.json());
  }, []);

  const saveSongs = async (updated: typeof songs) => {
    const res = await fetch("/api/music", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
    if (res.ok) { setSongs(updated); showMsg("歌单已保存！"); }
    else showMsg("保存失败");
  };

  const handleAddSong = () => {
    setEditSong({ id: Date.now().toString(), title: "", artist: "", src: "", neteaseId: "", cover: "" });
    setShowSongForm(true);
  };

  const handleEditSong = (s: typeof songs[0]) => { setEditSong({ ...s }); setShowSongForm(true); };
  const handleDeleteSong = (id: string) => saveSongs(songs.filter((s) => s.id !== id));

  const handleSongSubmit = () => {
    if (!editSong) return;
    const idx = songs.findIndex((s) => s.id === editSong.id);
    const updated = idx >= 0 ? songs.map((s, i) => (i === idx ? editSong : s)) : [editSong, ...songs];
    saveSongs(updated);
    setShowSongForm(false); setEditSong(null);
  };

  // ---- API 配置 ----
  const [apiKey, setApiKey] = useState("");
  const [apiBaseURL, setApiBaseURL] = useState("https://api.deepseek.com/v1");
  const [apiMsg, setApiMsg] = useState("");

  const loadApiConfig = useCallback(async () => {
    const res = await fetch("/api/script-analysis/settings");
    if (res.ok) {
      const data = await res.json();
      setApiKey(data.apiKey || "");
      setApiBaseURL(data.baseURL || "https://api.deepseek.com/v1");
    }
  }, []);

  const saveApiConfig = async () => {
    const res = await fetch("/api/script-analysis/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: apiKey.trim(), baseURL: apiBaseURL.trim() }),
    });
    setApiMsg(res.ok ? "API 配置已保存！" : "保存失败");
    setTimeout(() => setApiMsg(""), 2500);
  };

  useEffect(() => {
    loadWorks();
    loadCollections();
    loadConfig();
    loadSongs();
    loadApiConfig();
  }, [loadWorks, loadCollections, loadConfig, loadSongs, loadApiConfig]);

  // ---- 合集 CRUD ----
  const saveCollections = async (updated: Collection[]) => {
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      setCollections(updated);
      showMsg("合集已保存！");
    } else {
      showMsg("保存失败");
    }
  };

  const handleAddCol = () => {
    setEditCol({
      id: Date.now().toString(),
      title: "",
      description: "",
      thumbnail: "",
      workIds: [],
      tags: [],
      date: new Date().toISOString().slice(0, 10),
    });
    setColTagInput("");
    setSelectedWorkIds(new Set());
    setShowColForm(true);
  };

  const handleEditCol = (col: Collection) => {
    setEditCol({ ...col });
    setColTagInput(col.tags.join("、"));
    setSelectedWorkIds(new Set(col.workIds));
    setShowColForm(true);
  };

  const handleDeleteCol = (id: string) => {
    saveCollections(collections.filter((c) => c.id !== id));
  };

  const handleColSubmit = () => {
    if (!editCol) return;
    const col = {
      ...editCol,
      tags: colTagInput.split(/[,，、]/).map((t) => t.trim()).filter(Boolean),
      workIds: Array.from(selectedWorkIds),
    };
    const idx = collections.findIndex((c) => c.id === col.id);
    const updated = idx >= 0
      ? collections.map((c, i) => (i === idx ? col : c))
      : [col, ...collections];
    saveCollections(updated);
    setShowColForm(false);
    setEditCol(null);
  };

  const toggleWorkSelect = (workId: string) => {
    setSelectedWorkIds((prev) => {
      const next = new Set(prev);
      if (next.has(workId)) next.delete(workId);
      else next.add(workId);
      return next;
    });
  };

  // 保存到服务器
  const saveToServer = async (updated: Work[]) => {
    setSaving(true);
    const res = await fetch("/api/works", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      setWorks(updated);
      showMsg("保存成功！刷新首页即可看到变化");
    } else {
      showMsg("保存失败，请重试");
    }
    setSaving(false);
  };

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  // 新增
  const handleAdd = () => {
    setEditing(emptyWork());
    setTagInput("");
    setShowForm(true);
  };

  // 编辑
  const handleEdit = (work: Work) => {
    setEditing({ ...work });
    setTagInput(work.tags.join("、"));
    setShowForm(true);
  };

  // 删除
  const handleDelete = (id: string) => {
    const updated = works.filter((w) => w.id !== id);
    saveToServer(updated);
  };

  // 上传文件
  const handleUpload = async (file: File) => {
    if (!editing) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setEditing({ ...editing, src: data.path });
        if (file.type.startsWith("video/")) {
          setEditing((prev) => prev && { ...prev, type: "video" });
        }
        showMsg(`上传成功: ${data.filename}`);
      } else {
        showMsg(`上传失败: ${data.error}`);
      }
    } catch {
      showMsg("上传失败，请检查网络");
    }
    setUploading(false);
  };

  // 处理拖放
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  // 提交表单
  const handleSubmit = () => {
    if (!editing) return;
    const w = { ...editing, tags: tagInput.split(/[,，、]/).map((t) => t.trim()).filter(Boolean) };
    const exists = works.findIndex((x) => x.id === w.id);
    let updated: Work[];
    if (exists >= 0) {
      updated = [...works];
      updated[exists] = w;
    } else {
      updated = [w, ...works];
    }
    saveToServer(updated);
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="relative z-10 mx-auto max-w-5xl px-6 py-8">
      {/* 顶部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
          <span className="text-muted">|</span>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-white/80" />
            <h1 className="text-xl font-bold">内容管理</h1>
          </div>
        </div>
      </div>

      {/* 标签切换 */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setTab("works")}
          className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
            tab === "works"
              ? "bg-white/10 text-white"
              : "text-muted border border-border hover:text-foreground"
          }`}
        >
          作品 ({works.length})
        </button>
        <button
          onClick={() => setTab("collections")}
          className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
            tab === "collections"
              ? "bg-white/10 text-white"
              : "text-muted border border-border hover:text-foreground"
          }`}
        >
          合集 ({collections.length})
        </button>
        <button
          onClick={() => setTab("site")}
          className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
            tab === "site"
              ? "bg-white/10 text-white"
              : "text-muted border border-border hover:text-foreground"
          }`}
        >
          站点设置
        </button>
        <button
          onClick={() => setTab("music")}
          className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
            tab === "music"
              ? "bg-white/10 text-white"
              : "text-muted border border-border hover:text-foreground"
          }`}
        >
          音乐 ({songs.length})
        </button>
        <button
          onClick={() => setTab("api")}
          className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
            tab === "api"
              ? "bg-white/10 text-white"
              : "text-muted border border-border hover:text-foreground"
          }`}
        >
          API 配置
        </button>
      </div>

      {/* 提示消息 */}
      {message && (
        <div className="mb-6 rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/80">
          {message}
        </div>
      )}

      {/* ===== 作品标签页 ===== */}
      {tab === "works" && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium text-white shadow-lg  hover:bg-white/20 transition-all"
            >
              <Plus className="h-4 w-4" />
              添加作品
            </button>
          </div>

          {/* 作品列表 */}
          <div className="space-y-3">
        {works.length === 0 && (
          <div className="py-20 text-center text-muted">
            <p className="text-lg">还没有作品</p>
            <p className="mt-1 text-sm">点击右上角「添加作品」开始</p>
          </div>
        )}
        {works.map((work) => (
          <div
            key={work.id}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-white/10"
          >
            {/* 缩略图 */}
            <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-white/[0.03]">
              {work.type === "video" ? (
                <div className="flex h-full items-center justify-center">
                  <Video className="h-6 w-6 text-muted" />
                </div>
              ) : (
                <img
                  src={work.src}
                  alt={work.title}
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">
                  {work.title || "（未命名）"}
                </h3>
                <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">
                  {work.type === "video" ? "视频" : "图片"}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-muted truncate">
                {work.description || "无描述"}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {work.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border bg-white/[0.03] px-2 py-0.5 text-[10px] text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 操作 */}
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => handleEdit(work)}
                className="rounded-lg p-2 text-muted hover:text-foreground hover:bg-white/[0.06] transition-all"
                title="编辑"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(work.id)}
                className="rounded-lg p-2 text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="删除"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 保存状态 */}
      <p className="mt-6 text-center text-xs text-muted">
        {saving ? "保存中..." : `共 ${works.length} 件作品`}
      </p>

      {/* ========== 编辑弹窗 ========== */}
      {showForm && editing && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => {
            setShowForm(false);
            setEditing(null);
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                {works.find((w) => w.id === editing.id) ? "编辑作品" : "添加作品"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="rounded-lg p-1.5 text-muted hover:text-foreground hover:bg-white/[0.06]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 标题 */}
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">
                  标题
                </label>
                <input
                  type="text"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="作品标题"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-white/15 focus:outline-none"
                />
              </div>

              {/* 描述 */}
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">
                  描述
                </label>
                <textarea
                  value={editing.description}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                  placeholder="简单描述一下这件作品"
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-white/15 focus:outline-none resize-none"
                />
              </div>

              {/* 类型 */}
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">
                  类型
                </label>
                <div className="flex gap-2">
                  {(["image", "video"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setEditing({ ...editing, type: t })}
                      className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm transition-all ${
                        editing.type === t
                          ? "border-white/15 bg-white/5 text-white/80"
                          : "border-border text-muted hover:text-foreground"
                      }`}
                    >
                      {t === "image" ? (
                        <Image className="h-4 w-4" />
                      ) : (
                        <Video className="h-4 w-4" />
                      )}
                      {t === "image" ? "图片" : "视频"}
                    </button>
                  ))}
                </div>
              </div>

              {/* 上传文件 */}
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">
                  {editing.type === "video" ? "上传视频" : "上传图片"}
                </label>

                {/* 拖拽区域 */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all cursor-pointer ${
                    dragOver
                      ? "border-white/15 bg-white/5"
                      : uploading
                        ? "border-border bg-white/[0.02] opacity-50"
                        : "border-border hover:border-white/20 hover:bg-white/[0.02]"
                  }`}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = editing.type === "video" ? "video/*" : "image/*";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleUpload(file);
                    };
                    input.click();
                  }}
                >
                  {uploading ? (
                    <>
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-transparent mb-2" />
                      <p className="text-sm text-muted">上传中...</p>
                    </>
                  ) : dragOver ? (
                    <>
                      <Upload className="h-8 w-8 text-white/80 mb-2" />
                      <p className="text-sm text-white/80 font-medium">
                        松手即上传
                      </p>
                    </>
                  ) : (
                    <>
                      {editing.type === "video" ? (
                        <Film className="h-8 w-8 text-muted mb-2" />
                      ) : (
                        <FileImage className="h-8 w-8 text-muted mb-2" />
                      )}
                      <p className="text-sm text-muted">
                        拖拽{editing.type === "video" ? "视频" : "图片"}到这里，或点击选择
                      </p>
                      <p className="mt-1 text-xs text-muted/50">
                        支持 JPG、PNG、GIF、MP4、WebM
                      </p>
                    </>
                  )}
                </div>

                {/* 预览 / 已上传显示 */}
                {editing.src && (
                  <div className="mt-2 overflow-hidden rounded-lg border border-border">
                    {editing.type === "video" ? (
                      <video
                        src={editing.src}
                        controls
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <img
                        src={editing.src}
                        alt="预览"
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <div className="flex items-center justify-between bg-white/[0.03] px-3 py-2">
                      <span className="text-xs text-muted truncate">
                        已设置: {editing.src}
                      </span>
                      <button
                        onClick={() => setEditing({ ...editing, src: "" })}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        清除
                      </button>
                    </div>
                  </div>
                )}

                {/* 手动输入链接（备用） */}
                <details className="mt-2">
                  <summary className="text-xs text-muted/50 cursor-pointer hover:text-muted">
                    或者手动输入链接
                  </summary>
                  <input
                    type="text"
                    value={editing.src}
                    onChange={(e) => setEditing({ ...editing, src: e.target.value })}
                    placeholder="https://... 或 /images/xxx.png"
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-white/15 focus:outline-none"
                  />
                </details>
              </div>

              {/* 视频缩略图 */}
              {editing.type === "video" && (
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">
                    缩略图（可选）
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editing.thumbnail || ""}
                      onChange={(e) =>
                        setEditing({ ...editing, thumbnail: e.target.value })
                      }
                      placeholder="视频封面的图片地址"
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-white/15 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            setUploading(true);
                            const fd = new FormData();
                            fd.append("file", file);
                            const res = await fetch("/api/upload", { method: "POST", body: fd });
                            const data = await res.json();
                            if (data.success) {
                              setEditing((prev) => prev && { ...prev, thumbnail: data.path });
                            }
                            setUploading(false);
                          }
                        };
                        input.click();
                      }}
                      disabled={uploading}
                      className="shrink-0 rounded-lg border border-border px-3 py-2.5 text-sm text-muted hover:text-foreground hover:bg-white/[0.06] transition-all disabled:opacity-50"
                    >
                      <Upload className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* 标签 */}
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">
                  标签（用逗号或顿号分隔）
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="如：AI绘画, 赛博朋克"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-white/15 focus:outline-none"
                />
              </div>

              {/* 日期 */}
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">
                  日期
                </label>
                <input
                  type="date"
                  value={editing.date}
                  onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-white/15 focus:outline-none [color-scheme:dark]"
                />
              </div>
            </div>

            {/* 按钮 */}
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted hover:text-foreground transition-all"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-white shadow-lg  hover:bg-white/20 transition-all disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* ===== 合集标签页 ===== */}
      {tab === "collections" && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={handleAddCol}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium text-white shadow-lg  hover:bg-white/20 transition-all"
            >
              <Plus className="h-4 w-4" />
              创建合集
            </button>
          </div>

          {collections.length === 0 && (
            <div className="py-20 text-center text-muted">
              <p className="text-lg">还没有合集</p>
              <p className="mt-1 text-sm">点击「创建合集」开始</p>
            </div>
          )}

          <div className="space-y-3">
            {collections.map((col) => (
              <div
                key={col.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
              >
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-white/[0.03]">
                  {col.thumbnail ? (
                    <img src={col.thumbnail} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted">
                      <Layers className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{col.title || "（未命名）"}</h3>
                  <p className="text-sm text-muted">
                    {col.workIds.length} 件作品
                    {col.description && ` — ${col.description}`}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {col.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-border bg-white/[0.03] px-2 py-0.5 text-[10px] text-muted">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => handleEditCol(col)} className="rounded-lg p-2 text-muted hover:text-foreground hover:bg-white/[0.06] transition-all">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDeleteCol(col.id)} className="rounded-lg p-2 text-muted hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-muted">
            共 {collections.length} 个合集
          </p>

          {/* ===== 合集编辑弹窗 ===== */}
          {showColForm && editCol && (
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
              onClick={() => { setShowColForm(false); setEditCol(null); }}
            >
              <div
                className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">
                    {collections.find((c) => c.id === editCol.id) ? "编辑合集" : "创建合集"}
                  </h2>
                  <button onClick={() => { setShowColForm(false); setEditCol(null); }} className="rounded-lg p-1.5 text-muted hover:text-foreground hover:bg-white/[0.06]">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">合集标题</label>
                    <input
                      type="text"
                      value={editCol.title}
                      onChange={(e) => setEditCol({ ...editCol, title: e.target.value })}
                      placeholder="如：赛博朋克系列"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-white/15 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">描述</label>
                    <textarea
                      value={editCol.description}
                      onChange={(e) => setEditCol({ ...editCol, description: e.target.value })}
                      placeholder="简短的合集介绍"
                      rows={2}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-white/15 focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">标签</label>
                    <input
                      type="text"
                      value={colTagInput}
                      onChange={(e) => setColTagInput(e.target.value)}
                      placeholder="如：赛博朋克, 科幻"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-white/15 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">
                      选择作品（{selectedWorkIds.size} 件已选）
                    </label>
                    <div className="max-h-60 overflow-y-auto rounded-lg border border-border space-y-0.5 p-2">
                      {works.length === 0 && (
                        <p className="text-sm text-muted text-center py-4">暂无作品，请先添加作品</p>
                      )}
                      {works.map((w) => (
                        <div
                          key={w.id}
                          onClick={() => toggleWorkSelect(w.id)}
                          className={`flex items-center gap-3 rounded-lg p-2 cursor-pointer transition-all ${
                            selectedWorkIds.has(w.id)
                              ? "bg-white/5 border border-white/15"
                              : "hover:bg-white/[0.03] border border-transparent"
                          }`}
                        >
                          <div className={`h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-all ${
                            selectedWorkIds.has(w.id) ? "bg-white/10 border-white/15" : "border-border"
                          }`}>
                            {selectedWorkIds.has(w.id) && (
                              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="h-10 w-14 shrink-0 overflow-hidden rounded bg-white/[0.03]">
                            {w.type === "image" ? (
                              <img src={w.src} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center"><Video className="h-4 w-4 text-muted" /></div>
                            )}
                          </div>
                          <span className="text-sm text-foreground truncate flex-1">{w.title || "未命名"}</span>
                          <span className="text-[10px] text-muted">{w.type === "video" ? "视频" : "图片"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    onClick={() => { setShowColForm(false); setEditCol(null); }}
                    className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted hover:text-foreground transition-all"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleColSubmit}
                    className="flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-white shadow-lg  hover:bg-white/20 transition-all"
                  >
                    <Save className="h-4 w-4" />
                    保存合集
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== 站点设置标签页 ===== */}
      {tab === "site" && (
        <div className="max-w-xl space-y-6">
          {/* Hero */}
          <fieldset className="rounded-xl border border-border p-6">
            <legend className="text-sm font-semibold text-foreground px-2">首页 Hero</legend>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted mb-1">标题（完整）</label>
                <input
                  type="text"
                  value={(siteConfig as Record<string, Record<string, string>>)?.hero?.title || ""}
                  onChange={(e) =>
                    setSiteConfig((prev) => ({
                      ...prev,
                      hero: { ...((prev as Record<string, Record<string, string>>).hero || {}), title: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-white/15 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">高亮文字（渐变效果的部分）</label>
                <input
                  type="text"
                  value={(siteConfig as Record<string, Record<string, string>>)?.hero?.titleHighlight || ""}
                  onChange={(e) =>
                    setSiteConfig((prev) => ({
                      ...prev,
                      hero: { ...((prev as Record<string, Record<string, string>>).hero || {}), titleHighlight: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-white/15 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">副标题</label>
                <input
                  type="text"
                  value={(siteConfig as Record<string, Record<string, string>>)?.hero?.subtitle || ""}
                  onChange={(e) =>
                    setSiteConfig((prev) => ({
                      ...prev,
                      hero: { ...((prev as Record<string, Record<string, string>>).hero || {}), subtitle: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-white/15 focus:outline-none"
                />
              </div>
            </div>
          </fieldset>

          {/* 作品区域 */}
          <fieldset className="rounded-xl border border-border p-6">
            <legend className="text-sm font-semibold text-foreground px-2">作品画廊</legend>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted mb-1">标题</label>
                <input
                  type="text"
                  value={(siteConfig as Record<string, Record<string, string>>)?.gallery?.heading || ""}
                  onChange={(e) =>
                    setSiteConfig((prev) => ({
                      ...prev,
                      gallery: { ...((prev as Record<string, Record<string, string>>).gallery || {}), heading: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-white/15 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">副标题</label>
                <input
                  type="text"
                  value={(siteConfig as Record<string, Record<string, string>>)?.gallery?.subheading || ""}
                  onChange={(e) =>
                    setSiteConfig((prev) => ({
                      ...prev,
                      gallery: { ...((prev as Record<string, Record<string, string>>).gallery || {}), subheading: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-white/15 focus:outline-none"
                />
              </div>
            </div>
          </fieldset>

          {/* 关于 */}
          <fieldset className="rounded-xl border border-border p-6">
            <legend className="text-sm font-semibold text-foreground px-2">关于我</legend>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted mb-1">标题</label>
                <input
                  type="text"
                  value={(siteConfig as Record<string, Record<string, string>>)?.about?.heading || ""}
                  onChange={(e) =>
                    setSiteConfig((prev) => ({
                      ...prev,
                      about: { ...((prev as Record<string, Record<string, string>>).about || {}), heading: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-white/15 focus:outline-none"
                />
              </div>
            </div>
          </fieldset>

          {/* 博客 */}
          <fieldset className="rounded-xl border border-border p-6">
            <legend className="text-sm font-semibold text-foreground px-2">博客</legend>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted mb-1">标题</label>
                <input
                  type="text"
                  value={(siteConfig as Record<string, Record<string, string>>)?.blog?.heading || ""}
                  onChange={(e) =>
                    setSiteConfig((prev) => ({
                      ...prev,
                      blog: { ...((prev as Record<string, Record<string, string>>).blog || {}), heading: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-white/15 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">副标题</label>
                <input
                  type="text"
                  value={(siteConfig as Record<string, Record<string, string>>)?.blog?.subheading || ""}
                  onChange={(e) =>
                    setSiteConfig((prev) => ({
                      ...prev,
                      blog: { ...((prev as Record<string, Record<string, string>>).blog || {}), subheading: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-white/15 focus:outline-none"
                />
              </div>
            </div>
          </fieldset>

          {/* 导航栏 & 页脚 */}
          <fieldset className="rounded-xl border border-border p-6">
            <legend className="text-sm font-semibold text-foreground px-2">导航栏 & 页脚</legend>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted mb-1">网站名称（导航栏左侧）</label>
                <input
                  type="text"
                  value={(siteConfig as Record<string, Record<string, string>>)?.navbar?.logo || ""}
                  onChange={(e) =>
                    setSiteConfig((prev) => ({
                      ...prev,
                      navbar: { ...((prev as Record<string, Record<string, string>>).navbar || {}), logo: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-white/15 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">页脚版权</label>
                <input
                  type="text"
                  value={(siteConfig as Record<string, Record<string, string>>)?.footer?.copyright || ""}
                  onChange={(e) =>
                    setSiteConfig((prev) => ({
                      ...prev,
                      footer: { ...((prev as Record<string, Record<string, string>>).footer || {}), copyright: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-white/15 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">页脚标语</label>
                <input
                  type="text"
                  value={(siteConfig as Record<string, Record<string, string>>)?.footer?.tagline || ""}
                  onChange={(e) =>
                    setSiteConfig((prev) => ({
                      ...prev,
                      footer: { ...((prev as Record<string, Record<string, string>>).footer || {}), tagline: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-white/15 focus:outline-none"
                />
              </div>
            </div>
          </fieldset>

          <button
            onClick={saveConfig}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-white shadow-lg  hover:bg-white/20 transition-all"
          >
            <Save className="h-4 w-4" />
            保存设置
          </button>
        </div>
      )}

      {/* ===== 音乐标签页 ===== */}
      {tab === "music" && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={handleAddSong} className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-all">
              <Plus className="h-4 w-4" /> 添加歌曲
            </button>
          </div>

          {songs.length === 0 ? (
            <div className="py-20 text-center text-muted"><p className="text-lg">歌单是空的</p></div>
          ) : (
            <div className="space-y-3">
              {songs.map((s) => (
                <div key={s.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                  <div className="h-12 w-12 shrink-0 rounded-lg bg-white/10 flex items-center justify-center">
                    <Music className="h-5 w-5 text-white/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{s.title || "未命名"}</h3>
                    <p className="text-sm text-muted truncate">{s.artist || "未知艺术家"}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEditSong(s)} className="rounded-lg p-2 text-muted hover:text-foreground hover:bg-white/[0.06]"><Edit3 className="h-4 w-4" /></button>
                    <button onClick={() => handleDeleteSong(s.id)} className="rounded-lg p-2 text-muted hover:text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showSongForm && editSong && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={() => { setShowSongForm(false); setEditSong(null); }}>
              <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">{songs.find((s) => s.id === editSong.id) ? "编辑歌曲" : "添加歌曲"}</h2>
                  <button onClick={() => { setShowSongForm(false); setEditSong(null); }} className="rounded-lg p-1.5 text-muted hover:text-foreground"><X className="h-5 w-5" /></button>
                </div>
                <div className="space-y-4">
                  <div><label className="block text-xs text-muted mb-1">歌名</label><input type="text" value={editSong.title} onChange={(e) => setEditSong({ ...editSong, title: e.target.value })} placeholder="歌曲名称" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-white/15 focus:outline-none" /></div>
                  <div><label className="block text-xs text-muted mb-1">艺术家</label><input type="text" value={editSong.artist} onChange={(e) => setEditSong({ ...editSong, artist: e.target.value })} placeholder="艺术家名称" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-white/15 focus:outline-none" /></div>
                  <div><label className="block text-xs text-muted mb-1">网易云歌曲ID（优先）</label><input type="text" value={editSong.neteaseId || ""} onChange={(e) => setEditSong({ ...editSong, neteaseId: e.target.value })} placeholder="如 186016，填了就用网易云播放" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-white/15 focus:outline-none" /></div>
                  <div><label className="block text-xs text-muted mb-1">音频地址（备用）</label><input type="text" value={editSong.src || ""} onChange={(e) => setEditSong({ ...editSong, src: e.target.value })} placeholder="/music/xxx.mp3 或 https://..." className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-white/15 focus:outline-none" /></div>
                  <div><label className="block text-xs text-muted mb-1">封面图（可选）</label><input type="text" value={editSong.cover || ""} onChange={(e) => setEditSong({ ...editSong, cover: e.target.value })} placeholder="封面图片地址" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-white/15 focus:outline-none" /></div>
                </div>
                <div className="mt-6 flex gap-3 justify-end">
                  <button onClick={() => { setShowSongForm(false); setEditSong(null); }} className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted hover:text-foreground">取消</button>
                  <button onClick={handleSongSubmit} className="flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/20"><Save className="h-4 w-4" /> 保存</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== API 配置标签页 ===== */}
      {tab === "api" && (
        <div className="max-w-xl space-y-6">
          {apiMsg && (
            <div className="rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/80">
              {apiMsg}
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-1">DeepSeek API 密钥</h3>
            <p className="text-xs text-muted mb-3">
              剧本分析功能所需的 AI 接口密钥。
              <a
                href="https://platform.deepseek.com/api_keys"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-white/40 hover:text-white/60 underline"
              >
                获取 API Key →
              </a>
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-white/15 focus:outline-none font-mono"
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-1">API 地址</h3>
            <p className="text-xs text-muted mb-3">
              一般不需要改，除非使用中转服务。
            </p>
            <input
              type="text"
              value={apiBaseURL}
              onChange={(e) => setApiBaseURL(e.target.value)}
              placeholder="https://api.deepseek.com/v1"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-white/15 focus:outline-none font-mono"
            />
            <p className="text-xs text-muted mt-2">
              官方默认：https://api.deepseek.com/v1
            </p>
          </div>

          <button
            onClick={saveApiConfig}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-all"
          >
            <Save className="h-4 w-4" /> 保存配置
          </button>
        </div>
      )}
    </div>
  );
}
