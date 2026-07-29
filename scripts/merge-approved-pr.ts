/** @fileoverview Merges one pull request only at its conversation-approved exact head. */
import type { ApprovalRecord } from "../src/modules/architecture-standard/domain/approval-contract";
import { approvalRequest, assertApproval, type GitClient } from "./check-approval";

export interface PullRequestClient {
  run(arguments_: readonly string[]): Promise<{ readonly exitCode: number; readonly output: string }>;
}

export async function mergeApprovedPullRequest(
  approval: ApprovalRecord,
  gh: PullRequestClient,
  authorize: () => Promise<void>,
): Promise<void> {
  await authorize();
  if (approval.action !== "merge-pr" || !("repository" in approval.target)) throw new Error("merge approval target is invalid");
  const target = approval.target;
  const current = await gh.run([
    "view",
    String(target.pull_request),
    "--repo",
    target.repository,
    "--json",
    "headRefOid",
    "--jq",
    ".headRefOid",
  ]);
  if (current.exitCode !== 0) throw new Error(`pull-request read failed: ${current.output.trim()}`);
  if (current.output.trim() !== target.head_sha) throw new Error("pull-request head changed after approval");
  const merged = await gh.run([
    "merge",
    String(target.pull_request),
    "--repo",
    target.repository,
    "--merge",
    "--match-head-commit",
    target.head_sha,
  ]);
  if (merged.exitCode !== 0) throw new Error(`pull-request merge failed: ${merged.output.trim()}`);
}

const commandClient = (command: "git" | "gh"): GitClient & PullRequestClient => ({
  async run(arguments_) {
    const child = Bun.spawn([command, ...arguments_], { cwd: process.cwd(), stdout: "pipe", stderr: "pipe" });
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    return { exitCode, output: `${stdout}${stderr}` };
  },
});

function argument(name: string): string {
  const index = Bun.argv.indexOf(name);
  const value = index < 0 ? undefined : Bun.argv[index + 1];
  if (!value) throw new Error(`missing ${name}`);
  return value;
}

if (import.meta.main) {
  try {
    const issueId = argument("--issue");
    const repository = argument("--repository") as "BrandonJF/mandem";
    const pullRequest = Number(argument("--pull-request"));
    const headSha = argument("--head-sha");
    const request = approvalRequest(issueId, "merge-pr", {
      repository,
      pull_request: pullRequest,
      head_sha: headSha,
    });
    const git = commandClient("git");
    await mergeApprovedPullRequest(request, commandClient("gh"), async () => {
      await assertApproval(request, git);
    });
    console.log(`Pull request ${pullRequest} merged at ${headSha}.`);
  } catch (error: unknown) {
    console.error(`approved merge failed: ${error instanceof Error ? error.message : "unexpected error"}`);
    process.exitCode = 2;
  }
}
