import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

export const maxDuration = 60;

// 步骤1：扫描剧本，识别分集
async function scanEpisodes(script: string, client: OpenAI) {
  const systemPrompt = `你是一个剧本分析助手。快速扫描剧本，只输出分集信息。

输出 JSON：
{
  "totalEpisodes": 总集数,
  "episodes": [
    { "epNumber": 1, "title": "可从剧本提取或留空", "approxLength": "约xxx字" }
  ],
  "warnings": ["格式异常提示，如第3集缺少标记等"]
}

如果剧本没有明确分集标记（Episode X, Chapter X, 第X集等），根据长度每800-1500字划一集。
只输出 JSON，不要其他内容。`;

  const completion = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: script.slice(0, 5000) + (script.length > 5000 ? `\n\n...（完整剧本共${script.length}字）` : "") },
    ],
    response_format: { type: "json_object" },
    max_tokens: 2048,
    temperature: 0.3,
  });

  return JSON.parse(completion.choices[0]?.message?.content || "{}");
}

// 步骤2：批量分析指定集数（1-3集）
async function analyzeEpisodes(script: string, epNumbers: number[], client: OpenAI) {
  const epList = epNumbers.join("、第");

  const systemPrompt = `你是短剧剧本分析师。分析剧本的第${epList}集。每集输出精简格式。

输出 JSON：
{
  "episodes": [
    {
      "epNumber": 集号,
      "summary": "中文剧情复述（300字以内，准确翻译关键对白和反转）",
      "oneLiner": "一句话核心事件",
      "emotionCurve": "情绪曲线，5个以内节点，如：压抑→羞辱→爆发→反转→悬念",
      "characterEmotions": [
        { "role": "女主", "name": "角色名", "emotion": "1-2句情绪状态和变化" }
      ],
      "sTier": [{ "scene": "S级桥段", "reason": "点击/留存/情绪爆点" }],
      "aTier": [{ "scene": "A级桥段", "reason": "推动剧情" }],
      "keyShots": ["重点镜头1", "最多5个"],
      "assetNeeds": { "characters": [], "costumes": [], "scenes": [], "props": [] },
      "endHook": "1句话结尾悬念"
    }
  ]
}

限制：
- S级桥段最多3个，A级最多5个
- 关键镜头最多5个
- 每集summary控制在300字以内
- 不要重复输出剧本原文
- 只输出 JSON`;

  // 提取相关剧本章节
  const sections = extractEpisodeSections(script, epNumbers);

  const completion = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `完整剧本前2000字（了解背景）：\n${script.slice(0, 2000)}\n\n需要分析的集数章节：\n${sections}` },
    ],
    response_format: { type: "json_object" },
    max_tokens: 8192,
    temperature: 0.5,
  });

  return JSON.parse(completion.choices[0]?.message?.content || "{}");
}

// 步骤3：基于已分析结果生成全剧总结
async function generateSummary(allEpisodes: any[], client: OpenAI) {
  const episodesSummary = allEpisodes.map((ep: any) =>
    `第${ep.epNumber}集「${ep.title || ""}」: ${ep.oneLiner || ep.summary?.slice(0, 50) || ""}`
  ).join("\n");

  const systemPrompt = `基于已有分集分析，总结全剧。

输出 JSON：
{
  "overall": {
    "seriesTitle": "全剧标题",
    "mainPlot": "主线概括",
    "coreEmotion": "核心情绪",
    "characterRelationships": "人物关系总结",
    "mainConflicts": ["冲突1", "冲突2"],
    "recurringScenes": ["高频桥段"],
    "highFrequencyAssets": "高频角色/场景/服装/道具",
    "totalEpisodes": 总集数
  }
}
只输出 JSON。`;

  const completion = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `已分析的各集概要：\n${episodesSummary}\n\n请总结全剧。` },
    ],
    response_format: { type: "json_object" },
    max_tokens: 4096,
    temperature: 0.5,
  });

  return JSON.parse(completion.choices[0]?.message?.content || "{}");
}

// 辅助：从剧本中提取指定集数的章节
function extractEpisodeSections(script: string, epNumbers: number[]): string {
  // 尝试按 "Episode X" "Chapter X" "第X集" 等标记分割
  const markers = /(?:Episode|Chapter|EP|CH)\s*\d+|第\s*\d+\s*[集章节回]/gi;
  const parts = script.split(markers);

  if (parts.length <= 1) {
    // 没有明确标记，按比例取
    const total = script.length;
    const perEp = Math.floor(total / Math.max(...epNumbers, 10));
    return epNumbers.map(n => {
      const start = (n - 1) * perEp;
      return `\n--- 第${n}集（约） ---\n${script.slice(start, start + perEp * 2)}`;
    }).join("\n");
  }

  return epNumbers.map(n => `\n--- 第${n}集 ---\n见完整剧本`).join("\n");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action, script, epNumbers, allEpisodes } = await request.json();

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

    const client = new OpenAI({ apiKey, baseURL });

    // 步骤1：扫描分集
    if (action === "scan") {
      if (!script || script.trim().length < 100) {
        return NextResponse.json({ error: "剧本内容太少" }, { status: 400 });
      }
      const result = await scanEpisodes(script.trim(), client);
      return NextResponse.json({ success: true, ...result });
    }

    // 步骤2：批量分析指定集数
    if (action === "analyze") {
      if (!epNumbers?.length || epNumbers.length > 3) {
        return NextResponse.json({ error: "请指定1-3集" }, { status: 400 });
      }
      const result = await analyzeEpisodes(script.trim(), epNumbers, client);
      return NextResponse.json({ success: true, ...result });
    }

    // 步骤3：全剧总结
    if (action === "summary") {
      if (!allEpisodes?.length) {
        return NextResponse.json({ error: "需要已分析的各集数据" }, { status: 400 });
      }
      const result = await generateSummary(allEpisodes, client);
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch (err: unknown) {
    console.error("分析失败:", err);
    if (err instanceof OpenAI.APIError) {
      if (err.status === 401) return NextResponse.json({ error: "API Key 无效" }, { status: 500 });
      if (err.status === 429) return NextResponse.json({ error: "调用频率过高" }, { status: 500 });
    }
    return NextResponse.json({ error: "分析失败，请稍后重试" }, { status: 500 });
  }
}
