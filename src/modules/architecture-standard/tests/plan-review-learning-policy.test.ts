/** @fileoverview Protects the repository rule that plan-review failures improve future planning. */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const operating = readFileSync(".agents/OPERATING.md", "utf8");
const principles = readFileSync(".agents/PLAN_AUTHORING.md", "utf8");

describe("plan-review learning policy", () => {
  it("requires every blocking finding to receive a reusable-failure disposition", () => {
    expect(operating).toContain("For every blocking clean-room finding");
    expect(operating).toContain("reusable failure class");
    expect(operating).toContain("before dispatching another review");
    expect(operating).toContain("no-reusable-change");
  });

  it("requires reusable classes to improve planning guidance and enforcement", () => {
    expect(principles).toContain("## Learn from every blocking review finding");
    expect(principles).toContain("failure class");
    expect(principles).toMatch(/strengthen\s+the applicable principle/u);
    expect(principles).toContain("enforcement mechanism");
    expect(principles).toContain("plan-specific details");
  });

  it("requires five proof classes before independent review", () => {
    expect(principles).toContain("## Complete five pre-review proofs");
    for (const proof of ["closed-contract", "provenance", "state-and-replay", "milestone", "scope"]) {
      expect(principles).toContain(`\`${proof}\` proof`);
    }
    expect(principles).toContain("Do not dispatch a reviewer");
  });

  it("allows only one permit-one-more exception for an issue", () => {
    expect(operating).toContain("only one `permit-one-more` choice");
    expect(operating).toContain("`bun run plan-review:choices`");
    expect(operating).toContain("only `split` or `redesign`");
  });
});
