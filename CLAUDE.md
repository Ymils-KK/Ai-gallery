# 个人网站项目

## 项目概述
这是一个展示AI生成作品（图片/视频）的个人网站，包含作品画廊、关于我、博客、AI漫剧剧本分析四个主要板块。

## 技术栈
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 (CSS-based 配置)
- 内容管理: Markdown 文件 + gray-matter
- 部署: Vercel（免费）

## 重要标准文件
在开始任何开发工作前，请先阅读以下文件：
- [开发需求文档](./docs/requirements.md) — 项目需求、功能列表、页面结构
- [设计规范](./docs/design.md) — 配色方案、字体、动效标准、组件风格
- [技术规范](./docs/tech-stack.md) — 技术栈详情、依赖说明、配置要点
- [开发执行指南](./docs/development-guide.md) — 开发步骤、文件结构、注意事项
- [开发日志](./devlogs/) — 每日开发记录和待办事项

### 剧本分析功能专属文档
- [剧本分析需求](./docs/script-analysis-requirements.md)
- [剧本分析设计](./docs/script-analysis-design.md)
- [剧本分析技术规范](./docs/script-analysis-tech-spec.md)
- [剧本分析开发指南](./docs/script-analysis-dev-guide.md)

## 工作原则
- 渐进式开发：一次只做一个模块，确保功能正常再推进下一步
- 每次完成一个模块后，先验证（npm run dev），再继续
- 每天工作结束时，更新 devlogs/ 文件夹中的日志
- 修改代码前先确认不影响已有功能
- 保持代码简洁清晰，适合零基础用户理解和修改

## 剧本分析功能
位于 `/script-analysis` 路由。功能：输入剧本简介 + 目标受众 → DeepSeek API 自动分析 → 生成人物/场景/道具三类虚拟资产提示词 → 每条提示词旁可上传生成后的图片。

### 关键文件
| 文件 | 作用 |
|------|------|
| [页面主组件](./app/script-analysis/page.tsx) | 状态总管、数据加载、持久化 |
| [AI 分析 API](./app/api/script-analysis/analyze/route.ts) | 调用 DeepSeek，Prompt Engineering |
| [数据 CRUD API](./app/api/script-analysis/route.ts) | 读写 `content/script-analysis.json` |
| [数据文件](./content/script-analysis.json) | 单项目数据持久化 |
| [输入表单组件](./components/script-analysis/ScriptInputForm.tsx) | 剧本输入 + 校验 |
| [结果展示组件](./components/script-analysis/AnalysisResult.tsx) | 三标签页 + 资产网格 |
| [资产卡片组件](./components/script-analysis/AssetCard.tsx) | 提示词展示 + 复制 + 图片上传 |
| [图片上传组件](./components/script-analysis/ImageUploadSlot.tsx) | 拖拽/点击上传 |

### 环境变量
- `DEEPSEEK_API_KEY`：在 `.env.local` 中配置，仅服务器端可访问
- 获取地址：https://platform.deepseek.com/api_keys

### 工作流程
1. 用户输入剧本简介 + 目标受众
2. 前端 POST → `/api/script-analysis/analyze` → 服务器调用 DeepSeek → 返回三类提示词
3. 前端展示结果，用户可上传本地图片到每条提示词旁边
4. 所有数据自动保存到 `content/script-analysis.json`，刷新不丢失

## 目录结构
```
├── app/                  # Next.js App Router 页面
│   ├── layout.tsx        # 根布局（导航栏+页脚）
│   ├── page.tsx          # 首页（作品画廊）
│   ├── about/page.tsx    # 关于我
│   ├── script-analysis/
│   │   └── page.tsx      # 剧本分析工具
│   ├── blog/
│   │   ├── page.tsx      # 博客列表
│   │   └── [slug]/page.tsx  # 文章详情
│   ├── admin/page.tsx    # 后台管理
│   └── api/
│       ├── script-analysis/
│       │   ├── route.ts      # 剧本分析数据 CRUD
│       │   └── analyze/route.ts  # DeepSeek AI 分析
│       ├── upload/route.ts   # 文件上传
│       └── ...
├── components/           # 可复用组件
│   └── script-analysis/  # 剧本分析专属组件
│       ├── ScriptInputForm.tsx
│       ├── AnalysisResult.tsx
│       ├── AssetCard.tsx
│       └── ImageUploadSlot.tsx
├── content/              # 内容文件
│   ├── works.ts          # 作品数据配置
│   ├── script-analysis.json  # 剧本分析数据（单项目）
│   └── blog/             # Markdown 博客文章
├── lib/                  # 工具函数
├── docs/                 # 项目标准文档
├── devlogs/              # 开发日志
└── public/images/        # 静态图片资源
```
