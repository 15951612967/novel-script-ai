import type { ChapterDraft } from "./types";

const HEADING_PATTERN = /^(第[一二三四五六七八九十百千万\d]+[章节回][^\n\r]*|Chapter\s+\d+[^\n\r]*)$/i;
const ORDINALS = ["一", "二", "三"];

export function splitNovelIntoChapters(sourceText: string): ChapterDraft[] {
  const normalized = sourceText.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [];
  }

  const explicit = splitByHeadings(normalized);
  if (explicit.length > 0) {
    return explicit;
  }

  return splitPlainText(normalized);
}

function splitByHeadings(text: string): ChapterDraft[] {
  const lines = text.split("\n");
  const chapters: ChapterDraft[] = [];
  let currentTitle = "";
  let currentBody: string[] = [];

  const flush = () => {
    if (!currentTitle) return;
    chapters.push({
      index: chapters.length + 1,
      title: currentTitle,
      body: currentBody.join("\n").trim()
    });
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (HEADING_PATTERN.test(line)) {
      flush();
      currentTitle = line;
      currentBody = [];
    } else if (currentTitle) {
      currentBody.push(rawLine);
    }
  }
  flush();

  return chapters.filter((chapter) => chapter.body.length > 0);
}

function splitPlainText(text: string): ChapterDraft[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks = paragraphs.length >= 3 ? splitArray(paragraphs, 3) : splitByLength(text, 3);

  return chunks.map((chunk, index) => ({
    index: index + 1,
    title: `第${ORDINALS[index] ?? index + 1}章 自动分章`,
    body: Array.isArray(chunk) ? chunk.join("\n\n") : chunk
  }));
}

function splitArray(items: string[], count: number): string[][] {
  const result: string[][] = [];
  const chunkSize = Math.ceil(items.length / count);
  for (let index = 0; index < count; index += 1) {
    result.push(items.slice(index * chunkSize, (index + 1) * chunkSize));
  }
  return result;
}

function splitByLength(text: string, count: number): string[] {
  const clean = text.replace(/\s+/g, " ");
  const chunkSize = Math.ceil(clean.length / count);
  const chunks: string[] = [];
  for (let index = 0; index < count; index += 1) {
    chunks.push(clean.slice(index * chunkSize, (index + 1) * chunkSize).trim());
  }
  return chunks.filter(Boolean);
}
