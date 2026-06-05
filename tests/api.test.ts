import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/server/app";

describe("API", () => {
  process.env.AI_PROVIDER = "mock";
  const app = createApp();

  it("POST /api/validate returns validation errors for invalid YAML", async () => {
    const response = await request(app)
      .post("/api/validate")
      .send({ yaml: "meta:\n  title: only meta\n" });

    expect(response.status).toBe(200);
    expect(response.body.valid).toBe(false);
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  it("POST /api/convert returns valid YAML even without external AI", async () => {
    const response = await request(app)
      .post("/api/convert")
      .send({
        title: "星桥来信",
        providerPreference: "mock",
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

    expect(response.status).toBe(200);
    expect(response.body.validation.valid).toBe(true);
    expect(response.body.yaml).toContain("chapters:");
    expect(response.body.report.provider).toBe("mock");
  });

  it("POST /api/convert rejects unknown provider preferences", async () => {
    const response = await request(app)
      .post("/api/convert")
      .send({
        title: "星桥来信",
        providerPreference: "unknown",
        stylePreset: "webdrama",
        sourceText: "第一章 开端\n有足够长的正文。\n\n第二章 发展\n有足够长的正文。\n\n第三章 结尾\n有足够长的正文。"
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContain("providerPreference 必须是 auto、dashscope、openai 或 mock");
  });
});
