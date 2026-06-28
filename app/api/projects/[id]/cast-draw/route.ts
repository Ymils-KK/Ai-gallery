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
- 画面风格：cinematic romance drama still / luxury romance poster，不是白底证件照
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
- 服装：浅灰或深蓝高级西装，精致袖扣和领带

M3（左下）野性狼人/暗黑守护者：
- 28-36岁，深色或银灰中短发（dark or silver-gray medium-short hair），整洁有型
- 轮廓强但依然英俊（strong yet undeniably handsome），宽肩高大
- 眼神锐利危险但保护欲强（sharp intense eyes, dangerous yet fiercely protective）
- 气质：野性、占有欲、禁忌恋男主魅力，不是反派大叔不是粗糙老气
- 适合剧情：狼人题材、雨夜救人、战斗保护、禁忌恋
- 服装：深色敞领衬衫或高级皮夹克，随性但有力量感

M4（右下）温柔救赎型男主：
- 27-34岁，棕色短发（rich brown short hair），浓密干净
- 精致柔和但男性化的五官（refined soft but masculine features），清澈深情的眼睛（clear warm eyes, deep with emotion）
- 干净成熟，温柔可靠，但必须有足够的心动感，不是普通路人
- 像医生/律师/旧爱男主，但极帅有张力
- 适合剧情：医院守护、法庭辩护、旧情复燃、默默守护
- 服装：浅色衬衫或高级羊绒大衣，干净斯文

共同要求（必须全部满足）：
- 每位候选人都必须是 extremely handsome adult man，第一眼心动
- 必须像欧美女频短剧男主、浪漫小说封面男主，不是商务头像不是证件照
- 年龄感 27-35岁，年轻成熟，不要中年感、不要沧桑大叔
- 头发浓密、干净、有造型，不要发际线后退、不要稀少
- 五官精致立体但真实：高鼻梁、深邃眼窝、清晰下颌线、好看唇形
- 皮肤状态好但真实，不要油腻、粗糙、老态
- 身材气质：宽肩、挺拔、禁欲、贵气、保护欲
- 眼神必须有情绪张力：深情、克制、占有欲、压迫感、危险的温柔
- 服装高级：黑色西装、白衬衫、敞领衬衫、羊绒大衣、暗色礼服
- 四个人通过发色、气质和眼神区分，不要同一张脸换衣服

严禁生成（negative prompt）：
average businessman, corporate headshot, passport photo, plain office portrait, middle-aged CEO, old man, tired face, rough skin, receding hairline, thin hair, heavy wrinkles, dull eyes, boring face, ordinary man, uncle vibe, greasy face, excessive stubble, heavy beard, bodybuilder, cheap suit, villain thug, criminal face, harsh ugly face, anime, game character, plastic skin, wax figure, gym model, influencer, nightclub style, feminine face, weak jaw, distorted eyes, bad hands, long hair past shoulders

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
- 金棕或深棕短发（golden-brown or dark brown short hair），外表干净英俊
- 五官精致（refined handsome features），笑容温和但虚伪（warm smile that doesn't reach the eyes）
- 表情：礼貌微笑里带冷漠和算计（polite smile with cold calculating eyes）
- 气质：体面、虚伪、自私、会背叛女主（decent-looking, hypocritical, selfish, betrayer）
- 适合剧情：出轨、退婚、羞辱女主、家族联姻
- 服装：米色或浅灰高级西装

A2（右上）冷酷财阀反派/商业敌人：
- 黑色短发（black short hair），深色眼睛（dark eyes），西装严整
- 轮廓锐利（sharp jawline），眼神冷硬（cold hard stare）
- 表情：压迫凝视、轻蔑冷笑（oppressive glare, slight contemptuous sneer）
- 气质：权力、威胁、控制欲、利益至上（power, threat, control, profit above all）
- 适合剧情：商业打压、逼迫交易、威胁男主女主
- 服装：黑色西装、深色衬衫，一丝不苟

