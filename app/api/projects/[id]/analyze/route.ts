import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { deepseekChat, deepseekChatJSON } from "@/lib/deepseek";

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

function buildAssetPrompt(style: string, era: string): string {
  const selected = styleMap[style] || styleMap.anime;
  const tags = selected.tags;

  const eraLabels: Record<string, string> = { any: "不限", modern: "现代", medieval: "中世纪", ancient_east: "古代东方", victorian: "维多利亚", fantasy: "奇幻", cyberpunk: "赛博朋克" };
  const eraContext: Record<string, string> = {
    any: "",
    modern: "时代背景是现代 21 世纪。所有人物必须穿现代时装（衬衫、西装、连衣裙、牛仔裤、高跟鞋等），场景为现代都市。严禁出现古装、盔甲、长袍。",
    medieval: "时代背景是中世纪欧洲，绝对禁止现代服装！所有人物必须穿中世纪服装：女性穿束腰长裙（kirtle/gown）、紧身胸衣（corset）、斗篷（cloak）；男性穿束腰外衣（tunic）、皮甲、马裤（breeches）、长靴。场景为石砌城堡、铁质吊灯、木桌长凳。严禁任何现代元素（拉链、T恤、西装、高跟鞋）。",
    ancient_east: "时代背景是古代东方，绝对禁止现代服装！所有人物必须穿古风服装：女性穿汉服/齐胸襦裙/大袖衫/披帛；男性穿长袍/直裰/劲装/鹤氅。场景为宫殿楼阁、园林、仙山云雾。严禁任何现代元素。",
    victorian: "时代背景是维多利亚时代（19世纪英国），绝对禁止现代服装！所有人物必须穿维多利亚服装：女性穿紧身胸衣（corset）、多层裙撑（crinoline）、高领蕾丝衬衫、手套、礼帽；男性穿燕尾服（tailcoat）、马甲（waistcoat）、高领衬衫、手杖。场景为煤气灯街道、庄园、马车。严禁现代元素。",
    fantasy: "时代背景是奇幻异世界，绝对禁止现代服装！所有人物必须穿奇幻风格服装：精灵穿轻盈银甲和飘逸长袍；贵族穿华丽刺绣礼服配魔法宝石；冒险者穿皮革装束配斗篷。场景为魔法森林、浮空城堡、龙穴。严禁现代元素。",
    cyberpunk: "时代背景是赛博朋克未来，绝对禁止传统服装！所有人物必须穿未来科技服装：发光面料夹克、霓虹LED装饰、义体机械臂、全息投影配饰、智能眼镜。场景为霓虹都市、高科技贫民窟。严禁传统自然面料。",
  };
  const eraDesc = eraContext[era] || "";
  const eraLabel = eraLabels[era] || "不限";

  return `你是一个顶尖的影视概念艺术家和 AI 图像生成提示词专家。你的作品以极致细节、丰富视觉层次著称，每一条提示词都像一篇微型视觉散文。

当前画风：${selected.name}
时代背景：${eraLabel}
${eraDesc ? `时代约束：${eraDesc}` : "无特定时代约束，请根据剧本自行判断时代背景。"}
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
- outfits: 服装列表数组（仅 important 人物需要，minor 人物留空数组 []）。每件服装包含：
  - name: 服装场景标签（如"日常""宴会""战斗""睡衣""外出"等）
  - description: 1-2句中文服装描述
  - imagePrompt: 英文服装生图提示词（留空 ""，后续由单独 API 生成）
  - imagePromptCn: 中文服装生图提示词（留空 ""，后续由单独 API 生成）

注意：imagePrompt 是角色基础形象（面部+三视图），不要包含具体服装。服装的提示词放在 outfits 数组里。

### 重要人物的 imagePrompt 必须强制以以下前缀开头，不可省略：
Hasselblad X2D 100C, 85mm standard prime lens, 32K ultra HD, HDR10+ high dynamic range, cinematic color grading, IMAX quality, 100mm f/2.8 macro lens, ISO 100, shutter speed 1/125s, RAW format output, visible skin texture with pores and capillaries, individual hair strands clearly visible, rich light and shadow layers, fine grain texture, no props, standard front standing pose, nine-head golden body proportion, full body to feet no cropping, looking directly at camera, clean white seamless background, 16:9 aspect ratio,
然后接角色具体描述（必须保留上述全部前缀）

### ⚠️ 女性角色强制要求（所有女性人物必须遵守，缺一不可）
女性角色必须是「让人看一眼就心动的绝色美女」，这是最高优先级要求：

身材要求：
- 九头身黄金比例（1:9 head-to-body ratio），绝对禁止普通头身比
- 超模身材（supermodel physique: slim hourglass figure, 22-inch waist, long slender legs, delicate collarbones, graceful neck）
- 身高 172-180cm（5'8"-5'11"）
- 体重 48-55kg，体脂率极低但曲线明显
- 年龄 18-22 岁（fresh youthful appearance, age 18-22, no signs of aging）

面容要求（必须全部满足）：
- 绝美容颜（devastatingly beautiful, drop-dead gorgeous, breathtaking face that makes people stare）
- 无瑕瓷白肌肤（flawless porcelain skin, translucent and luminous, zero blemishes, no freckles, no fine lines, no wrinkles, no pores visible）
- 标准鹅蛋脸或瓜子脸（perfect oval or heart-shaped face）
- 高挺精致的鼻梁（high delicate nose bridge, refined nose tip）
- 大而有神的双眼（large captivating eyes, bright and clear, visible catchlight, thick long eyelashes）
- 含情脉脉的眼神（eyes that sparkle with emotion and depth）
- 丰润饱满的樱桃唇（full plump cherry lips, naturally rosy, cupid's bow definition）
- 柳叶弯眉（elegantly arched eyebrows, soft and natural）
- 精致小巧的下巴（delicate small chin, perfect V-line）
- 气质：高贵优雅中带冷艳，清冷拒人千里又让人忍不住想靠近（elegant and refined with a cool, untouchable allure that draws people in）

禁止项：
- 严禁普通路人长相
- 严禁有雀斑、痣、皱纹、法令纹、鱼尾纹
- 严禁粗犷或男性化面部特征
- 严禁皮肤暗沉、毛孔粗大

然后覆盖以下全部维度（逐项写，不可省略）：

【Body】精确的身高（英尺+厘米）、体型（瘦削/健壮/丰满等）、肩宽、腰身、腿长、头身比（如 1:8.5）、肤色、体态特征。女性角色必须写 1:9 头身比、超模身材。
【Face】脸型（方下巴/瓜子脸/圆脸等）、颧骨高低、鼻型、眉形、眼睛（颜色、形状、眼窝深浅、睫毛、眼睑）、嘴唇（厚薄、形状、颜色）、皮肤质感（毛孔/雀斑/光滑等）、下颌线条。女性角色必须写绝美容颜、无雀斑细纹、无瑕瓷肌。
【Hair】发型、发色、长度、发质（直/卷/波浪）、光泽度、具体造型描述
【Expression】表情——必须是中性的：放松自然，平静看向镜头，不微笑不皱眉不愤怒，但眼神有存在感
【Outfit】至少2-3句详细描述。包括：上衣（款式/颜色/材质/穿法如挽袖/解扣）、下装、鞋子、配饰（项链/手表/耳环/戒指等）。如果有不同场景的服装变化也写出。⚠️ 服装必须严格符合时代背景，绝对禁止不符合时代的服装（如中世纪角色穿西装、古代角色穿高跟鞋）。
【Lighting & Camera】光源类型和方向、色温、阴影质感、镜头焦段、景深、胶片质感、画面比例
【Overall aesthetic】整体美学定调，可引用影视参考（如 "The Vampire Diaries style", "Hollywood cinematic" 等）

【画面布局】横向 16:9 五视图高端角色参考板（casting reference board），白色无缝背景，干净白色细线分隔各面板：
- 左列（占1/4宽度）：上下两个等大面部特写
  上：正面特写直视镜头（close-up portrait, straight-on, looking directly at camera）
  下：严格90度侧面特写平视（strict 90-degree facial profile, looking straight ahead）
- 右三列（各占1/4宽度）：三个等大全身视图
  正面站姿（full-body front view, standard upright neutral pose, relaxed arms）
  严格90度侧面站姿（strict 90-degree side view）
  背面站姿（full-body back view）
- 所有面板保持同一人物，面部、发型、发色、眼睛颜色、服装、身材比例完全一致
- 人物完整展示从头到脚，充裕白色边距，不裁剪

【画质要求】Hasselblad X2D 100C photographic look, 100mm f/2.8 macro lens on facial close-ups, 85mm standard prime lens on full-body views, ISO 100, shutter 1/125s, 32K ultra HD, HDR10+, cinematic color grading, IMAX clarity, individual hair strands, subtle skin texture, rich light and shadow layers, fine grain, soft even studio lighting, clean white seamless background

### 服装提取规则（outfits 数组）
⚠️ 重要：每个重要人物（tier: "major"）都必须有 outfits 数组，至少包含一套服装。
从剧本中识别角色的不同场景服装变化，每一套不同的服装提取为一个 outfit：
- 仔细阅读剧本，找出角色在不同场景/情境下的服装变化
- 每套服装用简短的场景标签命名（如"日常""宴会""战斗""睡衣""婚礼""葬礼""运动"等）
- 如果剧本提到角色换衣服/穿什么出场，就提取出来
- 如果剧本只描述了一套服装或没有明确服装变化，至少提取一套"日常"服装
- description 写 1-2 句中文服装外观描述
- imagePrompt 和 imagePromptCn 都留空字符串 ""，后续手动触发生成

JSON 输出示例（人物）：
{
  "name": "角色名",
  "tier": "major",
  "description": "角色概述...",
  "imagePrompt": "Hasselblad X2D 100C...角色具体描述...",
  "imagePromptCn": "中文提示词...",
  "outfits": [
    { "name": "日常", "description": "深灰衬衫配黑马甲", "imagePrompt": "", "imagePromptCn": "" },
    { "name": "宴会", "description": "黑色天鹅绒礼服", "imagePrompt": "", "imagePromptCn": "" }
  ]
}

### 人物提示词质量参考（你的输出应该达到这个详细程度——五视图参考板格式）：
"Hasselblad X2D 100C, 85mm standard prime lens, 32K ultra HD, HDR10+ high dynamic range, cinematic color grading, IMAX quality, 100mm f/2.8 macro lens, ISO 100, shutter speed 1/125s, RAW format output, visible skin texture with pores and capillaries, individual hair strands clearly visible, rich light and shadow layers, fine grain texture, no props, standard front standing pose, nine-head golden body proportion, full body to feet no cropping, looking directly at camera, clean white seamless background, 16:9 aspect ratio, five-view casting reference board layout, left column: two equal stacked facial close-ups (straight-on front above + strict 90-degree profile below looking straight ahead), right three equal columns: full-body front view + strict 90-degree side view + back view, clean thin white dividers, same woman in all five panels preserving face hair eyes body gown and proportions exactly. Body: 5'9" (175cm), nine-head 1:9 supermodel physique, exceptionally long legs, 22-inch slim defined waist, elegant shoulders and neck, balanced feminine curves, graceful posture, slender toned body neither muscular nor gaunt. Face: harmonious facial thirds, highly symmetrical refined oval-heart-shaped small face, delicate tapered jawline, softly sculpted cheekbones, large luminous gray-blue almond eyes, elegant fine brows, petite straight nose, naturally full rose-colored lips, clean luminous cool-fair skin with subtle natural pores but zero fine lines wrinkles freckles moles blemishes. Hair: long pearl silver-blonde hair in glossy soft waves. Expression: ethereal calm, quiet resilience, neutral but present, looking naturally at camera. Outfit: glamorous late-Victorian-inspired sapphire blue silk-wool crepe gown, portrait neckline, shaped bodice, defined natural waist, refined long sleeves with delicate chiffon cuffs, flowing ankle-length skirt, dark leather period-inspired lace-up boots. Lighting & Camera: soft even studio illumination, 100mm macro on face close-ups, 85mm prime on full-body views, shallow depth of field, soft shadows. Overall aesthetic: premium Western female-audience romantic fantasy TV drama, ethereal moonlight beauty with restrained emotional depth."

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
- ⚠️ 所有重要人物（tier: "major"）必须有 outfits 数组，至少包含 1 套服装。次要人物 outfits 留空数组 []
- 严格 JSON 格式输出，不要任何其他内容`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { script, targetAudience, style, era, templateIds } = await request.json();

    if (!script || script.trim().length < 50) {
      return NextResponse.json({ error: "剧本内容太少，至少需要 50 个字" }, { status: 400 });
    }

    // 第一步：提炼简介（中文 + 英文）
    const synopsisRaw = await deepseekChat(
      [
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
      { maxTokens: 2048, temperature: 0.5, responseFormat: "json_object" }
    );

    let synopsis = "";
    let synopsisEn = "";
    try {
      const parsed = JSON.parse(synopsisRaw);
      synopsis = parsed.synopsisCn || "";
      synopsisEn = parsed.synopsisEn || "";
    } catch {
      synopsis = synopsisRaw;
    }
    if (!synopsis) {
      return NextResponse.json({ error: "AI 未能提炼出剧本简介" }, { status: 500 });
    }

    // 读取模板指令
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
    const assetSystemPrompt = buildAssetPrompt(style || "anime", era || "any")
      + (templateInstructions
        ? `\n\n## 用户自定义风格要求（可组合叠加）\n${templateInstructions}\n\n请严格遵循以上所有风格要求生成提示词，如果有冲突以后面的为准。`
        : "");

    const assetContent = await deepseekChat(
      [
        { role: "system", content: assetSystemPrompt },
        { role: "user", content: `完整剧本：\n${script.trim()}\n\n剧本简介（仅供参考）：\n${synopsis}\n\n用户分析要求：${targetAudience?.trim() || "无特殊要求"}\n\n请根据完整剧本和用户的分析要求生成虚拟资产提示词，从原文中提取所有可用的人物外貌、场景氛围、道具细节，每条提示词要有足够的信息密度。严格遵守用户的分析要求（如目标受众、风格偏好、长度限制等）。` },
      ],
      { maxTokens: 16384, temperature: 0.8, responseFormat: "json_object" }
    );

    if (!assetContent) {
      return NextResponse.json({ error: "AI 未返回有效内容" }, { status: 500 });
    }

    let result: {
      characters?: (Omit<AssetItem, "id" | "imageUrl"> & { tier?: string; imagePromptCn?: string; outfits?: { name: string; description: string; imagePrompt?: string; imagePromptCn?: string }[] })[];
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
        outfits: Array.isArray(item.outfits)
          ? item.outfits.map((o: any, j: number) => ({
              id: `${prefix}_${i + 1}_outfit_${j + 1}`,
              name: o.name || "未命名",
              description: o.description || "",
              imagePrompt: o.imagePrompt || "",
              imagePromptCn: o.imagePromptCn || "",
              imageUrl: "",
            }))
          : undefined,
      }));
    };

    const data = {
      characters: addMeta(result.characters, "char"),
      scenes: addMeta(result.scenes, "scene"),
      props: addMeta(result.props, "prop"),
    };

    // 保存到项目文件（Vercel 上写入可能失败，不影响返回结果）
    try {
      const projectPath = path.join(projectsDir, `${id}.json`);
      const projectData = {
        id,
        script: script.trim(),
        synopsis,
        synopsisEn,
        targetAudience: targetAudience?.trim() || "",
        style: style || "anime",
        era: era || "any",
        ...data,
      };
      fs.writeFileSync(projectPath, JSON.stringify(projectData, null, 2), "utf-8");
    } catch (saveErr) {
      console.error("保存项目文件失败（Vercel 环境正常）:", saveErr);
    }

    return NextResponse.json({ success: true, synopsis, synopsisEn, data });
  } catch (err: unknown) {
    console.error("AI 分析失败:", err);
    const message = err instanceof Error ? err.message : "分析失败，请稍后重试";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
