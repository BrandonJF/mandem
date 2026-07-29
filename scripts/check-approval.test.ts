/** @fileoverview Tests native-issue approval validation without repository writes. */
import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { serializeApproval, type ApprovalRecord } from "../src/modules/architecture-standard/domain/approval-contract";
import { assertApproval, requestFromArguments, sha256, type GitClient } from "./check-approval";

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
  it("derives the documented execute-plan target from the plan file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "mandem-approval-plan-"));
    try {
      const plan = join(directory, "plan.md");
      await writeFile(plan, "reviewed plan\n");
      await expect(requestFromArguments([
        "--issue", issueId,
        "--action", "execute-plan",
        "--plan", plan,
        "--plan-commit", head,
      ])).resolves.toMatchObject({ target: { plan_commit: head, plan_sha256: sha256("reviewed plan\n") } });
    } finally { await rm(directory, { recursive: true, force: true }); }
  });

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

  it("reads raw commits and detects incomparable approvals in a disposable Git repository", async () => {
    const directory = await mkdtemp(join(tmpdir(), "mandem-approval-git-"));
    const root = join(directory, "repository");
    const remote = join(directory, "remote.git");
    try {
      execFileSync("git", ["init", "--bare", remote]);
      execFileSync("git", ["init", root]);
      execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
      execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
      execFileSync("git", ["remote", "add", "origin", remote], { cwd: root });
      const tree = execFileSync("git", ["mktree"], { cwd: root, input: "", encoding: "utf8" }).trim();
      const commit = (message: string, parents: readonly string[] = []): string =>
        execFileSync("git", ["commit-tree", tree, ...parents.flatMap((parent) => ["-p", parent])], {
          cwd: root,
          input: message,
          encoding: "utf8",
        }).trim();
      const first = commit(serializeApproval(record));
      execFileSync("git", ["update-ref", `refs/issues/${issueId}`, first], { cwd: root });
      execFileSync("git", ["push", "origin", `refs/issues/${issueId}`], { cwd: root });
      const realGit: GitClient = {
        async run(arguments_) {
          try {
            return { exitCode: 0, output: execFileSync("git", arguments_, { cwd: root, encoding: "utf8" }) };
          } catch (error: unknown) {
            const failure = error as { readonly status?: number; readonly stdout?: string; readonly stderr?: string };
            return { exitCode: failure.status ?? 2, output: `${failure.stdout ?? ""}${failure.stderr ?? ""}` };
          }
        },
      };
      await expect(assertApproval(record, realGit)).resolves.toMatchObject({ approvalCommit: first });

      const second = commit(serializeApproval({ ...record, decision: "denied", response: "DENIED" }));
      const merge = commit("merge approvals\n", [first, second]);
      execFileSync("git", ["update-ref", `refs/issues/${issueId}`, merge], { cwd: root });
      execFileSync("git", ["push", "--force", "origin", `refs/issues/${issueId}`], { cwd: root });
      await expect(assertApproval(record, realGit)).rejects.toThrow(/incomparable/);
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
});
