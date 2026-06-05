import {
  CheckCircle2,
  Download,
  FileText,
  RefreshCw,
  Sparkles,
  TriangleAlert,
  Wand2
} from "lucide-react";
import { useMemo, useState } from "react";
import { yamlToMarkdownSummary } from "./exporters";
import { sampleNovel, sampleNovelTitle } from "./sampleNovel";
import type { QualityReport, ScriptProject, StylePreset, ValidationResult } from "../shared/types";

type Status = "idle" | "loading" | "ready" | "error";

const styleOptions: Array<{ value: StylePreset; label: string }> = [
  { value: "webdrama", label: "短剧" },
  { value: "film", label: "电影" },
  { value: "audio", label: "广播剧" }
];

export function App() {
  const [title, setTitle] = useState(sampleNovelTitle);
  const [sourceText, setSourceText] = useState(sampleNovel);
  const [stylePreset, setStylePreset] = useState<StylePreset>("webdrama");
  const [yaml, setYaml] = useState("");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [report, setReport] = useState<QualityReport | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("等待生成");

  const parsed = validation?.valid ? validation.parsed : undefined;
  const stats = useMemo(() => getStats(parsed, report), [parsed, report]);

  async function convertNovel() {
    setStatus("loading");
    setMessage("生成中");
    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, sourceText, stylePreset })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.errors?.join("；") || payload.message || "生成失败");
      }
      setYaml(payload.yaml);
      setValidation(payload.validation);
      setReport(payload.report);
      setStatus("ready");
      setMessage(payload.validation.valid ? "Schema 通过" : "需要修正 YAML");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "生成失败");
    }
  }

  async function validateYaml() {
    setStatus("loading");
    setMessage("校验中");
    try {
      const response = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yaml })
      });
      const payload = (await response.json()) as ValidationResult;
      setValidation(payload);
      setStatus(payload.valid ? "ready" : "error");
      setMessage(payload.valid ? "Schema 通过" : "Schema 未通过");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "校验失败");
    }
  }

  function loadSample() {
    setTitle(sampleNovelTitle);
    setSourceText(sampleNovel);
    setStylePreset("webdrama");
    setMessage("样例已载入");
  }

  function downloadYaml() {
    if (!yaml.trim()) return;
    downloadText(`${safeFileName(title)}.yaml`, yaml);
  }

  function downloadMarkdown() {
    if (!yaml.trim()) return;
    try {
      downloadText(`${safeFileName(title)}.md`, yamlToMarkdownSummary(yaml));
      setMessage("Markdown 已导出");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Markdown 导出失败");
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Qiniu AI Challenge</p>
          <h1>AI 小说转剧本工具</h1>
        </div>
        <div className={`status-pill ${status}`}>
          {status === "error" ? <TriangleAlert size={16} /> : <CheckCircle2 size={16} />}
          <span>{message}</span>
        </div>
      </header>

      <section className="metric-strip" aria-label="剧本指标">
        {stats.map((item) => (
          <div className="metric" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </section>

      <main className="workbench">
        <section className="panel input-panel">
          <div className="panel-heading">
            <h2>小说输入</h2>
            <button className="icon-button" type="button" onClick={loadSample} title="加载样例">
              <RefreshCw size={17} />
              <span>样例</span>
            </button>
          </div>
          <label className="field">
            <span>作品标题</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <div className="segmented" role="group" aria-label="剧本风格">
            {styleOptions.map((option) => (
              <button
                className={stylePreset === option.value ? "selected" : ""}
                key={option.value}
                type="button"
                onClick={() => setStylePreset(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <textarea
            className="novel-area"
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
            spellCheck={false}
          />
          <button className="primary-action" type="button" onClick={convertNovel} disabled={status === "loading"}>
            <Wand2 size={18} />
            <span>{status === "loading" ? "处理中" : "生成剧本 YAML"}</span>
          </button>
        </section>

        <section className="panel output-panel">
          <div className="panel-heading">
            <h2>结构化剧本</h2>
            <div className="toolbar">
              <button className="icon-button" type="button" onClick={validateYaml} disabled={!yaml.trim()}>
                <CheckCircle2 size={17} />
                <span>校验</span>
              </button>
              <button className="icon-button" type="button" onClick={downloadYaml} disabled={!yaml.trim()} title="导出 YAML">
                <Download size={17} />
                <span>YAML</span>
              </button>
              <button className="icon-button" type="button" onClick={downloadMarkdown} disabled={!yaml.trim()} title="导出 Markdown">
                <FileText size={17} />
                <span>MD</span>
              </button>
            </div>
          </div>
          <textarea
            className="yaml-area"
            value={yaml}
            onChange={(event) => setYaml(event.target.value)}
            placeholder="生成后的 YAML 会出现在这里"
            spellCheck={false}
          />
        </section>
      </main>

      <section className="inspector">
        <InfoList title="角色" empty="暂无角色" items={parsed?.characters.map((item) => `${item.name} / ${item.role}`) ?? []} />
        <InfoList
          title="场景"
          empty="暂无场景"
          items={parsed?.scenes.map((item) => `${item.chapter_id} · ${item.location} · ${item.dramatic_goal}`) ?? []}
        />
        <InfoList
          title="质量"
          empty="等待校验"
          items={
            validation?.valid
              ? [`完整度 ${parsed?.quality_report.completeness_score ?? "-"} 分`, ...(parsed?.quality_report.issues ?? [])]
              : validation?.errors ?? []
          }
        />
      </section>
    </div>
  );
}

function InfoList({ title, empty, items }: { title: string; empty: string; items: string[] }) {
  return (
    <section className="info-section">
      <h3>{title}</h3>
      <div className="info-list">
        {items.length ? items.map((item) => <div className="info-card" key={item}>{item}</div>) : <div className="muted">{empty}</div>}
      </div>
    </section>
  );
}

function getStats(project: ScriptProject | undefined, report: QualityReport | null) {
  return [
    { label: "章节", value: project?.chapters.length ?? "-" },
    { label: "场景", value: project?.scenes.length ?? "-" },
    { label: "完整度", value: project ? `${project.quality_report.completeness_score}` : "-" },
    { label: "Provider", value: report?.provider ?? "-" }
  ];
}

function safeFileName(name: string): string {
  return (name.trim() || "script").replace(/[\\/:*?"<>|]/g, "-");
}

function downloadText(fileName: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
