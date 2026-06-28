import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

function buildFemaleLeadPrompt(): string {
  return `你是一个顶尖的影视选角导演和 AI 图像生成提示词专家。为欧美女频短剧「女主」生成一个 2×2 选角联系人表（casting contact sheet）的生图提示词。

严格按以下格式生成 imagePrompt（英文）和 imagePromptCn（中文）：

布局要求：
- 横向 16:9，2×2 网格，白色细线分隔
- 四个格分别放四位 18-22 岁绝美白人女性，每人只占一格，adult woman
- 顺序：左上B1、右上B2、左下B3、右下B4
- 图内不得有文字、标签、字母、数字

⚠️ 长发强制要求：四人必须全部都是长发，发长至少过胸或到腰。绝对禁止短发、齐肩发、丸子头、盘发、马尾。

四个候选人是欧美女频短剧女主的不同美型方向——四个都极美但美法不同，通过脸型、发色、眼神、气质形成差异。目标审美：贵气、明艳、破碎感、温柔、可共情。不是游戏角色、反派或网红写真。

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
- 正面头肩特写，脸居中，平视，直视镜头，双唇闭合，无表情无动作无手势（no pose, no action, no hand gestures）
- 纯白色无缝背景（clean white seamless background），不要任何场景、道具、建筑
- 无皱纹、无雀斑、无痣、无瑕疵
- 哈苏 X2D 100C，100mm f/2.8 微距镜头，ISO 100，快门 1/125s，32K，HDR10+

输出 JSON：
{"imagePrompt":"英文提示词","imagePromptCn":"中文提示词"}`;
}

function buildFemaleVillainPrompt(): string {
  return `你是一个顶尖的影视选角导演和 AI 图像生成提示词专家。为欧美女频短剧「女反派」生成一个 2×2 选角联系人表（casting contact sheet）的生图提示词。

核心原则：反派不是丑角，而是"精致、危险、有压迫感、有嫉妒心、有阶级感"的高颜值女性角色。所有候选人都必须是 adult woman、长发、极美、真实剧照感。

严格按以下格式生成 imagePrompt（英文）和 imagePromptCn（中文）：

布局要求：
- 横向 16:9，2×2 网格，白色细线分隔
- 四个格分别放四位 18-35 岁绝美白人女性反派，每人只占一格，adult woman
- 顺序：左上V1、右上V2、左下V3、右下V4
- 图内不得有文字、标签、字母、数字

⚠️ 长发强制要求：四人必须全部都是长发，发长至少过胸或到腰。绝对禁止短发、齐肩发、丸子头、盘发。

四个反派候选人模板（四种不同类型的恶女）：

V1（左上）豪门恶毒千金：
- 长金发或蜜金色大波浪长发（long golden or honey-blonde voluminous waves to lower back）
- 精致鹅蛋脸（refined oval face），浅色眼睛（pale blue or gray eyes），妆容高级精致
- 表情：微笑里带轻蔑，像在羞辱女主（subtle condescending smirk, like looking down on the heroine）
- 气质：傲慢、贵气、嫉妒、控制欲强（arrogant, noble, jealous, controlling）
- 适合剧情：订婚宴羞辱女主、抢男主、家族压迫
- 服装：白色或浅金色高定礼服领口

V2（右上）冷艳继姐/假千金：
- 深棕或黑色长发，顺直或大波浪（dark brown or black long hair, sleek or loose waves to waist）
- 五官锐利精致但不能男性化，脸型偏窄椭圆，眼神冰冷（sharp refined features, narrow oval face, cold gaze）
- 表情：克制但嘴角轻微冷笑（restrained expression with a subtle cold smirk）
- 气质：聪明、阴险、算计、表面优雅（intelligent, scheming, calculating, outwardly elegant）
- 适合剧情：陷害女主、伪装受害者、身份争夺
- 服装：黑色或深紫礼服领口

V3（左下）成熟豪门夫人/继母型反派：
- 深栗色或暗红棕长发（rich chestnut or dark auburn long hair to waist），优雅成熟
- 更成熟但保持极高颜值，不是老态而是雍容华贵（mature but stunningly beautiful, regal not aged）
- 表情：端庄、冷漠、压迫感强（dignified, cold, intense oppressive gaze）
- 气质：权力感、阶级压迫、操控家庭（power, class oppression, family manipulation）
- 适合剧情：逼迫分手、家族交易、威胁女主
- 服装：深红或墨绿华贵礼服领口

V4（右下）白莲花情敌：
- 浅棕或柔金长发（light brown or soft golden long hair to waist），外表温柔无害
- 柔和心形脸（soft heart-shaped face），大眼睛（large innocent-looking eyes），清纯妆容
- 表情：楚楚可怜但眼神里藏恶意（vulnerable pitiful expression with hidden malice in the eyes）
- 气质：伪善、装可怜、嫉妒、情绪操控（hypocritical, playing victim, jealous, emotionally manipulative）
- 适合剧情：假装受伤、栽赃女主、博取男主同情
- 服装：浅粉或白色柔美裙装领口

共同要求（必须全部满足）：
- 四个反派都必须是长发，发长过胸
- 四个人都要极美，但不是女主的观众缘美，而是带危险感、压迫感或伪善感的美
- 必须像真实欧美短剧演员剧照，不要像游戏角色、动漫角色、AI娃娃
- 脸型可以更锐利，但不要方下颌、男性化、老气
- 妆容可以比女主更精致、更强势，但不要夜店网红风
- 服装：黑色礼服、白色高定裙、深红礼服、豪门宴会装
- 表情要有戏：轻蔑笑、冷笑、伪善微笑、压迫凝视
- 四人脸型、发色、眼神、气质必须明显不同

严禁生成（negative prompt）：
ugly villain, monster, witch-like, old hag, masculine jaw, square jaw, harsh wrinkles, cartoon evil smile, exaggerated evil face, anime, game character, fantasy NPC, plastic doll face, influencer nightclub makeup, overly sexy, cheap seductive look, distorted face, crossed eyes, asymmetrical eyes, short hair, bob cut, pixie cut

哈苏 X2D 100C，100mm f/2.8 微距镜头，ISO 100，快门 1/125s，32K，HDR10+，正面头肩特写，脸居中，平视，无表情无动作无手势，纯白色无缝背景。

输出 JSON：
{"imagePrompt":"英文提示词","imagePromptCn":"中文提示词"}`;
}

