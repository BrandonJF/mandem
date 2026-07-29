/** @fileoverview Tests native-issue approval validation without repository writes. */
import { describe, expect, it } from "vitest";
import { serializeApproval, type ApprovalRecord } from "../src/modules/architecture-standard/domain/approval-contract";
import { assertApproval, type GitClient } from "./check-approval";

const issueId = "745eda80-1e74-4866-bc95-2f2983b31025";
const head = "1".repeat(40);
const approvalCommit = "2".repeat(40);
const record: ApprovalRecord = {
  decision: "approved",
  action: "apply-ruleset",
  issueId,
  target: {
    plan_sha256: "3".repeat(64),
    ruleset_sha256: "4".repeat(64),
    implementation_sha: head,
  },
  actor: "operator",
  response: "APPROVED",
  evidence: {
    channel: "mandem-conversation",
    conversation_id: null,
    message_id: null,
    recorded_at: "2026-07-29T19:00:00Z",
  },
};

function client(options: { readonly remote?: string; readonly message?: string; readonly dirty?: boolean } = {}): GitClient {
  return {
    async run(arguments_) {
      const command = arguments_.join(" ");
      if (command === `rev-parse refs/issues/${issueId}`) return { exitCode: 0, output: `${approvalCommit}\n` };
      if (command === `ls-remote origin refs/issues/${issueId}`) {
        return { exitCode: 0, output: `${options.remote ?? approvalCommit}\trefs/issues/${issueId}\n` };
      }
      if (command === `rev-list refs/issues/${issueId}`) return { exitCode: 0, output: `${approvalCommit}\n` };
      if (command === `cat-file commit ${approvalCommit}`) {
        return { exitCode: 0, output: `tree ${"0".repeat(40)}\n\n${options.message ?? serializeApproval(record)}` };
      }
      if (command === `merge-base --is-ancestor ${approvalCommit} ${approvalCommit}`) return { exitCode: 0, output: "" };
      if (command === "rev-parse HEAD") return { exitCode: 0, output: `${head}\n` };
      if (command === "status --porcelain --untracked-files=no") return { exitCode: 0, output: options.dirty ? " M file\n" : "" };
      return { exitCode: 2, output: `unexpected command: ${command}` };
    },
  };
}

describe("check approval", () => {
  it("accepts an exact approved target at a clean implementation head", async () => {
    await expect(assertApproval(record, client(), { requireCleanHead: true })).resolves.toEqual({
      approvalCommit,
      issueRefHead: approvalCommit,
    });
  });

  it("fails closed for remote divergence, dirty tracked files, denial, and changed target", async () => {
    await expect(assertApproval(record, client({ remote: "9".repeat(40) }), { requireCleanHead: true })).rejects.toThrow(/remote/);
    await expect(assertApproval(record, client({ dirty: true }), { requireCleanHead: true })).rejects.toThrow(/tracked worktree/);
    const denied = { ...record, decision: "denied" as const, response: "DENIED" as const };
    await expect(assertApproval(record, client({ message: serializeApproval(denied) }), { requireCleanHead: true })).rejects.toThrow(/denied/);
    const changed = { ...record, target: { ...record.target, ruleset_sha256: "5".repeat(64) } };
    await expect(assertApproval(changed, client(), { requireCleanHead: true })).rejects.toThrow(/not found/);
  });
});