A3（左下）危险黑帮/狼人敌对首领：
- 深色或暗银中短发（dark or dark silver medium-short hair），强壮但不夸张
- 眉骨重（heavy brow ridge），眼神危险带野性（dangerous wild eyes）
- 表情：低沉、凶狠、占有欲强（intense, fierce, possessive）
- 气质：危险、侵略性、暴力压迫、黑暗魅力（dangerous, aggressive, violent oppression, dark charisma）
- 适合剧情：绑架、追杀、禁忌威胁、狼人势力冲突
- 服装：深色皮夹克或黑色衬衫

A4（右下）优雅操控者/家族长子型反派：
- 深栗色或黑色短发（dark chestnut or black short hair），穿高级西装
- 面容英俊成熟（handsome mature face），气质很贵（aristocratic air）
- 表情：平静、冷淡、像在布局（calm, cold, calculating, like he's always three steps ahead）
- 气质：阴谋、操控、阶级压迫、冷血理性（scheming, manipulating, class oppression, cold-blooded rational）
- 适合剧情：家族夺权、继承权斗争、秘密交易、幕后操控
- 服装：深蓝或藏青高级西装

共同要求（必须全部满足）：
- 四个男反派都必须是 adult man，年龄感 30-45 岁
- 都要高颜值，但帅得危险、压迫、虚伪或冷血
- 必须像真实欧美短剧演员剧照，不要像游戏NPC或动漫角色
- 服装：黑色西装、深色衬衫、贵族风大衣、商务权力套装
- 表情要有戏：虚伪微笑、轻蔑冷笑、威胁凝视、冷静算计
- 四人通过反派类型区分：背叛型、权力型、暴力型、操控型
- 脸居中，平视，直视镜头，无表情无动作无手势（no pose, no action, no hand gestures）
- 纯白色无缝背景（clean white seamless background），不要任何场景

严禁生成（negative prompt）：
ugly villain, monster, scarred monster face, old greasy man, exaggerated evil grin, cartoon villain, anime, game character, fantasy NPC, plastic skin, wax figure, bodybuilder, huge muscles, heavy beard, dirty face, nightclub style, distorted face, crossed eyes, bad teeth, long hair, bald, eyepatch, facial scars

哈苏 X2D 100C，100mm f/2.8 微距镜头，ISO 100，快门 1/125s，32K，HDR10+，正面头肩特写，白色无缝背景。

输出 JSON：
{"imagePrompt":"英文提示词","imagePromptCn":"中文提示词"}`;
}

function buildMedievalCostumePrompt(): string {
  return `你是一个顶尖的影视服装设计师和 AI 图像生成提示词专家。为欧美女频中世纪幻想短剧生成一个 2×2 服装设计展示表（costume design showcase sheet）的生图提示词。

核心原则：这是服装设计展示，不是人物写真。使用白色半透明无脸人体模特（white translucent faceless mannequin）展示服装。

性感华丽方向（elegant sensual luxury）：
- 允许并鼓励低胸、露肩、束腰、高开衩、贴身剪裁
- 目标是"高贵性感、危险诱惑、宫廷欲感"（elegant sensual, seductive royal gown, gothic romance），不是廉价暴露
- 胸口设计：sweetheart neckline、deep V neckline、off-shoulder neckline、corset bodice、lace bust detail
- 腰线必须明显：tight corset waist、narrow waist silhouette、structured bodice、metal corset belt
- 裙摆可高开衩：high slit skirt、asymmetrical overskirt、flowing train with slit
- 材质更华丽：black velvet、burgundy satin、transparent black lace、silver embroidery、gemstone chains
- 审美参考：高预算中世纪女频剧/吸血鬼宫廷剧的性感礼服（The Vampire Diaries ball scenes, gothic romance drama）

四套服装必须从轮廓、领口、袖型、裙摆、披风、材质、纹样上明显不同，不能只是换颜色。

严格按以下格式生成 imagePrompt（英文）和 imagePromptCn（中文）：

展示要求：
- 横向 16:9，2×2 网格，白色细线分隔
- 白色半透明无脸人体模特（white translucent faceless mannequin），无真人面孔、无头发、无妆容
- 顺序：D1左上、D2右上、D3左下、D4右下
- 图内不得有文字、标签、字母、数字
- 纯白色无缝背景，中性站姿，全身正面展示，从头到脚不裁剪
- 哈苏 X2D 100C，85mm 定焦，柔和影棚灯光

