# 技术规范

## 框架与运行时

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.2.6 | React 全栈框架，App Router |
| React | 19.2.4 | UI 库 |
| TypeScript | ^5 | 类型安全 |
| Tailwind CSS | ^4 | 原子化 CSS 框架 |

## 关键依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| lucide-react | ^1.16.0 | SVG 图标库 |
| gray-matter | ^4.0.3 | Markdown 元数据解析 |
| react-markdown | ^10.1.0 | Markdown 渲染为 React |
| remark-gfm | ^4.0.1 | GitHub Flavored Markdown 支持 |

## 配置要点

### Tailwind CSS 4
- 使用 CSS 文件配置（`app/globals.css`），不再需要 `tailwind.config.ts`
- 使用 `@theme inline` 定义自定义变量
- 直接在 CSS 中使用 `@import "tailwindcss"`

### Next.js 16
- App Router 模式
- `params` 为 Promise 类型，需 `await`
- 使用 `next/font/google` 加载 Geist 字体
- metadata API 用于 SEO

## 项目配置

### package.json
- `npm run dev` — 启动开发服务器 (localhost:3000)
- `npm run build` — 构建生产版本
- `npm run start` — 启动生产服务器
- `npm run lint` — 代码检查

### 内容管理
- 作品数据：`content/works.ts`（TypeScript 对象数组）
- 博客文章：`content/blog/*.md`（Markdown + frontmatter）
- 图片资源：`public/images/`

### 作品数据格式 (content/works.ts)
```ts
export interface Work {
  id: string;
  title: string;
  description: string;
  type: 'image' | 'video';
  src: string;        // 图片路径或视频URL
  thumbnail?: string;  // 视频缩略图
  tags: string[];
  date: string;
}
```

### 博客文章格式 (content/blog/*.md)
```md
---
title: 文章标题
date: 2026-05-22
description: 文章摘要
tags: [AI, 创作]
---

文章正文（Markdown 格式）
```
