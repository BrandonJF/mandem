/** @fileoverview Filesystem and Git snapshot adapter integration tests. */
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { changedGitEntries, analyzeDocumentationRevision } from "@/modules/architecture-standard/api/composition";
import { FileSystemSnapshot } from "../infrastructure/repositories/file-system-snapshot";
import { GitRepositorySnapshot } from "../infrastructure/repositories/git-repository-snapshot";

function command(root: string, ...arguments_: string[]): string { return execFileSync("git", arguments_, { cwd: root, encoding: "utf8" }).trim(); }

describe("repository snapshot adapters", () => {
  it("reads maintained source and documentation files without traversing excluded directories", async () => {
    const root = await mkdtemp(join(tmpdir(), "mandem-snapshot-"));
    try {
      await mkdir(join(root, "docs"));
      await mkdir(join(root, "node_modules", "ignored"), { recursive: true });
      await writeFile(join(root, "docs", "guide.yaml"), "name: guide\n");
      await writeFile(join(root, "source.ts"), "/** @fileoverview source. */\n");
      await writeFile(join(root, "node_modules", "ignored", "package.md"), "ignored\n");
      const paths = (await new FileSystemSnapshot().readWorkingTree(root)).files.map(({ path }) => path);
      expect(paths).toEqual(expect.arrayContaining(["docs/guide.yaml", "source.ts"]));
      expect(paths).not.toContain("node_modules/ignored/package.md");
    } finally { await rm(root, { recursive: true, force: true }); }
  });

  it("reads selected Git revisions and reports rename paths", async () => {
    const root = await mkdtemp(join(tmpdir(), "mandem-git-snapshot-"));
    try {
      command(root, "init"); command(root, "config", "user.email", "test@example.com"); command(root, "config", "user.name", "Test");
      await mkdir(join(root, "docs"));
      await writeFile(join(root, "README.md"), "[docs](docs/README.md)\n");
      await writeFile(join(root, "docs", "README.md"), "[guide](guide.md)\n");
      await writeFile(join(root, "docs", "guide.md"), "# first\n");
      command(root, "add", "."); command(root, "commit", "-m", "first");
      const base = command(root, "rev-parse", "HEAD");
      command(root, "mv", "docs/guide.md", "docs/renamed.md");
      await writeFile(join(root, "docs", "README.md"), "[guide](renamed.md)\n");
      command(root, "add", "."); command(root, "commit", "-m", "rename");
      const head = command(root, "rev-parse", "HEAD");
      const snapshots = new GitRepositorySnapshot();
      expect((await snapshots.readRevision(root, base)).files.find(({ path }) => path === "docs/guide.md")?.text).toBe("# first\n");
      expect(await changedGitEntries(root, base, head)).toEqual(expect.arrayContaining([expect.objectContaining({ status: "R", oldPath: "docs/guide.md", path: "docs/renamed.md" })]));
      expect((await analyzeDocumentationRevision(root, head)).violations).toEqual([]);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
});
