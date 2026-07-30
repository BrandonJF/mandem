/** @fileoverview Specifies raw Git reads for native issue graph records. */
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GitNativeIssueGraphRepository } from "../infrastructure/repositories/git-native-issue-graph-repository";

function epicMetadata(issue: string, key = "EPIC"): string {
  return `Mandem-Graph-Metadata: v1\nissue_key: "${key}"\nepic_issue_id: "${issue}"\nplan: null\nparent_issue_id: null\ndepends_on_issue_ids: []\nprovider:\n  kind: "github"\n  owner: "BrandonJF"\n  repository: "mandem"\nmilestone:\n  title: "Mandem v1"\n  description: "Tracks work."\n  state: "open"\n  due_on: null\nmanaged_labels:\n  blocked:\n    color: "B60205"\n    description: "Blocked"\n`;
}

describe("git native issue graph repository", () => {
  it("reads an issue comment from a raw issue ref in a disposable repository", async () => {
    const root = await mkdtemp(join(tmpdir(), "mandem-issue-graph-"));
    try {
      execFileSync("git", ["init"], { cwd: root });
      execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
      execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
      const tree = execFileSync("git", ["mktree"], { cwd: root, input: "", encoding: "utf8" }).trim();
      const issue = "abe862d6-b052-49fe-8611-bc1ab6e24253";
      const message = epicMetadata(issue);
      const commit = execFileSync("git", ["commit-tree", tree], { cwd: root, input: message, encoding: "utf8" }).trim();
      execFileSync("git", ["update-ref", `refs/issues/${issue}`, commit], { cwd: root });
      const repository = new GitNativeIssueGraphRepository(root);
      await expect(repository.readIssue(issue)).resolves.toMatchObject({ issueId: issue, metadata: { issueKey: "EPIC" } });
    } finally { await rm(root, { recursive: true, force: true }); }
  });

  it("selects the descendant metadata comment rather than commit order", async () => {
    const root = await mkdtemp(join(tmpdir(), "mandem-issue-graph-"));
    try {
      execFileSync("git", ["init"], { cwd: root });
      execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
      execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
      const tree = execFileSync("git", ["mktree"], { cwd: root, input: "", encoding: "utf8" }).trim();
      const issue = "abe862d6-b052-49fe-8611-bc1ab6e24253";
      const oldCommit = execFileSync("git", ["commit-tree", tree], { cwd: root, input: epicMetadata(issue, "OLD"), encoding: "utf8" }).trim();
      const newCommit = execFileSync("git", ["commit-tree", tree, "-p", oldCommit], { cwd: root, input: epicMetadata(issue), encoding: "utf8" }).trim();
      execFileSync("git", ["update-ref", `refs/issues/${issue}`, newCommit], { cwd: root });
      await expect(new GitNativeIssueGraphRepository(root).readIssue(issue)).resolves.toMatchObject({ metadata: { issueKey: "EPIC" } });
    } finally { await rm(root, { recursive: true, force: true }); }
  });
});