function buildMaleLeadPrompt(): string {
  return `你是一个顶尖的影视选角导演和 AI 图像生成提示词专家。为欧美女频短剧「男主」生成一个 2×2 选角联系人表（casting contact sheet）的生图提示词。

核心原则：男主必须有"第一眼心动感"——不是普通商务头像，不是证件照，不是中年企业家。要像短剧封面男主、浪漫小说封面男主、豪门霸总剧男主。每位候选人都必须是 extremely handsome adult man（27-35岁），有权力感、保护欲、禁欲感、深情感。

严格按以下格式生成 imagePrompt（英文）和 imagePromptCn（中文）：

布局要求：
- 横向 16:9，2×2 网格，白色细线分隔
- 四个格分别放四位男性，每人只占一格，extremely handsome adult man, age 27-35
- 顺序：左上M1、右上M2、左下M3、右下M4
- 图内不得有文字、标签、字母、数字
- 纯白色无缝背景（clean white seamless background），不要任何场景、建筑、道具
- 正面头肩特写，脸居中，平视，直视镜头，双唇闭合，无表情无动作无手势（standard front-facing head-and-shoulders portrait, no pose, no action, no hand gestures）
- 哈苏 X2D 100C 摄影质感，100mm f/2.8 微距镜头，ISO 100，快门 1/125s，32K，HDR10+

四个男主候选人模板：

M1（左上）顶级冷峻霸总：
- 28-34岁，黑色或深棕短发（dark brown or black short hair），浓密整洁有造型
- 深邃眼睛（deep-set intense eyes, dark brown or steel blue），高鼻梁（high straight nose bridge），清晰下颌线（sculpted jawline），精致唇形
- 宽肩挺拔，黑色高定西装（black bespoke suit），白衬衫（white dress shirt），气质禁欲贵气
- 表情冷静克制，眼神有压迫感和隐藏深情（controlled intensity, hidden depth of emotion）
- 气质：豪门继承人/财阀掌权者，令人心动的强大吸引力
- 适合剧情：契约婚姻、办公室对峙、霸道救场、豪门压迫

M2（右上）金发贵族男主：
- 27-33岁，深金或浅棕金微卷短发（dark golden or light brown-gold short hair, slight elegant wave）
- 蓝色或灰蓝眼睛（piercing blue or gray-blue eyes），精致贵族脸（aristocratic refined features），干净高级
- 像 old money heir，气质绅士、贵气、克制，温柔但疏离，危险的温柔（dangerously tender）
- 适合剧情：宴会、订婚、家族交易、温柔救赎

M3（左下）野性狼人/暗黑守护者：
- 28-36岁，深色或银灰中短发（dark or silver-gray medium-short hair），整洁有型
- 轮廓强但依然英俊（strong yet undeniably handsome），宽肩高大
- 眼神锐利危险但保护欲强（sharp intense eyes, dangerous yet fiercely protective）
- 气质：野性、占有欲、禁忌恋男主魅力

M4（右下）温柔救赎型男主：
- 27-34岁，棕色短发（rich brown short hair），浓密干净
- 精致柔和但男性化的五官（refined soft but masculine features），清澈深情的眼睛（clear warm eyes, deep with emotion）
- 干净成熟，温柔可靠，但必须有足够的心动感

共同要求（必须全部满足）：
- 每位候选人都必须是 extremely handsome adult man，第一眼心动
- 必须像欧美女频短剧男主、浪漫小说封面男主，不是商务头像不是证件照
- 年龄感 27-35岁，年轻成熟，不要中年感
- 头发浓密干净有造型
- 五官精致立体但真实
- 眼神必须有情绪张力
- 四个人通过发色、气质和眼神区分

严禁生成（negative prompt）：
average businessman, corporate headshot, passport photo, plain office portrait, middle-aged CEO, old man, tired face, rough skin, receding hairline, thin hair, heavy wrinkles, dull eyes, ordinary man, uncle vibe, greasy face, excessive stubble, bodybuilder, cheap suit, anime, game character, plastic skin, wax figure

输出 JSON：
{"imagePrompt":"英文提示词","imagePromptCn":"中文提示词"}`;
}

