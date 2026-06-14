import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { assetName, assetType, currentPrompt, userMessage, history } = await request.json();

    if (!userMessage || !currentPrompt) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 读取 API 配置
    const configPath = path.join(process.cwd(), "content", "api-config.json");
    let apiKey = "";
    let baseURL = "https://api.deepseek.com/v1";
    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      apiKey = cfg.apiKey || "";
      baseURL = cfg.baseURL || baseURL;
    }
    if (!apiKey && process.env.DEEPSEEK_API_KEY) apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "请先配置 API Key" }, { status: 500 });
    }

    // 读取项目上下文
    let projectContext = "";
    const projectPath = path.join(process.cwd(), "content", "projects", `${id}.json`);
    if (fs.existsSync(projectPath)) {
      const project = JSON.parse(fs.readFileSync(projectPath, "utf-8"));
      projectContext = `剧本简介：${project.synopsis || "无"}`;
    }

    const client = new OpenAI({ apiKey, baseURL });

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `你是一个 AI 图像生成提示词修改助手。根据用户的要求修改提示词，保持提示词的专业性和详细度。
项目背景：${projectContext}
当前资产的类别：${assetType || "未知"}，名称：${assetName || "未知"}

规则：
- 只输出修改后的完整提示词文本，不要加任何解释或标记
- 保持原有风格标签不变
- 根据用户要求精确调整描述
- 提示词使用英文`,
      },
    ];

    // 加入历史对话
    if (Array.isArray(history)) {
      for (const msg of history.slice(-6)) {
        messages.push(msg);
      }
    }

    // 加入当前请求
    messages.push({
      role: "user",
      content: `当前提示词：\n${currentPrompt}\n\n修改要求：${userMessage}`,
    });

    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages,
      max_tokens: 1024,
      temperature: 0.6,
    });

    const newPrompt = completion.choices[0]?.message?.content?.trim() || currentPrompt;

    return NextResponse.json({ success: true, prompt: newPrompt });
  } catch (err: unknown) {
    console.error("对话修改失败:", err);
    return NextResponse.json({ error: "修改失败，请稍后重试" }, { status: 500 });
  }
}
