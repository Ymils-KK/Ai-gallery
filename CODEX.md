# 个人网站项目

## 项目概述
这是一个展示AI生成作品（图片/视频）的个人网站，包含作品画廊、关于我、博客、AI漫剧剧本分析四个主要板块。

## 技术栈
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 (CSS-based 配置)
- 内容管理: Markdown 文件 + gray-matter
- AI: DeepSeek API（通过 fetch 直连，**不要用 openai SDK**）
- 部署: Vercel
- 包管理: npm

## 工作原则
- 渐进式开发：一次只做一个模块，先验证（npm run dev）再继续
- 修改代码前确认不影响已有功能
- 保持代码简洁清晰，适合零基础用户理解和修改

## 重要标准文件
在开始任何开发工作前，请先阅读：
- `docs/requirements.md` — 项目需求、功能列表、页面结构
- `docs/design.md` — 配色方案、字体、动效标准、组件风格
- `docs/tech-stack.md` — 技术栈详情、依赖说明、配置要点
- `docs/development-guide.md` — 开发步骤、文件结构、注意事项

### 剧本分析功能专属文档
- `docs/script-analysis-requirements.md`
- `docs/script-analysis-design.md`
- `docs/script-analysis-tech-spec.md`
- `docs/script-analysis-dev-guide.md`

## DeepSeek API 调用规则
- 所有 AI 调用使用 `lib/deepseek.ts` 中的共享函数：`deepseekChat()` 和 `deepseekChatJSON()`
- **禁止使用 openai SDK**（v6.42.0 有兼容性问题）
- API Key 在 `content/api-config.json` 中，已提交到仓库
- 环境变量：`DEEPSEEK_API_KEY`（.env.local 中配置）

## 项目数据持久化
- `content/projects/` — 多项目数据目录（已解除 gitignore）
- 前端 localStorage 兜底（key: `sa_projects`），Vercel 文件系统只读时刷新不丢数据
- API 路由中的 `fs.writeFileSync` 有 try/catch 保护，写失败不影响返回

## 关键文件速查表
| 文件 | 作用 |
|------|------|
| `app/script-analysis/page.tsx` | 剧本分析主页面（状态总管） |
| `app/api/projects/[id]/analyze/route.ts` | AI 剧本分析（DeepSeek） |
| `app/api/projects/[id]/cast-draw/route.ts` | 选角抽卡（女主/女反派/男主/男反派） |
| `app/api/projects/[id]/episode-analysis/route.ts` | 集数分析 |
| `app/api/projects/[id]/generate-prompt/route.ts` | 单条提示词生成 |
| `app/api/projects/[id]/chat/route.ts` | 提示词对话修改 |
| `lib/deepseek.ts` | DeepSeek API 共享封装 |
| `content/projects/` | 项目数据 JSON 文件 |
| `content/api-config.json` | API 密钥 |
| `components/script-analysis/` | 剧本分析 UI 组件 |

## cast-draw 抽卡规则
- 女主抽卡：变量池在 `buildFemaleLeadPrompt()` 函数前的 `HEROINE_*` 常量中
- 随机选择在 `drawHeroineCandidates()` 代码中执行，不要改成让 AI 自己随机
- 其他角色（女反派/男主/男反派）的变量池在各自的 `build*Prompt()` 函数中

## 目录结构
```
├── app/                  # Next.js App Router 页面
│   ├── layout.tsx        # 根布局（导航栏+页脚）
│   ├── page.tsx          # 首页
│   ├── script-analysis/page.tsx  # 剧本分析
│   ├── blog/             # 博客
│   ├── admin/page.tsx    # 后台管理
│   └── api/              # API 路由
├── components/           # 可复用组件
├── content/              # 内容文件
│   ├── projects/         # 多项目数据
│   ├── api-config.json   # API 密钥
│   └── blog/             # Markdown 博客
├── lib/                  # 工具函数（deepseek.ts 等）
├── docs/                 # 项目标准文档
├── devlogs/              # 开发日志
└── public/images/        # 静态图片资源
```
