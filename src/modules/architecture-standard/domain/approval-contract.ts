/** @fileoverview Defines Mandem's canonical, fail-closed operator approval record. */

export type ApprovalAction = "execute-plan" | "apply-ruleset" | "merge-pr";
export type ApprovalDecision = "approved" | "denied";

export interface ExecutePlanTarget {
  readonly plan_commit: string;
  readonly plan_sha256: string;
}

export interface ApplyRulesetTarget {
  readonly plan_sha256: string;
  readonly ruleset_sha256: string;
  readonly implementation_sha: string;
}

export interface MergePullRequestTarget {
  readonly repository: "BrandonJF/mandem";
  readonly pull_request: number;
  readonly head_sha: string;
}

export type ApprovalTarget = ExecutePlanTarget | ApplyRulesetTarget | MergePullRequestTarget;

export interface ApprovalRecord {
  readonly decision: ApprovalDecision;
  readonly action: ApprovalAction;
  readonly issueId: string;
  readonly target: ApprovalTarget;
  readonly actor: "operator";
  readonly response: "APPROVED" | "DENIED";
  readonly evidence: {
    readonly channel: "mandem-conversation";
    readonly conversation_id: string | null;
    readonly message_id: string | null;
    readonly recorded_at: string;
  };
}

export interface ApprovalCommit {
  readonly commit: string;
  readonly message: string;
}

export class ApprovalContractError extends Error {}

