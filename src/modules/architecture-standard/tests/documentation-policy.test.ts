/** @fileoverview Focused documentation-policy contract tests. */
import { describe, expect, it } from "vitest";
import { authoredSourcePolicyV1, evaluateAuthoredSources, evaluateDocumentation, repositoryRules } from "@/modules/architecture-standard";

const snapshot = (files: Record<string, string>) => ({ files: Object.entries(files).map(([path, text]) => ({ path, text })) });
const validDocumentation = {
  "README.md": "[docs](docs/README.md)",
  "docs/README.md": "[guides](guides/README.md)",
  "docs/guides/README.md": "[intro](intro.md)",
  "docs/guides/intro.md": "# Intro"
};

describe("documentation policy", () => {
  it("publishes every stable documentation rule", () => {
    expect(repositoryRules.map(({ id }) => id)).toEqual(expect.arrayContaining([
      "DOC-LOCAL-README",
      "DOC-LOCAL-INDEX",
      "DOC-PARENT-INDEX",
      "DOC-BROKEN-LOCAL-LINK",
      "DOC-UNSCOPED-DOCUMENT"
    ]));
  });

  it("accepts a complete root-to-leaf navigation chain", () => {
    expect(evaluateDocumentation(snapshot(validDocumentation)).violations).toEqual([]);
  });

  it("requires the root index and every dynamic special-index link", () => {
    expect(evaluateDocumentation(snapshot({})).violations).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: "DOC-LOCAL-README", path: "README.md" })
    ]));
    const files = {
      "README.md": "[agents](AGENTS.md)\n[claude](CLAUDE.md)\n[plans](PLANS.md)\n[docs](docs/README.md)\n[scripts](scripts/README.md)\n[hooks](.githooks/README.md)\n[modules](src/modules/README.md)\n[skill](.agents/skills/example/SKILL.md)",
      "AGENTS.md": "", "CLAUDE.md": "", "PLANS.md": "", "docs/README.md": "", "scripts/README.md": "[guide](guide.md)\n[hooks](hooks/README.md)", "scripts/guide.md": "", "scripts/hooks/README.md": "", ".githooks/README.md": "[guide](guide.md)", ".githooks/guide.md": "", "src/modules/README.md": "[example](example/README.md)", "src/modules/example/README.md": "", ".agents/skills/example/SKILL.md": "[guide](references/guide.md)", ".agents/skills/example/references/guide.md": ""
    };
    expect(evaluateDocumentation(snapshot(files)).violations).toEqual([]);
    for (const [path, expected] of [["README.md", ".agents/skills/example/SKILL.md"], [".agents/skills/example/SKILL.md", "references/guide.md"], ["scripts/README.md", "guide.md"], [".githooks/README.md", "guide.md"], ["src/modules/README.md", "example/README.md"]] as const) {
      const changed = { ...files, [path]: files[path].replace(expected, "missing") };
      expect(evaluateDocumentation(snapshot(changed)).violations).toEqual(expect.arrayContaining([expect.objectContaining({ ruleId: "DOC-LOCAL-INDEX" })]));
    }
  });

  it("derives special documents and index targets from the supplied policy", () => {
    const policy = {
      ...authoredSourcePolicyV1,
      rootIndexEntries: ["handbook/INDEX.md"],
      specialIndexes: { handbook: ["INDEX.md"] }
    };
    const files = {
      "README.md": "[handbook](handbook/INDEX.md)",
      "handbook/INDEX.md": "[guide](guide.md)",
      "handbook/guide.md": "# Guide",
      ".agents/skills/example/SKILL.md": "# No longer special"
    };
    expect(evaluateDocumentation(snapshot(files), policy).violations).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: "DOC-UNSCOPED-DOCUMENT", path: ".agents/skills/example/SKILL.md" })
    ]));
    expect(evaluateDocumentation(snapshot({ ...files, "handbook/INDEX.md": "" }), policy).violations).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: "DOC-LOCAL-INDEX", path: "handbook/guide.md" })
    ]));
  });

  it("reports each malformed documentation condition with a stable rule and path", () => {
    const cases = [
      { files: { "README.md": "", "docs/page.md": "# page" }, ruleId: "DOC-LOCAL-README", path: "docs" },
      { files: { "README.md": "[docs](docs/README.md)", "docs/README.md": "", "docs/page.md": "# page" }, ruleId: "DOC-LOCAL-INDEX", path: "docs/page.md" },
      { files: { "README.md": "[docs](docs/README.md)", "docs/README.md": "", "docs/child/README.md": "" }, ruleId: "DOC-PARENT-INDEX", path: "docs/child/README.md" },
      { files: { "README.md": "[docs](docs/README.md)", "docs/README.md": "[missing](missing.md)" }, ruleId: "DOC-BROKEN-LOCAL-LINK", path: "docs/README.md" },
      { files: { "notes.md": "# note" }, ruleId: "DOC-UNSCOPED-DOCUMENT", path: "notes.md" }
    ] as const;
    for (const fixture of cases) expect(evaluateDocumentation(snapshot(fixture.files)).violations).toEqual(expect.arrayContaining([expect.objectContaining({ ruleId: fixture.ruleId, path: fixture.path })]));
  });

  it("requires a README for a YAML-only documentation directory", () => {
    const result = evaluateDocumentation(snapshot({ "README.md": "[docs](docs/README.md)", "docs/README.md": "[source](source/README.md)", "docs/source/data.yaml": "name: mandem" }));
    expect(result.violations).toEqual(expect.arrayContaining([expect.objectContaining({ ruleId: "DOC-LOCAL-README", path: "docs/source" })]));
  });

  it("normalizes query, fragment, percent encoding, and child-directory links", () => {
    const result = evaluateDocumentation(snapshot({
      "README.md": "[docs](docs/)",
      "docs/README.md": "[guides](guides/)\n[reference](reference%20guide.md?view=full#section)",
      "docs/guides/README.md": "",
      "docs/reference guide.md": "# reference"
    }));
    expect(result.violations).toEqual([]);
  });

  it("enforces useful leading fileoverview comments across each authored root", () => {
    const result = evaluateAuthoredSources(snapshot({
      "src/file.ts": "/** @fileoverview source. */\nexport {};",
      "scripts/file.ts": "#!/usr/bin/env bun\n/** @fileoverview script. */\nexport {};",
      "tests/file.test.ts": "/** @fileoverview test. */\nexport {};",
      "docs/plans/contracts/contract.ts": "/** @fileoverview planning contract. */\nexport {};",
      "eslint.config.ts": "/** @fileoverview config. */\nexport {};",
      "src/misplaced.ts": "// text\n/** @fileoverview later. */",
      "scripts/placeholder.ts": "/** @fileoverview todo */",
      "scripts/todo-punctuation.ts": "/** @fileoverview TODO! */",
      "scripts/tags-only.ts": "/**\n * @fileoverview\n * @param value ignored\n */",
      "tests/fixtures/example.ts": "export {};",
      "generated/file.ts": "export {};",
      "types.d.ts": "declare const value: string;",
      "tools/unscoped.ts": "/** @fileoverview tool. */"
    }));
    expect(result.violations).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: "ARCH-FILEOVERVIEW", path: "src/misplaced.ts" }),
      expect.objectContaining({ ruleId: "ARCH-FILEOVERVIEW", path: "scripts/placeholder.ts" }),
      expect.objectContaining({ ruleId: "ARCH-FILEOVERVIEW", path: "scripts/todo-punctuation.ts" }),
      expect.objectContaining({ ruleId: "ARCH-FILEOVERVIEW", path: "scripts/tags-only.ts" }),
      expect.objectContaining({ ruleId: "ARCH-UNSCOPED-TYPESCRIPT", path: "tools/unscoped.ts" })
    ]));
    expect(result.violations.map(({ path }) => path)).not.toEqual(expect.arrayContaining(["tests/fixtures/example.ts", "generated/file.ts", "types.d.ts"]));
    expect(result.violations.map(({ path }) => path)).not.toContain("docs/plans/contracts/contract.ts");
  });

  it("uses the supplied authored-source policy for inclusion and exclusion", () => {
    const policy = {
      ...authoredSourcePolicyV1,
      authoredSourceIncludes: ["custom/"],
      authoredSourceExcludes: ["custom/ignored/"]
    };
    const result = evaluateAuthoredSources(snapshot({
      "custom/missing.ts": "export {};",
      "custom/ignored/missing.ts": "export {};",
      "src/missing.ts": "export {};"
    }), policy);
    expect(result.violations).toEqual([
      expect.objectContaining({ ruleId: "ARCH-FILEOVERVIEW", path: "custom/missing.ts" }),
      expect.objectContaining({ ruleId: "ARCH-UNSCOPED-TYPESCRIPT", path: "src/missing.ts" })
    ]);
  });
});