⚠️ 去重规则（必须严格遵守）：
如果四套服装只是颜色不同但轮廓/领口/袖型/裙摆/披风结构相似，判定为不合格。
每套服装至少有一个强设计记忆点（signature design element），如：
- 超长披风（dramatic floor-length cape）
- 不对称外裙（asymmetrical overskirt）
- 高领宝石项圈（high jeweled collar）
- 透明蕾丝长袖（sheer lace bishop sleeves）
- 金属雕花束腰（metal filigree corset belt）
- 月亮/狼纹/荆棘/星冠专属纹样刺绣
- 多层薄纱拖尾（layered chiffon train）

四套服装设计（必须从结构上不同，且每套加入高贵性感元素）：

D1（左上）月光圣婚礼服（Moonlight Sacrificial Bride Gown）：
- 轮廓：低胸心形领紧身束腰帝国裙（low-cut sweetheart neckline fitted empire waist gown），长拖尾
- 领口：深陷心形领（deep sweetheart neckline），蕾丝边饰勾勒胸线（lace-trimmed bust detail），锁骨全露
- 袖型：透明蕾丝紧身长袖（sheer lace fitted bishop sleeves），若隐若现肌肤，袖口微喇珍珠扣
- 裙摆：多层象牙白半透明薄纱叠层（layered semi-sheer ivory chiffon），行走时若隐若现腿部
- 材质：象牙白丝缎（ivory silk satin），尚蒂伊蕾丝（Chantilly lace），透明薄纱（sheer tulle）
- 纹样：弯月与星辰银线刺绣（crescent moon and star embroidery in silver thread），珍珠缀满胸线
- 设计记忆点：超长透明头纱披风（sheer floor-length veil cape）+ 胸线珍珠刺绣——性感但纯净神圣
- 气质：神圣、纯净、被献祭的新娘感，elegant sensual
- 关键词：low-cut sweetheart empire gown, sheer lace fitted bishop sleeves, lace-trimmed bust detail, moon embroidery, cathedral train, semi-sheer layered chiffon, pearl-studded veil cape, ethereal sensual bride

D2（右上）暗黑王后披风裙（Dark Queen Cloak Gown）：
- 轮廓：极度紧身束腰鱼尾裙（ultra-fitted corset mermaid gown），宽肩披风，蜂腰轮廓
- 领口：深 V 露肩设计（deep V off-shoulder neckline），黑色蕾丝镶边，锁骨肩线全露
- 袖型：披风袖（detachable floor-length cape sleeves），肩部金属狼头扣，无内袖露肩
- 裙摆：紧身鱼尾展开（fitted mermaid flare），紧贴身体曲线至膝下展开
- 材质：黑色丝绒（black velvet），银线锦缎（silver brocade），暗色绸缎内衬
- 纹样：银线狼纹族徽刺绣于胸下腰封（silver wolf crest embroidery on underbust corset），暗银金属雕花腰封
- 设计记忆点：超宽及地披风（oversized floor-length cape）+ 露肩深V+金属束腰——高贵性感女王权力
- 气质：权力、压迫、狼族王后、seductive royal power
- 关键词：black velvet off-shoulder mermaid gown, deep V neckline, silver wolf crest underbust corset, oversized floor-length cape, metal wolf clasp, tight corset waist, gothic queen sensual luxury

