/** @fileoverview Git-backed revision, index, and changed-path adapters. */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { GitChange, GitChangeReader, RepositorySnapshotReader } from "../../application/repositories/repository-snapshot";
import type { RepositoryFile, RepositorySnapshot } from "../../domain/types";

const execute = promisify(execFile);

async function git(root: string, arguments_: readonly string[]): Promise<string> {
  try {
    const result = await execute("git", [...arguments_], { cwd: root, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
    return result.stdout;
  } catch (error: unknown) {
    const output = error as { stderr?: string };
    throw new Error(output.stderr?.trim() || `git ${arguments_.join(" ")} failed`);
  }
}

async function snapshotFromEntries(root: string, entries: readonly { path: string; source: string }[]): Promise<RepositorySnapshot> {
  const files: RepositoryFile[] = [];
  for (const entry of entries) files.push({ path: entry.path, text: await git(root, ["show", entry.source]) });
  return { files: files.sort((left, right) => left.path.localeCompare(right.path)) };
}

function treeEntries(output: string, source: (path: string) => string): Array<{ path: string; source: string }> {
  return output.split("\0").filter(Boolean).map((entry) => {
    const tab = entry.indexOf("\t");
    if (tab < 0) throw new Error("Git returned an invalid tree entry");
    return { path: entry.slice(tab + 1), source: source(entry.slice(tab + 1)) };
  });
}

export class GitRepositorySnapshot implements RepositorySnapshotReader, GitChangeReader {
  async readWorkingTree(root: string): Promise<RepositorySnapshot> { throw new Error(`working snapshots require the filesystem adapter for ${root}`); }

  async readStagedTree(root: string): Promise<RepositorySnapshot> {
    const entries = treeEntries(await git(root, ["ls-files", "-s", "-z"]), (path) => `:${path}`);
    return snapshotFromEntries(root, entries);
  }

  async readRevision(root: string, revision: string): Promise<RepositorySnapshot> {
    const entries = treeEntries(await git(root, ["ls-tree", "-r", "-z", revision]), (path) => `${revision}:${path}`);
    return snapshotFromEntries(root, entries);
  }

  async changedEntries(root: string, base: string, head: string): Promise<readonly GitChange[]> {
    const values = (await git(root, ["diff", "--name-status", "-z", `${base}...${head}`])).split("\0");
    const changes: GitChange[] = [];
    for (let index = 0; index < values.length - 1;) {
      const statusToken = values[index++] ?? "";
      const status = statusToken[0] as GitChange["status"] | undefined;
      if (!status || !["A", "C", "M", "R", "D"].includes(status)) throw new Error(`unsupported Git change status ${statusToken}`);
      const firstPath = values[index++] ?? "";
      if ((status === "R" || status === "C") && firstPath !== "") {
        const path = values[index++] ?? "";
        changes.push({ status, oldPath: firstPath, path });
      } else changes.push({ status, path: firstPath });
    }
    return changes;
  }
}
