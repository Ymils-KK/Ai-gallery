# 个人网站项目

## 项目概述
这是一个展示AI生成作品（图片/视频）的个人网站，包含作品画廊、关于我、博客三个主要板块。

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

## 工作原则
- 渐进式开发：一次只做一个模块，确保功能正常再推进下一步
- 每次完成一个模块后，先验证（npm run dev），再继续
- 每天工作结束时，更新 devlogs/ 文件夹中的日志
- 修改代码前先确认不影响已有功能
- 保持代码简洁清晰，适合零基础用户理解和修改

## 目录结构
```
├── app/                  # Next.js App Router 页面
│   ├── layout.tsx        # 根布局（导航栏+页脚）
│   ├── page.tsx          # 首页（作品画廊）
│   ├── about/page.tsx    # 关于我
│   └── blog/
│       ├── page.tsx      # 博客列表
│       └── [slug]/page.tsx  # 文章详情
├── components/           # 可复用组件
├── content/              # 内容文件（作品数据、博客文章）
│   ├── works.ts          # 作品数据配置
│   └── blog/             # Markdown 博客文章
├── lib/                  # 工具函数
├── docs/                 # 项目标准文档
├── devlogs/              # 开发日志
└── public/images/        # 静态图片资源
```
