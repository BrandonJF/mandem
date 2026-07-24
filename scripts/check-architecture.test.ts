/** @fileoverview Contract tests for the architecture analyzer. */
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { analyzeRepositoryFiles } from "@/modules/architecture-standard";

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
});