D3（左下）血蔷薇复仇裙（Blood Rose Revenge Gown）：
- 轮廓：极致紧身不对称鱼尾裙（ultra-fitted asymmetrical mermaid gown），右侧高开衩至大腿上部
- 领口：深低胸心形领覆以透明黑蕾丝（deep low-cut sweetheart neckline with sheer black lace illusion panel），胸线明显
- 袖型：分离式黑色透明蕾丝歌剧长手套袖（detached sheer black lace opera-length glove sleeves），从肘垂落
- 裙摆：不对称外裙（asymmetrical overskirt），右侧高开衩露腿，左侧层叠荷叶边
- 材质：酒红丝缎（burgundy silk satin），黑色尚蒂伊蕾丝（black Chantilly lace），透明黑蕾丝
- 纹样：玫瑰荆棘黑丝刺绣从胸口盘旋至裙摆（rose and thorn embroidery），红宝石胸链垂于领口
- 设计记忆点：高开衩+低胸蕾丝+红宝石胸链+黑蕾丝长手套——最性感的复仇女神裙
- 气质：危险、艳丽、复仇、seductive noble vengeance
- 关键词：ultra-fitted burgundy mermaid gown, deep sweetheart neckline with black lace illusion, high front slit to thigh, detached opera-length lace gloves, ruby body chain, rose thorn embroidery, seductive revenge heroine couture

D4（右下）星冠加冕礼服（Star Crown Coronation Ball Gown）：
- 轮廓：极度紧身束腰大裙摆舞会裙（ultra-tight corset ball gown），蜂腰轮廓，超大裙撑
- 领口：露肩深心形珠宝领（off-shoulder deep sweetheart neckline with jeweled trim），胸前珠宝链饰
- 袖型：透明薄纱短披肩袖（sheer tulle off-shoulder cap sleeves），镶星形珠宝，半透明露肩
- 裙摆：巨大多层裙摆（voluminous multi-layered ball gown skirt），前开衩隐约露腿，长拖尾
- 材质：香槟金丝缎（champagne gold silk satin），金线织锦（gold brocade），星芒亮片，透明薄纱
- 纹样：星芒与皇冠纹样金线刺绣（star burst and crown pattern in gold embroidery），胸前星形珠宝链
- 设计记忆点：极度束腰蜂腰+露肩深心形领+珠宝胸链+星形肩饰——命定女王的华丽性感
- 气质：明艳、尊贵、命定女王、radiant sensual coronation
- 关键词：ultra-tight corset ball gown, off-shoulder deep sweetheart neckline, jeweled bust chain, sheer tulle cap sleeves, star burst gold embroidery, grand voluminous skirt, wasp waist silhouette, radiant sensual princess

性感过滤标准（sexy elegance filter）：
合格方向（elegant sensual）: elegant sensual gown, seductive royal dress, gothic romance luxury, luxurious low-cut corset dress, high-end TV drama costume
不合格方向（vulgar — 严禁）: vulgar sexy, lingerie, bikini armor, nightclub dress, pornographic outfit, cheap costume, latex, fetish wear, stripper dress, cheap sexy Halloween costume

共同要求：
- 四套服装必须看起来像高预算欧美中世纪奇幻剧的真实影视戏服设计稿（premium TV costume design sketch）
- 高贵性感：性感但优雅，诱惑但高级，像吸血鬼宫廷剧/中世纪女频剧的华丽礼服
- 质感至上：丝绒、丝缎、蕾丝、薄纱、刺绣、金属雕花、珍珠、宝石
- 展示在白色半透明无脸模特上（faceless translucent mannequin），无真人、无头发、无面孔
- 柔光影棚灯光，纯白无缝背景，中性站姿

Negative prompt（严禁生成）：
real person, human face, hair, makeup, portrait, character face, anime, cosplay, game armor, fantasy NPC, cheap costume, Halloween costume, plastic fabric, low quality, same dress repeated, only color variation, modern dress, sci-fi outfit, bikini armor, messy design, flat design, doll face, 3d character, wig, visible head, visible skin, realistic human skin, eyebrows, eyes, lips, nose, lingerie, vulgar, cheap sexy, nightclub dress, stripper outfit, fetish wear, latex, pornographic

输出 JSON：
{"imagePrompt":"英文提示词","imagePromptCn":"中文提示词"}`;
}

const promptBuilders: Record<string, () => string> = {
  female_lead: buildFemaleLeadPrompt,
  female_villain: buildFemaleVillainPrompt,
  male_lead: buildMaleLeadPrompt,
  male_villain: buildMaleVillainPrompt,
  medieval_costume: buildMedievalCostumePrompt,
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
