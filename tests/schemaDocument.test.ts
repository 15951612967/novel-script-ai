import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";

describe("script schema document", () => {
  it("defines the required screenplay YAML fields as a parseable schema file", () => {
    const schemaText = readFileSync(join(process.cwd(), "docs", "script-schema.yaml"), "utf8");
    const schema = parse(schemaText) as {
      required?: string[];
      properties?: Record<
        string,
        { type?: string; minItems?: number; required?: string[]; items?: { required?: string[] } }
      >;
    };

    expect(schema.required).toEqual([
      "meta",
      "characters",
      "chapters",
      "scenes",
      "continuity_notes",
      "quality_report"
    ]);
    expect(schema.properties?.chapters.minItems).toBe(3);
    expect(schema.properties?.scenes.items?.required).toContain("dialogue");
  });

  it("links the formal schema from the design document and README", () => {
    const design = readFileSync(join(process.cwd(), "docs", "schema-design.md"), "utf8");
    const readme = readFileSync(join(process.cwd(), "README.md"), "utf8");

    expect(design).toContain("script-schema.yaml");
    expect(readme).toContain("docs/script-schema.yaml");
  });
});
