export type StylePreset = "webdrama" | "film" | "audio";
export type ProviderPreference = "auto" | "dashscope" | "openai" | "mock";

export interface ChapterDraft {
  index: number;
  title: string;
  body: string;
}

export interface ConvertRequest {
  title: string;
  sourceText: string;
  stylePreset: StylePreset;
  providerPreference: ProviderPreference;
}

export interface DialogueLine {
  character: string;
  line: string;
}

export interface ScriptScene {
  id: string;
  chapter_id: string;
  location: string;
  time: string;
  dramatic_goal: string;
  beats: string[];
  dialogue: DialogueLine[];
}

export interface ScriptChapter {
  id: string;
  title: string;
  summary: string;
}

export interface ScriptCharacter {
  id: string;
  name: string;
  role: string;
  goal: string;
}

export interface ScriptProject {
  meta: {
    title: string;
    source_chapter_count: number;
    style_preset: StylePreset;
  };
  characters: ScriptCharacter[];
  chapters: ScriptChapter[];
  scenes: ScriptScene[];
  continuity_notes: string[];
  quality_report: {
    completeness_score: number;
    issues: string[];
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  parsed?: ScriptProject;
}

export interface QualityReport {
  provider: string;
  completenessScore: number;
  chapterCount: number;
  sceneCount: number;
  warnings: string[];
}

export interface ConversionResult {
  yaml: string;
  report: QualityReport;
  validation: ValidationResult;
  provider: string;
}
