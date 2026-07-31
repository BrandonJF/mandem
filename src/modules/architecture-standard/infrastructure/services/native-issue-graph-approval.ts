/** @fileoverview Selects and verifies exact native graph approval from native issue history. */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  parseApproval,
  type ApprovalRecord,
  type SetIssueGraphTarget,
} from "../../domain/approval-contract";

const execute = promisify(execFile);

async function git(root: string, arguments_: readonly string[], raw = false): Promise<string> {
  const child = await execute("git", [...arguments_], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  return raw ? child.stdout : child.stdout.trim();
}

function commitMessage(rawCommit: string): string {
  const separator = rawCommit.indexOf("\n\n");
  if (separator < 0) throw new Error("native approval commit has no message");
  return rawCommit.slice(separator + 2);
}

async function isAncestor(root: string, possibleAncestor: string, descendant: string): Promise<boolean> {
  try {
    await git(root, ["merge-base", "--is-ancestor", possibleAncestor, descendant]);
    return true;
  } catch {
    return false;
  }
}

export interface NativeGraphApproval {
  readonly commit: string;
  readonly timestamp: string;
  readonly target: SetIssueGraphTarget;
}

export class NativeIssueGraphApprovalReader {
  constructor(private readonly root: string, private readonly remote = "origin") {}

  async authorize(input: {
    readonly approvalIssueId: string;
    readonly graphSha256: string;
    readonly implementationSha: string;
  }): Promise<NativeGraphApproval> {
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

    const commits = (await git(this.root, ["rev-list", reference])).split("\n").filter(Boolean);
    const matching: { readonly commit: string; readonly record: ApprovalRecord }[] = [];
    for (const commit of commits) {
      const source = commitMessage(await git(this.root, ["cat-file", "commit", commit], true));
      if (!source.startsWith("Mandem-Approval: v1\n")) continue;
      const record = parseApproval(source);
      if (
        record.issueId === input.approvalIssueId &&
        record.action === "set-issue-graph" &&
        "issue_refs" in record.target &&
        record.target.repository === "BrandonJF/mandem" &&
        record.target.graph_sha256 === input.graphSha256 &&
        record.target.implementation_sha === input.implementationSha
      ) {
        matching.push({ commit, record });
      }
    }
    const maxima: typeof matching = [];
    for (const candidate of matching) {
      const descendsFromAll = (await Promise.all(matching.map(
        async (other) => other.commit === candidate.commit || isAncestor(this.root, other.commit, candidate.commit),
      ))).every(Boolean);
      if (descendsFromAll) maxima.push(candidate);
    }
    const selected = maxima[0];
    if (maxima.length !== 1 || !selected) throw new Error("exact native graph approval is absent or incomparable");
    if (selected.record.decision !== "approved") throw new Error("exact native graph approval was denied");
    const target = selected.record.target as SetIssueGraphTarget;
    const parent = await git(this.root, ["rev-parse", `${selected.commit}^`]);
    if (target.issue_refs[input.approvalIssueId] !== parent) {
      throw new Error("approval issue baseline does not match approval parent");
    }
    return {
      commit: selected.commit,
      timestamp: selected.record.evidence.recorded_at,
      target,
    };
  }
}
