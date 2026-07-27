/** @fileoverview Revision-aware pre-push repository quality hook. */
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execute = promisify(execFile);
const zeroSha = "0".repeat(40);
const protectedRefs = new Set(["refs/heads/main", "refs/heads/staging", "refs/heads/production"]);
const documentationOnly = (path: string): boolean => path === "README.md" || path === "AGENTS.md" || path === "CLAUDE.md" || path === "PLANS.md" || path.endsWith(".md") || path.startsWith("docs/");

interface PushUpdate { readonly localRef: string; readonly localSha: string; readonly remoteRef: string; readonly remoteSha: string; }

function parse(input: string): PushUpdate[] {
  if (input.trim() === "") return [];
  return input.trim().split("\n").map((line) => {
    const fields = line.trim().split(/\s+/);
    if (fields.length !== 4) throw new Error("Git supplied an invalid pre-push update");
    const [localRef, localSha, remoteRef, remoteSha] = fields;
    return { localRef: localRef ?? "", localSha: localSha ?? "", remoteRef: remoteRef ?? "", remoteSha: remoteSha ?? "" };
  });
}

async function git(root: string, arguments_: readonly string[]): Promise<string> {
  const result = await execute("git", [...arguments_], { cwd: root, encoding: "utf8" });
  return result.stdout.trim();
}

async function standardInput(): Promise<string> {
  let input = "";
  for await (const chunk of process.stdin) input += chunk.toString();
  return input;
}

async function changedPaths(root: string, base: string, head: string): Promise<readonly string[]> {
  return (await git(root, ["diff", "--name-only", `${base}...${head}`])).split("\n").filter(Boolean);
}

async function fallbackBase(root: string, head: string): Promise<string> {
  try { return await git(root, ["merge-base", "origin/main", head]); }
  catch { return await git(root, ["hash-object", "-t", "tree", "/dev/null"]); }
}

async function runQualityGate(root: string, localSha: string, paths: readonly string[]): Promise<void> {
  const command = paths.every(documentationOnly)
    ? ["run", "docs:revision", "--", "--revision", localSha]
    : ["run", "check:revision", "--", localSha];
  if (command[1] === "docs:revision") {
    await execute("bun", command, { cwd: root, encoding: "utf8" });
    await execute("bun", ["run", "authored-files:revision", "--", "--revision", localSha], { cwd: root, encoding: "utf8" });
    return;
  }
  await execute("bun", command, { cwd: root, encoding: "utf8" });
}

try {
  const root = process.cwd();
  const updates = parse(await standardInput());
  for (const update of updates) {
    if (protectedRefs.has(update.remoteRef)) {
      console.error(`pre-push rejected protected remote ref ${update.remoteRef}`);
      process.exitCode = 1;
      break;
    }
  }
  if (process.exitCode !== 1) {
    const revisions = new Map<string, Set<string>>();
    const record = (revision: string, paths: readonly string[]): void => {
      const combined = revisions.get(revision) ?? new Set<string>();
      for (const path of paths) combined.add(path);
      revisions.set(revision, combined);
    };
    if (updates.length === 0) {
      const head = await git(root, ["rev-parse", "HEAD"]);
      let base: string;
      try { base = await git(root, ["merge-base", "@{upstream}", "HEAD"]); }
      catch { base = await fallbackBase(root, head); }
      record(head, await changedPaths(root, base, head));
    } else {
      for (const update of updates) {
        if (update.localSha === zeroSha) continue;
        try {
          const base = update.remoteSha === zeroSha ? await fallbackBase(root, update.localSha) : update.remoteSha;
          record(update.localSha, await changedPaths(root, base, update.localSha));
        } catch {
          record(update.localSha, ["__indeterminate__"]);
        }
      }
    }
    for (const [revision, paths] of revisions) await runQualityGate(root, revision, [...paths]);
  }
} catch (error: unknown) {
  console.error(`pre-push hook failed: ${error instanceof Error ? error.message : "unexpected error"}`);
  process.exitCode = 2;
}
