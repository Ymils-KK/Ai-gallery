import { NextResponse } from "next/server";
import { deepseekChatJSON } from "@/lib/deepseek";

// ====== 随机选择工具 ======

function pickRandom<T>(arr: readonly T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ====== 女主变量池 ======

const HEROINE_ARCHETYPES = [
  "bright golden heiress", "radiant romantic bride", "cold noble princess",
  "gentle innocent heroine", "resilient runaway duchess", "soft romantic healer",
  "mysterious gothic heroine", "noble vampire bride",
] as const;

const HEROINE_HAIRSTYLES = [
  "long loose waves", "soft romantic curls", "half-up half-down princess hair",
  "loose braided crown", "waist-length straight hair", "shoulder-length wavy hair",
  "layered curtain bangs with flowing hair", "side-parted elegant waves",
  "soft airy heroine waves", "sleek noble straight hair",
] as const;

const HEROINE_HAIR_COLORS = [
  "golden blonde", "champagne blonde", "ash blonde", "silver gray", "chestnut brown",
  "dark brunette", "auburn red", "rose brown", "black brown", "pale platinum blonde",
] as const;

const HEROINE_FACE_SHAPES = [
  "small refined oval face with soft jawline", "delicate heart-shaped face with narrow chin", "small diamond-oval face with soft cheeks",
  "petite round-oval face with youthful fullness", "slim elegant oval face with delicate V-line",
] as const;

const HEROINE_EYE_SHAPES = [
  "large clear blue doe eyes with long lashes", "soft hazel almond eyes with glossy catchlights", "slightly upturned romantic gray-green eyes",
  "bright blue-gray eyes with clean eyelids", "clear luminous green eyes", "large innocent light brown eyes",
] as const;

const HEROINE_NOSE_SHAPES = [
  "delicate straight narrow nose", "refined high slim nose bridge", "small elegant nose with refined tip",
  "elegant narrow nose with soft tip", "aristocratic straight nose with delicate bridge",
] as const;

const HEROINE_LIP_SHAPES = [
  "soft natural rose-pink full lips", "delicate rosebud lips with subtle gloss", "defined cupid bow lips in soft peach-pink",
  "slightly parted natural pink lips", "gentle plush lips with clean lip line",
] as const;

const HEROINE_BROW_SHAPES = [
  "soft arched brows", "natural feathered brows", "innocent straight brows",
  "elegant defined brows", "slightly melancholic brows",
] as const;

const HEROINE_FACIAL_STRUCTURES = [
  "soft feminine bone structure with youthful facial fullness", "delicate cheekbones with smooth cheeks", "refined aristocratic features with a small camera-friendly face",
  "fresh 21-year-old adult heroine face, clearly adult", "clean fair-skinned youthful heroine face with realistic complexion",
] as const;

const HEROINE_TEMPERAMENTS = [
  "warm and approachable", "soft romantic but confident", "noble and distant",
  "bright and charming", "wounded but resilient", "soft but strong",
  "mysterious but sympathetic", "innocent but fated",
] as const;

const HEROINE_AGE_IMPRESSIONS = [
  "21-year-old adult woman, clearly adult", "21-year-old adult woman, clearly adult", "21-year-old adult woman, clearly adult", "21-year-old adult woman, clearly adult",
] as const;

const HEROINE_NECKLINES = [
  "ivory satin tailored jacket collar", "white high-collar romantic blouse",
  "pearl embroidered fitted bodice collar", "soft blue elegant high-neck blouse",
  "champagne silk structured lapel", "silver embroidered noble standing collar",
  "pale blue pearl-trimmed collar", "cream ceremonial fitted jacket",
  "dark charcoal refined noble collar", "white court-style blouse collar",
] as const;

interface HeroineCandidate {
  archetype: string; hairstyle: string; hairColor: string;
  faceShape: string; eyeShape: string; noseShape: string;
  lipShape: string; browShape: string; facialStructure: string;
  temperament: string; ageImpression: string; neckline: string;
}

function drawHeroineCandidates(): HeroineCandidate[] {
  const archetypes = pickRandom(HEROINE_ARCHETYPES, 4);
  const hairstyles = pickRandom(HEROINE_HAIRSTYLES, 4);
  const hairColors = pickRandom(HEROINE_HAIR_COLORS, 4);
  const faceShapes = pickRandom(HEROINE_FACE_SHAPES, 4);
  const eyeShapes = pickRandom(HEROINE_EYE_SHAPES, 4);
  const noseShapes = pickRandom(HEROINE_NOSE_SHAPES, 4);
  const lipShapes = pickRandom(HEROINE_LIP_SHAPES, 4);
  const browShapes = pickRandom(HEROINE_BROW_SHAPES, 4);
  const facialStructures = pickRandom(HEROINE_FACIAL_STRUCTURES, 4);
  const temperaments = pickRandom(HEROINE_TEMPERAMENTS, 4);
  const ageImpressions = pickRandom(HEROINE_AGE_IMPRESSIONS, 4);
  const necklines = pickRandom(HEROINE_NECKLINES, 4);
  return [0, 1, 2, 3].map((i) => ({
    archetype: archetypes[i], hairstyle: hairstyles[i], hairColor: hairColors[i],
    faceShape: faceShapes[i], eyeShape: eyeShapes[i], noseShape: noseShapes[i],
    lipShape: lipShapes[i], browShape: browShapes[i], facialStructure: facialStructures[i],
    temperament: temperaments[i], ageImpression: ageImpressions[i], neckline: necklines[i],
  }));
}


function buildFemaleLeadPrompt(): string {
  const candidates = drawHeroineCandidates();
  const labels = ["B1 (top-left)", "B2 (top-right)", "B3 (bottom-left)", "B4 (bottom-right)"];
  const candidateLines = candidates.map((c, i) =>
    `${labels[i]}:
- archetype: ${c.archetype}
- hairstyle: ${c.hairstyle}
- hair color: ${c.hairColor}
- face shape: ${c.faceShape}
- eye shape: ${c.eyeShape}
- nose shape: ${c.noseShape}
- lip shape: ${c.lipShape}
- brow shape: ${c.browShape}
- facial structure: ${c.facialStructure}
- temperament: ${c.temperament}
- age impression: ${c.ageImpression}
- visible costume neckline: ${c.neckline}`
  ).join("\n\n");

  return `你是一个顶尖的影视选角导演和 AI 图像生成提示词专家。为欧美女频短剧「女主」生成一个 2×2 选角联系人表（casting contact sheet）的生图提示词。

严格按以下格式生成 imagePrompt（英文）和 imagePromptCn（中文）。

## 核心原则

这是女主人脸抽卡。四个候选人都必须是 21-year-old adult European woman、clearly adult、极美、欧美女频短剧女主感、观众缘强、真实剧照感。默认必须年轻、漂亮、皮肤白皙干净透亮，不要反派脸、网红脸、路人脸、AI 娃娃脸。

⚠️ 女主默认年龄与颜值强制规则：除非用户自定义要求明确指定更大年龄，否则四位女主候选都固定保持 21 岁成年女性外貌且必须明确是成年人；禁止出现 26-30、28-32 这类年龄描述。必须是非常漂亮的年轻女主脸，不能显老、不能苦相、不能疲惫、不能皮肤粗糙，不能有未成年感或娃娃感。

## 参考美貌标准

四位女主必须严格接近用户参考图那种高颜值欧美短剧 casting contact sheet 风格：纯白背景、2×2 白线分隔、干净棚拍柔光、上胸到头顶的肩上半身试镜照、双肩可见、头顶完整、脸不贴镜头、衣服干净高级但不抢脸。美貌标准是小而精致的脸、干净对称的五官、清澈大眼、长睫毛、柔软饱满但自然的粉色嘴唇、细窄高鼻梁、精致小鼻尖、柔和脸部线条、干净发际线、蓬松自然长发、白皙透亮但真实的年轻皮肤、轻薄高级妆容。整体感觉要像真实昂贵的女演员试镜照，第一眼非常漂亮、年轻、上镜。

皮肤必须像参考图：fair luminous skin, clean pale complexion, subtle natural skin texture, soft studio glow, realistic human skin, no freckles, no wrinkles, no acne, no moles, no dark spots。脸部必须像参考图级别：small delicate camera-friendly face, symmetrical pretty features, clear eyes, refined nose, soft pink lips, no harsh bone structure。重点是真实年轻欧洲女演员，不是 CG、不是 3D、不是塑料磨皮。

差异度只来自不同风格的美丽，而不是降低颜值：可以是金发清冷美、棕发温柔美、黑发高贵美、浅棕发甜美美；四个人都必须好看，不能为了差异生成普通脸、老气脸、怪脸或反派脸。

## 以下四人属性由代码随机选出，所有属性已确保不同。严格按指定属性生成提示词，禁止自行更改：

${candidateLines}

## 统一展示要求

- 2×2 casting grid，白色细线分隔，左上B1、右上B2、左下B3、右下B4
- 图内不得有文字、标签、字母、数字
- 正面肩上半身试镜照，从上胸/锁骨下方到头顶完整入镜，双肩可见，脸居中但不要贴镜头，四格镜头距离和脸部大小完全一致，平视，直视镜头，双唇自然微闭，平静自然表情，无哭泣无泪水无动作无手势（shoulder-up bust casting portrait, crop from upper chest to full head, both shoulders visible, full head visible, centered face, not an extreme close-up, identical camera distance and face scale in all four panels, neutral soft expression, no crying, no tears, no pose, no action, no hand gestures）
- 真实女演员剧照感（realistic actress headshot quality）
- 电影级柔光（cinematic soft beauty lighting），白皙透亮但真实的年轻皮肤（fair luminous youthful skin, clean pale complexion, subtle natural skin texture, realistic human skin）
- 昂贵干净的欧美短剧女主试镜照质感（premium clean Western drama heroine casting headshot, expensive beauty, soft glam makeup, realistic camera-friendly face, not CGI）
- 高端奇幻言情剧女主美学（high-end fantasy romance heroine aesthetic）
- 纯白色无缝背景（clean white seamless background），不要任何场景、道具、建筑
- 无皱纹、无雀斑、无痣、无斑点、无法令纹、无黑眼圈、无瑕疵
- 85mm portrait lens，ISO 100，快门 1/125s，高质量真实棚拍人像，柔和自然曝光，不要微距贴脸，不要 32K 超锐化，不要 HDR 塑料感
- 服装参考用户图风格：高级白色/浅色/深色女主试镜服装，干净领口、夹克领、高领衬衫或精致宫廷衬衫；衣服只作为肩部和上胸辅助信息，不要低俗性感，不要暴露胸部，每人领口严格按上面指定的 costume neckline

## 质量要求

- imagePrompt 英文详细生图提示词，信息密度高
- imagePromptCn 中文版本与英文对应
- 四人必须像四个不同女演员，不能是同一张脸
- 四人都必须是漂亮、年轻、皮肤白皙干净且真实的短剧女主脸；每个候选人的美貌合格度必须达到 9.5/10 以上
- 差异必须建立在同一档高颜值基础上：不同发色、眼型、脸型、气质、服装领口可以不同，但不能牺牲漂亮度
- 构图必须接近参考图：白底、四格统一、肩膀可见、头顶完整、脸不被过度放大、不切头发、不切下巴、不切肩膀
- 如果出现 26-30、28-32、泪痕、哭泣、皱纹、雀斑、粗糙皮肤、暗沉皮肤、显老脸、普通路人脸、不够漂亮、CG感、3D感、塑料磨皮，判定失败重新生成
- 上面指定的属性必须一字不改地写进提示词

## Negative prompt (必须包含在 imagePrompt 末尾)

same face, identical facial features, same actress, face clone, only hair color changed, only hairstyle changed, all wearing same dress, identical outfit, same neckline color, age 26, 26-30, 28-32, woman over 25, mature woman, extreme close-up, oversized face, zoomed-in face, cropped head, cropped hair, cropped chin, cropped shoulders, face too large, body shot, full body, low-cut dress, deep cleavage, exposed chest, nightclub outfit, high collar covering jawline, covered neck hiding face shape, turtleneck, villain face, aggressive stare, crying, tears, tearful eyes, wet eyes, sad crying face, tragic face, tired face, rough skin, enlarged pores, freckles, moles, age spots, acne, blemishes, wrinkles, fine lines, nasolabial folds, under-eye bags, dark circles, dull skin, sallow skin, uneven skin, oily skin, harsh makeup, heavy contour, thin lips, wide nose, bulbous nose, harsh cheekbones, square jaw, long aged face, CGI, CG render, 3d render, plastic skin, overly airbrushed skin, waxy face, doll face, uncanny face, influencer face, Instagram model, nightclub model, cheap sexy look, ordinary face, plain face, masculine short hair, pixie cut, buzz cut, childish haircut, excessive updo, messy hair covering face, anime hair, underage, minor, childlike face, schoolgirl, juvenile, older woman, Asian face, overly plastic skin, anime, game character, old woman, masculine jaw, harsh face, ugly, distorted face, cartoon, illustration, painting, drawing

输出 JSON：
{"imagePrompt":"英文提示词","imagePromptCn":"中文提示词"}`;
}

function buildFemaleVillainPrompt(): string {
  return `你是一个顶尖的影视选角导演和 AI 图像生成提示词专家。为欧美女频短剧「女反派」生成一个 2×2 选角联系人表（casting contact sheet）的生图提示词。

核心原则：反派不是丑角，也不是老态继母脸，而是"非常年轻、极美、精致、有心机、有阶级感"的高颜值女性角色。漂亮必须排在反派感之前：默认情况下，所有候选人都必须是 young adult European woman、20-23 appearance、clearly adult、长发、绝美、真实欧美短剧剧照感。

⚠️ 默认年龄强制规则：除非用户在自定义要求里明确写了更大年龄、继母、夫人、母亲、年长反派等设定，否则四个女反派候选人一律保持 20-23 岁外貌且必须明确是成年人，不能自行生成 25 岁以上的成熟女性。

严格按以下格式生成 imagePrompt（英文）和 imagePromptCn（中文）：

布局要求：
- 横向 16:9，2×2 网格，白色细线分隔
- 四个格分别放四位 20-23 岁外貌的绝美欧美女性反派，每人只占一格，young adult European woman, clearly adult
- 顺序：左上V1、右上V2、左下V3、右下V4
- 图内不得有文字、标签、字母、数字

⚠️ 长发强制要求：四人必须全部都是长发，发长至少过胸或到腰。绝对禁止短发、齐肩发、丸子头、盘发。

四个反派候选人模板（四种不同类型的恶女）：

V1（左上）漂亮豪门千金情敌：
- 长金发或蜜金色大波浪长发（long golden or honey-blonde voluminous waves to lower back）
- 精致小鹅蛋脸（delicate refined oval face），浅色眼睛（pale blue or gray eyes），妆容高级精致但清透
- 表情：漂亮自信的轻微微笑，带一点优越感但不刻薄（beautiful confident faint smile, privileged but not harsh）
- 气质：贵气、漂亮、有心机、嫉妒但仍然迷人（noble, beautiful, sly, jealous but still charming）
- 适合剧情：订婚宴羞辱女主、抢男主、家族压迫
- 服装：白色或浅金色高定礼服领口

V2（右上）冷艳继姐/假千金：
- 深棕或黑色长发，顺直或大波浪（dark brown or black long hair, sleek or loose waves to waist）
- 五官精致漂亮但不能男性化，脸型偏窄椭圆，眼神清冷迷人（beautiful refined features, narrow oval face, cool elegant gaze）
- 表情：克制的漂亮微笑，不要冷笑不要皱眉（restrained beautiful faint smile, no sneer, no frown）
- 气质：聪明、有心机、表面优雅、漂亮得有距离感（intelligent, sly, outwardly elegant, beautiful and distant）
- 适合剧情：陷害女主、伪装受害者、身份争夺
- 服装：黑色或深紫礼服领口

V3（左下）年轻权贵千金/高阶贵族女反派：
- 深栗色或暗红棕长发（rich chestnut or dark auburn long hair to waist），精致高贵
- 20-23 岁外貌的年轻权贵美人，不是老态而是年轻、华丽、有权力感（young aristocratic noblewoman, 20-23 appearance, clearly adult, stunningly beautiful, regal but youthful, not aged）
- 表情：冷艳但漂亮，眼神有距离感但不能凶狠（composed beautiful cool gaze, distant but not harsh, youthful adult facial fullness）
- 气质：权贵感、阶级感、精英感、漂亮但不好接近（elite entitlement, aristocratic aura, beautiful but hard to approach）
- 适合剧情：逼迫分手、家族交易、威胁女主
- 服装：深红或墨绿华贵礼服领口

V4（右下）白莲花情敌：
- 浅棕或柔金长发（light brown or soft golden long hair to waist），外表温柔无害
- 柔和心形脸（soft heart-shaped face），大眼睛（large innocent-looking eyes），清纯妆容
- 表情：柔弱漂亮的无辜表情，眼神里藏一点心机但不要哭泣（soft beautiful innocent expression with subtle slyness in the eyes, no crying, no tears）
- 气质：伪善、装无辜、嫉妒、漂亮又会伪装（hypocritical, playing innocent, jealous, beautiful and deceptive）
- 适合剧情：假装受伤、栽赃女主、博取男主同情
- 服装：浅粉或白色柔美裙装领口

共同要求（必须全部满足）：
- 四个反派都必须是长发，发长过胸
- 四个人都要绝美、年轻、上镜，第一眼必须是漂亮，其次才是有心机、有阶级感或伪善感
- 四个人默认都必须是 20-23 appearance，clearly adult，像刚进入上流社交场/贵族学院/豪门宴会圈的年轻漂亮恶女
- 四个人都必须保持年轻成年人脸部状态：smooth firm skin, flawless complexion, youthful adult facial fullness, fresh glamorous beauty, no aged features, no wrinkles, no fine lines
- 必须像真实欧美短剧演员剧照，不要像游戏角色、动漫角色、AI娃娃
- 脸型可以有一点精致锐度，但必须漂亮柔和，不要方下颌、男性化、老气、刻薄脸
- 妆容可以比女主更精致、更强势，但不要夜店网红风
- 服装：黑色礼服、白色高定裙、深红礼服、豪门宴会装
- 表情要有戏但不能丑化：漂亮微笑、克制微笑、伪善无辜、清冷距离感；禁止冷笑、皱眉、凶狠凝视、夸张邪恶笑
- 四人脸型、发色、眼神、气质必须明显不同
- 美貌合格度必须优先于反派感：每个候选人都必须达到 9/10 以上的漂亮短剧女演员颜值；如果看起来不漂亮、显老、有皱纹、有法令纹、皮肤差或像普通路人，判定失败重新生成

严禁生成（negative prompt）：
ugly villain, unattractive face, plain face, ordinary face, monster, witch-like, old hag, woman over 23, woman over 25, late 20s woman, 28-year-old woman, 30-year-old woman, middle-aged woman, older woman, aged face, mature older woman look, stern old matron, evil stepmother look, harsh wrinkles, wrinkles, fine lines, forehead lines, crow's feet, nasolabial folds, under-eye bags, dark circles, sunken cheeks, tired face, rough skin, visible pores, freckles, moles, age spots, acne, blemishes, masculine jaw, square jaw, harsh face, cruel face, bitter face, angry face, frown, sneer, cartoon evil smile, exaggerated evil face, anime, game character, fantasy NPC, plastic doll face, influencer nightclub makeup, overly sexy, cheap seductive look, distorted face, crossed eyes, asymmetrical eyes, short hair, bob cut, pixie cut

哈苏 X2D 100C，100mm f/2.8 微距镜头，ISO 100，快门 1/125s，32K，HDR10+，正面头肩特写，脸居中，平视，无表情无动作无手势，纯白色无缝背景。

输出 JSON：
{"imagePrompt":"英文提示词","imagePromptCn":"中文提示词"}`;
}

function buildMaleLeadPrompt(): string {
  return `你是一个顶尖的影视选角导演和 AI 图像生成提示词专家。为欧美女频短剧「男主」生成一个 2×2 选角联系人表（casting contact sheet）的生图提示词。

严格按以下格式生成 imagePrompt（英文）和 imagePromptCn（中文）。

## 核心原则

这是男主抽卡，不是男性角色泛用抽卡。所有候选人都必须适合作为欧美女频短剧男主——高颜值、保护欲、权力感、深情感、真实欧美剧照感。

⚠️ 年龄措辞强制规则：
不要在提示词里使用 20-year-old、20 years old、teen、boyish、pretty boy、idol——这些词会导致生成亚洲男团脸、K-pop 偶像风格、少年感。
如果需要年轻男主，请使用：young adult European man, 24-28 appearance, refined masculine leading-man features。
常规男主请使用：adult European man, late 20s to mid 30s appearance, handsome refined Western leading-man face。

四个候选人都必须是 adult European / Western man、高颜值、欧美女频短剧男主感，但必须像四个不同男演员，而不是同一个人换发色、换衣服。

## 变量池系统

每次生成时从以下各池中为每位候选人各选 1 项，四人之间不重复（同池内每人选不同项）。

### 1. 男主美型 male lead archetype（4选4，不重复）
- cold billionaire heir 冷峻财阀继承人
- noble golden prince 金发贵族继承人
- dark wolf king 暗黑狼王男主
- gentle young doctor / lawyer 温柔年轻医生/律师男主
- cursed duke 被诅咒公爵
- protective knight 守护骑士
- wounded ex-lover 破碎旧爱
- powerful royal heir 强势王族继承人
- forbidden vampire prince 禁忌吸血鬼王子
- war-returned general 战后归来的将军

### 2. 发型 hairstyle（4选4，不重复）
- dark swept-back hair / short textured dark hair / soft wavy brown hair / golden wavy hair / slightly tousled noble hair / silver-gray medium-short hair / clean side-parted hair / dark curly hair / refined medium-length hair / wind-swept romantic hair

### 3. 发色 hair color（4选4，不重复）
- black / dark brown / chestnut brown / golden blonde / ash blonde / silver gray / warm brown / dirty blonde / charcoal black / dark auburn brown

### 4. 脸型 face shape（4选4，不重复）
- sharp oval face / refined square-oval face / aristocratic long face / strong angular face / balanced masculine oval face / clean handsome face / clean noble face / sculpted romantic face

### 5. 眼型 eye shape（4选4，不重复）
- deep-set intense eyes / soft romantic eyes / piercing blue eyes / gray-green restrained eyes / dark brooding eyes / protective warm eyes / slightly narrowed dangerous eyes / wounded emotional eyes

### 6. 鼻型 nose shape（4选4，不重复）
- high straight nose bridge / aristocratic narrow nose / strong straight nose / refined masculine nose / slightly rugged Roman nose / elegant Western nose

### 7. 唇形 mouth/lips（4选4，不重复）
- firm restrained lips / soft but masculine lips / defined cupid bow lips / thin serious lips / slightly parted emotional lips / calm controlled mouth

### 8. 眉形 brow shape（4选4，不重复）
- thick defined brows / straight noble brows / slightly furrowed brows / sharp dark brows / soft masculine brows / elegant restrained brows

### 9. 骨相 facial structure（4选4，不重复）
- refined masculine bone structure / strong clean jawline / noble cheekbones / handsome leading-man features / elegant aristocratic features / romantic masculine features / clean sculpted features

### 10. 男主气质 temperament（4选4，不重复）
- protective and restrained / cold but deeply emotional / noble and distant / dangerous but gentle / wounded but loyal / powerful and controlled / warm and reliable / forbidden romantic / dominant but tender / silent protector

### 11. 年龄感 age impression（4人尽量拉开差异）
- adult 24-28 appearance / adult 27-31 appearance / adult 29-33 appearance / adult 31-35 appearance

## 硬性差异规则

- 四个男主候选不能使用相同美型 archetype
- 四个男主候选不能使用相同脸型
- 四个男主候选不能使用相同眼型
- 四个男主候选不能使用相同发型
- 四个男主候选不能使用相同发色
- 四个男主候选不能只是换衣服或换发色——去掉发色和服装后脸型和五官必须不同
- 四个人必须像四个不同欧美男演员
- 如果只换发型但脸还是同一个人，判定失败重新生成
- 如果某个候选人看起来像商务头像、证件照、K-pop 偶像、少年，判定失败重新生成
- 如果某个候选人看起来油腻、疲惫、过度粗糙、年龄超过 35 岁，判定失败重新生成

## 男主合格度评分机制

每个候选人单独评分，满分 10 分。
评分维度：男主心动感、高颜值、保护欲、权力感、深情感、真实欧美剧照感、女频文吸引力。
低于 8 分需要重新生成。

## 男主脸部差异评分机制

四个候选之间差异评分满分 10 分。
评分维度：美型、发型、发色、脸型、眼型、鼻型、唇形、眉形、骨相、气质、年龄感——共 11 个维度。
如果任意两个人在 11 个维度中有 5 个以上相同，则差异分低于 6，需要重新组合。
目标是每次四个候选差异分达到 8 分以上。

## 统一展示要求

- 2×2 casting grid，白色细线分隔
- 四个格分别放四位男主候选人，每人只占一格
- 顺序：左上M1、右上M2、左下M3、右下M4
- 图内不得有文字、标签、字母、数字
- 相同干净的人像取景框（正面头肩特写，脸居中，平视，直视镜头）
- 双唇闭合，无表情无动作无手势（neutral expression, no pose, no action, no hand gestures）
- 真实欧美男演员剧照感（realistic Western actor headshot quality）
- 电影级柔光（cinematic soft lighting）
- 自然肤质（natural skin texture, masculine but not rough）
- 精致但不阴柔的高颜值男主脸（handsome refined leading-man face, clean romantic masculinity, attractive to female audience, not rough, not tired）
- 高端奇幻言情剧男主美学（high-end fantasy romance male lead aesthetic）
- 纯白色无缝背景（clean white seamless background），不要任何场景、建筑、道具
- 哈苏 X2D 100C，100mm f/2.8 微距镜头，ISO 100，快门 1/125s，32K，HDR10+

## Prompt 模板

Create a 2x2 casting grid of four different exceptionally handsome adult European fantasy romance male leads, 24-35 appearance. Each candidate must look like a different Western actor, not the same face with different hair. Each male lead must have distinct hairstyle, hair color, face shape, eye shape, nose shape, mouth shape, brow shape, facial structure, archetype, temperament, and age impression. They should feel like high-end romance drama male leads with protective aura, restrained desire, power, emotional depth, handsome refined leading-man faces, clean romantic masculinity, and realistic Western actor headshot quality. Cinematic soft lighting, natural skin texture, luxury fantasy romance casting sheet, no repeated face, no same-face syndrome.

## Negative prompt

same face, identical facial features, same actor, face clone, only hair color changed, only hairstyle changed, ordinary businessman, corporate headshot, passport photo, Asian face, East Asian, K-pop idol, Korean idol, Japanese idol, Chinese actor, teen boy, teenage, boyish face, pretty boy, soft idol face, college boy, youthful student, baby face, feminine idol look, ordinary man, boring face, old greasy man, middle-aged CEO, tired eyes, rough unattractive face, overly plastic skin, doll face, anime, game character, 3d render, distorted face, weak jaw, receding hairline, thin hair, heavy wrinkles, nasolabial folds, tired face, cartoon, illustration, painting, drawing

输出 JSON：
{"imagePrompt":"英文提示词","imagePromptCn":"中文提示词"}`;
}

function buildMaleVillainPrompt(): string {
  return `你是一个顶尖的影视选角导演和 AI 图像生成提示词专家。为欧美女频短剧「男反派」生成一个 2×2 选角联系人表（casting contact sheet）的生图提示词。

严格按以下格式生成 imagePrompt（英文）和 imagePromptCn（中文）。

## 核心原则

这是男反派抽卡。男反派不是丑角，而是"体面、危险、有控制欲、有背叛感、有压迫感"的高颜值男性角色——帅但危险，有吸引力但有威胁。

⚠️ 年龄措辞强制规则：
不要在提示词里使用 20-year-old、20 years old、teen、boyish、pretty boy、idol——这些词会导致生成亚洲男团脸、K-pop 偶像风格、少年感。
如果需要年轻男反派，请使用：young adult European man, 25-30 appearance, polished dangerous masculine features。
常规男反派请使用：adult European man, late 20s to mid 30s appearance, handsome dark romance antagonist face。

四个候选人都必须是 adult European / Western man、高颜值、真实欧美女频短剧男反派感，但必须像四个不同男演员。

## 变量池系统

每次生成时从以下各池中为每位候选人各选 1 项，四人之间不重复。

### 1. 男反派美型 male antagonist archetype（4选4，不重复）
- charming betrayer 伪善背叛型前任
- ruthless young billionaire rival 冷酷年轻财阀敌人
- dark rival alpha 暗黑敌对狼王
- elegant manipulator 优雅操控者
- corrupt noble heir 腐坏贵族继承人
- cruel fiance 残酷未婚夫
- dangerous vampire lord 危险吸血鬼领主
- smiling political schemer 微笑权谋反派
- jealous royal brother 嫉妒王族兄长
- fallen knight 堕落骑士

### 2. 发型 hairstyle（4选4，不重复）
- slicked-back dark hair / neat golden noble hair / dark side-parted hair / silver-gray aristocratic hair / black wavy hair / short sharp haircut / polished brunette hair / slightly disheveled dangerous hair / cold blond side-parted hair / dark refined medium hair

### 3. 发色 hair color（4选4，不重复）
- black / dark brown / ash brown / dirty blonde / silver gray / chestnut brown / cold blond / charcoal black / deep auburn / smoky brown

### 4. 脸型 face shape（4选4，不重复）
- sharp handsome face / refined long face / narrow aristocratic face / strong square-oval face / cold elegant oval face / predatory handsome face / sculpted attractive villain face / clean but cruel face

### 5. 眼型 eye shape（4选4，不重复）
- cold deep-set eyes / calculating narrow eyes / pale blue icy eyes / dark threatening eyes / charming but empty eyes / predatory intense eyes / restrained cruel eyes / jealous burning eyes

### 6. 鼻型 nose shape（4选4，不重复）
- sharp high nose bridge / aristocratic straight nose / narrow refined nose / strong Roman nose / cold sculpted nose / elegant villain nose

### 7. 唇形 mouth/lips（4选4，不重复）
- thin cold lips / restrained smirk / elegant cruel mouth / polite false smile / sharp serious lips / charming deceptive smile

### 8. 眉形 brow shape（4选4，不重复）
- sharp dark brows / straight cold brows / slightly arched manipulative brows / heavy authoritative brows / refined noble brows / tense jealous brows

### 9. 骨相 facial structure（4选4，不重复）
- sharp cheekbones / cold masculine bone structure / aristocratic angular features / polished dangerous features / refined but threatening features / strong clean predatory jawline / elegant cruel features

### 10. 男反派气质 temperament（4选4，不重复）
- charming but false / cold and controlling / dangerous and possessive / elegant but cruel / polite but threatening / jealous and entitled / powerful and manipulative / aristocratic and corrupt / calm but violent / seductive but untrustworthy

### 11. 年龄感 age impression（4人尽量拉开差异）
- adult 25-30 appearance / adult 28-32 appearance / adult 30-34 appearance / adult 32-36 appearance

## 硬性差异规则

- 四个男反派候选不能使用相同美型 archetype
- 四个男反派候选不能使用相同脸型
- 四个男反派候选不能使用相同眼型
- 四个男反派候选不能使用相同发型
- 四个男反派候选不能使用相同发色
- 四个男反派候选不能只是换衣服或换发色——去掉发色和服装后脸型和五官必须不同
- 四个人必须像四个不同欧美男演员
- 如果只换发型但脸还是同一个人，判定失败重新生成
- 不许生成丑恶怪物脸、不许生成普通商务头像、不许生成 K-pop 偶像少年
- 不许生成中年老板、油腻反派、疲惫老男人、皱纹明显或法令纹很重的脸

## 男反派合格度评分机制

每个候选人单独评分，满分 10 分。
评分维度：危险感、高颜值、控制欲、虚伪/背叛感、压迫感、真实欧美剧照感、女频文反派吸引力。
低于 8 分需要重新生成。

## 男反派脸部差异评分机制

四个候选之间差异评分满分 10 分。
评分维度：美型、发型、发色、脸型、眼型、鼻型、唇形、眉形、骨相、气质、年龄感——共 11 个维度。
如果任意两个人在 11 个维度中有 5 个以上相同，则差异分低于 6，需要重新组合。
目标是每次四个候选差异分达到 8 分以上。

## 统一展示要求

- 2×2 casting grid，白色细线分隔
- 四个格分别放四位男反派候选人，每人只占一格
- 顺序：左上A1、右上A2、左下A3、右下A4
- 图内不得有文字、标签、字母、数字
- 相同干净的人像取景框（正面头肩特写，脸居中，平视，直视镜头）
- 双唇闭合，无表情无动作无手势（neutral expression, no pose, no action, no hand gestures）
- 真实欧美男演员剧照感（realistic Western actor headshot quality）
- 电影级戏剧光（cinematic dramatic lighting, slightly shadowed for villain atmosphere）
- 自然肤质（natural skin texture, masculine）
- 帅但危险的短剧反派吸引力（handsome dark romance antagonist, attractive villain, polished young elite, not greasy, not aged）
- 高端暗黑言情剧反派美学（high-end dark romance antagonist aesthetic）
- 纯白色无缝背景（clean white seamless background），不要任何场景、建筑、道具
- 哈苏 X2D 100C，100mm f/2.8 微距镜头，ISO 100，快门 1/125s，32K，HDR10+

## Prompt 模板

Create a 2x2 casting grid of four different handsome adult European fantasy romance male antagonists, 25-36 appearance. Each candidate must look like a different Western actor, not the same face with different hair. Each male antagonist must have distinct hairstyle, hair color, face shape, eye shape, nose shape, mouth shape, brow shape, facial structure, archetype, temperament, and age impression. They should feel like high-end dark romance drama antagonists: attractive but dangerous, charming but false, controlling, threatening, aristocratic, polished young elite, handsome villain faces, and realistic Western actor headshot quality. Cinematic dramatic lighting, natural skin texture, luxury fantasy romance casting sheet, no repeated face, no same-face syndrome.

## Negative prompt

same face, identical facial features, same actor, face clone, only hair color changed, only hairstyle changed, Asian face, East Asian, K-pop idol, Korean idol, Japanese idol, Chinese actor, teen boy, teenage, boyish face, pretty boy, soft idol face, college boy, youthful student, baby face, feminine idol look, ugly villain, monster, scarred monster face, old greasy man, middle-aged CEO, tired old businessman, greasy villain, tired eyes, heavy nasolabial folds, cartoon villain, exaggerated evil grin, ordinary businessman, corporate headshot, passport photo, overly plastic skin, doll face, anime, game character, 3d render, distorted face, weak jaw, receding hairline, thin hair, cartoon, illustration, painting, drawing

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

function enforceFemaleLeadPromptRules(prompt: string): string {
  return prompt
    .replace(/\b(adult woman|young adult woman|woman),?\s*(?:age\s*)?(?:23-26|26-30|28-32|22-26)\b/gi, "21-year-old adult woman, clearly adult")
    .replace(/\bage\s*(?:23-26|26-30|28-32|22-26|22)\b/gi, "age 21, clearly adult")
    .replace(/\b(?:23-26|26-30|28-32|22-26)\s*(?:appearance)?\b/gi, "21-year-old adult appearance, clearly adult")
    .replace(/\bvisible pores but flawless\b/gi, "clean fair realistic skin, no freckles, no wrinkles")
    .replace(/\bnatural skin texture with visible pores but flawless\b/gi, "subtle natural skin texture, clean fair complexion, no freckles, no wrinkles")
    .replace(/\bmessy tragic heroine hair\b/gi, "soft airy heroine waves")
    .replace(/\bmisty tearful eyes\b/gi, "clear luminous eyes")
    .replace(/\belegant mature feminine face\b/gi, "fresh youthful heroine face")
    .replace(/\bfragile and emotional temperament\b/gi, "soft romantic but confident temperament")
    .replace(/\bdeep plunge neckline\b/gi, "clean elegant blouse collar")
    .replace(/\bplunging sweetheart neckline\b/gi, "clean elegant fitted bodice collar")
    .replace(/\blow-cut fitted bodice\b/gi, "refined fitted jacket collar")
    .replace(/\b100mm f\/2\.8 macro lens\b/gi, "85mm portrait lens")
    .replace(/\b32K\b/gi, "high-resolution")
    .replace(/\bHDR10\+\b/gi, "soft natural dynamic range")
    .replace(/\bporcelain skin\b/gi, "clean fair realistic skin")
    .replace(/\bporeless-looking\b/gi, "clean natural")
    .replace(/\boverly plastic skin\b/gi, "CGI plastic skin");
}

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

    // 默认年龄：女主=21岁，女反派=20岁，男性=25岁；自定义要求可覆盖
    const isMaleType = roleType === "male_lead" || roleType === "male_villain";
    const defaultAge = roleType === "female_lead" ? "21" : roleType === "female_villain" ? "20" : "25";
    const ageLabel = isMaleType ? "男性" : "女性";
    const defaultAgeRule = `\n\n⚠️ 年龄要求：${ageLabel}角色默认年龄 ${defaultAge} 岁。如果用户自定义要求中指定了年龄，以用户指定为准；否则严格使用默认年龄 ${defaultAge} 岁。`;

    const systemPrompt = builder() + defaultAgeRule + (customRequirement ? `

用户自定义要求（必须严格遵守）：${customRequirement}` : "");

    const result = await deepseekChatJSON<{ imagePrompt: string; imagePromptCn: string }>(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: "请生成 2×2 选角联系表提示词。" },
      ],
      { maxTokens: 4096, temperature: 0.8 }
    );

    const imagePrompt = roleType === "female_lead"
      ? enforceFemaleLeadPromptRules(result.imagePrompt || "")
      : result.imagePrompt || "";
    const imagePromptCn = roleType === "female_lead"
      ? (result.imagePromptCn || "")
          .replace(/(?:23-26|26-30|28-32|22-26|22)\s*岁/g, "21 岁成年女性")
          .replace(/毛孔清晰|可见毛孔|自然肤质可见毛孔/g, "真实干净的白皙皮肤")
          .replace(/凌乱悲情女主发型|悲情|流泪|泪眼/g, "柔软自然女主发型")
          .replace(/CG感|塑料感|过度磨皮/g, "真实演员棚拍质感")
      : result.imagePromptCn || "";

    return NextResponse.json({
      success: true,
      imagePrompt,
      imagePromptCn,
    });
  } catch (err: unknown) {
    console.error("抽卡失败:", err);
    const message = err instanceof Error ? err.message : "抽卡失败，请稍后重试";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
