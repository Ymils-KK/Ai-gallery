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

四个候选人是同一套规则下的不同组合——四个人都极美但美的方向不同，通过脸型、发色、气质形成差异：

B1（左上）冷艳女王：
- 银灰色长发（silver-gray long straight hair to waist）
- 五官锐利精致，高颧骨，狭长眼型，冰蓝色眼眸（icy blue eyes, cold and deep）
- 妆容冷艳，气场强势神秘充满压迫感，domineering queenly presence
- 脸型偏窄长椭圆，下颌线条锋利（narrow elongated oval face, sharp jawline）
- 气质：高冷、权势、让人不敢靠近

B2（右上）甜美千金：
- 金色大波浪长发（golden blonde voluminous waves to lower back）
- 圆润鹅蛋脸（soft round-oval face），大而圆的清澈蓝眼（large round clear blue eyes）
- 甜美明艳，贵族千金气质，温柔但有致命吸引力（warm but captivating）
- 妆容精致温暖，嘴唇自然红润
- 气质：甜美、贵气、温柔但有吸引力

B3（左下）成熟御姐：
- 深棕色或黑色长直发（dark brown or black long sleek straight hair to waist）
- 杏仁眼型（almond eyes），眼神深邃危险、有故事感（dangerous elegance, mysterious）
- 脸型偏菱形或瓜子脸，颧骨立体（diamond or heart-shaped face, prominent cheekbones）
- 嘴唇丰润饱满，妆容成熟大气（full lips, mature refined makeup）
- 气质：性感、危险、优雅、阅历丰富

B4（右下）清冷破碎感女主：
- 浅棕色或玫瑰金色长软波浪发（light brown or rose-gold long soft waves to waist）
- 脸型小巧精致（petite delicate face），眼神清澈带淡淡忧伤（clear eyes with subtle sadness）
- 肤色白皙透亮（translucent fair skin），妆容淡雅自然
- fragile-looking but exquisitely delicate beauty
- 气质：柔弱、破碎感、精致、适合女频虐恋女主

共同要求：
- 四个人都必须是 adult woman，极美，高颜值，适合欧美女频 AI 短剧角色资产库
- 四人颅面结构、脸型、眼神、发色、气质必须明显不同，绝不是同一个人换发色
- 严禁短发作为差异点，严禁动漫脸、娃娃脸、幼态脸、整容脸
- 统一穿月光蓝宝石色维多利亚风格长裙领口（deep moonlit sapphire late-Victorian day gown neckline）
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
