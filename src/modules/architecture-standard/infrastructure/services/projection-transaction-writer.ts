/** @fileoverview Publishes one canonical provider transaction on a native issue ref. */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parseApproval } from "../../domain/approval-contract";
import {
  projectionTransactionDigest,
  serializeProjectionTransaction,
  type ProjectionTransaction,
} from "../../domain/projection-transaction";

const execute = promisify(execFile);

async function git(root: string, arguments_: readonly string[], env?: NodeJS.ProcessEnv, raw = false): Promise<string> {
  const result = await execute("git", [...arguments_], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    env: env ? { ...process.env, ...env } : process.env,
  });
  return raw ? result.stdout : result.stdout.trim();
}

function message(rawCommit: string): string {
  const separator = rawCommit.indexOf("\n\n");
  if (separator < 0) throw new Error("native issue commit has no message");
  return rawCommit.slice(separator + 2);
}

export class ProjectionTransactionWriter {
  constructor(private readonly root: string, private readonly remote = "origin") {}

  private async message(commit: string): Promise<string> {
    return message(await git(this.root, ["cat-file", "commit", commit], undefined, true));
  }

  async prepare(issueId: string, transaction: ProjectionTransaction): Promise<{
    readonly commit: string;
    readonly created: boolean;
    readonly pushed: boolean;
    readonly transactionSha256: string;
  }> {
    const reference = `refs/issues/${issueId}`;
    const [local, remoteLine] = await Promise.all([
      git(this.root, ["rev-parse", reference]),
      git(this.root, ["ls-remote", this.remote, reference]),
    ]);
    const remote = remoteLine.split(/\s+/u)[0] ?? "";
    const payload = serializeProjectionTransaction(transaction);
    const transactionSha256 = projectionTransactionDigest(transaction);
    const localMessage = await this.message(local);
    if (local === remote && localMessage === payload) {
      return { commit: local, created: false, pushed: false, transactionSha256 };
    }
    if (local === remote && localMessage.startsWith("Mandem-Approval: v1\n")) {
      const approval = parseApproval(localMessage);
      const parent = await git(this.root, ["rev-parse", `${local}^`]);
      if (
        approval.action === "sync-issue-projection" &&
        "transaction_sha256" in approval.target &&
        approval.target.transaction_sha256 === transactionSha256 &&
        await this.message(parent) === payload
      ) return { commit: parent, created: false, pushed: false, transactionSha256 };
    }
    if (local !== remote && localMessage === payload) {
      const parent = await git(this.root, ["rev-parse", `${local}^`]);
      if (parent === remote) {
        await git(this.root, ["push", `--force-with-lease=${reference}:${remote}`, this.remote, reference]);
        return { commit: local, created: false, pushed: true, transactionSha256 };
      }
    }
    if (local !== remote) throw new Error("local and remote approval issue refs differ");
    const [tree, date] = await Promise.all([
      git(this.root, ["rev-parse", `${local}^{tree}`]),
      git(this.root, ["show", "-s", "--format=%cI", local]),
    ]);
    const commit = await git(
      this.root,
      ["commit-tree", tree, "-p", local, "-m", payload],
      {
        GIT_AUTHOR_NAME: "Mandem",
        GIT_AUTHOR_EMAIL: "mandem@local",
        GIT_COMMITTER_NAME: "Mandem",
        GIT_COMMITTER_EMAIL: "mandem@local",
        GIT_AUTHOR_DATE: date,
        GIT_COMMITTER_DATE: date,
      },
    );
    await git(this.root, ["update-ref", reference, commit, local]);
    await git(this.root, ["push", `--force-with-lease=${reference}:${remote}`, this.remote, reference]);
    return { commit, created: true, pushed: true, transactionSha256 };
  }
}
