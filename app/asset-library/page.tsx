"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  Heart,
  ImagePlus,
  Loader2,
  Map,
  Search,
  Shirt,
  Sparkles,
  Trash2,
  UploadCloud,
  User,
  X,
} from "lucide-react";

type AssetCategory = "character" | "scene" | "outfit" | "prop" | "reference";
type Gender = "male" | "female";
type RoleType = "lead" | "villain";
type OutfitEra = "modern" | "medieval";
type StatusFilter = "all" | "unused" | "used";

interface UsageRecord {
  id: string;
  projectName: string;
  role: string;
  note: string;
  usedAt: string;
}

interface LibraryAsset {
  id: string;
  name: string;
  category: AssetCategory;
  imageUrl: string;
  description: string;
  prompt: string;
  tags: string[];
  favorite: boolean;
  used: boolean;
  usages: UsageRecord[];
  createdAt: string;
  gender?: Gender;
  roleType?: RoleType;
  era?: OutfitEra;
  batchId?: string;
}

interface BatchMeta {
  category: AssetCategory;
  gender: Gender;
  roleType: RoleType;
  era: OutfitEra;
}

const MAX_UPLOAD_SIZE = 4 * 1024 * 1024;

const categoryLabels: Record<AssetCategory, string> = {
  character: "人物",
  scene: "场景",
  outfit: "服装",
  prop: "道具",
  reference: "参考",
};

const categoryOptions: Array<{ key: AssetCategory | "all"; label: string; icon: React.ReactNode }> = [
  { key: "all", label: "全部", icon: <Archive className="h-4 w-4" /> },
  { key: "character", label: "人物", icon: <User className="h-4 w-4" /> },
  { key: "scene", label: "场景", icon: <Map className="h-4 w-4" /> },
  { key: "outfit", label: "服装", icon: <Shirt className="h-4 w-4" /> },
  { key: "prop", label: "道具", icon: <Sparkles className="h-4 w-4" /> },
  { key: "reference", label: "参考", icon: <ImagePlus className="h-4 w-4" /> },
];

const seedAssets: LibraryAsset[] = [
  {
    id: "asset_seed_character",
    name: "男主001",
    category: "character",
    gender: "male",
    roleType: "lead",
    imageUrl: "",
    description: "",
    prompt: "cinematic portrait, sharp facial features, reserved expression, premium drama character reference",
    tags: ["男主", "悬疑"],
    favorite: false,
    used: false,
    usages: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "asset_seed_scene",
    name: "场景001",
    category: "scene",
    imageUrl: "",
    description: "",
    prompt: "rainy neon alley, reflective pavement, cinematic lighting, moody atmosphere, high detail",
    tags: ["雨夜", "都市"],
    favorite: false,
    used: false,
    usages: [],
    createdAt: new Date().toISOString(),
  },
];

