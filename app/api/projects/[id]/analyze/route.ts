import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const projectsDir = path.join(process.cwd(), "content", "projects");

interface AssetItem {
  id: string;
  name: string;
  description: string;
  imagePrompt: string;
  imageUrl: string;
  tier?: "major" | "minor";
}

const styleMap: Record<string, { name: string; tags: string }> = {
  anime: { name: "二次元", tags: "anime style, 2D animation style, vibrant colors, clean lineart, cel shading" },
  "2.5d": { name: "2.5D", tags: "2.5D style, semi-realistic, cel-shaded 3D, detailed textures, stylized realism" },
  "3d": { name: "3D", tags: "3D render, CGI, octane render, detailed textures, cinematic lighting, subsurface scattering" },
  realistic: { name: "真人", tags: "photorealistic, hyperrealistic, cinematic lighting, 8k, detailed skin texture, film grain" },
};

function buildAssetPrompt(style: string): string {
  const selected = styleMap[style] || styleMap.anime;
  const tags = selected.tags;

  return `你是一个顶尖的影视概念艺术家和 AI 图像生成提示词专家。你的作品以极致细节、丰富视觉层次著称，每一条提示词都像一篇微型视觉散文。

当前画风：${selected.name}
风格标签：${tags}

## 核心原则
1. 信息密度要高：每条提示词至少 300 词（英文），不允许笼统概括
2. 具体具体再具体：不要"handsome"而写"sharp square jaw, high cheekbones, deep-set intense eyes with heavy lids and long lashes"
3. 从剧本原文中提取一切可用细节：角色外貌描写、服装、场景氛围、道具特征
4. 如果剧本没有某方面描写，根据角色身份/时代背景/场景类型合理推断并具体化

## 输出规则
每条资产需要提供 imagePrompt（英文）和 imagePromptCn（中文）两个版本的提示词。
重要资产（tier: "major"）：必须同时生成 imagePrompt 和 imagePromptCn，内容详尽
次要资产（tier: "minor"）：imagePrompt 和 imagePromptCn 都留空字符串 ""

## 一、人物（characters）
提取剧本中所有人物角色，包括有名字的、有台词的、被提及的、作为背景出现的。宁可多提取，不要遗漏。

分级标准：
- 重要人物（tier: "major"）：主角、反派、关键配角、推动剧情发展的角色
- 次要人物（tier: "minor"）：龙套、背景角色、仅提及名字、一次性出场

如无法判断重要性，默认标为 major，优先保证提取数量。

字段：
- name: 角色名
- tier: "major" 或 "minor"
- description: 详细的中文角色概述，包含外貌特征、气质、服装风格、角色定位（不要限制字数，写出所有可用信息）
- imagePrompt: 英文生图提示词（仅 major）
- imagePromptCn: 中文生图提示词（仅 major，与英文内容对应）

### 重要人物的 imagePrompt 必须覆盖以下全部维度（逐项写，不可省略）：

【Body】精确的身高（英尺+厘米）、体型（瘦削/健壮/丰满等）、肩宽、腰身、腿长、头身比（如 1:8.5）、肤色、体态特征
【Face】脸型（方下巴/瓜子脸/圆脸等）、颧骨高低、鼻型、眉形、眼睛（颜色、形状、眼窝深浅、睫毛、眼睑）、嘴唇（厚薄、形状、颜色）、皮肤质感（毛孔/雀斑/光滑等）、下颌线条
【Hair】发型、发色、长度、发质（直/卷/波浪）、光泽度、具体造型描述
【Expression】表情——必须是中性的：放松自然，平静看向镜头，不微笑不皱眉不愤怒，但眼神有存在感
【Outfit】至少2-3句详细描述。包括：上衣（款式/颜色/材质/穿法如挽袖/解扣）、下装、鞋子、配饰（项链/手表/耳环/戒指等）。如果有不同场景的服装变化也写出
【Lighting & Camera】光源类型和方向、色温、阴影质感、镜头焦段、景深、胶片质感、画面比例
【Overall aesthetic】整体美学定调，可引用影视参考（如 "The Vampire Diaries style", "Hollywood cinematic" 等）

【画面布局】
左上角：人物面部正面特写（close-up portrait, front view）
左下角：人物侧面特写（close-up portrait, side profile）
右侧：人物全身三视图 1×3 网格（full body turnaround: front view | side view | back view, horizontal 1x3 grid）

【画质要求】character design sheet, turnaround reference, detailed face, clean lines, neutral expression

### 人物提示词质量参考（你的输出应该达到这个详细程度）：
"European short drama style. Body: 6'2" (188cm), broad shoulders, lean athletic V-shaped torso, narrow waist, long legs, 1:8.5 head-to-body ratio. Face: Sharp square jaw with light designer stubble, high cheekbones, straight nose, deep-set intense dark brown eyes with heavy lids and long lashes, full lips, slightly tousled thick dark brown hair with natural wave — short sides, longer top with soft fringe falling across forehead. Expression: Smoldering calm confidence, looking naturally at camera, neutral but present. Outfit: Dark charcoal grey fitted linen-blend shirt, top two buttons undone, sleeves rolled to mid-forearm revealing muscular veiny forearms, thin black wool open-front vest, dark charcoal slim-fit tailored trousers, simple black leather boots, thin silver chain with wolf-tooth pendant. Lighting: Warm amber candlelight from stone hearth, casting soft shadows, low saturation, film grain, 50mm lens, shallow depth of field, realistic skin texture. Mainstream Western romantic fantasy TV drama aesthetic."

## 二、场景（scenes）
提取剧本中所有出现过的场景地点，包括室内室外、具体场所、过渡场景。宁可多提取，不要遗漏。

分级标准：
- 重要场景（tier: "major"）：故事核心地点，反复出现、推动剧情、或关键事件发生地
- 次要场景（tier: "minor"）：过渡性地点、仅短暂出现、或仅提及的场景

如无法判断重要性，默认标为 major，优先保证提取数量。

字段：
- name: 场景名
- tier: "major" 或 "minor"
- description: 详细的中文场景描述，包含空间结构、氛围、时间、天气（不要限制字数）
- imagePrompt: 英文生图提示词（仅 major）
- imagePromptCn: 中文生图提示词（仅 major）

### 重要场景的 imagePrompt 必须覆盖：
【Architecture & Space】建筑风格、空间大小、材质（石/木/玻璃/金属）、结构细节、家具陈设
【Atmosphere & Mood】整体氛围、时间（晨/午/夜）、季节、天气
【Lighting】光源（自然光/烛光/灯光/月光）、色温、阴影、体积光
【Camera】镜头焦段、景深、构图（广角/特写/中景）、画面比例
【Color Palette】主色调、饱和度、对比度
【Details】至少3个具体的视觉细节（墙上的裂缝/桌上的物品/窗外的景色等）

## 三、道具（props）
提取剧本中所有被角色使用、持有、提及或对剧情有意义的道具物品。包括武器、饰品、工具、衣物、书信、药品、法器、交通工具、日常用品等。宁可多提取，不要遗漏。

分级标准：
- 重要道具（tier: "major"）：贯穿全剧的核心道具、对剧情起关键作用的物品、主角的标志性装备
- 次要道具（tier: "minor"）：仅出现一次但有剧情意义的物品、日常用品

如无法判断重要性，默认标为 major，优先保证提取数量。

字段：
- name: 道具名
- tier: "major" 或 "minor"
- description: 详细的中文道具描述，外观、材质、尺寸、用途、故事意义（不要限制字数）
- imagePrompt: 英文生图提示词（仅 major）
- imagePromptCn: 中文生图提示词（仅 major）

### 重要道具的 imagePrompt 必须覆盖：
【Appearance】形状、颜色、尺寸比例
【Material & Texture】材质（金属/木/布/宝石/皮革等）、表面纹理、磨损/新旧程度、光泽度
【Details】雕刻/纹饰/铭文/镶嵌等装饰细节
【Lighting & Camera】光源设置、镜头类型（微距/产品摄影）、景深、背景
【Context】（可选）如果道具在特定场景中出现，可简要提及环境氛围

## 通用规则
- 禁止使用模糊词汇：handsome/beautiful/nice/atmospheric 这类词不能单独出现，必须跟具体描述
- 中国风/东方玄幻题材额外加入 "eastern fantasy art"
- 西方/欧美题材加入对应的美学参考
- 所有 imagePrompt 和 imagePromptCn 末尾统一加风格标签
- 严格 JSON 格式输出，不要任何其他内容`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { script, targetAudience, style, templateIds } = await request.json();

    if (!script || script.trim().length < 50) {
      return NextResponse.json({ error: "剧本内容太少，至少需要 50 个字" }, { status: 400 });
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
      return NextResponse.json({ error: "请先在管理后台配置 API Key" }, { status: 500 });
    }

    const client = new OpenAI({ apiKey, baseURL });

    // 第一步：提炼简介（中文 + 英文）
    const synopsisCompletion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `你是专业的漫剧编辑。阅读完整剧本，提炼剧本简介，输出中英文两个版本。

要求：
- synopsisCn: 中文简介，200-500字，包含世界观、主要角色关系、核心冲突
- synopsisEn: 英文简介，与中文内容一致，100-300词

严格按JSON格式输出：{"synopsisCn":"中文简介...","synopsisEn":"English synopsis..."}`,
        },
        { role: "user", content: script.trim() },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2048,
      temperature: 0.5,
    });
    const synopsisRaw = synopsisCompletion.choices[0]?.message?.content?.trim() || "";
    let synopsis = "";
    let synopsisEn = "";
    try {
      const parsed = JSON.parse(synopsisRaw);
      synopsis = parsed.synopsisCn || "";
      synopsisEn = parsed.synopsisEn || "";
    } catch {
      synopsis = synopsisRaw; // fallback
    }
    if (!synopsis) {
      return NextResponse.json({ error: "AI 未能提炼出剧本简介" }, { status: 500 });
    }

    // 读取模板指令（支持多模板叠加）
    let templateInstructions = "";
    if (Array.isArray(templateIds) && templateIds.length > 0) {
      const templatesPath = path.join(process.cwd(), "content", "prompt-templates.json");
      if (fs.existsSync(templatesPath)) {
        const templates: { id: string; name: string; instructions: string }[] = JSON.parse(fs.readFileSync(templatesPath, "utf-8"));
        const selected = templates.filter((t) => templateIds.includes(t.id));
        if (selected.length > 0) {
          templateInstructions = selected
            .map((t) => `【${t.name}】${t.instructions}`)
            .join("\n\n");
        }
      }
    }

    // 第二步：生成资产
    const assetSystemPrompt = buildAssetPrompt(style || "anime")
      + (templateInstructions
        ? `\n\n## 用户自定义风格要求（可组合叠加）\n${templateInstructions}\n\n请严格遵循以上所有风格要求生成提示词，如果有冲突以后面的为准。`
        : "");

    const assetCompletion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: assetSystemPrompt },
        { role: "user", content: `完整剧本：\n${script.trim()}\n\n剧本简介（仅供参考）：\n${synopsis}\n\n用户分析要求：${targetAudience?.trim() || "无特殊要求"}\n\n请根据完整剧本和用户的分析要求生成虚拟资产提示词，从原文中提取所有可用的人物外貌、场景氛围、道具细节，每条提示词要有足够的信息密度。严格遵守用户的分析要求（如目标受众、风格偏好、长度限制等）。` },
      ],
      response_format: { type: "json_object" },
      max_tokens: 16384,
      temperature: 0.8,
    });

    const assetContent = assetCompletion.choices[0]?.message?.content;
    if (!assetContent) {
      return NextResponse.json({ error: "AI 未返回有效内容" }, { status: 500 });
    }

    let result: {
      characters?: (Omit<AssetItem, "id" | "imageUrl"> & { tier?: string; imagePromptCn?: string })[];
      scenes?: (Omit<AssetItem, "id" | "imageUrl"> & { tier?: string; imagePromptCn?: string })[];
      props?: (Omit<AssetItem, "id" | "imageUrl"> & { tier?: string; imagePromptCn?: string })[];
    };

    try {
      result = JSON.parse(assetContent);
    } catch {
      return NextResponse.json({ error: "AI 返回格式异常" }, { status: 500 });
    }

    const addMeta = (items: any[] | undefined, prefix: string): AssetItem[] => {
      if (!Array.isArray(items)) return [];
      return items.map((item, i) => ({
        id: `${prefix}_${i + 1}`,
        name: item.name || "未命名",
        description: item.description || "",
        imagePrompt: item.imagePrompt || "",
        imagePromptCn: item.imagePromptCn || "",
        imageUrl: "",
        tier: item.tier || undefined,
      }));
    };

    const data = {
      characters: addMeta(result.characters, "char"),
      scenes: addMeta(result.scenes, "scene"),
      props: addMeta(result.props, "prop"),
    };

    // 保存到项目文件
    const projectPath = path.join(projectsDir, `${id}.json`);
    const projectData = {
      id,
      script: script.trim(),
      synopsis,
      synopsisEn,
      targetAudience: targetAudience?.trim() || "",
      style: style || "anime",
      ...data,
    };
    fs.writeFileSync(projectPath, JSON.stringify(projectData, null, 2), "utf-8");

    return NextResponse.json({ success: true, synopsis, synopsisEn, data });
  } catch (err: unknown) {
    console.error("AI 分析失败:", err);
    if (err instanceof OpenAI.APIError) {
      if (err.status === 401) return NextResponse.json({ error: "API Key 无效" }, { status: 500 });
      if (err.status === 429) return NextResponse.json({ error: "调用频率过高，请稍后再试" }, { status: 500 });
    }
    return NextResponse.json({ error: "分析失败，请稍后重试" }, { status: 500 });
  }
}
