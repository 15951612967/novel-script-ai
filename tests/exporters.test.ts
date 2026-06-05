import { describe, expect, it } from "vitest";
import { yamlToMarkdownSummary } from "../src/client/exporters";

describe("yamlToMarkdownSummary", () => {
  it("creates a readable markdown synopsis from valid script YAML", () => {
    const markdown = yamlToMarkdownSummary(`
meta:
  title: 星桥来信
  source_chapter_count: 3
  style_preset: webdrama
characters:
  - id: char_lin
    name: 林澈
    role: 主角
    goal: 追查星桥
chapters:
  - id: ch01
    title: 第一章 雨夜来信
    summary: 匿名信出现。
  - id: ch02
    title: 第二章 旧车站
    summary: 铜钥匙出现。
  - id: ch03
    title: 第三章 天台灯塔
    summary: 星桥入口出现。
scenes:
  - id: sc01
    chapter_id: ch01
    location: 档案室
    time: 夜
    dramatic_goal: 建立悬念
    beats:
      - 匿名信出现
    dialogue:
      - character: 林澈
        line: 我会查下去。
  - id: sc02
    chapter_id: ch02
    location: 旧车站
    time: 夜
    dramatic_goal: 交出关键道具
    beats:
      - 铜钥匙出现
    dialogue:
      - character: 林澈
        line: 门在哪里？
  - id: sc03
    chapter_id: ch03
    location: 天台
    time: 黎明
    dramatic_goal: 打开结尾悬念
    beats:
      - 星桥入口出现
    dialogue:
      - character: 林澈
        line: 我们到了。
continuity_notes: []
quality_report:
  completeness_score: 90
  issues: []
`);

    expect(markdown).toContain("# 星桥来信");
    expect(markdown).toContain("## 角色");
    expect(markdown).toContain("- 林澈：主角，目标：追查星桥");
    expect(markdown).toContain("### 第一章 雨夜来信");
  });
});
