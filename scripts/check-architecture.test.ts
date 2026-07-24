/** @fileoverview Contract tests for the architecture analyzer. */
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
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
    expect(architectureRules).toHaveLength(22);
    expect(architectureRules.map(({ id }) => id)).toContain("ARCH-COMPONENT-STATE");
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

  it("has a table-driven malformed fixture matrix for every stable rule", () => {
    const huge = (count: number) => Array.from({ length: count }, (_, index) => index === 0 ? overview.trim() : "// line").join("\n");
    const files = [
      { path: "src/modules/Bad_Name/index.ts", text: `${overview}export * from "./infrastructure/index";` },
      { path: "src/modules/no-barrel/README.md", text: "fixture" },
      ...completeModule("broken", [
        { path: "src/modules/broken/domain/entity.ts", text: `${overview}import { x } from "../api/composition";\nexport interface BrokenEntity { value: string; }` },
        { path: "src/modules/broken/domain/io.ts", text: `${overview}const value = Bun.file("x") as any;\nexport { value };` },
        { path: "src/modules/broken/application/zod.ts", text: `${overview}import { z } from "zod";\nexport { z };` },
        { path: "src/modules/broken/application/deep.ts", text: `${overview}import { x } from "@/modules/other/domain/types";\nexport { x };` },
        { path: "src/modules/broken/api/Widget.tsx", text: `${huge(151)}\nuseState(1);useState(2);useState(3);useState(4);useState(5);` },
        { path: "src/modules/broken/application/useThing.ts", text: huge(201) }
      ]),
      { path: "src/worker.ts", text: "const value = Bun.file(\"x\");" }
    ];
    const result = analyzeRepositoryFiles(files);
    const rows = [
      ["ARCH-MODULE-NAME", "src/modules/Bad_Name", "lowercase kebab-case"], ["ARCH-MODULE-DOMAIN", "src/modules/Bad_Name", "contain domain"], ["ARCH-MODULE-APPLICATION", "src/modules/Bad_Name", "contain application"], ["ARCH-MODULE-INFRASTRUCTURE", "src/modules/Bad_Name", "contain infrastructure"], ["ARCH-MODULE-API", "src/modules/Bad_Name", "contain api"], ["ARCH-MODULE-README", "src/modules/Bad_Name", "README.md"], ["ARCH-MODULE-ROOT-BARREL", "src/modules/no-barrel", "index.ts"], ["ARCH-DOMAIN-TYPES", "src/modules/Bad_Name", "domain/types.ts"], ["ARCH-API-COMPOSITION", "src/modules/Bad_Name", "api/composition.ts"], ["ARCH-MODULE-TESTS", "src/modules/Bad_Name", "contain tests"], ["ARCH-MODULE-TEST-FAKES", "src/modules/Bad_Name", "tests/fakes"],
      ["ARCH-DOMAIN-DEPENDENCY", "src/modules/broken/domain/entity.ts", "outer layer"], ["ARCH-APPLICATION-DEPENDENCY", "src/modules/broken/application/zod.ts", "only domain or application"], ["ARCH-CROSS-MODULE-DEEP-IMPORT", "src/modules/broken/application/deep.ts", "module barrels"], ["ARCH-INFRASTRUCTURE-ROOT-EXPORT", "src/modules/Bad_Name/index.ts", "do not export infrastructure"], ["ARCH-IO-PLACEMENT", "src/modules/broken/domain/io.ts", "limited to infrastructure"], ["ARCH-FILEOVERVIEW", "src/worker.ts", "@fileoverview"], ["ARCH-NO-EXPLICIT-ANY", "src/modules/broken/domain/io.ts", "explicit any"], ["ARCH-DOMAIN-ENTITY-PLACEMENT", "src/modules/broken/domain/entity.ts", "types.ts"], ["ARCH-COMPONENT-SIZE", "src/modules/broken/api/Widget.tsx", "150"], ["ARCH-HOOK-SIZE", "src/modules/broken/application/useThing.ts", "200"], ["ARCH-COMPONENT-STATE", "src/modules/broken/api/Widget.tsx", "fewer than five"]
    ] as const;
    expect(rows).toHaveLength(architectureRules.length);
    for (const [ruleId, path, messageFragment] of rows) {
      const finding = result.violations.find((violation) => violation.ruleId === ruleId && violation.path === path);
      expect(finding, `${ruleId} ${path}`).toBeDefined();
      expect(finding?.message).toContain(messageFragment);
    }
    expect(result.violations).toEqual([...result.violations].sort((left, right) => left.ruleId.localeCompare(right.ruleId) || left.path.localeCompare(right.path) || left.message.localeCompare(right.message)));
  });
});
