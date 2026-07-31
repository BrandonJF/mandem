/** @fileoverview Proves deterministic leased native issue graph writes against a bare remote. */
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { canonicalJson, serializeApproval, type ApprovalRecord } from "../domain/approval-contract";
import { NativeIssueGraphApprovalReader } from "../infrastructure/services/native-issue-graph-approval";
import { NativeIssueGraphWriter } from "../infrastructure/services/native-issue-graph-writer";

const issueId = "6a6a8bab-853f-4658-9bc0-38e2386b642d";
const timestamp = "2026-07-30T14:48:17Z";

function git(root: string, arguments_: readonly string[], input?: string): string {
  return execFileSync("git", [...arguments_], { cwd: root, input, encoding: "utf8" }).trim();
}

async function repository(): Promise<{ readonly root: string; readonly remote: string; readonly baseline: string }> {
  const directory = await mkdtemp(join(tmpdir(), "mandem-native-writer-"));
  const remote = join(directory, "remote.git");
  const root = join(directory, "repository");
  git(directory, ["init", "--bare", remote]);
  git(directory, ["init", root]);
  git(root, ["config", "user.name", "Test"]);
  git(root, ["config", "user.email", "test@example.com"]);
  git(root, ["remote", "add", "origin", remote]);
  const tree = git(root, ["mktree"], "");
  const baseline = git(root, ["commit-tree", tree], "Root\n");
  git(root, ["update-ref", `refs/issues/${issueId}`, baseline]);
  git(root, ["update-ref", "refs/heads/main", baseline]);
  git(root, ["symbolic-ref", "HEAD", "refs/heads/main"]);
  git(root, ["reset", "--hard", baseline]);
  git(root, ["push", "origin", `refs/issues/${issueId}:refs/issues/${issueId}`]);
  return { root, remote, baseline };
}

describe("native issue graph writer", () => {
  it("creates one deterministic result and repeats with zero push", async () => {
    const fixture = await repository();
    try {
      const writer = new NativeIssueGraphWriter(fixture.root);
      const request = {
        issueId,
        approvedBaseline: fixture.baseline,
        payload: "Mandem-Graph-Metadata: v1\nissue_key: \"WI1\"\n",
        approvalCommit: fixture.baseline,
        approvalIssueId: "745eda80-1e74-4866-bc95-2f2983b31025",
        approvalTimestamp: timestamp,
      };
      const first = await writer.apply(request);
      expect(first.action).toBe("created");
      await expect(writer.apply(request)).resolves.toEqual({ action: "complete", result: first.result });
      expect(git(fixture.remote, ["rev-parse", `refs/issues/${issueId}`])).toBe(first.result);
    } finally {
      await rm(join(fixture.root, ".."), { recursive: true, force: true });
    }
  });

  it("retries a lost push and parents approval-ref metadata to the approval", async () => {
    const fixture = await repository();
    try {
      const tree = git(fixture.root, ["show", "-s", "--format=%T", fixture.baseline]);
      const approval = git(fixture.root, ["commit-tree", tree, "-p", fixture.baseline], "Mandem-Approval: v1\n");
      git(fixture.root, ["update-ref", `refs/issues/${issueId}`, approval, fixture.baseline]);
      git(fixture.root, ["push", "origin", `refs/issues/${issueId}:refs/issues/${issueId}`]);
      const writer = new NativeIssueGraphWriter(fixture.root);
      const request = {
        issueId,
        approvedBaseline: fixture.baseline,
        payload: "Mandem-Graph-Metadata: v1\nissue_key: \"WI1\"\n",
        approvalCommit: approval,
        approvalIssueId: issueId,
        approvalTimestamp: timestamp,
      };
      const first = await writer.apply(request);
      git(fixture.remote, ["update-ref", `refs/issues/${issueId}`, approval, first.result]);
      await expect(writer.apply(request)).resolves.toEqual({ action: "pushed", result: first.result });
      expect(git(fixture.root, ["rev-parse", `${first.result}^`])).toBe(approval);
    } finally {
      await rm(join(fixture.root, ".."), { recursive: true, force: true });
    }
  });

  it("adopts an already-published result and rejects an unrelated third state", async () => {
    const fixture = await repository();
    try {
      const writer = new NativeIssueGraphWriter(fixture.root);
      const request = {
        issueId,
        approvedBaseline: fixture.baseline,
        payload: "Mandem-Graph-Metadata: v1\nissue_key: \"WI1\"\n",
        approvalCommit: fixture.baseline,
        approvalIssueId: "745eda80-1e74-4866-bc95-2f2983b31025",
        approvalTimestamp: timestamp,
      };
      const first = await writer.apply(request);
      git(fixture.root, ["update-ref", `refs/issues/${issueId}`, fixture.baseline, first.result]);
      await expect(writer.apply(request)).resolves.toEqual({ action: "adopted", result: first.result });
      const tree = git(fixture.root, ["show", "-s", "--format=%T", first.result]);
      const unrelated = git(fixture.root, ["commit-tree", tree, "-p", first.result], "Unrelated\n");
      git(fixture.root, ["update-ref", `refs/issues/${issueId}`, unrelated, first.result]);
      await expect(writer.apply(request)).rejects.toThrow("third state");
    } finally {
      await rm(join(fixture.root, ".."), { recursive: true, force: true });
    }
  });

  it("selects exact approval and reconstructs its approval-ref baseline", async () => {
    const fixture = await repository();
    try {
      const refs = { [issueId]: fixture.baseline };
      const approval: ApprovalRecord = {
        decision: "approved",
        action: "set-issue-graph",
        issueId,
        target: {
          repository: "BrandonJF/mandem",
          graph_sha256: "a".repeat(64),
          issue_refs: refs,
          issue_refs_sha256: createHash("sha256").update(canonicalJson(refs)).digest("hex"),
          implementation_sha: fixture.baseline,
        },
        actor: "operator",
        response: "APPROVED",
        evidence: {
          channel: "mandem-conversation",
          conversation_id: null,
          message_id: null,
          recorded_at: timestamp,
        },
      };
      const tree = git(fixture.root, ["show", "-s", "--format=%T", fixture.baseline]);
      const approvalCommit = git(
        fixture.root,
        ["commit-tree", tree, "-p", fixture.baseline, "-m", serializeApproval(approval).slice(0, -1)],
      );
      git(fixture.root, ["update-ref", `refs/issues/${issueId}`, approvalCommit, fixture.baseline]);
      git(fixture.root, ["push", "origin", `refs/issues/${issueId}:refs/issues/${issueId}`]);
      await expect(new NativeIssueGraphApprovalReader(fixture.root).authorize({
        approvalIssueId: issueId,
        graphSha256: "a".repeat(64),
        implementationSha: fixture.baseline,
      })).resolves.toMatchObject({ commit: approvalCommit, target: approval.target });
    } finally {
      await rm(join(fixture.root, ".."), { recursive: true, force: true });
    }
  });
});
