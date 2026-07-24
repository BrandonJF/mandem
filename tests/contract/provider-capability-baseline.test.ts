/** @fileoverview Ensures the U1 provider baseline is explicit about its limits. */
import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

describe("provider capability baseline", () => {
  it("records actual provider versions and a conservative U2 gate", async () => {
    const baseline = await readFile("docs/operations/provider-capability-baseline.md", "utf8");
    expect(baseline).toContain("2.1.219");
    expect(baseline).toContain("0.145.0");
    expect(baseline).toContain("U2 promotion remains blocked");
  });
});
