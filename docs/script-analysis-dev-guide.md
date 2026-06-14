# 剧本分析功能 - 开发执行指南

## 开发顺序（已完成）
1. ✅ 安装 openai SDK + 配置 .env.local
2. ✅ 创建 content/script-analysis.json 数据模板
3. ✅ 创建数据持久化 API（GET/POST /api/script-analysis）
4. ✅ 创建 AI 分析 API（POST /api/script-analysis/analyze）
5. ✅ 创建 ImageUploadSlot 组件
6. ✅ 创建 AssetCard 组件
7. ✅ 创建 AnalysisResult 组件
8. ✅ 创建 ScriptInputForm 组件
9. ✅ 创建 /script-analysis 页面
10. ✅ 修改 Navbar 添加导航链接
11. ✅ 错误处理 + 响应式适配
12. ✅ 编写文档（需求/设计/技术规范）

## 启动步骤
1. 在 `.env.local` 中填入有效的 `DEEPSEEK_API_KEY`
2. `npm run dev` 启动开发服务器
3. 访问 `http://localhost:3000/script-analysis`
4. 输入剧本简介和目标受众，点击"开始分析"
5. 等待 AI 生成结果，在提示词旁边上传图片

## 注意事项
- 新分析会覆盖旧数据（单项目模式）
- 上传图片后立即自动保存，刷新页面数据不丢失
- 复制提示词按钮点击后有 2 秒绿色确认反馈
- 图片上传支持 PNG/JPEG/WebP/GIF，最大 10MB
- 如果分析失败，查看浏览器控制台和终端日志排查
