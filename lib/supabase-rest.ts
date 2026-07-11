const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || "asset-images";
const storageSetupHint = `Supabase 存储桶 ${storageBucket} 不存在，且当前 Key 无权自动创建。请在 Supabase Storage 新建 Public bucket，Bucket ID 必须是 ${storageBucket}；或者在 Vercel 把 SUPABASE_SERVICE_ROLE_KEY 换成 Supabase 的 Secret key。`;

type NoteRow = {
  id: string;
  text: string;
  done: boolean;
  created_at: string;
};

export type CloudNote = {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
};

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseServiceKey);
}

function getHeaders(extra?: HeadersInit): HeadersInit {
  if (!supabaseServiceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return {
    apikey: supabaseServiceKey,
    Authorization: `Bearer ${supabaseServiceKey}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function requestSupabase<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!supabaseUrl) throw new Error("Missing SUPABASE_URL");
  const response = await fetch(`${supabaseUrl}/rest/v1${path}`, {
    ...init,
    headers: getHeaders(init.headers),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase request failed ${response.status}: ${detail.slice(0, 200)}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function requestSupabaseRaw(path: string, init: RequestInit = {}) {
  if (!supabaseUrl) throw new Error("Missing SUPABASE_URL");
  return fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: getHeaders(init.headers),
    cache: "no-store",
  });
}

function toNote(row: NoteRow): CloudNote {
  return {
    id: row.id,
    text: row.text,
    done: row.done,
    createdAt: row.created_at,
  };
}

export async function getCloudNotes(): Promise<CloudNote[]> {
  const rows = await requestSupabase<NoteRow[]>("/notes?select=*&order=created_at.desc");
  return rows.map(toNote);
}

export async function createCloudNote(text: string): Promise<CloudNote> {
  const id = `note_${Date.now().toString(36)}`;
  const [row] = await requestSupabase<NoteRow[]>("/notes", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      id,
      text,
      done: false,
      created_at: new Date().toISOString(),
    }),
  });
  return toNote(row);
}

export async function updateCloudNote(id: string, updates: Partial<Pick<CloudNote, "text" | "done">>): Promise<CloudNote> {
  const payload: Partial<NoteRow> = {};
  if (typeof updates.text === "string") payload.text = updates.text;
  if (typeof updates.done === "boolean") payload.done = updates.done;

  const [row] = await requestSupabase<NoteRow[]>(`/notes?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  return toNote(row);
}

export async function deleteCloudNote(id: string): Promise<void> {
  await requestSupabase<void>(`/notes?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function getCloudAssetLibrary<T>(): Promise<T[] | null> {
  const rows = await requestSupabase<Array<{ data: T[] }>>("/app_state?key=eq.asset_library&select=data&limit=1");
  return Array.isArray(rows[0]?.data) ? rows[0].data : null;
}

export async function saveCloudAssetLibrary<T>(assets: T[]): Promise<void> {
  await requestSupabase<void>("/app_state", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      key: "asset_library",
      data: assets,
      updated_at: new Date().toISOString(),
    }),
  });
}

function safeObjectName(name: string) {
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")).toLowerCase() : "";
  const base = name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return `${base || "upload"}-${Date.now().toString(36)}${ext}`;
}

async function ensureStorageBucket() {
  const existing = await requestSupabaseRaw(`/storage/v1/bucket/${storageBucket}`);
  if (existing.ok) return;
  const existingDetail = await existing.text().catch(() => "");
  const bucketMissing = existing.status === 404 || /bucket not found/i.test(existingDetail);
  if (!bucketMissing) {
    throw new Error(`Supabase bucket check failed ${existing.status}: ${existingDetail.slice(0, 200)}`);
  }

  const response = await requestSupabaseRaw("/storage/v1/bucket", {
    method: "POST",
    body: JSON.stringify({
      id: storageBucket,
      name: storageBucket,
      public: true,
    }),
  });

  if (response.ok || response.status === 409) return;

  const detail = await response.text().catch(() => "");
  if (response.status === 401 || response.status === 403 || /unauthorized|row-level security/i.test(detail)) {
    throw new Error(storageSetupHint);
  }
  throw new Error(`Failed to create Supabase bucket ${response.status}: ${detail.slice(0, 200)}`);
}

export async function uploadCloudFile(file: File) {
  await ensureStorageBucket();

  const objectName = safeObjectName(file.name);
  const objectPath = `uploads/${objectName}`;
  const response = await requestSupabaseRaw(`/storage/v1/object/${storageBucket}/${objectPath}`, {
    method: "POST",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "false",
    },
    body: Buffer.from(await file.arrayBuffer()),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase upload failed ${response.status}: ${detail.slice(0, 200)}`);
  }

  return {
    filename: objectName,
    path: `${supabaseUrl}/storage/v1/object/public/${storageBucket}/${objectPath}`,
  };
}
