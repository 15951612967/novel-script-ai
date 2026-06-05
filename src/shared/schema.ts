import { parse } from "yaml";
import type { ScriptProject, StylePreset, ValidationResult } from "./types";

const STYLE_PRESETS: StylePreset[] = ["webdrama", "film", "audio"];

export const scriptSchema = {
  type: "object",
  required: ["meta", "characters", "chapters", "scenes", "continuity_notes", "quality_report"],
  properties: {
    meta: {
      required: ["title", "source_chapter_count", "style_preset"]
    },
    characters: {
      minItems: 1,
      requiredItemFields: ["id", "name", "role", "goal"]
    },
    chapters: {
      minItems: 3,
      requiredItemFields: ["id", "title", "summary"]
    },
    scenes: {
      minItemsPerChapter: 1,
      requiredItemFields: ["id", "chapter_id", "location", "time", "dramatic_goal", "beats", "dialogue"]
    }
  }
} as const;

export function validateYamlString(yamlText: string): ValidationResult {
  try {
    const parsed = parse(yamlText);
    return validateScriptProject(parsed);
  } catch (error) {
    return {
      valid: false,
      errors: [`YAML 解析失败: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
}

export function validateScriptProject(candidate: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(candidate)) {
    return { valid: false, errors: ["根节点必须是对象"] };
  }

  const meta = candidate.meta;
  if (!isRecord(meta)) {
    errors.push("meta 必须是对象");
  } else {
    requireString(meta.title, "meta.title", errors);
    if (typeof meta.source_chapter_count !== "number") {
      errors.push("meta.source_chapter_count 必须是数字");
    }
    if (!STYLE_PRESETS.includes(meta.style_preset as StylePreset)) {
      errors.push("meta.style_preset 必须是 webdrama、film 或 audio");
    }
  }

  validateCharacters(candidate.characters, errors);
  validateChapters(candidate.chapters, errors);
  validateScenes(candidate.scenes, candidate.chapters, errors);
  validateStringArray(candidate.continuity_notes, "continuity_notes", errors);
  validateQualityReport(candidate.quality_report, errors);

  return errors.length === 0
    ? { valid: true, errors: [], parsed: candidate as unknown as ScriptProject }
    : { valid: false, errors };
}

function validateCharacters(value: unknown, errors: string[]): void {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push("characters 至少需要 1 个角色");
    return;
  }

  value.forEach((character, index) => {
    if (!isRecord(character)) {
      errors.push(`characters[${index}] 必须是对象`);
      return;
    }
    requireString(character.id, `characters[${index}].id`, errors);
    requireString(character.name, `characters[${index}].name`, errors);
    requireString(character.role, `characters[${index}].role`, errors);
    requireString(character.goal, `characters[${index}].goal`, errors);
  });
}

function validateChapters(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push("chapters 必须是数组");
    return;
  }
  if (value.length < 3) {
    errors.push("chapters 至少需要 3 个章节");
  }

  value.forEach((chapter, index) => {
    if (!isRecord(chapter)) {
      errors.push(`chapters[${index}] 必须是对象`);
      return;
    }
    requireString(chapter.id, `chapters[${index}].id`, errors);
    requireString(chapter.title, `chapters[${index}].title`, errors);
    requireString(chapter.summary, `chapters[${index}].summary`, errors);
  });
}

function validateScenes(value: unknown, chapters: unknown, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push("scenes 必须是数组");
    return;
  }

  const chapterIds = Array.isArray(chapters)
    ? chapters.filter(isRecord).map((chapter) => String(chapter.id ?? ""))
    : [];
  const sceneChapterIds = value.filter(isRecord).map((scene) => String(scene.chapter_id ?? ""));

  for (const chapterId of chapterIds) {
    if (chapterId && !sceneChapterIds.includes(chapterId)) {
      errors.push(`章节 ${chapterId} 至少需要 1 个场景`);
    }
  }

  value.forEach((scene, index) => {
    if (!isRecord(scene)) {
      errors.push(`scenes[${index}] 必须是对象`);
      return;
    }
    requireString(scene.id, `scenes[${index}].id`, errors);
    requireString(scene.chapter_id, `scenes[${index}].chapter_id`, errors);
    requireString(scene.location, `scenes[${index}].location`, errors);
    requireString(scene.time, `scenes[${index}].time`, errors);
    requireString(scene.dramatic_goal, `scenes[${index}].dramatic_goal`, errors);
    validateStringArray(scene.beats, `scenes[${index}].beats`, errors);
    validateDialogue(scene.dialogue, index, errors);
  });
}

function validateDialogue(value: unknown, sceneIndex: number, errors: string[]): void {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`scenes[${sceneIndex}].dialogue 至少需要 1 句对白`);
    return;
  }

  value.forEach((line, lineIndex) => {
    if (!isRecord(line)) {
      errors.push(`scenes[${sceneIndex}].dialogue[${lineIndex}] 必须是对象`);
      return;
    }
    requireString(line.character, `scenes[${sceneIndex}].dialogue[${lineIndex}].character`, errors);
    requireString(line.line, `scenes[${sceneIndex}].dialogue[${lineIndex}].line`, errors);
  });
}

function validateQualityReport(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push("quality_report 必须是对象");
    return;
  }
  if (typeof value.completeness_score !== "number") {
    errors.push("quality_report.completeness_score 必须是数字");
  }
  validateStringArray(value.issues, "quality_report.issues", errors);
}

function validateStringArray(value: unknown, label: string, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push(`${label} 必须是数组`);
    return;
  }
  value.forEach((item, index) => {
    if (typeof item !== "string") {
      errors.push(`${label}[${index}] 必须是字符串`);
    }
  });
}

function requireString(value: unknown, label: string, errors: string[]): void {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${label} 必须是非空字符串`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
