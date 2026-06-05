import { describe, expect, it } from "vitest";
import { validateYamlString } from "../src/shared/schema";

describe("validateYamlString", () => {
  it("accepts a three-chapter script YAML with characters, scenes, and dialogue", () => {
    const yaml = `
meta:
  title: 星桥来信
  source_chapter_count: 3
  style_preset: webdrama
characters:
  - id: char_lin
    name: 林澈
    role: 主角
    goal: 查清来信来源
chapters:
  - id: ch01
    title: 第一章 雨夜来信
    summary: 林澈收到匿名信。
  - id: ch02
    title: 第二章 旧车站
    summary: 林澈与沈遥会合。
  - id: ch03
    title: 第三章 天台灯塔
    summary: 蓝色光柱出现。
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
        line: 这封信不是今天写的。
  - id: sc02
    chapter_id: ch02
    location: 旧车站
    time: 夜
    dramatic_goal: 让主角获得钥匙线索
    beats:
      - 沈遥交出铜钥匙
    dialogue:
      - character: 沈遥
        line: 这把钥匙只能开一次门。
  - id: sc03
    chapter_id: ch03
    location: 天台
    time: 黎明
    dramatic_goal: 让蓝色光柱成为下一幕入口
    beats:
      - 蓝色光柱出现
    dialogue:
      - character: 林澈
        line: 原来星桥一直在城市上方。
continuity_notes:
  - 铜钥匙贯穿三章。
quality_report:
  completeness_score: 92
  issues:
    - 后续可补充反派动机。
`;

    const result = validateYamlString(yaml);

    expect(result.valid).toBe(true);
    expect(result.parsed?.chapters).toHaveLength(3);
  });

  it("rejects YAML that has fewer than three chapters", () => {
    const yaml = `
meta:
  title: 星桥来信
  source_chapter_count: 2
  style_preset: webdrama
characters:
  - id: char_lin
    name: 林澈
    role: 主角
    goal: 查清来信来源
chapters:
  - id: ch01
    title: 第一章
    summary: 开端
  - id: ch02
    title: 第二章
    summary: 发展
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
        line: 这封信不是今天写的。
continuity_notes: []
quality_report:
  completeness_score: 70
  issues: []
`;

    const result = validateYamlString(yaml);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("chapters 至少需要 3 个章节");
  });
});
