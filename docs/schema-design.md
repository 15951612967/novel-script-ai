# YAML Schema 设计说明

## 设计目标

这个 Schema 的目标是让小说转剧本结果同时满足三件事：可编辑、可校验、可继续生产。作者可以直接修改 YAML；工具可以用 Schema 判断字段是否齐全；后续也能把同一份 YAML 转成 Markdown、分镜表或拍摄清单。

## 正式 Schema 文件

正式 YAML Schema 定义见 [script-schema.yaml](script-schema.yaml)。该文件采用 JSON Schema 结构并保存为 YAML，便于评委直接查看字段类型、必填项、枚举值和最小数量约束；应用内校验逻辑位于 `src/shared/schema.ts`，与该文档保持同一组核心约束。

## 顶层结构

```yaml
meta:
  title: string
  source_chapter_count: number
  style_preset: webdrama | film | audio
characters:
  - id: string
    name: string
    role: string
    goal: string
chapters:
  - id: string
    title: string
    summary: string
scenes:
  - id: string
    chapter_id: string
    location: string
    time: string
    dramatic_goal: string
    beats: string[]
    dialogue:
      - character: string
        line: string
continuity_notes: string[]
quality_report:
  completeness_score: number
  issues: string[]
```

## 关键约束

- `chapters` 至少 3 个，贴合题目“3 个章节以上”的要求。
- `meta.source_chapter_count` 至少为 3，明确记录原始小说满足三章要求。
- 每个 `chapter` 至少对应一个 `scene`，避免只生成章节摘要而没有剧本内容。
- 每个 `scene` 必须有地点、时间、戏剧目标、节拍和对白，保证能被继续编辑为分场剧本。
- `characters` 记录角色目标，而不只记录姓名，方便后续检查人物动机是否连续。
- `quality_report` 放在 YAML 内部，让评审直接看到工具对输出质量的自检。

## 风格预设

- `webdrama`：强调短场景、强冲突、场尾钩子。
- `film`：强调视觉调度、场面转换、镜头感。
- `audio`：强调声音线索、对白密度、可听化信息。

## 设计取舍

本项目没有把 Schema 做成过度复杂的制片工业格式，而是保留比赛 Demo 最需要的字段。这样可以降低作者理解成本，同时让自动校验、导出和二次加工都足够稳定。
