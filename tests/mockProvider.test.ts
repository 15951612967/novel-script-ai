import { describe, expect, it } from "vitest";
import { createMockConversion } from "../src/server/mockProvider";
import { validateYamlString } from "../src/shared/schema";

describe("createMockConversion", () => {
  it("turns a three-chapter novel into valid script YAML and a quality report", () => {
    const result = createMockConversion({
      title: "星桥来信",
      stylePreset: "webdrama",
      sourceText: `
第一章 雨夜来信
林澈在雨夜收到匿名信，信纸背面画着星桥。

第二章 旧车站
沈遥在车站拿出铜钥匙，告诉林澈还有一个见证者。

第三章 天台灯塔
城市中心升起蓝色光柱，星桥的真正入口出现。
`
    });

    const validation = validateYamlString(result.yaml);

    expect(result.provider).toBe("mock");
    expect(validation.valid).toBe(true);
    expect(result.report.completenessScore).toBeGreaterThanOrEqual(80);
    expect(result.yaml).toContain("星桥来信");
  });
});
