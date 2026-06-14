# 剧本分析功能 - 需求文档

## 功能概述
AI 漫剧剧本分析工具，输入剧本简介和目标受众，自动生成虚拟资产提示词（人物、场景、道具），支持本地图片上传关联。

## 用户故事
- 作为漫剧创作者，我想输入剧本大纲，AI 自动帮我拆解出需要制作的角色、场景和道具
- 作为创作者，我想要每条资产都有对应的 AI 生图提示词，方便我直接去 Midjourney/SD 生成
- 作为创作者，我想把生成的图片上传到对应提示词旁边，方便对照查看
- 刷新页面后，之前的所有数据应该完好保留

## 功能列表

### P0（核心功能）
- [x] 剧本简介输入（textarea）
- [x] 目标受众输入
- [x] AI 分析按钮，调用 DeepSeek API 生成三类资产提示词
- [x] 分析结果分三类标签展示：人物 / 场景 / 道具
- [x] 每条资产含：名称、描述、英文生图提示词
- [x] 提示词复制按钮
- [x] 图片上传（点击 + 拖拽）
- [x] 已上传图片的预览和删除
- [x] 数据刷新后持久保留（JSON 文件存储）
- [x] 分析中的加载状态
- [x] 错误提示（API 异常、输入校验）

### P1（后续可优化）
- [ ] 支持多个剧本项目管理
- [ ] 分析结果导出（Markdown/PDF）
- [ ] 生图提示词一键优化/翻译
- [ ] 历史版本回看

## 数据模型
```json
{
  "synopsis": "剧本简介文本",
  "targetAudience": "目标受众描述",
  "characters": [{ "id", "name", "description", "imagePrompt", "imageUrl" }],
  "scenes": [{ "id", "name", "description", "imagePrompt", "imageUrl" }],
  "props": [{ "id", "name", "description", "imagePrompt", "imageUrl" }]
}
```

## 技术要点
- AI 服务：DeepSeek API（OpenAI 兼容接口）
- 单项目模式：新分析覆盖旧数据
- 图片存储：public/images/ 目录
- 数据持久化：content/script-analysis.json
