/** @fileoverview Disposable integration tests for exact revision quality checks. */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const mandemRoot = process.cwd();
const checker = join(mandemRoot, "scripts", "check-revision.ts");

function git(root: string, ...arguments_: string[]): string { return execFileSync("git", arguments_, { cwd: root, encoding: "utf8" }).trim(); }

describe("check-revision", () => {
  it("checks only the selected revision, preserves a dirty checkout, cleans up, and separates gate failures", async () => {
    const parent = await mkdtemp(join(tmpdir(), "mandem-check-revision-test-"));
    const root = join(parent, "repository");
    try {
      execFileSync("git", ["clone", "--no-hardlinks", mandemRoot, root], { encoding: "utf8" });
      git(root, "config", "user.email", "test@example.com"); git(root, "config", "user.name", "Test");
      const clean = git(root, "rev-parse", "HEAD");
      await writeFile(join(root, "README.md"), `${await readFile(join(root, "README.md"), "utf8")}\nDirty checkout text.\n`);
      const before = git(root, "status", "--porcelain=v1");
      expect(spawnSync("bun", [checker, clean], { cwd: root, encoding: "utf8" }).status).toBe(0);
      expect(git(root, "status", "--porcelain=v1")).toBe(before);
      expect(git(root, "worktree", "list", "--porcelain").match(/^worktree /gm)).toHaveLength(1);

      await writeFile(join(root, "src", "revision-failure.ts"), "export const broken = true;\n");
      git(root, "add", "src/revision-failure.ts"); git(root, "commit", "-m", "quality failure");
      const failure = spawnSync("bun", [checker, git(root, "rev-parse", "HEAD")], { cwd: root, encoding: "utf8" });
      expect(failure.status).toBe(1);
      expect(git(root, "status", "--porcelain=v1")).toBe(before);
      expect(git(root, "worktree", "list", "--porcelain").match(/^worktree /gm)).toHaveLength(1);
    } finally { await rm(parent, { recursive: true, force: true }); }
  }, 120_000);
});
