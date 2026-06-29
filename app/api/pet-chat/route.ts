import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

type PetChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function readApiConfig() {
  const configPath = path.join(process.cwd(), "content", "api-config.json");
  let apiKey = "";
  let baseURL = "https://api.deepseek.com/v1";

  if (fs.existsSync(configPath)) {
    const cfg = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    apiKey = typeof cfg.apiKey === "string" ? cfg.apiKey.trim() : "";
    baseURL = typeof cfg.baseURL === "string" && cfg.baseURL.trim() ? cfg.baseURL.trim() : baseURL;
  }

  if (!apiKey && process.env.DEEPSEEK_API_KEY) {
    apiKey = process.env.DEEPSEEK_API_KEY.trim();
  }

  if (process.env.DEEPSEEK_BASE_URL) {
    baseURL = process.env.DEEPSEEK_BASE_URL.trim();
  }

  return { apiKey, baseURL };
}

function looksLikePlaceholder(apiKey: string) {
  return !apiKey || apiKey.includes("DeepSeek_API") || apiKey.toLowerCase().includes("your_");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userMessage = typeof body.message === "string" ? body.message.trim() : "";
    const history = Array.isArray(body.history) ? (body.history as PetChatMessage[]) : [];

    if (!userMessage) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const { apiKey, baseURL } = readApiConfig();
    if (looksLikePlaceholder(apiKey)) {
      return NextResponse.json(
        { error: "API key is not configured. Please set DEEPSEEK_API_KEY in .env.local." },
        { status: 500 },
      );
    }

    const client = new OpenAI({ apiKey, baseURL });
    const recentHistory = history
      .filter((msg) => msg && (msg.role === "user" || msg.role === "assistant") && typeof msg.content === "string")
      .slice(-8);

    const completion = await client.chat.completions.create({
      model: process.env.PET_CHAT_MODEL || "deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "You are a tiny blue-haired wizard pixel pet living on the user's personal website. Reply in Simplified Chinese. Keep replies warm, short, playful, and useful. If the user asks for coding help, explain in beginner-friendly steps.",
        },
        ...recentHistory,
        { role: "user", content: userMessage },
      ],
      max_tokens: 500,
      temperature: 0.8,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ error: "The pet did not reply." }, { status: 500 });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Pet chat failed:", error);
    return NextResponse.json({ error: "Pet chat failed. Please try again later." }, { status: 500 });
  }
}
