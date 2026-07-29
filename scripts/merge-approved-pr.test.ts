/** @fileoverview Tests exact-head approved pull-request merging. */
import { describe, expect, it } from "vitest";
import type { ApprovalRecord } from "../src/modules/architecture-standard/domain/approval-contract";
import { mergeApprovedPullRequest, type PullRequestClient } from "./merge-approved-pr";

const approval: ApprovalRecord = {
  decision: "approved",
  action: "merge-pr",
  issueId: "745eda80-1e74-4866-bc95-2f2983b31025",
  target: { repository: "BrandonJF/mandem", pull_request: 44, head_sha: "a".repeat(40) },
  actor: "operator",
  response: "APPROVED",
  evidence: {
    channel: "mandem-conversation",
    conversation_id: null,
    message_id: null,
    recorded_at: "2026-07-29T20:00:00Z",
  },
};

function gh(head = "a".repeat(40)): { readonly client: PullRequestClient; readonly calls: readonly string[][] } {
  const calls: string[][] = [];
  return {
    calls,
    client: {
      async run(arguments_) {
        calls.push([...arguments_]);
        if (arguments_[0] === "view") return { exitCode: 0, output: `${head}\n` };
        return { exitCode: 0, output: "merged\n" };
      },
    },
  };
}

describe("approved PR merge", () => {
  it("reads the PR head and uses GitHub's atomic head match", async () => {
    const fixture = gh();
    await mergeApprovedPullRequest(approval, fixture.client, async () => {});
    expect(fixture.calls).toEqual([
      ["view", "44", "--repo", "BrandonJF/mandem", "--json", "headRefOid", "--jq", ".headRefOid"],
      ["merge", "44", "--repo", "BrandonJF/mandem", "--merge", "--match-head-commit", "a".repeat(40)],
    ]);
  });

  it("performs no merge for missing approval or a stale PR head", async () => {
    const missing = gh();
    await expect(
      mergeApprovedPullRequest(approval, missing.client, async () => {
        throw new Error("approval missing");
      }),
    ).rejects.toThrow("approval missing");
    expect(missing.calls).toEqual([]);

    const stale = gh("b".repeat(40));
    await expect(mergeApprovedPullRequest(approval, stale.client, async () => {})).rejects.toThrow(/head changed/);
    expect(stale.calls).toHaveLength(1);
  });
});
