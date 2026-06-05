import express from "express";
import { validateYamlString } from "../shared/schema";
import type { ConvertRequest, ProviderPreference, StylePreset } from "../shared/types";
import { convertNovel } from "./converter";

const STYLE_PRESETS: StylePreset[] = ["webdrama", "film", "audio"];
const PROVIDER_PREFERENCES: ProviderPreference[] = ["auto", "dashscope", "openai", "mock"];

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  app.post("/api/validate", (request, response) => {
    const yaml = typeof request.body?.yaml === "string" ? request.body.yaml : "";
    response.json(validateYamlString(yaml));
  });

  app.post("/api/convert", async (request, response) => {
    const parsed = parseConvertRequest(request.body);
    if (!parsed.ok) {
      response.status(400).json({
        message: "请求参数无效",
        errors: parsed.errors
      });
      return;
    }

    const result = await convertNovel(parsed.value);
    response.json(result);
  });

  return app;
}

function parseConvertRequest(body: unknown):
  | { ok: true; value: ConvertRequest }
  | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const record = isRecord(body) ? body : {};
  const title = typeof record.title === "string" ? record.title.trim() : "";
  const sourceText = typeof record.sourceText === "string" ? record.sourceText.trim() : "";
  const stylePreset = record.stylePreset;
  const providerPreference = record.providerPreference ?? "auto";

  if (!title) errors.push("title 必须是非空字符串");
  if (sourceText.length < 30) errors.push("sourceText 至少需要 30 个字符");
  if (!STYLE_PRESETS.includes(stylePreset as StylePreset)) {
    errors.push("stylePreset 必须是 webdrama、film 或 audio");
  }
  if (!PROVIDER_PREFERENCES.includes(providerPreference as ProviderPreference)) {
    errors.push("providerPreference 必须是 auto、dashscope、openai 或 mock");
  }

  return errors.length
    ? { ok: false, errors }
    : {
        ok: true,
        value: {
          title,
          sourceText,
          stylePreset: stylePreset as StylePreset,
          providerPreference: providerPreference as ProviderPreference
        }
      };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
