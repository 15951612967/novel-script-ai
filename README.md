# AI 小说转剧本工具

把 3 个章节以上的小说文本转换为可编辑、可校验、可导出的结构化剧本 YAML。

## 功能

- 小说文本输入、三种剧本风格选择：短剧、电影、广播剧
- AI 生成结构化 YAML，支持页面选择自动、阿里云百炼强模型、OpenAI、本地 mock
- YAML Schema 校验、错误提示、角色索引、场景索引、质量报告
- 导出 `.yaml` 和 `.md`
- 内置三章样例，方便比赛现场快速演示

## 快速运行

如果本机能使用 conda：

```powershell
conda activate qiniu
```

项目本体不依赖 Python，直接使用 Node/npm：

```powershell
npm install
npm run dev
```

默认前端地址：

- Web 工作台：http://127.0.0.1:5173
- API 服务：http://127.0.0.1:8787

比赛现场如需避免外部 API 波动：

```powershell
$env:AI_PROVIDER="mock"
npm run dev
```

## 使用阿里云百炼强模型

项目支持阿里云百炼 / DashScope 的 OpenAI-compatible 接口。先在终端设置 API Key：

```powershell
$env:DASHSCOPE_API_KEY="你的百炼 API Key"
$env:DASHSCOPE_MODEL="qwen-max"
npm run dev
```

然后在页面“模型来源”选择“阿里云百炼”。默认模型是 `qwen-max`，偏强效果；如果想更省免费额度，可以把 `DASHSCOPE_MODEL` 改成 `qwen-plus`。

如果你同时配置了 OpenAI 和百炼，页面选择“阿里云百炼”时只会走百炼；选择“自动”时会按 OpenAI、百炼的顺序尝试。

## API

`POST /api/convert`

```json
{
  "title": "星桥来信",
  "sourceText": "第一章 ... 第二章 ... 第三章 ...",
  "stylePreset": "webdrama",
  "providerPreference": "dashscope"
}
```

返回：

```json
{
  "yaml": "meta:\n  title: 星桥来信\n...",
  "report": {
    "provider": "mock",
    "completenessScore": 88,
    "chapterCount": 3,
    "sceneCount": 3,
    "warnings": []
  },
  "validation": {
    "valid": true,
    "errors": []
  }
}
```

`POST /api/validate`

```json
{
  "yaml": "meta:\n  title: 星桥来信\n..."
}
```

## YAML 顶层结构

```yaml
meta: {}
characters: []
chapters: []
scenes: []
continuity_notes: []
quality_report: {}
```

正式 Schema 定义见 [docs/script-schema.yaml](docs/script-schema.yaml)，设计原因见 [docs/schema-design.md](docs/schema-design.md)。

## 验证

```powershell
npm run test
npm run build
```

当前测试覆盖：分章、Schema 校验、mock provider、API、Markdown 导出。

## demo
novel-script-ai-demo.webm
