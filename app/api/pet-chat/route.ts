import { NextResponse } from "next/server";

type PetChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function getApiConfig() {
  // 优先从环境变量读取
  let apiKey = (process.env.DEEPSEEK_API_KEY || "").trim();
  let baseURL = (process.env.DEEPSEEK_BASE_URL || "").trim() || "https://api.deepseek.com/v1";

  // 如果环境变量是占位符，用本地配置文件兜底（仅开发环境）
  if ((!apiKey || apiKey.includes("你的DeepSeek") || apiKey.toLowerCase().includes("your_")) && typeof process !== "undefined") {
    try {
      const fs = require("fs");
      const path = require("path");
      const configPath = path.join(process.cwd(), "content", "api-config.json");
      if (fs.existsSync(configPath)) {
        const cfg = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        if (typeof cfg.apiKey === "string" && cfg.apiKey.trim() && !cfg.apiKey.includes("你的")) {
          apiKey = cfg.apiKey.trim();
        }
        if (typeof cfg.baseURL === "string" && cfg.baseURL.trim()) {
          baseURL = cfg.baseURL.trim();
        }
      }
    } catch {}
  }

  return { apiKey, baseURL };
}

function looksLikePlaceholder(key: string) {
  return !key || key.includes("你的") || key.toLowerCase().includes("your_");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userMessage = typeof body.message === "string" ? body.message.trim() : "";
    const history = Array.isArray(body.history) ? (body.history as PetChatMessage[]) : [];

    if (!userMessage) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const { apiKey, baseURL } = getApiConfig();
    if (looksLikePlaceholder(apiKey)) {
      return NextResponse.json(
        { error: "API key is not configured. Please set DEEPSEEK_API_KEY in Vercel environment variables." },
        { status: 500 },
      );
    }

    // 用 fetch 直接调 DeepSeek，避免依赖 openai SDK 版本问题
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.PET_CHAT_MODEL || "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "You are a tiny blue-haired wizard pixel pet living on the user's personal website. Reply in Simplified Chinese. Keep replies warm, short, playful, and useful. If the user asks for coding help, explain in beginner-friendly steps.",
          },
          ...history
            .filter((msg) => msg && (msg.role === "user" || msg.role === "assistant") && typeof msg.content === "string")
            .slice(-8),
          { role: "user", content: userMessage },
        ],
        max_tokens: 500,
        temperature: 0.8,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("DeepSeek API error:", response.status, errText);
      return NextResponse.json({ error: `DeepSeek API error: ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ error: "The pet did not reply." }, { status: 500 });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Pet chat failed:", error);
    return NextResponse.json({ error: "Pet chat failed. Please try again later." }, { status: 500 });
  }
}
