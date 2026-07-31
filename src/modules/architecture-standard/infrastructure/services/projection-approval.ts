/** @fileoverview Verifies the current exact approval for one provider projection transaction. */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parseApproval, type SyncIssueProjectionTarget } from "../../domain/approval-contract";
import {
  parseProjectionTransaction,
  projectionTransactionDigest,
  type ProjectionTransaction,
} from "../../domain/projection-transaction";

const execute = promisify(execFile);

async function git(root: string, arguments_: readonly string[], raw = false): Promise<string> {
  const result = await execute("git", [...arguments_], { cwd: root, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  return raw ? result.stdout : result.stdout.trim();
}

function message(rawCommit: string): string {
  const separator = rawCommit.indexOf("\n\n");
  if (separator < 0) throw new Error("native issue commit has no message");
  return rawCommit.slice(separator + 2);
}

export class ProjectionApprovalReader {
  constructor(private readonly root: string, private readonly remote = "origin") {}

  async authorize(input: { readonly approvalIssueId: string; readonly implementationSha: string }): Promise<{
    readonly approvalCommit: string;
    readonly target: SyncIssueProjectionTarget;
    readonly transactionCommit: string;
    readonly transaction: ProjectionTransaction;
  }> {
    const reference = `refs/issues/${input.approvalIssueId}`;
    const [local, remoteLine, head, status] = await Promise.all([
      git(this.root, ["rev-parse", reference]),
      git(this.root, ["ls-remote", this.remote, reference]),
      git(this.root, ["rev-parse", "HEAD"]),
      git(this.root, ["status", "--porcelain", "--untracked-files=no"]),
    ]);
    const remote = remoteLine.split(/\s+/u)[0];
    if (local !== remote) throw new Error("local and remote approval issue refs differ");
    if (head !== input.implementationSha) throw new Error("implementation HEAD differs from approval target");
    if (status !== "") throw new Error("tracked worktree must be clean");
    const approval = parseApproval(message(await git(this.root, ["cat-file", "commit", local], true)));
    if (
      approval.decision !== "approved" ||
      approval.action !== "sync-issue-projection" ||
      approval.issueId !== input.approvalIssueId ||
      !("transaction_sha256" in approval.target) ||
      approval.target.implementation_sha !== input.implementationSha
    ) throw new Error("current native issue head is not the exact projection approval");
    const transactionCommit = await git(this.root, ["rev-parse", `${local}^`]);
    const transaction = parseProjectionTransaction(message(await git(this.root, ["cat-file", "commit", transactionCommit], true)));
    const target = approval.target as SyncIssueProjectionTarget;
    if (
      projectionTransactionDigest(transaction) !== target.transaction_sha256 ||
      transaction.graphSha256 !== target.graph_sha256 ||
      transaction.providerSnapshotSha256 !== target.provider_snapshot_sha256 ||
      transaction.operationsSha256 !== target.operations_sha256 ||
      transaction.implementationSha !== target.implementation_sha
    ) throw new Error("projection approval does not match its parent transaction");
    return { approvalCommit: local, target, transactionCommit, transaction };
  }
}
