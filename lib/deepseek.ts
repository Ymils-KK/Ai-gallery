/**
 * DeepSeek API 共享工具函数
 * 使用 fetch 直接调用，避免依赖 openai SDK 版本问题
 */

import fs from "fs";
import path from "path";

function getApiConfig(): { apiKey: string; baseURL: string } {
  let apiKey = (process.env.DEEPSEEK_API_KEY || "").trim();
  let baseURL = (process.env.DEEPSEEK_BASE_URL || "").trim() || "https://api.deepseek.com/v1";

  // 如果环境变量是占位符，用本地配置文件兜底
  if ((!apiKey || apiKey.includes("你的") || apiKey.toLowerCase().includes("your_")) && typeof process !== "undefined") {
    try {
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
    } catch {
      // 读取失败时静默忽略
    }
  }

  return { apiKey, baseURL };
}

interface DeepSeekChatOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  responseFormat?: "json_object" | "text";
  timeoutMs?: number;
}

/**
 * 调用 DeepSeek chat completion，返回原始文本内容
 */
export async function deepseekChat(
  messages: { role: string; content: string }[],
  options: DeepSeekChatOptions = {}
): Promise<string> {
  const { apiKey, baseURL } = getApiConfig();
  if (!apiKey || apiKey.includes("你的")) {
    throw new Error("请先在管理后台配置 API Key");
  }

  const body: Record<string, unknown> = {
    model: options.model || "deepseek-chat",
    messages,
    max_tokens: options.maxTokens || 4096,
    temperature: options.temperature ?? 0.7,
  };

  if (options.responseFormat === "json_object") {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(options.timeoutMs || 120000),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 401) throw new Error("API Key 无效，请检查管理后台中的 API Key");
    if (response.status === 429) throw new Error("API 调用频率过高，请稍后再试");
    throw new Error(`DeepSeek API error ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

/**
 * 调用 DeepSeek chat completion，返回解析后的 JSON 对象
 */
export async function deepseekChatJSON<T = Record<string, unknown>>(
  messages: { role: string; content: string }[],
  options: DeepSeekChatOptions = {}
): Promise<T> {
  const text = await deepseekChat(messages, {
    ...options,
    responseFormat: "json_object",
  });
  return JSON.parse(text) as T;
}

/**
 * 检查 API Key 是否已配置
 */
export function hasApiKey(): boolean {
  const { apiKey } = getApiConfig();
  return !!apiKey && !apiKey.includes("你的") && !apiKey.toLowerCase().includes("your_");
}

export { getApiConfig };
