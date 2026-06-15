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
    const { assetName, assetType, description, style, templateIds } = await request.json();

    if (!assetName || !assetType) {
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

    // 读取模板指令
    let templateInstructions = "";
    if (Array.isArray(templateIds) && templateIds.length > 0) {
      const tplPath = path.join(process.cwd(), "content", "prompt-templates.json");
      if (fs.existsSync(tplPath)) {
        const templates = JSON.parse(fs.readFileSync(tplPath, "utf-8"));
        const selected = templates.filter((t: { id: string }) => templateIds.includes(t.id));
        templateInstructions = selected.map((t: { name: string; instructions: string }) => `【${t.name}】${t.instructions}`).join("\n\n");
      }
    }

    // 画风标签
    const styleMap: Record<string, string> = {
      anime: "anime style, 2D animation style, vibrant colors, clean lineart, cel shading",
      "2.5d": "2.5D style, semi-realistic, cel-shaded 3D, detailed textures, stylized realism",
      "3d": "3D render, CGI, octane render, detailed textures, cinematic lighting, subsurface scattering",
      realistic: "photorealistic, hyperrealistic, cinematic lighting, 8k, detailed skin texture, film grain",
    };
    const tags = styleMap[style] || styleMap.anime;

    const isOutfit = assetType === "outfit";
    const typeLabel = isOutfit ? "服装" : assetType === "characters" ? "人物" : assetType === "scenes" ? "场景" : "道具";

    const client = new OpenAI({ apiKey, baseURL });

    const hasselblad = `Hasselblad X2D 100C, 85mm standard prime lens, 32K ultra HD, HDR10+ high dynamic range, cinematic color grading, IMAX quality, 100mm f/2.8 macro lens, ISO 100, shutter speed 1/125s, RAW format output, visible skin texture with pores and capillaries, individual hair strands clearly visible, rich light and shadow layers, fine grain texture,`;

    const systemPrompt = isOutfit
      ? `你是一个 AI 图像生成提示词专家。为以下角色服装生成生图提示词。

剧本背景：${projectContext || "未提供"}
${templateInstructions ? `风格要求：\n${templateInstructions}\n` : ""}
风格标签：${tags}

重要：这是服装提示词，聚焦于服装的款式、材质、颜色、细节、穿着效果。不需要描述角色面部或体型。

强制要求：imagePrompt 必须以以下前缀开头（不可省略）：
${hasselblad}
然后接服装具体描述。

输出 JSON 格式：
{"imagePrompt":"英文提示词","imagePromptCn":"中文提示词"}

提示词要求：详细描述服装款式、剪裁、面料、颜色、纹理、装饰细节，末尾加风格标签。`
      : assetType === "characters"
      ? `你是一个 AI 图像生成提示词专家。为以下${typeLabel}生成生图提示词。

剧本背景：${projectContext || "未提供"}
${templateInstructions ? `风格要求：\n${templateInstructions}\n` : ""}
风格标签：${tags}

强制要求：imagePrompt 必须以以下前缀开头（不可省略）：
${hasselblad} no props, standard front standing pose, nine-head golden body proportion, full body to feet no cropping, looking directly at camera, clean white seamless background, 16:9 aspect ratio,
然后接角色具体描述。

输出 JSON 格式：
{"imagePrompt":"英文提示词","imagePromptCn":"中文提示词"}

提示词要求：详细、具体、视觉化，英文用于生图工具，中文与英文对应。末尾加风格标签。`
      : `你是一个 AI 图像生成提示词专家。为以下${typeLabel}生成生图提示词。

剧本背景：${projectContext || "未提供"}
${templateInstructions ? `风格要求：\n${templateInstructions}\n` : ""}
风格标签：${tags}

输出 JSON 格式：
{"imagePrompt":"英文提示词","imagePromptCn":"中文提示词"}

提示词要求：详细、具体、视觉化，英文用于生图工具，中文与英文对应。末尾加风格标签。`;

    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${typeLabel}名称：${assetName}\n描述：${description || "无"}\n\n请生成提示词。` },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2048,
      temperature: 0.7,
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
    console.error("生成提示词失败:", err);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}