function buildMaleVillainPrompt(): string {
  return `你是一个顶尖的影视选角导演和 AI 图像生成提示词专家。为欧美女频短剧「男反派」生成一个 2×2 选角联系人表（casting contact sheet）的生图提示词。

核心原则：男反派不是丑角，而是"体面、危险、有控制欲、有背叛感、有压迫感"的高颜值男性角色。所有候选人都必须是 adult man（30-45岁）、高颜值、真实剧照感。

严格按以下格式生成 imagePrompt（英文）和 imagePromptCn（中文）：

布局要求：
- 横向 16:9，2×2 网格，白色细线分隔
- 四个格分别放四位男性反派，每人只占一格，adult man, age 30-45
- 顺序：左上A1、右上A2、左下A3、右下A4
- 图内不得有文字、标签、字母、数字

四个男反派候选人模板：

A1（左上）伪善未婚夫/背叛型前任：
- 金棕或深棕短发，外表干净英俊
- 五官精致，笑容温和但虚伪
- 表情：礼貌微笑里带冷漠和算计
- 气质：体面、虚伪、自私、会背叛女主

A2（右上）冷酷财阀反派/商业敌人：
- 黑色短发，深色眼睛，西装严整
- 轮廓锐利，眼神冷硬
- 表情：压迫凝视、轻蔑冷笑
- 气质：权力、威胁、控制欲、利益至上

A3（左下）危险黑帮/狼人敌对首领：
- 深色或暗银中短发，强壮但不夸张
- 眉骨重，眼神危险带野性
- 表情：低沉、凶狠、占有欲强
- 气质：危险、侵略性、暴力压迫、黑暗魅力

A4（右下）优雅操控者/家族长子型反派：
- 深栗色或黑色短发，穿高级西装
- 面容英俊成熟，气质很贵
- 表情：平静、冷淡、像在布局
- 气质：阴谋、操控、阶级压迫、冷血理性

共同要求（必须全部满足）：
- 四个男反派都必须是 adult man，年龄感 30-45 岁
- 都要高颜值，但帅得危险、压迫、虚伪或冷血
- 必须像真实欧美短剧演员剧照
- 四人通过反派类型区分：背叛型、权力型、暴力型、操控型
- 脸居中，平视，直视镜头，无表情无动作无手势
- 纯白色无缝背景，不要任何场景

严禁生成（negative prompt）：
ugly villain, monster, scarred monster face, old greasy man, exaggerated evil grin, cartoon villain, anime, game character, fantasy NPC, plastic skin, wax figure, bodybuilder, huge muscles, heavy beard, dirty face, nightclub style, distorted face

哈苏 X2D 100C，100mm f/2.8 微距镜头，ISO 100，快门 1/125s，32K，HDR10+，正面头肩特写，白色无缝背景。

输出 JSON：
{"imagePrompt":"英文提示词","imagePromptCn":"中文提示词"}`;
}

