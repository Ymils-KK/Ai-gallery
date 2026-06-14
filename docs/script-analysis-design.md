# 剧本分析功能 - 设计规范

## 页面布局
- 桌面端（>=1024px）：左右双栏布局 — 左侧输入表单，右侧分析结果
- 平板端（640-1023px）：同上双栏，间距缩小
- 手机端（<640px）：单栏堆叠 — 表单在上，结果在下

## 组件层次
```
/script-analysis
├── 顶部导航：返回首页链接 + 页面标题
├── 左侧栏（lg:w-1/2）
│   └── ScriptInputForm（卡片容器内）
│       ├── 剧本简介 textarea + 字数计数
│       ├── 目标受众 input
│       ├── 错误提示（条件渲染）
│       └── 分析按钮（含 loading 状态）
└── 右侧栏（lg:w-1/2）
    └── AnalysisResult（卡片容器内）
        ├── 标签页导航（人物 | 场景 | 道具）
        └── AssetCard 网格（1/2/3 列）
            ├── 名称 + 描述
            ├── ImageUploadSlot
            │   ├── 空状态：上传区域
            │   ├── 上传中：旋转动画
            │   └── 有图片：预览 + 删除按钮
            └── 生图提示词 + 复制按钮
```

## 配色与样式
- 沿用项目暗色主题体系
- 卡片：`rounded-2xl bg-black/40 backdrop-blur-xl border border-white/[0.06]`
- 按钮：`rounded-full` 药丸按钮，半透明底色
- 标签：`rounded-full`，active 态白色半透明
- 输入框：`rounded-xl bg-white/[0.04] border border-white/[0.08]`，focus 时边框变亮
- 错误提示：红色半透明背景 `bg-red-500/10 border-red-500/20`
- 字体：标题 Geist Sans，提示词等宽 Geist Mono

## 状态覆盖
| 组件 | 状态 |
|------|------|
| 页面整体 | 加载中 / 空数据 / 有数据 / 错误 |
| ScriptInputForm | 待输入 / 分析中 / 校验错误 |
| AnalysisResult | 有结果 / 某类为空 / 全空 |
| AssetCard | 无图片 / 上传中 / 有图片 |
| ImageUploadSlot | 空（hover/拖拽） / 上传中 / 预览 / 错误提示 |
| 提示词复制 | 未复制 / 已复制（2秒反馈） |

## 交互细节
- 图片上传支持点击选择 + 拖拽
- 图片 hover 显示删除按钮（group-hover）
- 复制按钮点击后有 2 秒绿色反馈
- 分析中按钮显示旋转动画 + "AI 分析中..."文字
- 分析过程中按钮禁用，防止重复提交
