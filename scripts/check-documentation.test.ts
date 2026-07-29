/** @fileoverview Public documentation CLI integration tests. */
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function git(root: string, ...arguments_: string[]): string { return execFileSync("git", arguments_, { cwd: root, encoding: "utf8" }).trim(); }

describe("check-documentation CLI", () => {
  it("uses the selected clean revision instead of a dirty checkout", async () => {
    const root = await mkdtemp(join(tmpdir(), "mandem-documentation-cli-"));
    try {
      git(root, "init"); git(root, "config", "user.email", "test@example.com"); git(root, "config", "user.name", "Test");
      await mkdir(join(root, "docs"));
      await writeFile(join(root, "README.md"), "[docs](docs/README.md)\n");
      await writeFile(join(root, "docs", "README.md"), "[guide](guide.md)\n");
      await writeFile(join(root, "docs", "guide.md"), "# guide\n");
      git(root, "add", "."); git(root, "commit", "-m", "valid");
      const revision = git(root, "rev-parse", "HEAD");
      await writeFile(join(root, "docs", "README.md"), "# now invalid\n");
      const script = join(process.cwd(), "scripts", "check-documentation.ts");
      expect(execFileSync("bun", [script, "--mode", "revision", "--revision", revision], { cwd: root, encoding: "utf8" })).toBe("");
      try {
        execFileSync("bun", [script, "--mode", "full"], { cwd: root, encoding: "utf8" });
        throw new Error("dirty checkout unexpectedly conformed");
      } catch (error: unknown) {
        expect((error as { status?: number }).status).toBe(1);
      }
    } finally { await rm(root, { recursive: true, force: true }); }
  });
});