function buildMedievalCostumePrompt(): string {
  return `你是一个顶级高定服装设计师和 AI 图像生成提示词专家。每次从动态设计变量池中随机组合四套中世纪女频宫廷服装，像"高定秀场 + 中世纪女频宫廷剧 + 吸血鬼/狼人贵族题材"。不是固定模板，每次都是全新设计。

⚠️ 核心：纯服装设计展示，使用白色半透明无脸模特（white translucent faceless mannequin, no human face, no hair, no real person）。

展示格式：
- 横向 16:9，2×2 网格，白色细线分隔
- 白色半透明无脸模特，纯白无缝背景，中性站姿，全身正面从头到脚
- 顺序：D1左上、D2右上、D3左下、D4右下
- 图内不得有任何文字、标签、数字
- 哈苏 X2D 100C，85mm 定焦镜头，柔和影棚灯光
- 性感方向：高贵性感、危险诱惑、宫廷欲感（elegant sensual luxury），严禁低俗暴露

设计变量池（每套服装从各池中选取1项，四套之间不重复）：

【剧情身份池】(10选4，不重复)
sacrificial bride / wolf queen / vampire duchess / exiled princess / fallen saint / witch inquisitor / kingdom heiress / secret mistress / revenge widow / prophesied one

【剧情场景池】(10选4，不重复)
wedding / coronation / trial / masquerade ball / escape / post-war return / secret pact / ritual ceremony / court humiliation / identity reveal

【主轮廓池】(8选4，不重复)
empire gown / corset gown / mermaid gown / ball gown / cloak dress / split-front gown / high-low gown / layered robe gown

【领口池】(8选4，不重复)
deep V / sweetheart neckline / off-shoulder / high lace collar / jeweled standing collar / square neckline / one-shoulder sculptural / sheer illusion plunge neckline

【袖型池】(7选4，不重复)
transparent lace sleeves / bell sleeves / cape sleeves / detached opera sleeves / puff sleeves / fitted long sleeves / sleeveless with shoulder jewelry

【裙摆结构池】(8选4，不重复)
high front slit / asymmetric overskirt / cathedral train / layered tulle / pleated velvet skirt / petal hem / split front / heavy court train

【纹样符号池】(10选4，不重复)
moon phase / wolf crest / thorn rose / star crown / blood ruby / black swan / silver vines / sacred cross / serpent chain / raven feather

【材质色彩池】(每套选1-2主色，四套覆盖至少4种不同主色调)
ivory lace / black velvet / burgundy satin / champagne brocade / silver silk / midnight blue chiffon / emerald velvet / pearl tulle / blood red organza / smoky gray lace / deep plum silk / gold metallic brocade / shadow navy velvet / blush pink tulle / onyx black silk

⚠️ 差异评分机制（必须遵守）：
满分10分。如果任意两套在主轮廓、领口、袖型、裙摆中有3项以上相同→差异分<6→重新组合。目标差异分≥8分。

⚠️ 重复惩罚机制：
不要每次都用牺牲新娘+黑色王后+复仇公爵+加冕女王那套组合。每次从身份池和轮廓池选全新的组合，确保和上一轮不同。

每套服装输出格式：
D1（左上）：[从各池选的身份] + [场景]
- 概念：[一句话设计概念]
- 轮廓：[从轮廓池选]
- 领口：[从领口池选]
- 袖型：[从袖型池选]
- 裙摆：[从裙摆池选]
- 纹样：[从纹样池选]
- 记忆点：[1个强视觉记忆点]
- 色彩：[主色+辅色]
- 关键词：[英文关键词串]

D2-D4 同样格式，四套身份/轮廓/领口/袖型/裙摆/纹样各不同。

统一风格：
高预算欧美中世纪奇幻剧真实影视戏服设计稿，不是游戏皮肤、动漫Cosplay、廉价影楼装。像 The Vampire Diaries 贵族舞会 + Game of Thrones 宫廷 + 高定秀场。华丽、性感、贵气、有身份感和剧情感。

Negative prompt:
real person, human face, hair, makeup, portrait, character face, anime, cosplay, game armor, fantasy NPC, cheap costume, Halloween costume, plastic fabric, low quality, same dress repeated, only color variation, modern dress, sci-fi outfit, bikini armor, messy design, flat design, doll face, 3d character, wig, visible head, visible skin, realistic human skin, eyebrows, eyes, lips, nose, lingerie, vulgar, cheap sexy, nightclub dress, stripper outfit, fetish wear, latex, pornographic, same silhouette repeated, only color swap, no structure difference

输出 JSON：
{"imagePrompt":"英文提示词","imagePromptCn":"中文提示词"}`;
}

