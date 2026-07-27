/** @fileoverview Provider post-write adapter integration tests. */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseClaudePostToolUse } from "../../src/modules/architecture-standard/infrastructure/provider-events/claude-post-tool-use";
import { parseCodexPostToolUse } from "../../src/modules/architecture-standard/infrastructure/provider-events/codex-post-tool-use";
import { checkAuthoredPath } from "../../src/modules/architecture-standard/application/use-cases/check-authored-path";

const repositoryRoot = process.cwd();
const bun = execFileSync("which", ["bun"], { encoding: "utf8" }).trim();

function invoke(root: string, provider: "claude" | "codex", input: unknown) {
  return spawnSync(bun, [join(repositoryRoot, "scripts/hooks/provider-post-write.ts"), provider], {
    cwd: root,
    encoding: "utf8",
    input: JSON.stringify(input),
  });
}

function git(root: string, ...arguments_: string[]): string {
  return execFileSync("git", arguments_, { cwd: root, encoding: "utf8" }).trim();
}

async function fixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "mandem-provider-hook-"));
  git(root, "init");
  git(root, "config", "user.email", "test@example.com");
  git(root, "config", "user.name", "Test");
  await writeFile(join(root, "README.md"), "# Fixture\n");
  await writeFile(join(root, "package.json"), JSON.stringify({ scripts: {} }));
  return root;
}

describe("provider post-write adapters", () => {
  it("maps Claude write events to checked paths", async () => {
    const root = await fixture();
    try {
      await writeFile(join(root, "guide.md"), "# Guide\n");
      const result = invoke(root, "claude", {
        hook_event_name: "PostToolUse",
        cwd: root,
        tool_name: "Write",
        tool_input: { file_path: "guide.md" },
      });
      expect(result.status).toBe(2);
      expect(result.stderr).toContain("DOC-UNSCOPED-DOCUMENT guide.md");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("accepts nested Claude MultiEdit launches without changing the fixture", async () => {
    const root = await fixture();
    try {
      await mkdir(join(root, "nested directory"));
      await writeFile(join(root, "nested directory", "spaced file.txt"), "fixture\n");
      const before = git(root, "status", "--porcelain=v1");
      const result = invoke(join(root, "nested directory"), "claude", {
        hook_event_name: "PostToolUse",
        cwd: join(root, "nested directory"),
        tool_name: "MultiEdit",
        tool_input: { edits: [{ file_path: "spaced file.txt" }, { file_path: "spaced file.txt" }] },
      });
      expect(result.status).toBe(0);
      expect(result.stdout).toBe("");
      expect(git(root, "status", "--porcelain=v1")).toBe(before);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("maps Codex add, update, delete, and move headers", () => {
    expect(parseCodexPostToolUse({
      hook_event_name: "PostToolUse",
      cwd: "/fixture",
      tool_name: "apply_patch",
      tool_input: { command: "*** Add File: added.txt\n*** Update File: old name.txt\n*** Move to: new name.txt\n*** Delete File: removed.txt" },
    })).toEqual([
      { path: "added.txt", operation: "write" },
      { path: "old name.txt", operation: "move-from" },
      { path: "new name.txt", operation: "move-to" },
      { path: "removed.txt", operation: "delete" },
    ]);
  });

  it("rejects malformed, out-of-root, and failed events with bounded feedback", async () => {
    const root = await fixture();
    try {
      const malformed = invoke(root, "claude", { hook_event_name: "PostToolUse", cwd: root, tool_name: "Unknown", tool_input: {} });
      expect(malformed.status).toBe(2);
      expect(malformed.stderr).toContain("expected Write, Edit, or MultiEdit");

      const outside = invoke(root, "claude", { hook_event_name: "PostToolUse", cwd: root, tool_name: "Write", tool_input: { file_path: "../outside.md" } });
      expect(outside.status).toBe(2);
      expect(outside.stderr).toContain("outside the Git repository");

      await writeFile(join(root, "broken.md"), "# Broken\n");
      const failed = invoke(root, "codex", {
        hook_event_name: "PostToolUse", cwd: root, tool_name: "apply_patch",
        tool_input: { command: "*** Add File: broken.md" },
      });
      expect(failed.status).toBe(2);
      expect(failed.stderr.split("\n").filter(Boolean)).toHaveLength(1);
      expect(failed.stderr).toContain("DOC-UNSCOPED-DOCUMENT broken.md");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("parses Claude Write, Edit, and MultiEdit events", () => {
    for (const toolName of ["Write", "Edit"] as const) {
      expect(parseClaudePostToolUse({ hook_event_name: "PostToolUse", tool_name: toolName, tool_input: { file_path: "guide.md" } }))
        .toEqual([{ path: "guide.md", operation: "write" }]);
    }
    expect(parseClaudePostToolUse({ hook_event_name: "PostToolUse", tool_name: "MultiEdit", tool_input: { edits: [{ file_path: "one.md" }, { file_path: "two.md" }] } }))
      .toEqual([{ path: "one.md", operation: "write" }, { path: "two.md", operation: "write" }]);
  });

  it("uses full architecture policy without linting deleted TypeScript paths", async () => {
    const commands: string[][] = [];
    const result = await checkAuthoredPath("/fixture", "deleted.ts", {
      readWorkingTree: async () => ({ files: [{ path: "src/broken.ts", text: "export const broken = true;\n" }] }),
      readStagedTree: async () => ({ files: [] }),
      readRevision: async () => ({ files: [] }),
    }, {
      run: async (command) => {
        commands.push([...command]);
        return { exitCode: 0, output: "" };
      },
    }, "delete");
    expect(result.checks).toEqual(["architecture"]);
    expect(result.violations).toHaveLength(1);
    expect(commands).toEqual([]);
  });
});

describe("provider hook configuration", () => {
  it("installs the exact Claude and Codex PostToolUse commands", async () => {
    const claude = await readFile(join(repositoryRoot, ".claude/settings.json"), "utf8");
    const codex = await readFile(join(repositoryRoot, ".codex/hooks.json"), "utf8");
    expect(claude).toContain('"matcher": "Write|Edit|MultiEdit"');
    expect(codex).toContain('"matcher": "Edit|Write|apply_patch"');
    expect(claude).toContain('bun \\"$(git rev-parse --show-toplevel)/scripts/hooks/provider-post-write.ts\\" claude');
    expect(codex).toContain('bun \\"$(git rev-parse --show-toplevel)/scripts/hooks/provider-post-write.ts\\" codex');
  });
});
