/** @fileoverview Disposable integration tests for exact revision quality checks. */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

const mandemRoot = process.cwd();
const checker = join(mandemRoot, "scripts", "check-revision.ts");

function git(root: string, ...arguments_: string[]): string { return execFileSync("git", arguments_, { cwd: root, encoding: "utf8" }).trim(); }

describe("check-revision", () => {
  it("reconciles exact durable manifest and marker temporary files", async () => {
    const parent = await mkdtemp(join(dirname(mandemRoot), ".mandem-check-revision-test-"));
    const root = join(parent, "repository");
    try {
      execFileSync("git", ["clone", "--no-hardlinks", mandemRoot, root], { encoding: "utf8" });
      const canonicalCheckout = await realpath(root);
      const commonGitDirectory = await realpath(join(root, ".git"));
      const namespace = join(dirname(canonicalCheckout), `${basename(canonicalCheckout)}-worktrees`, ".verification");
      const runsDirectory = join(namespace, "runs");
      await mkdir(runsDirectory, { recursive: true });
      const commit = git(root, "rev-parse", "HEAD");
      const runId = `run-${commit}-${"1".repeat(32)}`;
      const runDirectory = join(runsDirectory, runId);
      const record = {
        schemaVersion: 1,
        runId,
        canonicalCheckout,
        commonGitDirectory,
        commit,
        runDirectory,
        checkoutPath: join(runDirectory, "checkout"),
        createdAt: "2026-07-29T20:00:00.000Z",
      };
      const manifest = join(namespace, "active-run.json");
      const manifestTemporary = `${manifest}.tmp-${runId}`;
      await writeFile(manifestTemporary, `${JSON.stringify(record)}\n`);
      const first = spawnSync("bun", [checker, "--reconcile-only"], { cwd: root, encoding: "utf8" });
      expect(first.status, `${first.stdout}\n${first.stderr}`).toBe(0);

      await writeFile(manifest, `${JSON.stringify(record)}\n`);
      await mkdir(runDirectory);
      await writeFile(join(runDirectory, `owner.json.tmp-${runId}`), `${JSON.stringify(record)}\n`);
      const second = spawnSync("bun", [checker, "--reconcile-only"], { cwd: root, encoding: "utf8" });
      expect(second.status, `${second.stdout}\n${second.stderr}`).toBe(0);
      expect(git(root, "worktree", "list", "--porcelain").match(/^worktree /gm)).toHaveLength(1);
    } finally { await rm(parent, { recursive: true, force: true }); }
  }, 30_000);

  it("checks only the selected revision, preserves a dirty checkout, cleans up, and separates gate failures", async () => {
    const parent = await mkdtemp(join(dirname(mandemRoot), ".mandem-check-revision-test-"));
    const root = join(parent, "repository");
    try {
      execFileSync("git", ["clone", "--no-hardlinks", mandemRoot, root], { encoding: "utf8" });
      execFileSync(
        "git",
        ["fetch", mandemRoot, "+refs/issues/*:refs/issues/*"],
        { cwd: root, encoding: "utf8" },
      );
      git(root, "config", "user.email", "test@example.com"); git(root, "config", "user.name", "Test");
      const clean = git(root, "rev-parse", "HEAD");
      await writeFile(join(root, "README.md"), `${await readFile(join(root, "README.md"), "utf8")}\nDirty checkout text.\n`);
      const before = git(root, "status", "--porcelain=v1");
      const passing = spawnSync("bun", [checker, clean], { cwd: root, encoding: "utf8" });
      expect(passing.status, `${passing.stdout}\n${passing.stderr}`).toBe(0);
      expect(git(root, "status", "--porcelain=v1")).toBe(before);
      expect(git(root, "worktree", "list", "--porcelain").match(/^worktree /gm)).toHaveLength(1);

      await writeFile(join(root, "src", "revision-failure.ts"), "export const broken = true;\n");
      git(root, "add", "src/revision-failure.ts"); git(root, "commit", "-m", "quality failure");
      const failure = spawnSync("bun", [checker, git(root, "rev-parse", "HEAD")], { cwd: root, encoding: "utf8" });
      expect(failure.status).toBe(1);
      expect(git(root, "status", "--porcelain=v1")).toBe(before);
      expect(git(root, "worktree", "list", "--porcelain").match(/^worktree /gm)).toHaveLength(1);
    } finally { await rm(parent, { recursive: true, force: true }); }
  }, 300_000);
});