function buildMedievalMaleCostumePrompt(): string {
  return `你是一个顶级高定男装设计师和 AI 图像生成提示词专家。每次从动态设计变量池中随机组合四套中世纪女频文风男主服装，像"高定秀场 + 中世纪女频宫廷剧 + 吸血鬼/狼人贵族题材"。不是固定模板，每次都是全新设计。

核心：纯服装设计展示，使用白色半透明无脸男性模特（white translucent faceless male mannequin, no human face, no hair, no real person）。

展示格式：
- 横向 16:9，2×2 网格，白色细线分隔
- 白色半透明无脸男性模特，纯白无缝背景，中性站姿，全身正面从头到脚
- 顺序：M1左上、M2右上、M3左下、M4右下
- 图内不得有任何文字、标签、数字
- 哈苏 X2D 100C，85mm 定焦镜头，柔和影棚灯光
- 设计方向：宽肩窄腰长腿、强轮廓、高领、披风、皮革、丝绒、银线刺绣、禁欲危险

设计变量池（每套服装从各池中选取1项，四套之间不重复）：

【剧情身份池】(10选4，不重复)
wolf king / vampire prince / cold duke / cursed knight / royal heir / exiled prince / templar inquisitor / dark regent / war hero general / forbidden guardian

【剧情场景池】(10选4，不重复)
coronation / masquerade ball / post-war return / royal trial / secret pact / wedding rescue / rain rescue / throne confrontation / family judgment / identity reveal

【主轮廓池】(8选4，不重复)
long noble coat / high-collar prince coat / military ceremonial coat / fitted leather coat / layered cloak outfit / embroidered court suit / knight-inspired formalwear / asymmetrical cape coat

【领口结构池】(8选4，不重复)
high standing collar / open collar with cravat / jeweled collar / fur-trimmed collar / armored collar detail / deep V inner shirt / structured mandarin collar / silver chain collar

【肩部设计池】(8选4，不重复)
broad structured shoulders / cape shoulders / fur shoulder mantle / leather shoulder guards / jeweled shoulder chain / military epaulettes / asymmetrical shoulder cape / wolf-fur mantle

【下装结构池】(8选4，不重复)
tailored dark trousers with high boots / ceremonial riding pants / leather trousers with silver buckle / layered waist sash / embroidered belt structure / asymmetrical waist drape / long split coat hem / gothic high boots

【披风/外套结构池】(8选4，不重复)
floor-length heavy cloak / half cape / asymmetrical cloak / heavy velvet cape / fur-lined mantle / split back coat / layered battle cloak / detachable royal cape

【纹样符号池】(10选4，不重复)
wolf crest / vampire sigil / black rose / silver thorns / royal lion / moon phase / raven feather / blood ruby clasp / sacred cross / serpent chain

【材质色彩池】(每套选1-2主色，四套覆盖至少4种不同主色调)
black velvet / dark leather / midnight blue brocade / burgundy satin lining / silver embroidery / charcoal wool / smoky gray silk / deep emerald velvet / antique gold trim / blood red inner lining / shadow navy wool / onyx black silk / deep wine leather / icy silver brocade

差异评分机制（必须遵守）：
满分10分。任意两套在主轮廓、领口结构、肩部设计、披风结构中有3项以上相同→差异分<6→重新组合。目标≥8分。

重复惩罚机制：
不要每次都出黑色狼王披风+吸血鬼王子礼服+骑士战袍+金边公爵外套。每次从身份池和轮廓池选全新组合。

每套服装输出格式：
M1（左上）：[身份] + [场景]
- 概念：[一句话设计概念]
- 轮廓：[从轮廓池选]
- 领口：[从领口池选]
- 肩部：[从肩部池选]
- 下装：[从下装池选]
- 披风：[从披风池选]
- 纹样：[从纹样池选]
- 记忆点：[1个强视觉记忆点，如超长黑披风/狼毛肩披/血红内衬/银链胸饰/徽章扣]
- 色彩：[主色+辅色]
- 关键词：[英文关键词串]

M2-M4同样格式，四套身份/轮廓/领口/肩部/披风/纹样各不同。

统一风格：
高预算欧美中世纪奇幻剧真实影视戏服设计稿。华丽、强势、禁欲、贵气、危险、有保护欲。女频男主吸引力：宽肩窄腰长腿、高领披风、皮革丝绒、银线刺绣。

禁止：
现代商务西装、普通衬衫西裤、游戏重甲、动漫Cosplay、廉价王子装、海盗装、牛仔装、夜店风、裸露过度。

Negative prompt:
real person, human face, hair, makeup, portrait, character face, modern business suit, corporate suit, office suit, tuxedo, ordinary shirt, anime, cosplay, game armor, heavy armor, fantasy NPC, pirate costume, cowboy outfit, cheap costume, Halloween costume, plastic fabric, low quality, same outfit repeated, only color variation, modern casual clothes, sci-fi outfit, flat design, no structure, messy design, nightclub outfit, vulgar sexy, shirtless, bodybuilder, doll face, 3d character

输出 JSON：
{"imagePrompt":"英文提示词","imagePromptCn":"中文提示词"}`;
}

