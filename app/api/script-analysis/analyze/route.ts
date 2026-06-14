import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

interface AssetItem {
  id: string;
  name: string;
  description: string;
  imagePrompt: string;
  imageUrl: string;
}

const styleMap: Record<string, { name: string; tags: string }> = {
  anime: {
    name: "二次元",
    tags: "anime style, 2D animation style, vibrant colors, clean lineart, cel shading",
  },
  "2.5d": {
    name: "2.5D",
    tags: "2.5D style, semi-realistic, cel-shaded 3D, detailed textures, stylized realism",
  },
  "3d": {
    name: "3D",
    tags: "3D render, CGI, octane render, detailed textures, cinematic lighting, subsurface scattering",
  },
  realistic: {
    name: "真人",
    tags: "photorealistic, hyperrealistic, cinematic lighting, 8k, detailed skin texture, film grain",
  },
};

function buildAssetPrompt(style: string): string {
  const selected = styleMap[style] || styleMap.anime;
  const tags = selected.tags;

  return `你是一个顶尖的漫剧（动态漫画）概念艺术家和 AI 图像生成提示词专家。

当前画风：${selected.name}
所有提示词的风格标签必须包含：${tags}

你需要生成三类资产，每类 3-8 个条目。

## 一、人物（characters）
- name: 角色名
- description: 1-2句中文描述外貌、服装、气质
- imagePrompt: 英文生图提示词，包含：年龄体型、发型五官、服装材质配饰、姿态表情、画质词(detailed face, fine details)

人物提示词示例：
"A young man in his early 20s, tall and lean build, medium-length black hair tied in a loose ponytail, sharp amber eyes, wearing a worn dark blue martial arts robe with silver trim, standing on a cliff edge with a determined expression, dramatic lighting, detailed face, fine details, ${tags}, high quality, concept art"

## 二、场景（scenes）
- name: 场景名
- description: 1-2句中文描述环境、氛围
- imagePrompt: 英文生图提示词，包含：地点类型、建筑/自然元素、光线氛围、时间、画质词(wide shot, rich details, atmospheric lighting)

场景提示词示例：
"Ancient cultivation cave interior, glowing blue crystal formation illuminating the space, stone platforms with ancient carvings, underground lake reflecting blue light, mist floating, volumetric light rays, wide shot, rich details, atmospheric lighting, ${tags}, high quality, concept art"

## 三、道具（props）
- name: 道具名
- description: 1-2句中文描述外观和用途
- imagePrompt: 英文生图提示词，包含：形状大小颜色材质纹理、花纹光泽、展示角度背景光源、画质词(product shot, intricate details, sharp focus)

道具提示词示例：
"A mystical jade pendant, oval shaped, translucent green jade with golden glowing veins, suspended on a thin silver chain, ancient runes carved along the edge, soft warm backlight, product shot, intricate details, sharp focus, macro photography, ${tags}, high quality, concept art"

## 通用规则
- 避免模糊词，用具体视觉描述
- 风格标签统一加在末尾
- 中国风/东方玄幻题材额外加入 "eastern fantasy art, chinese ink painting influence"
- 严格 JSON 格式输出，不要任何其他内容`;
}

export async function POST(request: Request) {
  try {
    const { script, targetAudience, style } = await request.json();

    if (!script || typeof script !== "string" || script.trim().length < 50) {
      return NextResponse.json(
        { error: "剧本内容太少，至少需要 50 个字" },
        { status: 400 }
      );
    }
    if (script.length > 200000) {
      return NextResponse.json(
        { error: "剧本内容过长，请控制在 200000 字以内" },
        { status: 400 }
      );
    }
    if (!targetAudience || typeof targetAudience !== "string" || targetAudience.trim().length < 1) {
      return NextResponse.json(
        { error: "请填写目标受众" },
        { status: 400 }
      );
    }

    const configPath = path.join(process.cwd(), "content", "api-config.json");
    let apiKey = "";
    let baseURL = "https://api.deepseek.com/v1";

    if (fs.existsSync(configPath)) {
      const configRaw = fs.readFileSync(configPath, "utf-8");
      const config = JSON.parse(configRaw);
      apiKey = config.apiKey || "";
      baseURL = config.baseURL || baseURL;
    }

    if (!apiKey && process.env.DEEPSEEK_API_KEY) {
      apiKey = process.env.DEEPSEEK_API_KEY;
    }
    if (process.env.DEEPSEEK_BASE_URL && baseURL === "https://api.deepseek.com/v1") {
      baseURL = process.env.DEEPSEEK_BASE_URL;
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "请先在管理后台配置 API Key" },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey, baseURL });

    // ====== 第一步：提炼剧本简介 ======
    const synopsisCompletion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "你是专业的漫剧编辑。阅读完整剧本，提炼一段简洁的剧本简介（200-500字），包含世界观、主要角色关系、核心冲突。只输出简介文本。",
        },
        { role: "user", content: script.trim() },
      ],
      max_tokens: 1024,
      temperature: 0.5,
    });

    const synopsis = synopsisCompletion.choices[0]?.message?.content?.trim() || "";
    if (!synopsis) {
      return NextResponse.json(
        { error: "AI 未能提炼出剧本简介，请重试" },
        { status: 500 }
      );
    }

    // ====== 第二步：基于简介生成虚拟资产 ======
    const assetSystemPrompt = buildAssetPrompt(style || "anime");

    const assetUserPrompt = `剧本简介：
${synopsis}

目标受众：${targetAudience.trim()}

请生成虚拟资产提示词，包含人物(characters)、场景(scenes)、道具(props)三个类别。`;

    const assetCompletion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: assetSystemPrompt },
        { role: "user", content: assetUserPrompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 8192,
      temperature: 0.8,
    });

    const assetContent = assetCompletion.choices[0]?.message?.content;
    if (!assetContent) {
      return NextResponse.json(
        { error: "AI 未返回有效内容，请重试" },
        { status: 500 }
      );
    }

    let result: {
      characters?: Omit<AssetItem, "id" | "imageUrl">[];
      scenes?: Omit<AssetItem, "id" | "imageUrl">[];
      props?: Omit<AssetItem, "id" | "imageUrl">[];
    };

    try {
      result = JSON.parse(assetContent);
    } catch {
      return NextResponse.json(
        { error: "AI 返回格式异常，请重试" },
        { status: 500 }
      );
    }

    const addMeta = (
      items: Omit<AssetItem, "id" | "imageUrl">[] | undefined,
      prefix: string
    ): AssetItem[] => {
      if (!Array.isArray(items)) return [];
      return items.map((item, i) => ({
        id: `${prefix}_${i + 1}`,
        name: item.name || "未命名",
        description: item.description || "",
        imagePrompt: item.imagePrompt || "",
        imageUrl: "",
      }));
    };

    const data = {
      characters: addMeta(result.characters, "char"),
      scenes: addMeta(result.scenes, "scene"),
      props: addMeta(result.props, "prop"),
    };

    return NextResponse.json({
      success: true,
      synopsis,
      data,
    });
  } catch (err: unknown) {
    console.error("AI 分析失败:", err);

    if (err instanceof OpenAI.APIError) {
      if (err.status === 401) {
        return NextResponse.json(
          { error: "API Key 无效，请检查管理后台中的 API Key" },
          { status: 500 }
        );
      }
      if (err.status === 429) {
        return NextResponse.json(
          { error: "API 调用频率过高，请稍后再试" },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: `AI 服务异常（${err.status}），请稍后重试` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "分析失败，请稍后重试" },
      { status: 500 }
    );
  }
}
