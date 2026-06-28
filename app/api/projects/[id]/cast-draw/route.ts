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
    const { characterName, characterDescription, style, era } = await request.json();

    if (!characterName) {
      return NextResponse.json({ error: "请选择角色" }, { status: 400 });
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
      projectContext = project.synopsis || "";
    }

    const eraLabels: Record<string, string> = {
      any: "", modern: "现代", medieval: "中世纪", ancient_east: "古代东方",
      victorian: "维多利亚", fantasy: "奇幻", cyberpunk: "赛博朋克",
    };

    const client = new OpenAI({ apiKey, baseURL });

    const systemPrompt = `你是一个顶尖的影视选角导演和 AI 图像生成提示词专家。为角色「${characterName}」生成一个 2×2 选角联系人表（casting contact sheet）的生图提示词。

剧本背景：${projectContext || "未提供"}
角色描述：${characterDescription || "未提供"}
${era ? `时代背景：${eraLabels[era] || era}` : ""}
${style ? `画风：${style}` : ""}

严格按以下格式生成 imagePrompt（英文）和 imagePromptCn（中文）：

布局要求：
- 横向 16:9，2×2 网格，白色细线分隔
- 四个格分别放四位 18-22 岁绝美白人女性，每人只占一格，adult woman
- 顺序：左上B1、右上B2、左下B3、右下B4
- 图内不得有文字、标签、字母、数字

⚠️ 长发强制要求：四人必须全部都是长发，发长至少过胸或到腰。绝对禁止短发、齐肩发、丸子头、盘发、马尾。

四个候选人是欧美女频短剧女主的不同美型方向——四个都极美但美法不同，通过脸型、发色、眼神、气质形成差异。目标审美：贵气、明艳、破碎感、温柔、可共情。不是游戏角色、反派或网红写真。

⚠️ 长发强制要求：四人必须全部都是长发，发长至少过胸或到腰。绝对禁止短发、齐肩发、丸子头、盘发、马尾。

B1（左上）清冷贵族千金：
- 银灰色或浅金色长发（silver-gray or light ash-blonde long hair to waist）
- 柔和心形脸（soft heart-shaped face），精致但不尖锐
- 浅色眼睛（light gray-blue or pale green eyes），眼神清澈神秘但无攻击性
- 精致但有脆弱感（refined with a touch of fragility），清冷但不老气
- 气质：清冷、贵气、神秘但可亲近，不是巫女感、不是冷硬女王
- 妆容淡雅精致，肤色白皙

B2（右上）明艳甜美女主（主女主人设）：
- 金色大波浪长发（golden blonde voluminous soft waves to lower back）
- 柔和鹅蛋脸（soft oval face），五官温和精致
- 大而明亮的蓝眼睛（large bright warm blue eyes），眼神温暖可亲
- 甜美明艳，贵族千金气质，温柔但有致命吸引力
- 健康气色，妆容精致自然，嘴唇柔软红润
- 气质：甜美、贵气、温柔、最有观众缘，最适合做主女主

B3（左下）成熟优雅豪门女主：
- 深棕色柔顺长发（rich dark brown long silky hair to waist）
- 精致椭圆脸（refined oval face），五官柔和优雅
- 温柔深邃的深棕色或榛子色眼睛（warm deep brown or hazel eyes）
- 高贵聪明有故事感，但仍然亲和可共情
- 克制妆容（restrained refined makeup），不浓艳、不网红
- 气质：优雅、成熟、智慧、有阅历但不疏离，不是性感反派

B4（右下）破碎感虐恋女主：
- 浅棕色柔和长波浪发（soft light brown long waves to waist）
- 小巧精致心形脸（small delicate heart-shaped face）
- 浅色或灰绿色眼睛（pale or gray-green eyes），眼神清澈带淡淡忧伤泪感
- 柔弱清冷但极度精致，适合女频虐恋女主
- 肤色白皙透亮，妆容极淡几近素颜
- 气质：破碎感、柔弱、精致、让人心疼，adult woman 不是幼态

共同要求（必须全部满足）：
- 四个人都必须像欧美女频短剧女主——真实剧照感、有观众缘、可共情
- 不是游戏角色、反派、模特硬照、网红写真、夜店风
- 四人颅面结构、脸型、眼神、发色、气质必须明显不同，绝不是同一个人换发色
- 五官柔和精致，脸型偏心形脸或鹅蛋脸，不要方下颌或夸张高颧骨
- 颜值极高但要有真实感，不要过度性感，不要厚重欧美网红妆
- 严禁：短发、盘发、银发老气感、强攻击性眼神、反派脸、女巫感
- 严禁：动漫脸、娃娃脸、幼态脸、整容脸、成熟妈妈感
- 统一穿月光蓝宝石色维多利亚风格长裙领口
- 正面头肩特写，脸居中，平视，直视镜头，双唇闭合
- 无皱纹、无雀斑、无痣、无瑕疵
- 哈苏 X2D 100C，100mm f/2.8 微距镜头，ISO 100，快门 1/125s，32K，HDR10+

输出 JSON：
{"imagePrompt":"英文提示词","imagePromptCn":"中文提示词"}`;

    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `请为角色「${characterName}」生成 2×2 选角联系表提示词。` },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4096,
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "AI 未返回内容" }, { status: 500 });
    }

    let result: { imagePrompt: string; imagePromptCn: string };
    try {
      result = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: "AI 返回格式异常" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      imagePrompt: result.imagePrompt || "",
      imagePromptCn: result.imagePromptCn || "",
    });
  } catch (err: unknown) {
    console.error("抽卡失败:", err);
    if (err instanceof OpenAI.APIError) {
      if (err.status === 401) return NextResponse.json({ error: "API Key 无效" }, { status: 500 });
      if (err.status === 429) return NextResponse.json({ error: "调用频率过高" }, { status: 500 });
    }
    return NextResponse.json({ error: "抽卡失败，请稍后重试" }, { status: 500 });
  }
}
