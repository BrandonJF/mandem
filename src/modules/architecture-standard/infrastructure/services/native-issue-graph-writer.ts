/** @fileoverview Executes deterministic guarded native issue metadata writes with Git argument arrays. */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  classifyNativeRef,
  type NativeRefRecoveryState,
} from "../../application/use-cases/set-native-issue-graph-metadata";

const execute = promisify(execFile);

async function git(
  root: string,
  arguments_: readonly string[],
  options: { readonly environment?: Readonly<Record<string, string>> } = {},
): Promise<string> {
  const child = await execute("git", [...arguments_], {
    cwd: root,
    encoding: "utf8",
    env: options.environment === undefined ? process.env : { ...process.env, ...options.environment },
    maxBuffer: 10 * 1024 * 1024,
  });
  return child.stdout.trim();
}

export interface NativeIssueGraphWriteRequest {
  readonly issueId: string;
  readonly approvedBaseline: string;
  readonly payload: string;
  readonly approvalCommit: string;
  readonly approvalIssueId: string;
  readonly approvalTimestamp: string;
}

export interface NativeIssueGraphWriteResult {
  readonly action: "created" | "pushed" | "adopted" | "complete";
  readonly result: string;
}

/** Accepts only an approved baseline or its one deterministic metadata result. */
export class NativeIssueGraphWriter {
  constructor(private readonly root: string, private readonly remote = "origin") {}

  async remoteHead(issueId: string): Promise<string> {
    const reference = `refs/issues/${issueId}`;
    const line = await git(this.root, ["ls-remote", this.remote, reference]);
    const head = line.split(/\s+/u)[0];
    if (!head) throw new Error(`remote native issue ref is missing: ${issueId}`);
    return head;
  }

  private async resultCommit(request: NativeIssueGraphWriteRequest): Promise<string> {
    const parent = request.issueId === request.approvalIssueId
      ? request.approvalCommit
      : request.approvedBaseline;
    const tree = await git(this.root, ["show", "-s", "--format=%T", parent]);
    return git(
      this.root,
      ["commit-tree", tree, "-p", parent, "-m", request.payload],
      {
        environment: {
          GIT_AUTHOR_NAME: "Mandem Issue Graph",
          GIT_AUTHOR_EMAIL: "issue-graph@mandem.invalid",
          GIT_AUTHOR_DATE: request.approvalTimestamp,
          GIT_COMMITTER_NAME: "Mandem Issue Graph",
          GIT_COMMITTER_EMAIL: "issue-graph@mandem.invalid",
          GIT_COMMITTER_DATE: request.approvalTimestamp,
        },
      },
    );
  }

  async apply(request: NativeIssueGraphWriteRequest): Promise<NativeIssueGraphWriteResult> {
    const reference = `refs/issues/${request.issueId}`;
    const remoteReference = `refs/mandem/remote/${request.issueId}`;
    await git(this.root, ["fetch", this.remote, `+${reference}:${remoteReference}`]);
    const remote = await git(this.root, ["rev-parse", remoteReference]);
    const local = await git(this.root, ["rev-parse", reference]);
    const acceptedBaseline = request.issueId === request.approvalIssueId
      ? request.approvalCommit
      : request.approvedBaseline;
    const result = await this.resultCommit(request);
    const action = classifyNativeRef({
      baseline: acceptedBaseline,
      result,
      local,
      remote,
    } satisfies NativeRefRecoveryState);

    if (action === "complete") return { action: "complete", result };
    if (action === "adopt-result") {
      await git(this.root, ["update-ref", reference, result, acceptedBaseline]);
      return { action: "adopted", result };
    }
    if (action === "create-result") {
      await git(this.root, ["update-ref", reference, result, acceptedBaseline]);
    }
    await git(this.root, [
      "push",
      this.remote,
      `--force-with-lease=${reference}:${acceptedBaseline}`,
      `${reference}:${reference}`,
    ]);
    return { action: action === "create-result" ? "created" : "pushed", result };
  }
}
