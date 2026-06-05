import { validateYamlString } from "../shared/schema";

export function yamlToMarkdownSummary(yamlText: string): string {
  const validation = validateYamlString(yamlText);
  if (!validation.valid || !validation.parsed) {
    throw new Error(validation.errors.join("; "));
  }

  const project = validation.parsed;
  const lines: string[] = [
    `# ${project.meta.title}`,
    "",
    `- 风格：${project.meta.style_preset}`,
    `- 原始章节数：${project.meta.source_chapter_count}`,
    `- 完整度评分：${project.quality_report.completeness_score}`,
    "",
    "## 角色",
    ...project.characters.map((character) => `- ${character.name}：${character.role}，目标：${character.goal}`),
    "",
    "## 分章剧本"
  ];

  for (const chapter of project.chapters) {
    lines.push("", `### ${chapter.title}`, "", chapter.summary, "");
    const scenes = project.scenes.filter((scene) => scene.chapter_id === chapter.id);
    for (const scene of scenes) {
      lines.push(
        `- 场景：${scene.location} / ${scene.time}`,
        `- 戏剧目标：${scene.dramatic_goal}`,
        `- 节拍：${scene.beats.join("；")}`,
        "- 对白：",
        ...scene.dialogue.map((line) => `  - ${line.character}：${line.line}`),
        ""
      );
    }
  }

  if (project.continuity_notes.length) {
    lines.push("## 连续性备注", ...project.continuity_notes.map((note) => `- ${note}`), "");
  }

  if (project.quality_report.issues.length) {
    lines.push("## 待优化点", ...project.quality_report.issues.map((issue) => `- ${issue}`));
  }

  return `${lines.join("\n").trim()}\n`;
}
