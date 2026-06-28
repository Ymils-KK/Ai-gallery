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
- 四个格分别放四位 18-22 岁绝美白人女性，每人只占一格
- 顺序：左上B1、右上B2、左下B3、右下B4
- 图内不得有文字、标签、字母、数字
- 四人都是角色「${characterName}」的可能版本

人物要求：
- B1（左上）：柔和圆鹅蛋脸，圆润轮廓，宽大温暖的棕色眼睛，焦糖色卷发，温柔中藏隐痛
- B2（右上）：贵族窄长脸，纤长轮廓，深邃蓝灰眼睛，深灰棕波浪发，冷静高贵
- B3（左下）：小巧短脸，精致小下巴，清澈蓝绿小鹿眼，浅栗金色蓬松卷发，脆弱但坚韧
- B4（右下）：柔和方鹅蛋脸，宽颧骨，拉长的灰绿色眼睛，黑咖啡色光泽波浪发，强大未来女王气
- 四人颅面结构必须明显不同，不得同质化
- 统一穿月光蓝宝石色维多利亚风格长裙领口
- 正面头肩特写，脸居中，平视，直视镜头，双唇闭合
- 无皱纹、无雀斑、无痣、无瑕疵、无整容感
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
