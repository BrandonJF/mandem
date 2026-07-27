/** @fileoverview Contract tests for the architecture analyzer. */
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { analyzeRepositoryFiles, architectureRules } from "@/modules/architecture-standard";

const overview = "/** @fileoverview fixture. */\n";
const completeModule = (name: string, extras: Array<{ path: string; text: string }> = []) => [
  { path: `src/modules/${name}/README.md`, text: "fixture" },
  { path: `src/modules/${name}/index.ts`, text: overview },
  { path: `src/modules/${name}/domain/types.ts`, text: overview },
  { path: `src/modules/${name}/application/index.ts`, text: overview },
  { path: `src/modules/${name}/infrastructure/index.ts`, text: overview },
  { path: `src/modules/${name}/api/composition.ts`, text: overview },
  { path: `src/modules/${name}/tests/fakes/.gitkeep`, text: "" },
  ...extras
];

describe("architecture analyzer", () => {
  it("reports a missing module infrastructure directory", () => {
    const result = analyzeRepositoryFiles([
      { path: "src/modules/runtime/README.md", text: "runtime" },
      { path: "src/modules/runtime/index.ts", text: "/** @fileoverview runtime. */" },
      { path: "src/modules/runtime/domain/types.ts", text: "/** @fileoverview types. */" },
      { path: "src/modules/runtime/api/composition.ts", text: "/** @fileoverview composition. */" }
    ]);

    expect(result.violations).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: "ARCH-MODULE-INFRASTRUCTURE", path: "src/modules/runtime" })
    ]));
  });

  it("does not treat the module index README as a module", () => {
    expect(analyzeRepositoryFiles([{ path: "src/modules/README.md", text: "# Modules" }]).violations).toEqual([]);
  });

  it("returns exit 1 and stable findings for the malformed fixture", () => {
    try {
      execFileSync("bun", ["scripts/check-architecture.ts", "tests/fixtures/architecture/malformed"], { encoding: "utf8" });
      throw new Error("malformed fixture unexpectedly conformed");
    } catch (error: unknown) {
      const output = error as { status?: number; stdout?: string };
      expect(output.status).toBe(1);
      expect(output.stdout).toContain("ARCH-MODULE-INFRASTRUCTURE src/modules/broken");
    }
  });

  it("rejects relative cross-module deep imports and outer-layer dependencies", () => {
    const files = [
      ...completeModule("alpha", [{ path: "src/modules/alpha/domain/policy.ts", text: `${overview}import { x } from "../infrastructure/index";\nexport const policy = x;` }]),
      ...completeModule("beta", [{ path: "src/modules/beta/application/use.ts", text: `${overview}import { x } from "../../alpha/domain/types";\nexport const use = x;` }])
    ];
    const ids = analyzeRepositoryFiles(files).violations.map(({ ruleId }) => ruleId);
    expect(ids).toContain("ARCH-DOMAIN-DEPENDENCY");
    expect(ids).toContain("ARCH-CROSS-MODULE-DEEP-IMPORT");
  });

  it("rejects Node and Bun IO APIs outside allowed layers", () => {
    const result = analyzeRepositoryFiles(completeModule("runtime", [{ path: "src/modules/runtime/domain/io.ts", text: `${overview}import { readFile } from "node:fs/promises";\nconst value = Bun.file("x");\nexport { readFile, value };` }]));
    expect(result.violations).toEqual(expect.arrayContaining([expect.objectContaining({ ruleId: "ARCH-IO-PLACEMENT" })]));
  });

  it("uses LF physical lines without counting a final delimiter", () => {
    const component = (count: number) => Array.from({ length: count }, (_, index) => index === 0 ? "/** @fileoverview fixture. */" : "// line").join("\n") + "\n";
    const hook = (count: number) => Array.from({ length: count }, (_, index) => index === 0 ? "/** @fileoverview fixture. */" : "// line").join("\n") + "\n";
    expect(analyzeRepositoryFiles(completeModule("runtime", [{ path: "src/modules/runtime/api/Widget.tsx", text: component(150) }, { path: "src/modules/runtime/application/useThing.ts", text: hook(200) }])).violations.map(({ ruleId }) => ruleId)).not.toEqual(expect.arrayContaining(["ARCH-COMPONENT-SIZE", "ARCH-HOOK-SIZE"]));
    const ids = analyzeRepositoryFiles(completeModule("runtime", [{ path: "src/modules/runtime/api/Widget.tsx", text: component(151) }, { path: "src/modules/runtime/application/useThing.ts", text: hook(201) }])).violations.map(({ ruleId }) => ruleId);
    expect(ids).toContain("ARCH-COMPONENT-SIZE");
    expect(ids).toContain("ARCH-HOOK-SIZE");
  });

  it("publishes the full stable rule catalog and deterministic finding order", () => {
    expect(architectureRules.map(({ id }) => id)).toEqual([
      "ARCH-MODULE-NAME", "ARCH-MODULE-DOMAIN", "ARCH-MODULE-APPLICATION", "ARCH-MODULE-INFRASTRUCTURE", "ARCH-MODULE-API", "ARCH-MODULE-README", "ARCH-MODULE-ROOT-BARREL", "ARCH-DOMAIN-TYPES", "ARCH-API-COMPOSITION", "ARCH-MODULE-TESTS", "ARCH-MODULE-TEST-FAKES", "ARCH-DOMAIN-DEPENDENCY", "ARCH-APPLICATION-DEPENDENCY", "ARCH-CROSS-MODULE-DEEP-IMPORT", "ARCH-INFRASTRUCTURE-ROOT-EXPORT", "ARCH-IO-PLACEMENT", "ARCH-FILEOVERVIEW", "ARCH-NO-EXPLICIT-ANY", "ARCH-UNSCOPED-TYPESCRIPT", "ARCH-DOMAIN-ENTITY-PLACEMENT", "ARCH-COMPONENT-SIZE", "ARCH-HOOK-SIZE", "ARCH-COMPONENT-STATE"
    ]);
    const result = analyzeRepositoryFiles([{ path: "src/modules/CandidateSearch/index.ts", text: "export * from './infrastructure';" }]);
    expect(result.violations.map(({ ruleId }) => ruleId)).toEqual([...result.violations.map(({ ruleId }) => ruleId)].sort());
    expect(result.violations.map(({ ruleId }) => ruleId)).toEqual(expect.arrayContaining(["ARCH-MODULE-NAME", "ARCH-INFRASTRUCTURE-ROOT-EXPORT", "ARCH-FILEOVERVIEW"]));
  });

  it("covers application, alias, explicit-any, and component-state variants", () => {
    const result = analyzeRepositoryFiles(completeModule("runtime", [
      { path: "src/modules/runtime/application/use.ts", text: `${overview}import { adapter } from "../infrastructure/index";\nconst value: any = adapter;\nexport { value };` },
      { path: "src/modules/runtime/domain/alias.ts", text: `${overview}import { runtimeVersion } from "@/modules/other/domain/types";\nexport { runtimeVersion };` },
      { path: "src/modules/runtime/api/State.tsx", text: `${overview}useState(1); useState(2); useState(3); useState(4); useState(5);` }
    ]));
    expect(result.violations.map(({ ruleId }) => ruleId)).toEqual(expect.arrayContaining(["ARCH-APPLICATION-DEPENDENCY", "ARCH-CROSS-MODULE-DEEP-IMPORT", "ARCH-NO-EXPLICIT-ANY", "ARCH-COMPONENT-STATE"]));
  });

  it("rejects bare application imports, `as any`, and IO outside exact composition roots", () => {
    const result = analyzeRepositoryFiles([
      ...completeModule("runtime", [
        { path: "src/modules/runtime/application/zod.ts", text: `${overview}import { z } from "zod";\nexport { z };` },
        { path: "src/modules/runtime/domain/cast.ts", text: `${overview}import { env } from "node:process";\nconst value = unknownValue as any;\ntype Values = Array<any[]>;\nexport { value, env };` },
        { path: "src/modules/runtime/api/report.ts", text: `${overview}const value = Bun.file("x");\nexport { value };` }
      ]),
      { path: "src/worker.ts", text: `${overview}const value = Bun.file("x");\nexport { value };` }
    ]);
    expect(result.violations.map(({ ruleId }) => ruleId)).toEqual(expect.arrayContaining(["ARCH-APPLICATION-DEPENDENCY", "ARCH-NO-EXPLICIT-ANY", "ARCH-IO-PLACEMENT"]));
    expect(result.violations.filter(({ ruleId }) => ruleId === "ARCH-IO-PLACEMENT").map(({ path }) => path)).toEqual(expect.arrayContaining(["src/modules/runtime/api/report.ts", "src/worker.ts"]));
  });

  it("detects nested any types and process imports independently", () => {
    const result = analyzeRepositoryFiles(completeModule("runtime", [{ path: "src/modules/runtime/domain/nested.ts", text: `${overview}import { env } from "node:process";\ntype Values = Array<any[]>;\nexport { env };` }]));
    expect(result.violations.map(({ ruleId }) => ruleId)).toEqual(expect.arrayContaining(["ARCH-NO-EXPLICIT-ANY", "ARCH-IO-PLACEMENT"]));
  });

  it("detects any in a template-literal type without scanning ordinary strings", () => {
    const result = analyzeRepositoryFiles(completeModule("runtime", [{ path: "src/modules/runtime/domain/template.ts", text: `${overview}type Template = \`\${any}\`;\nconst ordinary = "any";\nexport { ordinary };` }]));
    expect(result.violations.map(({ ruleId }) => ruleId)).toContain("ARCH-NO-EXPLICIT-ANY");
  });

  it("has a table-driven malformed fixture matrix for every stable rule", () => {
    const huge = (count: number) => Array.from({ length: count }, (_, index) => index === 0 ? overview.trim() : "// line").join("\n");
    const files = [
      { path: "src/modules/Bad_Name/index.ts", text: `${overview}export * from "./infrastructure/index";` },
      { path: "src/modules/no-barrel/README.md", text: "fixture" },
      ...completeModule("broken", [
        { path: "src/modules/broken/domain/entity.ts", text: `${overview}import { x } from "../api/composition";\nexport interface BrokenEntity { value: string; }` },
        { path: "src/modules/broken/domain/io.ts", text: `${overview}import { Octokit } from "@octokit/rest";\nconst value = Bun.connect({});\nprocess.stdin;\nprocess.stdout.write("x");\nexport { Octokit, value };` },
        { path: "src/modules/broken/application/zod.ts", text: `${overview}import { z } from "zod";\nexport { z };` },
        { path: "src/modules/broken/application/deep.ts", text: `${overview}import { x } from "@/modules/other/domain/types";\nexport { x };` },
        { path: "src/modules/broken/api/Widget.tsx", text: `${huge(151)}\nuseState(1);useState(2);useState(3);useState(4);useState(5);` },
        { path: "src/modules/broken/application/useThing.ts", text: huge(201) }
      ]),
      { path: "src/worker.ts", text: "const value = Bun.file(\"x\");" },
      { path: "scripts/missing-overview.ts", text: "export const script = true;" },
      { path: "tests/has-any.test.ts", text: `${overview}const value: any = true;\nexport { value };` },
      { path: "root-policy.config.ts", text: "export default {};" },
      { path: "tools/unscoped.ts", text: `${overview}export const unscoped = true;` }
    ];
    const result = analyzeRepositoryFiles(files);
    const rows = [
      ["ARCH-MODULE-NAME", "src/modules/Bad_Name", "lowercase kebab-case"], ["ARCH-MODULE-DOMAIN", "src/modules/Bad_Name", "contain domain"], ["ARCH-MODULE-APPLICATION", "src/modules/Bad_Name", "contain application"], ["ARCH-MODULE-INFRASTRUCTURE", "src/modules/Bad_Name", "contain infrastructure"], ["ARCH-MODULE-API", "src/modules/Bad_Name", "contain api"], ["ARCH-MODULE-README", "src/modules/Bad_Name", "README.md"], ["ARCH-MODULE-ROOT-BARREL", "src/modules/no-barrel", "index.ts"], ["ARCH-DOMAIN-TYPES", "src/modules/Bad_Name", "domain/types.ts"], ["ARCH-API-COMPOSITION", "src/modules/Bad_Name", "api/composition.ts"], ["ARCH-MODULE-TESTS", "src/modules/Bad_Name", "contain tests"], ["ARCH-MODULE-TEST-FAKES", "src/modules/Bad_Name", "tests/fakes"],
      ["ARCH-DOMAIN-DEPENDENCY", "src/modules/broken/domain/entity.ts", "outer layer"], ["ARCH-APPLICATION-DEPENDENCY", "src/modules/broken/application/zod.ts", "only domain or application"], ["ARCH-CROSS-MODULE-DEEP-IMPORT", "src/modules/broken/application/deep.ts", "module barrels"], ["ARCH-INFRASTRUCTURE-ROOT-EXPORT", "src/modules/Bad_Name/index.ts", "do not export infrastructure"], ["ARCH-IO-PLACEMENT", "src/modules/broken/domain/io.ts", "limited to infrastructure"], ["ARCH-FILEOVERVIEW", "root-policy.config.ts", "@fileoverview"], ["ARCH-NO-EXPLICIT-ANY", "tests/has-any.test.ts", "explicit any"], ["ARCH-UNSCOPED-TYPESCRIPT", "tools/unscoped.ts", "not covered by authored-source policy"], ["ARCH-DOMAIN-ENTITY-PLACEMENT", "src/modules/broken/domain/entity.ts", "types.ts"], ["ARCH-COMPONENT-SIZE", "src/modules/broken/api/Widget.tsx", "150"], ["ARCH-HOOK-SIZE", "src/modules/broken/application/useThing.ts", "200"], ["ARCH-COMPONENT-STATE", "src/modules/broken/api/Widget.tsx", "fewer than five"]
    ] as const;
    expect(rows).toHaveLength(architectureRules.length);
    for (const [ruleId, path, messageFragment] of rows) {
      const finding = result.violations.find((violation) => violation.ruleId === ruleId && violation.path === path);
      expect(finding, `${ruleId} ${path}`).toBeDefined();
      expect(finding?.message).toContain(messageFragment);
    }
    expect(result.violations).toEqual([...result.violations].sort((left, right) => left.ruleId.localeCompare(right.ruleId) || left.path.localeCompare(right.path) || left.message.localeCompare(right.message)));
  });

  it("rejects alias infrastructure exports, vendor IO, and direct IO APIs", () => {
    const result = analyzeRepositoryFiles([...completeModule("broken").filter(({ path }) => path !== "src/modules/broken/index.ts"),
      { path: "src/modules/broken/index.ts", text: `${overview}export * from "@/modules/broken/infrastructure";` },
      { path: "src/modules/broken/domain/io.ts", text: `${overview}import { Octokit } from "@octokit/rest";\nconst socket = Bun.connect({});\nprocess.stdin;\nprocess.stdout.write("x");\nexport { Octokit, socket };` }
    ]);
    expect(result.violations).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: "ARCH-INFRASTRUCTURE-ROOT-EXPORT", path: "src/modules/broken/index.ts" }),
      expect.objectContaining({ ruleId: "ARCH-DOMAIN-DEPENDENCY", path: "src/modules/broken/domain/io.ts" }),
      expect.objectContaining({ ruleId: "ARCH-IO-PLACEMENT", path: "src/modules/broken/domain/io.ts" })
    ]));
  });

  it("ignores direct IO API text while retaining template expressions", () => {
    const negative = ["// Bun.connect", "/* process.stdin */", 'const text = "process.stdout.write";', "const template = `Bun.connect process.stdin process.stdout.write`;"].join("\n");
    const result = analyzeRepositoryFiles(completeModule("runtime", [
      { path: "src/modules/runtime/domain/text.ts", text: `${overview}${negative}\nconst evaluated = \`\${Bun.connect({})}\`;\nexport { evaluated };` }
    ]));
    expect(result.violations.filter(({ ruleId }) => ruleId === "ARCH-IO-PLACEMENT")).toHaveLength(1);
  });

  it("retains prohibited IO after a regex literal containing adjacent slashes", () => {
    const result = analyzeRepositoryFiles([
      { path: "src/regex-then-io.ts", text: `${overview}const url = /https?:\\/\\//; Bun.connect({});\nexport { url };` }
    ]);
    expect(result.violations).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: "ARCH-IO-PLACEMENT", path: "src/regex-then-io.ts" })
    ]));
  });

  it("retains prohibited IO after a regex character class containing slashes", () => {
    const result = analyzeRepositoryFiles([
      { path: "src/regex-class-then-io.ts", text: `${overview}const slash = /[//]/; const socket = Bun.connect({});\nexport { slash, socket };` }
    ]);
    expect(result.violations).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: "ARCH-IO-PLACEMENT", path: "src/regex-class-then-io.ts" })
    ]));
  });

  it("isolates literal and executable coverage for every direct IO API", () => {
    const cases = [
      { name: "bun-connect", token: "Bun.connect", expression: "Bun.connect({})" },
      { name: "process-stdin", token: "process.stdin", expression: "process.stdin" },
      { name: "process-stdout-write", token: "process.stdout.write", expression: 'process.stdout.write("x")' }
    ] as const;
    for (const fixture of cases) {
      const negativeForms = [
        `// ${fixture.token}`,
        `/* ${fixture.token} */`,
        `const text = "${fixture.token}";`,
        `const text = \`${fixture.token}\`;`
      ];
      for (const [index, text] of negativeForms.entries()) {
        const path = `src/${fixture.name}-negative-${index}.ts`;
        const findings = analyzeRepositoryFiles([{ path, text: `${overview}${text}` }]).violations;
        expect(findings, `${fixture.name} negative form ${index}`).not.toEqual(expect.arrayContaining([
          expect.objectContaining({ ruleId: "ARCH-IO-PLACEMENT", path })
        ]));
      }
      const path = `src/${fixture.name}-template-expression.ts`;
      const findings = analyzeRepositoryFiles([{ path, text: `${overview}const value = \`\${${fixture.expression}}\`;` }]).violations;
      expect(findings, `${fixture.name} executable template expression`).toEqual(expect.arrayContaining([
        expect.objectContaining({ ruleId: "ARCH-IO-PLACEMENT", path })
      ]));
    }
  });

  it("allows every direct IO API in infrastructure, composition, and entrypoints", () => {
    const cases = [
      { name: "bun-connect", expression: "Bun.connect({})" },
      { name: "process-stdin", expression: "process.stdin" },
      { name: "process-stdout-write", expression: 'process.stdout.write("x")' }
    ] as const;
    for (const fixture of cases) {
      const paths = [
        `src/modules/runtime/infrastructure/${fixture.name}.ts`,
        "src/modules/runtime/api/composition.ts",
        "src/cli/main.ts",
        "src/server/main.ts"
      ];
      for (const path of paths) {
        const findings = analyzeRepositoryFiles([{ path, text: `${overview}${fixture.expression};` }]).violations;
        expect(findings, `${fixture.name} at ${path}`).not.toEqual(expect.arrayContaining([
          expect.objectContaining({ ruleId: "ARCH-IO-PLACEMENT", path })
        ]));
      }
    }
  });

  it("keeps authored checks but excludes module test paths from production IO rules", () => {
    const path = "src/modules/runtime/tests/io.test.ts";
    const result = analyzeRepositoryFiles([
      { path, text: `${overview}const socket: any = Bun.connect({});\nexport { socket };` }
    ]);
    expect(result.violations).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: "ARCH-NO-EXPLICIT-ANY", path })
    ]));
    expect(result.violations).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: "ARCH-IO-PLACEMENT", path })
    ]));
  });

  it("rejects vendor IO imports from application files", () => {
    const path = "src/modules/runtime/application/octokit.ts";
    const result = analyzeRepositoryFiles(completeModule("runtime", [
      { path, text: `${overview}import { Octokit } from "@octokit/rest";\nexport { Octokit };` }
    ]));
    expect(result.violations).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: "ARCH-APPLICATION-DEPENDENCY", path }),
      expect.objectContaining({ ruleId: "ARCH-IO-PLACEMENT", path })
    ]));
  });

  it("applies authored-source rules without applying production IO rules to scripts and tests", () => {
    const result = analyzeRepositoryFiles([
      { path: "scripts/check-architecture.ts", text: `${overview}process.stdout.write("ok");` },
      { path: "scripts/check-architecture.test.ts", text: `${overview}process.stdin;` },
      { path: "scripts/missing-overview.ts", text: "export const missing = true;" },
      { path: "tests/has-any.test.ts", text: `${overview}const value: any = true;\nexport { value };` },
      { path: "root-policy.config.ts", text: "export default {};" },
      { path: "tools/unscoped.ts", text: `${overview}export const unscoped = true;` }
    ]);
    expect(result.violations.map(({ ruleId }) => ruleId)).toEqual(expect.arrayContaining(["ARCH-NO-EXPLICIT-ANY", "ARCH-FILEOVERVIEW", "ARCH-UNSCOPED-TYPESCRIPT"]));
    expect(result.violations).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: "ARCH-FILEOVERVIEW", path: "scripts/missing-overview.ts" })
    ]));
    expect(result.violations.map(({ ruleId }) => ruleId)).not.toContain("ARCH-IO-PLACEMENT");
  });

  it("discovers root configuration and unscoped files through the CLI", async () => {
    const root = await mkdtemp(join(tmpdir(), "mandem-architecture-"));
    try {
      await mkdir(join(root, "tests/fixtures"), { recursive: true });
      await mkdir(join(root, "tools"), { recursive: true });
      await writeFile(join(root, "root-policy.config.ts"), "export default {};\n");
      await writeFile(join(root, "tools/unscoped.ts"), `${overview}export const unscoped = true;\n`);
      await writeFile(join(root, "tests/fixtures/example.ts"), "export const fixture = true;\n");
      await writeFile(join(root, "ignored.d.ts"), "declare const ignored: string;\n");
      try {
        execFileSync("bun", ["scripts/check-architecture.ts", root], { encoding: "utf8" });
        throw new Error("fixture unexpectedly conformed");
      } catch (error: unknown) {
        const output = error as { status?: number; stdout?: string };
        expect(output.status).toBe(1);
        expect(output.stdout).toContain("ARCH-FILEOVERVIEW root-policy.config.ts");
        expect(output.stdout).toContain("ARCH-UNSCOPED-TYPESCRIPT tools/unscoped.ts");
        expect(output.stdout).not.toContain("tests/fixtures/example.ts");
        expect(output.stdout).not.toContain("ignored.d.ts");
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
