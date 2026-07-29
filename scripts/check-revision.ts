/** @fileoverview Acquires the repository revision-check lock and launches its private worker. */
import { execFileSync, spawnSync } from "node:child_process";
import { lstatSync, realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

function fail(message: string): never {
  console.error(`revision checker failed: ${message}`);
  process.exit(2);
}

try {
  const arguments_ = Bun.argv.slice(2);
  if (
    !(
      (arguments_.length === 1 && arguments_[0] === "--reconcile-only") ||
      (arguments_.length === 1 && arguments_[0] !== undefined && !/^0+$/.test(arguments_[0]))
    )
  ) {
    fail("use one nonzero revision or --reconcile-only");
  }

  const root = process.cwd();
  const commonGitDirectory = resolve(
    root,
    execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], {
      cwd: root,
      encoding: "utf8",
    }).trim(),
  );
  const commonStat = lstatSync(commonGitDirectory);
  if (!commonStat.isDirectory() || commonStat.isSymbolicLink()) {
    fail("the common Git directory must be a real directory");
  }
  const realCommonGitDirectory = realpathSync(commonGitDirectory);
  const lockPath = join(realCommonGitDirectory, "mandem-revision-check.lock");
  const worker = join(dirname(new URL(import.meta.url).pathname), "check-revision-worker.ts");
  const result = spawnSync(
    "flock",
    ["--nonblock", "--conflict-exit-code", "66", lockPath, "bun", worker, ...arguments_],
    { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  if (result.error) fail(`could not launch flock: ${result.error.message}`);
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status === 1) process.exit(1);
  if (result.status !== 0) {
    if (result.status === 66) fail("another revision check holds the repository lock");
    process.exit(2);
  }
} catch (error: unknown) {
  fail(error instanceof Error ? error.message : "unexpected error");
}
