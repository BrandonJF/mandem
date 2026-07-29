/** @fileoverview Validates exact approvals stored in a native issue ref. */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  ApprovalContractError,
  canonicalJson,
  selectApproval,
  serializeApproval,
  type ApprovalRecord,
  type ApprovalTarget,
} from "../src/modules/architecture-standard/domain/approval-contract";

export interface GitClient {
  run(arguments_: readonly string[]): Promise<{ readonly exitCode: number; readonly output: string }>;
}

export class ApprovalCheckError extends Error {}
export class ApprovalDeniedError extends ApprovalCheckError {}

function output(result: { readonly exitCode: number; readonly output: string }, label: string): string {
  if (result.exitCode !== 0) throw new ApprovalCheckError(`${label} failed: ${result.output.trim() || `exit ${result.exitCode}`}`);
  return result.output.trim();
}

function commitMessage(rawCommit: string): string {
  const separator = rawCommit.indexOf("\n\n");
  if (separator < 0) throw new ApprovalCheckError("raw approval commit has no message separator");
  return rawCommit.slice(separator + 2);
}

export function approvalRequest(issueId: string, action: ApprovalRecord["action"], target: ApprovalTarget): ApprovalRecord {
  return {
    decision: "approved",
    action,
    issueId,
    target,
    actor: "operator",
    response: "APPROVED",
    evidence: {
      channel: "mandem-conversation",
      conversation_id: null,
      message_id: null,
      recorded_at: "1970-01-01T00:00:00Z",
    },
  };
}

export async function assertApproval(
  request: ApprovalRecord,
  git: GitClient,
  options: { readonly requireCleanHead?: boolean } = {},
): Promise<{ readonly approvalCommit: string; readonly issueRefHead: string }> {
  serializeApproval(request);
  const reference = `refs/issues/${request.issueId}`;
  const issueRefHead = output(await git.run(["rev-parse", reference]), "local native issue ref");
  const remoteLine = output(await git.run(["ls-remote", "origin", reference]), "remote native issue ref");
  const remoteHead = remoteLine.split(/\s+/u)[0];
  if (remoteHead !== issueRefHead) throw new ApprovalDeniedError("local and remote native issue refs differ");

  if (options.requireCleanHead) {
    const head = output(await git.run(["rev-parse", "HEAD"]), "implementation HEAD");
    if (!("implementation_sha" in request.target) || head !== request.target.implementation_sha) {
      throw new ApprovalDeniedError("checked-out HEAD differs from the approved implementation SHA");
    }
    const status = output(await git.run(["status", "--porcelain", "--untracked-files=no"]), "tracked worktree status");
    if (status !== "") throw new ApprovalDeniedError("tracked worktree must be clean");
  }

  const commitList = output(await git.run(["rev-list", reference]), "native issue history");
  const commits = await Promise.all(
    commitList
      .split("\n")
      .filter(Boolean)
      .map(async (commit) => {
        const raw = await git.run(["cat-file", "commit", commit]);
        if (raw.exitCode !== 0) throw new ApprovalCheckError(`raw approval commit read failed: ${raw.output.trim()}`);
        return { commit, message: commitMessage(raw.output) };
      }),
  );
  let selected;
  try {
    selected = await selectApproval(commits, request, async (ancestor, descendant) => {
      const result = await git.run(["merge-base", "--is-ancestor", ancestor, descendant]);
      if (result.exitCode === 0) return true;
      if (result.exitCode === 1) return false;
      throw new ApprovalCheckError(`approval ancestry check failed: ${result.output.trim()}`);
    });
  } catch (error: unknown) {
    throw new ApprovalDeniedError(error instanceof Error ? error.message : "approval validation failed");
  }
  if (!selected) throw new ApprovalDeniedError("exact approval was not found");
  if (!selected.authorized) throw new ApprovalDeniedError("exact approval was denied");
  return { approvalCommit: selected.commit, issueRefHead };
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function assertRulesetApproval(
  ruleset: unknown,
  issueId: string,
  planPath: string,
  git: GitClient = gitClient,
): Promise<void> {
  const head = output(await git.run(["rev-parse", "HEAD"]), "implementation HEAD");
  const request = approvalRequest(issueId, "apply-ruleset", {
    plan_sha256: sha256(await readFile(planPath, "utf8")),
    ruleset_sha256: sha256(canonicalJson(ruleset)),
    implementation_sha: head,
  });
  await assertApproval(request, git, { requireCleanHead: true });
}

const gitClient: GitClient = {
  async run(arguments_) {
    const child = Bun.spawn(["git", ...arguments_], { cwd: process.cwd(), stdout: "pipe", stderr: "pipe" });
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    return { exitCode, output: `${stdout}${stderr}` };
  },
};

function valueAfter(arguments_: readonly string[], name: string): string {
  const index = arguments_.indexOf(name);
  const value = index < 0 ? undefined : arguments_[index + 1];
  if (!value) throw new ApprovalContractError(`missing ${name}`);
  return value;
}

function assertExactFlags(arguments_: readonly string[], expected: readonly string[]): void {
  if (arguments_.length !== expected.length * 2) throw new ApprovalDeniedError("approval command has missing or unknown flags");
  const supplied = arguments_.filter((_, index) => index % 2 === 0);
  if (new Set(supplied).size !== supplied.length || supplied.some((flag) => !expected.includes(flag))) {
    throw new ApprovalDeniedError("approval command has duplicate or unknown flags");
  }
}

export async function requestFromArguments(arguments_: readonly string[], git: GitClient = gitClient): Promise<ApprovalRecord> {
  const issueId = valueAfter(arguments_, "--issue");
  const action = valueAfter(arguments_, "--action");
  if (action === "execute-plan") {
    assertExactFlags(arguments_, ["--issue", "--action", "--plan", "--plan-commit"]);
    const planPath = valueAfter(arguments_, "--plan");
    return approvalRequest(issueId, action, {
      plan_commit: valueAfter(arguments_, "--plan-commit"),
      plan_sha256: sha256(await readFile(planPath, "utf8")),
    });
  }
  if (action === "apply-ruleset") {
    assertExactFlags(arguments_, ["--issue", "--action", "--plan"]);
    const { repositoryRuleset } = await import("./configure-repository-ruleset");
    const head = output(await git.run(["rev-parse", "HEAD"]), "implementation HEAD");
    return approvalRequest(issueId, action, {
      plan_sha256: sha256(await readFile(valueAfter(arguments_, "--plan"), "utf8")),
      ruleset_sha256: sha256(canonicalJson(repositoryRuleset)),
      implementation_sha: head,
    });
  }
  if (action === "merge-pr") {
    assertExactFlags(arguments_, ["--issue", "--action", "--repository", "--pull-request", "--head"]);
    return approvalRequest(issueId, action, {
      repository: valueAfter(arguments_, "--repository") as "BrandonJF/mandem",
      pull_request: Number(valueAfter(arguments_, "--pull-request")),
      head_sha: valueAfter(arguments_, "--head"),
    });
  }
  throw new ApprovalContractError("action must be execute-plan, apply-ruleset, or merge-pr");
}

if (import.meta.main) {
  try {
    const request = await requestFromArguments(Bun.argv.slice(2), gitClient);
    const result = await assertApproval(request, gitClient, { requireCleanHead: request.action === "apply-ruleset" });
    console.log(`Approval verified at native issue commit ${result.approvalCommit}.`);
  } catch (error: unknown) {
    console.error(`approval check failed: ${error instanceof Error ? error.message : "unexpected error"}`);
    process.exitCode = error instanceof ApprovalDeniedError || error instanceof ApprovalContractError ? 1 : 2;
  }
}
