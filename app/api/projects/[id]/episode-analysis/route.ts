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
    const { script } = await request.json();

    if (!script || script.trim().length < 100) {
      return NextResponse.json({ error: "剧本内容太少" }, { status: 400 });
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

    const client = new OpenAI({ apiKey, baseURL });

    const systemPrompt = `你是一个专业的短剧剧本分析师，服务于 AI 短剧制作流程。阅读完整英文/中文剧本，自动识别集数分集，逐集输出详细分析。

请按以下 JSON 格式输出（严格 JSON，不要其他内容）：
{
  "episodes": [
    {
      "epNumber": 1,
      "title": "本集标题",
      "translationSummary": "中文翻译/剧情复述（300-500字）：准确翻译人物关系、事件、关键对白和反转信息",
      "oneLiner": "一句话概括本集核心事件",
      "emotionCurve": "情绪曲线描述，如：压抑 → 羞辱 → 爆发 → 反转 → 悬念",
      "characterEmotions": [
        { "role": "女主", "name": "角色名", "emotion": "本集情绪状态和变化" },
        { "role": "男主", "name": "角色名", "emotion": "本集情绪状态和变化" },
        { "role": "反派", "name": "角色名", "emotion": "本集情绪状态和变化" },
        { "role": "重要配角", "name": "角色名", "emotion": "本集情绪状态和变化" }
      ],
      "sceneTiers": [
        { "tier": "S", "scene": "桥段描述", "reason": "为什么是S级——决定点击/留存/情绪爆点" },
        { "tier": "A", "scene": "桥段描述", "reason": "推动剧情，画面清楚即可" },
        { "tier": "B", "scene": "桥段描述", "reason": "过渡信息，快速处理" }
      ],
      "keyShots": ["必须做好的关键镜头1", "镜头2", "镜头3"],
      "assetNeeds": {
        "characters": ["出场角色列表"],
        "costumes": ["需要的服装"],
        "scenes": ["场景地点"],
        "props": ["道具物品"]
      },
      "endHook": "本集结尾悬念——应该突出什么让观众点下一集"
    }
  ],
  "overall": {
    "seriesTitle": "全剧标题",
    "mainPlot": "全剧主线概括",
    "coreEmotion": "全剧核心情绪",
    "characterRelationships": "人物关系总结",
    "mainConflicts": "主要冲突列表",
    "recurringScenes": "反复出现的重要桥段",
    "highFrequencyAssets": "高频资产需求（经常出现的角色/场景/服装/道具）",
    "totalEpisodes": 总集数
  }
}

分析要求：
- 如果是英文剧本，翻译成中文复述时保留关键英文对白
- 自动识别剧本中的集数分界（如 Episode 1, Chapter 1, 第一集 等标记）
- 如果剧本没有明确分集，根据长度和剧情节点自动划分（每集约800-1500字）
- S级桥段：情绪爆点、反转、虐点、甜点、悬念揭晓——需要精修
- A级桥段：推动剧情的关键事件——画面清楚即可
- B级桥段：过渡、铺垫、日常——快速处理
- 每集列出3-5个最需要重点制作的画面
- 资产需求要具体：角色名、服装类型、场景描述、道具名称`;

    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: script.trim() },
      ],
      response_format: { type: "json_object" },
      max_tokens: 32768,
      temperature: 0.5,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "AI 未返回内容" }, { status: 500 });
    }

    let result: any;
    try {
      result = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: "AI 返回格式异常" }, { status: 500 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    console.error("集数分析失败:", err);
    if (err instanceof OpenAI.APIError) {
      if (err.status === 401) return NextResponse.json({ error: "API Key 无效" }, { status: 500 });
      if (err.status === 429) return NextResponse.json({ error: "调用频率过高" }, { status: 500 });
    }
    return NextResponse.json({ error: "分析失败，请稍后重试" }, { status: 500 });
  }
}
