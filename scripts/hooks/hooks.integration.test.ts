/** @fileoverview Disposable-repository integration tests for Mandem Git hooks. */
import { execFileSync, spawnSync } from "node:child_process";
import { chmod, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const mandemRoot = process.cwd();
const bunExecutable = execFileSync("which", ["bun"], { encoding: "utf8" }).trim();

function git(root: string, ...arguments_: string[]): string {
  return execFileSync("git", arguments_, { cwd: root, encoding: "utf8" }).trim();
}

async function repository(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "mandem-hooks-"));
  git(root, "init");
  git(root, "config", "user.email", "test@example.com");
  git(root, "config", "user.name", "Test");
  await mkdir(join(root, ".githooks"));
  await symlink(join(mandemRoot, ".githooks", "pre-commit"), join(root, ".githooks", "pre-commit"));
  await symlink(join(mandemRoot, ".githooks", "pre-push"), join(root, ".githooks", "pre-push"));
  await symlink(join(mandemRoot, "scripts"), join(root, "scripts"));
  await writeFile(join(root, "README.md"), "# fixture\n");
  await writeFile(join(root, "package.json"), JSON.stringify({ scripts: {} }));
  git(root, "add", ".");
  git(root, "commit", "-m", "initial");
  return root;
}

function runHook(root: string, name: "pre-commit" | "pre-push", input = "", path?: string) {
  return spawnSync(join(root, ".githooks", name), [], {
    cwd: root,
    encoding: "utf8",
    input,
    env: { ...process.env, PATH: path ?? process.env.PATH },
  });
}

function runInstaller(root: string, check = false) {
  return spawnSync(bunExecutable, [join(mandemRoot, "scripts", "hooks", "install.ts"), ...(check ? ["--check"] : [])], { cwd: root, encoding: "utf8" });
}

async function fakeBun(root: string): Promise<{ readonly path: string; readonly log: string }> {
  const bin = join(root, "bin");
  const log = join(root, "bun.log");
  await mkdir(bin);
  const executable = join(bin, "bun");
  await writeFile(executable, `#!/usr/bin/env sh\ncase "$1" in\n  *scripts/hooks/pre-push.ts) exec "${bunExecutable}" "$@" ;;\nesac\nprintf '%s\\n' "$*" >> "${log}"\nexit 0\n`);
  await chmod(executable, 0o755);
  return { path: `${bin}:${process.env.PATH}`, log };
}

