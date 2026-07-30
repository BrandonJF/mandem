/** @fileoverview Specifies deprecated issue hierarchy vocabulary checks and exceptions. */
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkVocabulary } from "./check-vocabulary";

async function check(source: string): Promise<readonly string[]> {
  const root = await mkdtemp(join(tmpdir(), "mandem-vocabulary-"));
  try {
    await writeFile(join(root, "README.md"), source);
    return await checkVocabulary(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

describe("vocabulary check", () => {
  it("finds canonical deprecated contexts in prose and code fences", async () => {
    const findings = await check("A program issue and work-item.\n```\nchild issue\n```\n");
    expect(findings).toEqual([
      "README.md:1: program issue",
      "README.md:1: work-item",
      "README.md:3: child issue",
    ]);
  });

  it("allows exactly one finding line with a substantial reason", async () => {
    await expect(check('<!-- vocabulary-check: allow-next-line reason="Historical external quotation" -->\nThe official name is work item.\nA child issue remains invalid.\n')).resolves.toEqual([
      "README.md:3: child issue",
    ]);
  });

  it("rejects malformed, short, blank, adjacent, missing, and unused exceptions", async () => {
    expect((await check('<!-- vocabulary-check: allow-next-line reason="short" -->\nwork item\n')).join("\n")).toContain("reason must contain");
    expect((await check('<!-- vocabulary-check: allow-next-line reason="Long enough reason text" -->\n\n')).join("\n")).toContain("must not be blank");
    expect((await check('<!-- vocabulary-check: allow-next-line reason="Long enough reason text" -->\n<!-- vocabulary-check: allow-next-line reason="Another long reason" -->\n')).join("\n")).toContain("must not be another");
    expect((await check('<!-- vocabulary-check: allow-next-line reason="Long enough reason text" -->\nordinary prose\n')).join("\n")).toContain("unused");
    expect((await check('<!-- vocabulary-check: allow-next-line reason=bad -->\n')).join("\n")).toContain("malformed");
    expect((await check('<!-- vocabulary-check: allow-next-line reason="Long enough reason text" -->')).join("\n")).toContain("target is missing");
  });
});
