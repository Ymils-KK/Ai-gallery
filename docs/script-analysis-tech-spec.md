# 剧本分析功能 - 技术规范

## 技术栈
- DeepSeek API（OpenAI 兼容 SDK `openai`）
- Next.js 16 App Router + API Routes
- React 19 + TypeScript
- Tailwind CSS 4（暗色主题 + 玻璃拟态）

## API 接口

### 1. 数据持久化 — `/api/script-analysis`
| 方法 | 说明 |
|------|------|
| GET | 读取 `content/script-analysis.json`，返回 `{ synopsis, targetAudience, characters[], scenes[], props[] }` |
| POST | 保存完整数据到 `content/script-analysis.json`，覆盖写入 |

### 2. AI 分析 — `POST /api/script-analysis/analyze`
| 项目 | 说明 |
|------|------|
| 请求体 | `{ synopsis: string, targetAudience: string }` |
| 成功响应 | `{ success: true, data: { characters, scenes, props } }` |
| 错误响应 | `{ error: string }` + 对应 HTTP 状态码 |
| API 模型 | `deepseek-chat` |
| 调用方式 | `new OpenAI({ apiKey, baseURL: "https://api.deepseek.com/v1" })` |
| JSON 模式 | `response_format: { type: "json_object" }` |
| max_tokens | 4096 |
| temperature | 0.7 |

### 3. 图片上传 — `POST /api/upload`（复用现有）
| 项目 | 说明 |
|------|------|
| 请求格式 | FormData，字段名 `file` |
| 响应 | `{ success: true, filename, path }` |
| 存储位置 | `public/images/` |

## DeepSeek 提示词策略

**System Prompt**：定义角色为漫剧预制作助手，要求输出三类资产，每类至少 3 个。强制 JSON 格式输出。提示词末尾统一加风格标签 `", comic style, anime style, high quality, concept art"`。

**User Prompt**：格式化为 `剧本简介：{...}\n目标受众：{...}`，让 AI 聚焦具体内容。

**JSON Schema**：
```json
{
  "characters": [{ "name": "角色名", "description": "视觉描述", "imagePrompt": "英文生图提示词" }],
  "scenes": [{ "name": "场景名", "description": "视觉描述", "imagePrompt": "英文生图提示词" }],
  "props": [{ "name": "道具名", "description": "视觉描述", "imagePrompt": "英文生图提示词" }]
}
```

## 数据流水线
```
用户提交 → POST /analyze → DeepSeek API → 解析 JSON → 添加 id + imageUrl → 返回前端 → POST /script-analysis 持久化
```
```
上传图片 → POST /upload → 拿到 path → 更新对应 asset.imageUrl → POST /script-analysis 持久化
```

## 安全
- API Key 仅存 `.env.local`（已加入 `.gitignore`）
- 所有 AI 调用均通过服务器端 API Route，客户端不接触 Key
- 输入校验：简介 10-3000 字，受众 1-200 字
- 图片校验：类型（PNG/JPEG/WebP/GIF），大小 ≤ 10MB
- API 错误均返回友好中文提示，不泄露内部信息

## 文件结构
```
app/
  script-analysis/
    page.tsx                  → 页面主组件（"use client"）
  api/script-analysis/
    route.ts                  → GET/POST 数据持久化
    analyze/
      route.ts                → POST DeepSeek 分析
components/script-analysis/
  ScriptInputForm.tsx         → 输入表单
  AnalysisResult.tsx          → 结果展示 + 标签页
  AssetCard.tsx               → 单条资产卡片
  ImageUploadSlot.tsx         → 图片上传插槽
content/
  script-analysis.json        → 单项目数据文件
```

## 依赖
- `openai` ^6 — DeepSeek API 调用
- 其余依赖均沿用项目现有（next, react, tailwindcss, lucide-react）
