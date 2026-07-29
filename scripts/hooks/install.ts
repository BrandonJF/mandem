/** @fileoverview Installs Mandem's versioned hooks in one Git worktree. */
import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execute = promisify(execFile);

async function git(root: string, arguments_: readonly string[], allowMissing = false): Promise<string | undefined> {
  try { return (await execute("git", [...arguments_], { cwd: root, encoding: "utf8" })).stdout.trim(); }
  catch (error: unknown) {
    const details = error as { code?: number; stderr?: string };
    if (allowMissing && details.code === 1) return undefined;
    throw new Error(details.stderr?.trim() || `git ${arguments_.join(" ")} failed`);
  }
}

function worktrees(output: string): readonly string[] {
  return output.split("\n").filter((line) => line.startsWith("worktree ")).map((line) => line.slice("worktree ".length));
}

async function install(root: string): Promise<void> {
  const commonDirectory = await git(root, ["rev-parse", "--git-common-dir"]);
  const commonConfig = resolve(root, commonDirectory ?? "", "config");
  const commonHookPath = await git(root, ["config", "--file", commonConfig, "--get", "core.hooksPath"], true);
  const allWorktrees = worktrees((await git(root, ["worktree", "list", "--porcelain"])) ?? "");
  if (await git(root, ["config", "--file", commonConfig, "--get", "extensions.worktreeConfig"], true) !== "true") {
    await git(root, ["config", "--file", commonConfig, "extensions.worktreeConfig", "true"]);
  }
  if (commonHookPath) {
    for (const worktree of allWorktrees) {
      if (await git(worktree, ["config", "--worktree", "--get", "core.hooksPath"], true) === undefined) {
        await git(worktree, ["config", "--worktree", "core.hooksPath", commonHookPath]);
      }
      if (await git(worktree, ["config", "--worktree", "--get", "core.hooksPath"], true) === undefined) throw new Error(`could not preserve hooks for ${worktree}`);
    }
    await git(root, ["config", "--file", commonConfig, "--unset-all", "core.hooksPath"]);
  }
  await git(root, ["config", "--worktree", "core.hooksPath", ".githooks"]);
  if (await git(root, ["config", "--worktree", "--get", "core.hooksPath"], true) !== ".githooks") throw new Error("could not configure .githooks");
  console.log("Git hooks use .githooks in this worktree.");
}

async function check(root: string): Promise<void> {
  if (await git(root, ["config", "--worktree", "--get", "core.hooksPath"], true) === ".githooks") {
    console.log("Git hooks use .githooks in this worktree.");
    return;
  }
  console.error("Git hooks are not configured for this worktree.");
  process.exitCode = 1;
}

try {
  if (Bun.argv.slice(2).length > 1 || (Bun.argv[2] !== undefined && Bun.argv[2] !== "--check")) throw new Error("use no arguments or --check");
  if (Bun.argv[2] === "--check") await check(process.cwd()); else await install(process.cwd());
} catch (error: unknown) {
  console.error(`hook installation failed: ${error instanceof Error ? error.message : "unexpected error"}`);
  process.exitCode = 2;
}
