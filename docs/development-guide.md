# 开发执行指南

## 开发原则

1. **一次只做一个模块** — 完成并验证后再推进下一步
2. **先骨架后细节** — 先把页面结构和布局搭好，再加动画和细节
3. **每次修改后验证** — `npm run dev` 确认没有报错
4. **内容与代码分离** — 作品数据在 `content/works.ts`，博客在 `content/blog/`

## 执行步骤

### 步骤1：项目基础搭建
- [x] 创建 Next.js 项目
- [x] 安装依赖
- [x] 创建目录结构
- [ ] 配置全局样式（暗色主题）
- [ ] 搭建基础布局（Navbar + Footer + Layout）
- [ ] 更新 package.json name

### 步骤2：作品画廊（首页）
- [ ] 创建作品数据配置文件 `content/works.ts`
- [ ] 实现 Gallery 组件（网格布局）
- [ ] 实现分类筛选功能
- [ ] 实现 Lightbox 灯箱组件
- [ ] 首页整体排版

### 步骤3：关于我页面
- [ ] 个人信息区域
- [ ] AI 工具标签
- [ ] 社交链接

### 步骤4：博客系统
- [ ] 创建示例 Markdown 文章
- [ ] 实现文章列表页
- [ ] 实现文章详情页（Markdown 渲染）
- [ ] 博客卡片组件

### 步骤5：打磨优化
- [ ] 滚动渐入动画
- [ ] 页面过渡效果
- [ ] 移动端响应式检查
- [ ] SEO metadata 配置

### 步骤6：部署
- [ ] 构建验证 (`npm run build`)
- [ ] 开发环境验证 (`npm run dev`)
- [ ] 部署指导文档

## 关键文件

| 文件 | 说明 |
|------|------|
| `app/layout.tsx` | 根布局，全局 HTML 结构 |
| `app/globals.css` | 全局样式 + Tailwind 配置 |
| `app/page.tsx` | 首页（画廊） |
| `app/about/page.tsx` | 关于我 |
| `app/blog/page.tsx` | 博客列表 |
| `app/blog/[slug]/page.tsx` | 博客详情 |
| `components/Navbar.tsx` | 导航栏 |
| `components/Footer.tsx` | 页脚 |
| `components/Gallery.tsx` | 作品网格 |
| `components/Lightbox.tsx` | 灯箱 |
| `components/BlogCard.tsx` | 博客卡片 |
| `content/works.ts` | 作品数据 |
| `content/blog/*.md` | 博客文章 |
| `lib/posts.ts` | 博客工具函数 |

## 注意事项
- 使用 `next/link` 做页面跳转，不要用 `<a>` 标签
- 使用 `next/image` 处理图片（需要配置 `next.config.ts` 允许外部图片域名）
- Tailwind CSS 4 的配置方式与 v3 不同，主题放在 CSS 的 `@theme` 块中
- 所有需要用户修改的内容集中在 `content/` 文件夹
