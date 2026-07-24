/** @fileoverview Ensures the U1 provider baseline is explicit about its limits. */
import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

describe("provider capability baseline", () => {
  it("records actual provider versions and the completed capability matrix", async () => {
    const baseline = await readFile("docs/operations/provider-capability-baseline.md", "utf8");
    expect(baseline).toContain("2.1.219");
    expect(baseline).toContain("0.145.0");
    expect(baseline).toContain("every required U2 protocol capability");
  });
});