const shaPattern = /^[0-9a-f]{40}$/u;
const digestPattern = /^[0-9a-f]{64}$/u;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/u;

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value).sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(",")}}`;
  }
  const rendered = JSON.stringify(value);
  if (rendered === undefined) throw new ApprovalContractError("approval values must be JSON serializable");
  return rendered;
}

function quote(value: string): string {
  return JSON.stringify(value);
}

function nullable(value: string | null): string {
  return value === null ? "null" : quote(value);
}

function targetLines(action: ApprovalAction, target: ApprovalTarget): readonly string[] {
  if (action === "execute-plan" && "plan_commit" in target && "plan_sha256" in target) {
    return [`  plan_commit: ${quote(target.plan_commit)}`, `  plan_sha256: ${quote(target.plan_sha256)}`];
  }
  if (action === "apply-ruleset" && "ruleset_sha256" in target && "implementation_sha" in target) {
    return [
      `  plan_sha256: ${quote(target.plan_sha256)}`,
      `  ruleset_sha256: ${quote(target.ruleset_sha256)}`,
      `  implementation_sha: ${quote(target.implementation_sha)}`,
    ];
  }
  if (action === "merge-pr" && "repository" in target && "pull_request" in target && "head_sha" in target) {
    return [
      `  repository: ${quote(target.repository)}`,
      `  pull_request: ${target.pull_request}`,
      `  head_sha: ${quote(target.head_sha)}`,
    ];
  }
  throw new ApprovalContractError(`target does not match action ${action}`);
}

function validate(record: ApprovalRecord): void {
  if (!uuidPattern.test(record.issueId)) throw new ApprovalContractError("issue_id must be a UUID");
  if ((record.decision === "approved") !== (record.response === "APPROVED")) {
    throw new ApprovalContractError("decision and response disagree");
  }
  if (!timestampPattern.test(record.evidence.recorded_at) || Number.isNaN(Date.parse(record.evidence.recorded_at))) {
    throw new ApprovalContractError("recorded_at must be an RFC 3339 UTC timestamp");
  }
  const target = record.target;
  if (record.action === "execute-plan") {
    if (!("plan_commit" in target) || !shaPattern.test(target.plan_commit) || !digestPattern.test(target.plan_sha256)) {
      throw new ApprovalContractError("execute-plan target is invalid");
    }
  } else if (record.action === "apply-ruleset") {
    if (
      !("implementation_sha" in target) ||
      !digestPattern.test(target.plan_sha256) ||
      !digestPattern.test(target.ruleset_sha256) ||
      !shaPattern.test(target.implementation_sha)
    ) {
      throw new ApprovalContractError("apply-ruleset target is invalid");
    }
  } else if (
    !("repository" in target) ||
    target.repository !== "BrandonJF/mandem" ||
    !Number.isSafeInteger(target.pull_request) ||
    target.pull_request < 1 ||
    !shaPattern.test(target.head_sha)
  ) {
    throw new ApprovalContractError("merge-pr target is invalid");
  }
  targetLines(record.action, record.target);
}

export function serializeApproval(record: ApprovalRecord): string {
  validate(record);
  return [
    "Mandem-Approval: v1",
    `decision: ${quote(record.decision)}`,
    `action: ${quote(record.action)}`,
    `issue_id: ${quote(record.issueId)}`,
    "target:",
    ...targetLines(record.action, record.target),
    'actor: "operator"',
    `response: ${quote(record.response)}`,
    "evidence:",
    '  channel: "mandem-conversation"',
    `  conversation_id: ${nullable(record.evidence.conversation_id)}`,
    `  message_id: ${nullable(record.evidence.message_id)}`,
    `  recorded_at: ${quote(record.evidence.recorded_at)}`,
    "",
  ].join("\n");
}

function stringValue(line: string, prefix: string): string {
  if (!line.startsWith(prefix)) throw new ApprovalContractError(`expected ${prefix.trim()}`);
  try {
    const value: unknown = JSON.parse(line.slice(prefix.length));
    if (typeof value !== "string") throw new Error();
    return value;
  } catch {
    throw new ApprovalContractError(`expected a quoted string after ${prefix.trim()}`);
  }
}

function nullableValue(line: string, prefix: string): string | null {
  if (!line.startsWith(prefix)) throw new ApprovalContractError(`expected ${prefix.trim()}`);
  const raw = line.slice(prefix.length);
  if (raw === "null") return null;
  return stringValue(line, prefix);
}

export function parseApproval(source: string): ApprovalRecord {
  if (source.includes("\r") || !source.endsWith("\n")) throw new ApprovalContractError("approval must use LF endings and one final newline");
  const lines = source.slice(0, -1).split("\n");
  if (lines[0] !== "Mandem-Approval: v1") throw new ApprovalContractError("approval marker is missing");
  const decision = stringValue(lines[1] ?? "", "decision: ");
  const action = stringValue(lines[2] ?? "", "action: ");
  const issueId = stringValue(lines[3] ?? "", "issue_id: ");
  if ((decision !== "approved" && decision !== "denied") || (action !== "execute-plan" && action !== "apply-ruleset" && action !== "merge-pr")) {
    throw new ApprovalContractError("approval decision or action is invalid");
  }
  if (lines[4] !== "target:") throw new ApprovalContractError("target is missing");
  let cursor = 5;
  let target: ApprovalTarget;
  if (action === "execute-plan") {
    target = {
      plan_commit: stringValue(lines[cursor++] ?? "", "  plan_commit: "),
      plan_sha256: stringValue(lines[cursor++] ?? "", "  plan_sha256: "),
    };
  } else if (action === "apply-ruleset") {
    target = {
      plan_sha256: stringValue(lines[cursor++] ?? "", "  plan_sha256: "),
      ruleset_sha256: stringValue(lines[cursor++] ?? "", "  ruleset_sha256: "),
      implementation_sha: stringValue(lines[cursor++] ?? "", "  implementation_sha: "),
    };
  } else {
    const repository = stringValue(lines[cursor++] ?? "", "  repository: ");
    const pullRequestLine = lines[cursor++] ?? "";
    if (!pullRequestLine.startsWith("  pull_request: ")) throw new ApprovalContractError("pull_request is missing");
    const pullRequest = Number(pullRequestLine.slice("  pull_request: ".length));
    target = {
      repository: repository as "BrandonJF/mandem",
      pull_request: pullRequest,
      head_sha: stringValue(lines[cursor++] ?? "", "  head_sha: "),
    };
  }
  if (lines[cursor++] !== 'actor: "operator"') throw new ApprovalContractError("actor must be operator");
  const response = stringValue(lines[cursor++] ?? "", "response: ");
  if (lines[cursor++] !== "evidence:" || lines[cursor++] !== '  channel: "mandem-conversation"') {
    throw new ApprovalContractError("evidence channel is invalid");
  }
  const record: ApprovalRecord = {
    decision,
    action,
    issueId,
    target,
    actor: "operator",
    response: response as "APPROVED" | "DENIED",
    evidence: {
      channel: "mandem-conversation",
      conversation_id: nullableValue(lines[cursor++] ?? "", "  conversation_id: "),
      message_id: nullableValue(lines[cursor++] ?? "", "  message_id: "),
      recorded_at: stringValue(lines[cursor++] ?? "", "  recorded_at: "),
    },
  };
  if (cursor !== lines.length) throw new ApprovalContractError("approval contains unknown keys or extra lines");
  validate(record);
  if (serializeApproval(record) !== source) throw new ApprovalContractError("approval is not canonical");
  return record;
}

function sameRequest(record: ApprovalRecord, request: ApprovalRecord): boolean {
  return record.issueId === request.issueId && record.action === request.action && canonicalJson(record.target) === canonicalJson(request.target);
}

export async function selectApproval(
  commits: readonly ApprovalCommit[],
  request: ApprovalRecord,
  isAncestor: (ancestor: string, descendant: string) => Promise<boolean>,
): Promise<{ readonly commit: string; readonly record: ApprovalRecord; readonly authorized: boolean } | undefined> {
  const matching: { readonly commit: string; readonly record: ApprovalRecord }[] = [];
  for (const commit of commits) {
    if (!commit.message.startsWith("Mandem-Approval: v1\n")) continue;
    let record: ApprovalRecord;
    try {
      record = parseApproval(commit.message);
    } catch (error: unknown) {
      throw new ApprovalContractError(`malformed approval commit ${commit.commit}: ${error instanceof Error ? error.message : "invalid content"}`);
    }
    if (sameRequest(record, request)) matching.push({ commit: commit.commit, record });
  }
  if (matching.length === 0) return undefined;
  const maximal: typeof matching = [];
  for (const candidate of matching) {
    const descendsFromAll = await Promise.all(matching.map((other) => isAncestor(other.commit, candidate.commit)));
    if (descendsFromAll.every(Boolean)) maximal.push(candidate);
  }
  if (maximal.length !== 1) throw new ApprovalContractError("matching approvals have incomparable maximal commits");
  const selected = maximal[0];
  if (!selected) throw new ApprovalContractError("approval selection failed");
  return { ...selected, authorized: selected.record.decision === "approved" && selected.record.response === "APPROVED" };
}
