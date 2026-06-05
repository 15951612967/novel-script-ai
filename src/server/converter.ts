import { validateYamlString } from "../shared/schema";
import type { ConversionResult, ConvertRequest, QualityReport } from "../shared/types";
import { createMockConversion } from "./mockProvider";

interface AiProvider {
  name: string;
  enabled: boolean;
  convert: (request: ConvertRequest) => Promise<string>;
}

export async function convertNovel(request: ConvertRequest): Promise<ConversionResult> {
  if (process.env.AI_PROVIDER === "mock") {
    return createMockConversion(request);
  }

  const providers = createProviders();
  const warnings: string[] = [];

  for (const provider of providers) {
    if (!provider.enabled) {
      continue;
    }

    try {
      const yaml = await provider.convert(request);
      const validation = validateYamlString(yaml);
      if (!validation.valid || !validation.parsed) {
        warnings.push(`${provider.name} 返回内容未通过 Schema 校验`);
        continue;
      }

      const report: QualityReport = {
        provider: provider.name,
        completenessScore: validation.parsed.quality_report.completeness_score,
        chapterCount: validation.parsed.chapters.length,
        sceneCount: validation.parsed.scenes.length,
        warnings: validation.parsed.quality_report.issues
      };

      return {
        yaml,
        report,
        validation,
        provider: provider.name
      };
    } catch (error) {
      warnings.push(`${provider.name} 调用失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const fallback = createMockConversion(request);
  return {
    ...fallback,
    report: {
      ...fallback.report,
      warnings: [...warnings, ...fallback.report.warnings]
    }
  };
}

function createProviders(): AiProvider[] {
  return [
    {
      name: "openai",
      enabled: Boolean(process.env.OPENAI_API_KEY),
      convert: (request) =>
        callCompatibleChatCompletion({
          endpoint: "https://api.openai.com/v1/chat/completions",
          apiKey: process.env.OPENAI_API_KEY ?? "",
          model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
          request
        })
    },
    {
      name: "dashscope",
      enabled: Boolean(process.env.DASHSCOPE_API_KEY),
      convert: (request) =>
        callCompatibleChatCompletion({
          endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
          apiKey: process.env.DASHSCOPE_API_KEY ?? "",
          model: process.env.DASHSCOPE_MODEL ?? "qwen-plus",
          request
        })
    }
  ];
}

async function callCompatibleChatCompletion(input: {
  endpoint: string;
  apiKey: string;
  model: string;
  request: ConvertRequest;
}): Promise<string> {
  const response = await fetch(input.endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: input.model,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "你是专业编剧工具。只输出 YAML，不要 Markdown 代码围栏。YAML 必须包含 meta、characters、chapters、scenes、continuity_notes、quality_report。chapters 至少 3 个，每章至少一个 scene。"
        },
        {
          role: "user",
          content: `标题：${input.request.title}
风格：${input.request.stylePreset}
请把以下小说改编为结构化剧本 YAML：

${input.request.sourceText}`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("模型响应为空");
  }

  return stripCodeFence(content);
}

function stripCodeFence(content: string): string {
  return content.replace(/^```ya?ml\s*/i, "").replace(/```$/i, "").trim();
}