const promptBuilders: Record<string, () => string> = {
  female_lead: buildFemaleLeadPrompt,
  female_villain: buildFemaleVillainPrompt,
  male_lead: buildMaleLeadPrompt,
  male_villain: buildMaleVillainPrompt,
  medieval_costume: buildMedievalCostumePrompt,
  medieval_male_costume: buildMedievalMaleCostumePrompt,
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { roleType, customRequirement } = await request.json();

    const builder = promptBuilders[roleType];
    if (!builder) {
      return NextResponse.json({ error: "未知角色类型" }, { status: 400 });
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

    // 默认年龄：女性=22岁，男性=25岁；自定义要求可覆盖
    const isMaleType = roleType === "male_lead" || roleType === "male_villain";
    const defaultAge = isMaleType ? "25" : "22";
    const ageLabel = isMaleType ? "男性" : "女性";
    const defaultAgeRule = `\n\n⚠️ 年龄要求：${ageLabel}角色默认年龄 ${defaultAge} 岁。如果用户自定义要求中指定了年龄，以用户指定为准；否则严格使用默认年龄 ${defaultAge} 岁。`;

    const systemPrompt = builder() + defaultAgeRule + (customRequirement ? `

用户自定义要求（必须严格遵守）：${customRequirement}` : "");

    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "请生成 2×2 选角联系表提示词。" },
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
