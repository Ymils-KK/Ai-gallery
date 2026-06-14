import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const configPath = path.join(process.cwd(), "content", "api-config.json");

const defaultConfig = {
  apiKey: "",
  baseURL: "https://api.deepseek.com/v1",
};

export async function GET() {
  try {
    if (!fs.existsSync(configPath)) {
      return NextResponse.json(defaultConfig);
    }
    const raw = fs.readFileSync(configPath, "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "读取配置失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const config = {
      apiKey: typeof body.apiKey === "string" ? body.apiKey.trim() : "",
      baseURL:
        typeof body.baseURL === "string" && body.baseURL.trim()
          ? body.baseURL.trim()
          : defaultConfig.baseURL,
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "保存配置失败" }, { status: 500 });
  }
}