function makeId(prefix = "asset") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function splitTags(value: string) {
  return value
    .split(/[,，\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function createBlankAsset(): LibraryAsset {
  return {
    id: makeId(),
    name: "",
    category: "character",
    gender: "male",
    roleType: "lead",
    imageUrl: "",
    description: "",
    prompt: "",
    tags: [],
    favorite: false,
    used: false,
    usages: [],
    createdAt: new Date().toISOString(),
  };
}

function normalizeAsset(raw: Partial<LibraryAsset>): LibraryAsset {
  const category = raw.category || "reference";
  return {
    id: raw.id || makeId(),
    name: raw.name || "未命名",
    category,
    imageUrl: raw.imageUrl || "",
    description: raw.description || "",
    prompt: raw.prompt || "",
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    favorite: !!raw.favorite,
    used: !!raw.used,
    usages: Array.isArray(raw.usages) ? raw.usages : [],
    createdAt: raw.createdAt || new Date().toISOString(),
    gender: raw.gender,
    roleType: raw.roleType,
    era: raw.era,
    batchId: raw.batchId,
  };
}

function prefixFor(meta: Pick<LibraryAsset, "category" | "gender" | "roleType" | "era">) {
  if (meta.category === "character") {
    if (meta.gender === "female") return meta.roleType === "villain" ? "女反派" : "女主";
    return meta.roleType === "villain" ? "男反派" : "男主";
  }
  if (meta.category === "outfit") {
    const gender = meta.gender === "female" ? "女装" : "男装";
    const era = meta.era === "medieval" ? "中世纪" : "现代";
    return `${gender}${era}`;
  }
  return categoryLabels[meta.category] || "资产";
}

function nextNameFor(meta: Pick<LibraryAsset, "category" | "gender" | "roleType" | "era">, assets: LibraryAsset[]) {
  const prefix = prefixFor(meta);
  const max = assets.reduce((current, asset) => {
    if (!asset.name.startsWith(prefix)) return current;
    const match = asset.name.slice(prefix.length).match(/^(\d+)/);
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

function searchableText(asset: LibraryAsset) {
  return [
    asset.name,
    asset.description,
    asset.prompt,
    categoryLabels[asset.category],
    prefixFor(asset),
    ...(asset.tags || []),
    ...(asset.usages || []).flatMap((usage) => [usage.projectName, usage.role, usage.note]),
  ]
    .join(" ")
    .toLowerCase();
}

export default function AssetLibraryPage() {
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [activeCategory, setActiveCategory] = useState<AssetCategory | "all">("all");
  const [genderFilter, setGenderFilter] = useState<Gender | "all">("all");
  const [roleFilter, setRoleFilter] = useState<RoleType | "all">("all");
  const [eraFilter, setEraFilter] = useState<OutfitEra | "all">("all");
  const [query, setQuery] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editing, setEditing] = useState<LibraryAsset | null>(null);
  const [usageAsset, setUsageAsset] = useState<LibraryAsset | null>(null);
  const [copiedId, setCopiedId] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/asset-library");
        if (res.ok) {
          const data = await res.json();
          const next = Array.isArray(data) && data.length > 0 ? data.map(normalizeAsset) : seedAssets;
          setAssets(next);
          localStorage.setItem("asset_library", JSON.stringify(next));
          return;
        }
      } catch {}

      try {
        const cached = JSON.parse(localStorage.getItem("asset_library") || "[]");
        setAssets(Array.isArray(cached) && cached.length > 0 ? cached.map(normalizeAsset) : seedAssets);
      } catch {
        setAssets(seedAssets);
      }
    }
    load();
  }, []);

  async function persist(next: LibraryAsset[]) {
    setAssets(next);
    try {
      localStorage.setItem("asset_library", JSON.stringify(next));
    } catch {}
    try {
      await fetch("/api/asset-library", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
    } catch {}
  }

  const filteredAssets = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return assets.filter((asset) => {
      if (activeCategory !== "all" && asset.category !== activeCategory) return false;
      if (asset.category === "character") {
        if (genderFilter !== "all" && asset.gender !== genderFilter) return false;
        if (roleFilter !== "all" && asset.roleType !== roleFilter) return false;
      }
      if (asset.category === "outfit") {
        if (genderFilter !== "all" && asset.gender !== genderFilter) return false;
        if (eraFilter !== "all" && asset.era !== eraFilter) return false;
      }
      if (onlyFavorites && !asset.favorite) return false;
      if (statusFilter === "unused" && asset.used) return false;
      if (statusFilter === "used" && !asset.used) return false;
      return keyword ? searchableText(asset).includes(keyword) : true;
    });
  }, [activeCategory, assets, eraFilter, genderFilter, onlyFavorites, query, roleFilter, statusFilter]);

  const stats = {
    total: assets.length,
    unused: assets.filter((asset) => !asset.used).length,
    used: assets.filter((asset) => asset.used).length,
    favorite: assets.filter((asset) => asset.favorite).length,
  };

  function saveAsset(asset: LibraryAsset) {
    const normalized = normalizeAsset(asset);
    const nextAsset = normalized.name.trim()
      ? normalized
      : { ...normalized, name: nextNameFor(normalized, assets) };
    const exists = assets.some((item) => item.id === nextAsset.id);
    const next = exists ? assets.map((item) => (item.id === nextAsset.id ? nextAsset : item)) : [nextAsset, ...assets];
    persist(next);
    setEditing(null);
  }

  function addUsage(asset: LibraryAsset, record: UsageRecord) {
    const nextAsset = { ...asset, used: true, usages: [record, ...asset.usages] };
    persist(assets.map((item) => (item.id === asset.id ? nextAsset : item)));
    setUsageAsset(null);
  }

  async function copyPrompt(asset: LibraryAsset) {
    const text = asset.prompt || asset.description || asset.name;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(""), 1600);
  }

  async function importFiles(files: File[], meta: BatchMeta) {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) return { ok: 0, failed: files.length };

    const batchId = makeId("batch");
    const imported: LibraryAsset[] = [];
    let failed = files.length - imageFiles.length;
    let lastError = "";

    for (const file of imageFiles) {
      try {
        if (file.size > MAX_UPLOAD_SIZE) {
          throw new Error("图片太大，请先压缩到 4MB 以内");
        }
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result.detail || result.error || "上传失败");

        const base: LibraryAsset = {
          id: makeId(),
          name: "",
          category: meta.category,
          gender: meta.category === "character" || meta.category === "outfit" ? meta.gender : undefined,
          roleType: meta.category === "character" ? meta.roleType : undefined,
          era: meta.category === "outfit" ? meta.era : undefined,
          imageUrl: result.path,
          description: "",
          prompt: "",
          tags: [prefixFor({ category: meta.category, gender: meta.gender, roleType: meta.roleType, era: meta.era })],
          favorite: false,
          used: false,
          usages: [],
          createdAt: new Date().toISOString(),
          batchId,
        };
        imported.push({ ...base, name: nextNameFor(base, [...assets, ...imported]) });
      } catch (error) {
        lastError = error instanceof Error ? error.message : "上传失败";
        failed += 1;
      }
    }

    if (imported.length > 0) {
      await persist([...imported, ...assets]);
    }
    return { ok: imported.length, failed, error: lastError };
  }

  return (
    <div className="min-h-screen bg-[#07120f] text-white">
      <div className="mx-auto max-w-[1560px] px-3 py-5 sm:px-5 lg:px-7">
        <div className="mb-4 border-b border-white/[0.08] pb-4">
          <Link href="/#hero" className="mb-3 inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            <span>返回首页</span>
          </Link>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/[0.10] bg-white/[0.08]">
                <Archive className="h-5 w-5 text-white/80" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">资产仓库</h1>
                <p className="mt-1 text-sm text-white/42">批量收纳人物、场景、服装和参考图，平时看图，悬浮管理。</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditing(createBlankAsset())}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/[0.12] bg-white/[0.10] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/[0.16]"
            >
              <ImagePlus className="h-4 w-4" />
              <span>单张新增</span>
            </button>
          </div>
        </div>

        <BatchImportPanel onImport={importFiles} />

        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="全部" value={stats.total} />
          <Stat label="未使用" value={stats.unused} />
          <Stat label="已使用" value={stats.used} />
          <Stat label="收藏" value={stats.favorite} />
        </div>

        <div className="mb-4 rounded-lg border border-white/[0.08] bg-[#07120f]/88 p-3 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索编号、标签、提示词、剧名或用途"
                className="w-full rounded-md border border-white/[0.08] bg-white/[0.05] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <ToggleButton active={onlyFavorites} onClick={() => setOnlyFavorites((value) => !value)}>
                收藏
              </ToggleButton>
              {(["all", "unused", "used"] as const).map((mode) => (
                <ToggleButton key={mode} active={statusFilter === mode} onClick={() => setStatusFilter(mode)}>
                  {mode === "all" ? "全部状态" : mode === "unused" ? "未使用" : "已使用"}
                </ToggleButton>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {categoryOptions.map((category) => (
              <button
                key={category.key}
                type="button"
                onClick={() => setActiveCategory(category.key)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-all ${
                  activeCategory === category.key ? "border-white/20 bg-white/[0.14] text-white" : "border-white/[0.08] bg-white/[0.04] text-white/50 hover:text-white"
                }`}
              >
                {category.icon}
                <span>{category.label}</span>
              </button>
            ))}
          </div>

          {(activeCategory === "character" || activeCategory === "outfit") && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
              <ToggleButton active={genderFilter === "all"} onClick={() => setGenderFilter("all")}>全部性别</ToggleButton>
              <ToggleButton active={genderFilter === "male"} onClick={() => setGenderFilter("male")}>{activeCategory === "outfit" ? "男装" : "男性"}</ToggleButton>
              <ToggleButton active={genderFilter === "female"} onClick={() => setGenderFilter("female")}>{activeCategory === "outfit" ? "女装" : "女性"}</ToggleButton>
              {activeCategory === "character" && (
                <>
                  <ToggleButton active={roleFilter === "all"} onClick={() => setRoleFilter("all")}>全部角色</ToggleButton>
                  <ToggleButton active={roleFilter === "lead"} onClick={() => setRoleFilter("lead")}>主角</ToggleButton>
                  <ToggleButton active={roleFilter === "villain"} onClick={() => setRoleFilter("villain")}>反派</ToggleButton>
                </>
              )}
              {activeCategory === "outfit" && (
                <>
                  <ToggleButton active={eraFilter === "all"} onClick={() => setEraFilter("all")}>全部年代</ToggleButton>
                  <ToggleButton active={eraFilter === "modern"} onClick={() => setEraFilter("modern")}>现代</ToggleButton>
                  <ToggleButton active={eraFilter === "medieval"} onClick={() => setEraFilter("medieval")}>中世纪</ToggleButton>
                </>
              )}
            </div>
          )}
        </div>

        {filteredAssets.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-white/[0.08] bg-[#07120f]/82 p-8 text-center shadow-2xl backdrop-blur-xl">
            <div>
              <Archive className="mx-auto mb-4 h-10 w-10 text-white/30" />
              <h2 className="text-lg font-semibold text-white">没有匹配的图片</h2>
              <p className="mt-2 text-sm text-white/40">换个筛选，或者把图片拖进上方导入区。</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {filteredAssets.map((asset) => (
              <AssetTile
                key={asset.id}
                asset={asset}
                copied={copiedId === asset.id}
                onCopy={() => copyPrompt(asset)}
                onDelete={() => persist(assets.filter((item) => item.id !== asset.id))}
                onEdit={() => setEditing(asset)}
                onUsage={() => setUsageAsset(asset)}
                onToggleFavorite={() => persist(assets.map((item) => (item.id === asset.id ? { ...item, favorite: !item.favorite } : item)))}
                onToggleUsed={() => persist(assets.map((item) => (item.id === asset.id ? { ...item, used: !item.used } : item)))}
              />
            ))}
          </div>
        )}
      </div>

      {editing && <AssetEditor asset={editing} onClose={() => setEditing(null)} onSave={saveAsset} />}
      {usageAsset && <UsageDialog asset={usageAsset} onClose={() => setUsageAsset(null)} onSave={(record) => addUsage(usageAsset, record)} />}
    </div>
  );
}

function BatchImportPanel({ onImport }: { onImport: (files: File[], meta: BatchMeta) => Promise<{ ok: number; failed: number; error?: string } | undefined> }) {
  const [meta, setMeta] = useState<BatchMeta>({ category: "character", gender: "male", roleType: "lead", era: "modern" });
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(list: FileList | File[]) {
    const files = Array.from(list);
    if (files.length === 0) return;
    setImporting(true);
    setResult("");
    try {
      const next = await onImport(files, meta);
      if (next) {
        setResult(`已导入 ${next.ok} 张${next.failed ? `，失败 ${next.failed} 张${next.error ? `：${next.error}` : ""}` : ""}`);
      }
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mb-4 rounded-lg border border-white/[0.08] bg-[#07120f]/88 p-3 shadow-2xl backdrop-blur-xl">
      <div className="mb-3 flex flex-wrap gap-2">
        <Select value={meta.category} onChange={(value) => setMeta({ ...meta, category: value as AssetCategory })}>
          <option value="character">人物</option>
          <option value="scene">场景</option>
          <option value="outfit">服装</option>
          <option value="prop">道具</option>
          <option value="reference">参考</option>
        </Select>
        {(meta.category === "character" || meta.category === "outfit") && (
          <Select value={meta.gender} onChange={(value) => setMeta({ ...meta, gender: value as Gender })}>
            <option value="male">{meta.category === "outfit" ? "男装" : "男性"}</option>
            <option value="female">{meta.category === "outfit" ? "女装" : "女性"}</option>
          </Select>
        )}
        {meta.category === "character" && (
          <Select value={meta.roleType} onChange={(value) => setMeta({ ...meta, roleType: value as RoleType })}>
            <option value="lead">主角</option>
            <option value="villain">反派</option>
          </Select>
        )}
        {meta.category === "outfit" && (
          <Select value={meta.era} onChange={(value) => setMeta({ ...meta, era: value as OutfitEra })}>
            <option value="modern">现代</option>
            <option value="medieval">中世纪</option>
          </Select>
        )}
        <div className="flex items-center rounded-md border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white/55">
          自动命名：{prefixFor(meta)}001
        </div>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          handleFiles(event.dataTransfer.files);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        className={`flex min-h-24 w-full items-center justify-center rounded-lg border border-dashed px-4 py-4 text-center transition-all ${
          dragOver ? "border-white/35 bg-white/[0.08]" : "border-white/[0.12] bg-white/[0.035] hover:border-white/25 hover:bg-white/[0.06]"
        }`}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => event.target.files && handleFiles(event.target.files)} />
        <div className="flex flex-col items-center gap-2">
          {importing ? <Loader2 className="h-6 w-6 animate-spin text-white/55" /> : <UploadCloud className="h-6 w-6 text-white/45" />}
          <div className="text-sm font-medium text-white/70">{importing ? "正在导入..." : "批量拖入图片，或点击选择文件"}</div>
          <div className="text-xs text-white/35">{result || "整批图片会使用上方同一组分类"}</div>
        </div>
      </button>
    </div>
  );
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-2 text-sm transition-all ${
        active ? "border-white/20 bg-white/[0.12] text-white" : "border-white/[0.08] bg-white/[0.04] text-white/50 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function Select({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-md border border-white/[0.08] bg-[#10201a] px-3 py-2 text-sm text-white outline-none focus:border-white/20"
    >
      {children}
    </select>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/[0.08] bg-white/[0.05] px-3 py-2">
      <div className="text-xs text-white/35">{label}</div>
      <div className="text-lg font-semibold leading-tight text-white">{value}</div>
    </div>
  );
}

function AssetTile({
  asset,
  copied,
  onCopy,
  onDelete,
  onEdit,
  onUsage,
  onToggleFavorite,
  onToggleUsed,
}: {
  asset: LibraryAsset;
  copied: boolean;
  onCopy: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onUsage: () => void;
  onToggleFavorite: () => void;
  onToggleUsed: () => void;
}) {
  return (
    <article className="group relative aspect-[3/4] overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.035] shadow-lg transition-all hover:border-white/[0.20]">
      {asset.imageUrl ? (
        <img src={asset.imageUrl} alt={asset.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.035]" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-white/25">
          <ImagePlus className="h-8 w-8" />
          <span className="text-xs">未添加图片</span>
        </div>
      )}

      <div className="pointer-events-none absolute left-2 top-2 flex gap-1.5">
        {asset.used && (
          <span className="rounded-full bg-emerald-400/90 p-1 text-[#07120f] shadow">
            <Check className="h-3.5 w-3.5" />
          </span>
        )}
        {asset.favorite && (
          <span className="rounded-full bg-amber-300/90 p-1 text-[#07120f] shadow">
            <Heart className="h-3.5 w-3.5 fill-current" />
          </span>
        )}
      </div>

      <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/70 via-black/10 to-black/80 p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
        <div className="flex justify-end gap-1.5">
          <IconButton title={asset.used ? "取消已用" : "标记已用"} onClick={onToggleUsed}>
            {asset.used ? <CheckCircle2 className="h-4 w-4 text-emerald-200" /> : <Check className="h-4 w-4" />}
          </IconButton>
          <IconButton title={asset.favorite ? "取消收藏" : "收藏"} onClick={onToggleFavorite}>
            <Heart className={`h-4 w-4 ${asset.favorite ? "fill-current text-amber-200" : ""}`} />
          </IconButton>
          <IconButton title="复制提示词" onClick={onCopy}>
            {copied ? <Check className="h-4 w-4 text-emerald-200" /> : <Copy className="h-4 w-4" />}
          </IconButton>
          <IconButton title="编辑" onClick={onEdit}>
            <Edit3 className="h-4 w-4" />
          </IconButton>
          <IconButton title="删除" onClick={onDelete} danger>
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>

        <div>
          <div className="truncate text-sm font-semibold text-white">{asset.name}</div>
          <button
            type="button"
            onClick={onUsage}
            className="mt-2 w-full rounded-md border border-white/[0.14] bg-white/[0.12] px-2 py-1.5 text-left text-xs text-white/80 transition-all hover:bg-white/[0.18] hover:text-white"
          >
            {asset.usages.length > 0 ? `${asset.usages[0].projectName} · ${asset.usages[0].role}` : "记录用途"}
          </button>
        </div>
      </div>
    </article>
  );
}

function IconButton({ title, onClick, danger, children }: { title: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-md border border-white/[0.12] bg-black/45 p-1.5 text-white/75 backdrop-blur transition-all hover:bg-white/[0.16] hover:text-white ${
        danger ? "hover:border-red-300/40 hover:text-red-200" : ""
      }`}
    >
      {children}
    </button>
  );
}

function AssetEditor({ asset, onClose, onSave }: { asset: LibraryAsset; onClose: () => void; onSave: (asset: LibraryAsset) => void }) {
  const [draft, setDraft] = useState(asset);
  const [tagText, setTagText] = useState(asset.tags.join(" "));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploadError("");
    if (file.size > MAX_UPLOAD_SIZE) {
      setUploadError("图片太大，请先压缩到 4MB 以内。");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.detail || result.error || "上传失败");
      }
      setDraft((value) => ({ ...value, imageUrl: result.path }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    onSave({ ...draft, name: draft.name.trim(), tags: splitTags(tagText) });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-xl">
      <div className="max-h-full w-full max-w-3xl overflow-auto rounded-lg border border-white/[0.10] bg-[#07120f] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.08] bg-[#07120f]/95 px-5 py-4 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">{asset.name ? "编辑资产" : "新增资产"}</h2>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-white/45 transition-all hover:bg-white/[0.08] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex aspect-[3/4] w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-white/[0.12] bg-white/[0.04] text-white/40 transition-all hover:border-white/25 hover:text-white"
            >
              {draft.imageUrl ? <img src={draft.imageUrl} alt="" className="h-full w-full object-cover" /> : uploading ? <span className="text-sm">上传中...</span> : <><UploadCloud className="mb-2 h-6 w-6" /><span className="text-sm">上传图片</span></>}
            </button>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} />
            {uploadError && <p className="mt-2 rounded-md border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs text-red-100">{uploadError}</p>}
            <input
              value={draft.imageUrl}
              onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })}
              placeholder="也可以粘贴图片链接"
              className="mt-3 w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
            />
          </div>

          <div className="flex flex-col gap-3">
            <input
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              placeholder="留空则自动编号"
              className="rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
            />
            <Select value={draft.category} onChange={(value) => setDraft({ ...draft, category: value as AssetCategory })}>
              <option value="character">人物</option>
              <option value="scene">场景</option>
              <option value="outfit">服装</option>
              <option value="prop">道具</option>
              <option value="reference">参考</option>
            </Select>
            {(draft.category === "character" || draft.category === "outfit") && (
              <Select value={draft.gender || "male"} onChange={(value) => setDraft({ ...draft, gender: value as Gender })}>
                <option value="male">{draft.category === "outfit" ? "男装" : "男性"}</option>
                <option value="female">{draft.category === "outfit" ? "女装" : "女性"}</option>
              </Select>
            )}
            {draft.category === "character" && (
              <Select value={draft.roleType || "lead"} onChange={(value) => setDraft({ ...draft, roleType: value as RoleType })}>
                <option value="lead">主角</option>
                <option value="villain">反派</option>
              </Select>
            )}
            {draft.category === "outfit" && (
              <Select value={draft.era || "modern"} onChange={(value) => setDraft({ ...draft, era: value as OutfitEra })}>
                <option value="modern">现代</option>
                <option value="medieval">中世纪</option>
              </Select>
            )}
            <textarea
              value={draft.prompt}
              onChange={(event) => setDraft({ ...draft, prompt: event.target.value })}
              placeholder="生图提示词，可用于复制复用"
              rows={4}
              className="resize-none rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 font-mono text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
            />
            <input
              value={tagText}
              onChange={(event) => setTagText(event.target.value)}
              placeholder="标签，用空格或逗号分隔"
              className="rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
            />
            <textarea
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              placeholder="备注，可留空；不会显示在图片墙下方"
              rows={2}
              className="resize-none rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
            />
            <label className="inline-flex items-center gap-2 text-sm text-white/60">
              <input type="checkbox" checked={draft.favorite} onChange={(event) => setDraft({ ...draft, favorite: event.target.checked })} className="h-4 w-4 accent-white" />
              收藏
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-white/[0.08] px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm text-white/55 transition-all hover:bg-white/[0.08] hover:text-white">
            取消
          </button>
          <button type="button" onClick={submit} className="rounded-md bg-white/[0.12] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/[0.18]">
            保存资产
          </button>
        </div>
      </div>
    </div>
  );
}

