import { stringify } from "yaml";
import { splitNovelIntoChapters } from "../shared/chaptering";
import type { ConversionResult, ConvertRequest, QualityReport, ScriptProject } from "../shared/types";
import { validateYamlString } from "../shared/schema";

const STYLE_LABELS = {
  webdrama: "短剧强冲突",
  film: "电影分场",
  audio: "广播剧声音优先"
} as const;

export function createMockConversion(request: ConvertRequest): ConversionResult {
  const chapters = splitNovelIntoChapters(request.sourceText).slice(0, 6);
  const safeChapters = chapters.length >= 3 ? chapters : splitNovelIntoChapters(request.sourceText);
  const selected = safeChapters.slice(0, Math.max(3, safeChapters.length));

  const project: ScriptProject = {
    meta: {
      title: request.title.trim() || "未命名小说",
      source_chapter_count: selected.length,
      style_preset: request.stylePreset
    },
    characters: [
      {
        id: "char_protagonist",
        name: "主角",
        role: "推动剧情的人物",
        goal: "追查核心谜团并完成选择"
      },
      {
        id: "char_partner",
        name: "同伴",
        role: "提供线索与情感支点",
        goal: "帮助主角补全真相"
      }
    ],
    chapters: selected.map((chapter) => ({
      id: chapterId(chapter.index),
      title: chapter.title,
      summary: summarize(chapter.body)
    })),
    scenes: selected.map((chapter) => ({
      id: `${chapterId(chapter.index)}_sc01`,
      chapter_id: chapterId(chapter.index),
      location: inferLocation(chapter.body),
      time: inferTime(chapter.body),
      dramatic_goal: `${STYLE_LABELS[request.stylePreset]}：${summarize(chapter.body, 28)}`,
      beats: [
        summarize(chapter.body, 34),
        "角色交换关键信息，推动下一场行动",
        "场尾留下一个可视化悬念"
      ],
      dialogue: [
        {
          character: "主角",
          line: "这不是巧合，线索一定指向同一个地方。"
        },
        {
          character: "同伴",
          line: "如果继续追下去，我们就没有回头路了。"
        }
      ]
    })),
    continuity_notes: [
      "每章场尾保留一个可延续到下一章的视觉或道具线索。",
      "主角目标从寻找线索逐步升级为直面真相。",
      `当前风格预设为${STYLE_LABELS[request.stylePreset]}，对白和场面调度应围绕该风格微调。`
    ],
    quality_report: {
      completeness_score: selected.length >= 3 ? 88 : 62,
      issues: selected.length >= 3 ? ["可继续细化角色专属口癖。"] : ["原文不足三章，建议补充素材。"]
    }
  };

  const yaml = stringify(project, { lineWidth: 0 });
  const validation = validateYamlString(yaml);
  const report: QualityReport = {
    provider: "mock",
    completenessScore: project.quality_report.completeness_score,
    chapterCount: project.chapters.length,
    sceneCount: project.scenes.length,
    warnings: project.quality_report.issues
  };

  return {
    yaml,
    report,
    validation,
    provider: "mock"
  };
}

function chapterId(index: number): string {
  return `ch${String(index).padStart(2, "0")}`;
}

function summarize(text: string, maxLength = 42): string {
  const sentence = text
    .replace(/\s+/g, " ")
    .split(/[。！？!?]/)
    .find((part) => part.trim().length > 0)
    ?.trim();
  const summary = sentence || text.replace(/\s+/g, " ").trim();
  return summary.length > maxLength ? `${summary.slice(0, maxLength)}...` : summary;
}

function inferLocation(text: string): string {
  if (/车站|站台|地铁/.test(text)) return "旧车站";
  if (/天台|楼顶/.test(text)) return "天台";
  if (/雨|信|档案/.test(text)) return "档案室";
  return "关键场景";
}

function inferTime(text: string): string {
  if (/夜|凌晨|雨/.test(text)) return "夜";
  if (/清晨|黎明/.test(text)) return "清晨";
  return "日";
}
