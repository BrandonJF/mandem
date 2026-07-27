/** @fileoverview Runs the complete gate in a disposable detached worktree. */
import { execFile } from "node:child_process";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execute = promisify(execFile);

async function command(root: string, arguments_: readonly string[]): Promise<void> {
  await execute("git", [...arguments_], { cwd: root, encoding: "utf8" });
}

try {
  const [revision] = Bun.argv.slice(2);
  if (!revision || Bun.argv.length !== 3 || /^0+$/.test(revision)) throw new Error("use one nonzero revision");
  const root = process.cwd();
  await command(root, ["rev-parse", "--verify", `${revision}^{commit}`]);
  const temporary = await mkdtemp(join(tmpdir(), "mandem-check-revision-"));
  let worktreeAdded = false;
  let cleanupFailure: Error | undefined;
  try {
    await command(root, ["worktree", "add", "--detach", temporary, revision]);
    worktreeAdded = true;
    await execute("bun", ["install", "--frozen-lockfile"], { cwd: temporary, encoding: "utf8" });
    await execute("bun", ["run", "check"], { cwd: temporary, encoding: "utf8" });
  } finally {
    try {
      if (worktreeAdded) await command(root, ["worktree", "remove", "--force", temporary]);
      try { await stat(temporary); cleanupFailure = new Error("temporary worktree remains"); } catch (error: unknown) {
        if ((error as { code?: string }).code !== "ENOENT") cleanupFailure = error instanceof Error ? error : new Error("could not verify temporary worktree removal");
      }
      await command(root, ["worktree", "prune"]);
      await rm(temporary, { recursive: true, force: true });
    } catch (error: unknown) {
      cleanupFailure = error instanceof Error ? error : new Error("could not remove temporary worktree");
    }
  }
  if (cleanupFailure) throw cleanupFailure;
} catch (error: unknown) {
  console.error(`revision checker failed: ${error instanceof Error ? error.message : "unexpected error"}`);
  process.exitCode = 2;
}
