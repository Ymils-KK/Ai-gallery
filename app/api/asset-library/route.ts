import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getCloudAssetLibrary, isSupabaseConfigured, saveCloudAssetLibrary } from "@/lib/supabase-rest";

const dataPath = path.join(process.cwd(), "content", "asset-library.json");

function ensureFile() {
  const dir = path.dirname(dataPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, "[]", "utf-8");
}

function readLocalAssets() {
  ensureFile();
  return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
}

function writeLocalAssets(assets: unknown[]) {
  ensureFile();
  fs.writeFileSync(dataPath, JSON.stringify(assets, null, 2), "utf-8");
}

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const assets = await getCloudAssetLibrary<unknown>();
      if (assets) return NextResponse.json(assets);
    }
    return NextResponse.json(readLocalAssets());
  } catch {
    try {
      return NextResponse.json(readLocalAssets());
    } catch {
      return NextResponse.json({ error: "读取资产仓库失败" }, { status: 500 });
    }
  }
}

export async function PUT(request: Request) {
  try {
    const assets = await request.json();
    if (!Array.isArray(assets)) {
      return NextResponse.json({ error: "资产数据格式不正确" }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      await saveCloudAssetLibrary(assets);
      return NextResponse.json({ success: true, storage: "supabase" });
    }

    writeLocalAssets(assets);
    return NextResponse.json({ success: true, storage: "file" });
  } catch {
    return NextResponse.json({ error: "保存资产仓库失败" }, { status: 500 });
  }
}