describe("versioned Git hooks", () => {
  it("pre-commit evaluates the staged snapshot", async () => {
    const root = await repository();
    try {
      await mkdir(join(root, "src"));
      await writeFile(join(root, "src", "valid.ts"), "/** @fileoverview Valid source. */\nexport const value = 1;\n");
      git(root, "add", "src/valid.ts");
      expect(runHook(root, "pre-commit").status).toBe(0);

      await writeFile(join(root, "src", "invalid.ts"), "export const value = 1;\n");
      git(root, "add", "src/invalid.ts");
      const before = git(root, "status", "--porcelain=v1");
      const result = runHook(root, "pre-commit");
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("ARCH-FILEOVERVIEW src/invalid.ts");
      expect(git(root, "status", "--porcelain=v1")).toBe(before);

      git(root, "reset", "--", "src/invalid.ts");
      await mkdir(join(root, "docs"));
      await writeFile(join(root, "docs", "unindexed.md"), "# Unindexed\n");
      git(root, "add", "docs/unindexed.md");
      const documentationResult = runHook(root, "pre-commit");
      expect(documentationResult.status).toBe(1);
      expect(documentationResult.stderr).toContain("DOC-LOCAL-README docs:");
    } finally { await rm(root, { recursive: true, force: true }); }
  });

  it("pre-push classifies every ref update fail closed", async () => {
    const root = await repository();
    try {
      const fake = await fakeBun(root);
      const head = git(root, "rev-parse", "HEAD");
      const protectedResult = runHook(root, "pre-push", `refs/heads/main ${head} refs/heads/main ${"0".repeat(40)}\n`, fake.path);
      expect(protectedResult.status).toBe(1);
      expect(protectedResult.stderr).toContain("protected remote ref refs/heads/main");

      await mkdir(join(root, "docs"));
      await writeFile(join(root, "docs", "guide.md"), "# Guide\n");
      git(root, "add", "docs/guide.md");
      git(root, "commit", "-m", "docs");
      const docsHead = git(root, "rev-parse", "HEAD");
      const docsResult = runHook(root, "pre-push", `refs/heads/docs ${docsHead} refs/heads/docs ${head}\n`, fake.path);
      expect(docsResult.status).toBe(0);
      const commands = await readFile(fake.log, "utf8");
      expect(commands).toContain("run docs:revision -- --revision");
      expect(commands).toContain("run authored-files:revision -- --revision");

      await mkdir(join(root, "src"));
      await writeFile(join(root, "src", "code.ts"), "/** @fileoverview Fixture code. */\nexport const code = 1;\n");
      git(root, "add", "src/code.ts");
      git(root, "commit", "-m", "code");
      const codeHead = git(root, "rev-parse", "HEAD");
      expect(runHook(root, "pre-push", `refs/heads/code ${codeHead} refs/heads/code ${docsHead}\n`, fake.path).status).toBe(0);
      expect(await readFile(fake.log, "utf8")).toContain(`run check:revision -- ${codeHead}`);

      expect(runHook(root, "pre-push", `refs/heads/unknown ${codeHead} refs/heads/unknown deadbeef\n`, fake.path).status).toBe(0);
      expect((await readFile(fake.log, "utf8")).match(/run check:revision/g)?.length).toBeGreaterThanOrEqual(2);

      await writeFile(join(root, "docs", "follow-up.md"), "# Follow up\n");
      git(root, "add", "docs/follow-up.md");
      git(root, "commit", "-m", "follow up docs");
      const combinedHead = git(root, "rev-parse", "HEAD");
      await writeFile(fake.log, "");
      const duplicate = runHook(root, "pre-push", `refs/heads/combined-a ${combinedHead} refs/heads/combined-a ${docsHead}\nrefs/heads/combined-b ${combinedHead} refs/heads/combined-b ${codeHead}\n`, fake.path);
      expect(duplicate.status).toBe(0);
      expect(await readFile(fake.log, "utf8")).toContain(`run check:revision -- ${combinedHead}`);

      await writeFile(fake.log, "");
      const indeterminateDuplicate = runHook(root, "pre-push", `refs/heads/docs-a ${docsHead} refs/heads/docs-a ${head}\nrefs/heads/docs-b ${docsHead} refs/heads/docs-b deadbeef\n`, fake.path);
      expect(indeterminateDuplicate.status).toBe(0);
      expect(await readFile(fake.log, "utf8")).toContain(`run check:revision -- ${docsHead}`);
    } finally { await rm(root, { recursive: true, force: true }); }
  });

  it("installs hooks only in the selected worktree and migrates a common value", async () => {
    const root = await repository();
    const sibling = await mkdtemp(join(tmpdir(), "mandem-hooks-sibling-"));
    await rm(sibling, { recursive: true, force: true });
    try {
      git(root, "worktree", "add", "--detach", sibling, "HEAD");
      expect(runInstaller(root).status).toBe(0);
      expect(git(root, "config", "--worktree", "--get", "core.hooksPath")).toBe(".githooks");
      expect(spawnSync("git", ["config", "--worktree", "--get", "core.hooksPath"], { cwd: sibling }).status).toBe(1);
      expect(runInstaller(root, true).status).toBe(0);

      git(root, "config", "--file", join(git(root, "rev-parse", "--git-common-dir"), "config"), "core.hooksPath", ".legacy-hooks");
      expect(runInstaller(root).status).toBe(0);
      expect(git(sibling, "config", "--worktree", "--get", "core.hooksPath")).toBe(".legacy-hooks");
      expect(spawnSync("git", ["config", "--file", join(git(root, "rev-parse", "--git-common-dir"), "config"), "--get", "core.hooksPath"], { cwd: root }).status).toBe(1);
    } finally {
      spawnSync("git", ["worktree", "remove", "--force", sibling], { cwd: root });
      await rm(root, { recursive: true, force: true });
    }
  });
});