function UsageDialog({ asset, onClose, onSave }: { asset: LibraryAsset; onClose: () => void; onSave: (record: UsageRecord) => void }) {
  const [projectName, setProjectName] = useState("");
  const [role, setRole] = useState("");
  const [note, setNote] = useState("");

  function submit() {
    if (!projectName.trim() || !role.trim()) return;
    onSave({
      id: makeId("usage"),
      projectName: projectName.trim(),
      role: role.trim(),
      note: note.trim(),
      usedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-xl">
      <div className="w-full max-w-lg rounded-lg border border-white/[0.10] bg-[#07120f] p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">记录用途</h2>
            <p className="mt-1 text-sm text-white/45">{asset.name}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-white/45 transition-all hover:bg-white/[0.08] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="剧本/项目名" className="rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20" />
          <input value={role} onChange={(event) => setRole(event.target.value)} placeholder="拿去做什么，比如男主、女主、第三幕街景" className="rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20" />
          <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="备注，可写第几集、第几场、改了哪些设定" rows={3} className="resize-none rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20" />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm text-white/55 transition-all hover:bg-white/[0.08] hover:text-white">
            取消
          </button>
          <button type="button" onClick={submit} disabled={!projectName.trim() || !role.trim()} className="rounded-md bg-white/[0.12] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/[0.18] disabled:opacity-35">
            保存用途
          </button>
        </div>
      </div>
    </div>
  );
}
