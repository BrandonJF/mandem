/** @fileoverview GitHub issue graph adapter implemented with typed gh api requests. */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { IssueGraphProvider } from "../../application/ports/issue-graph-provider";
import type {
  IssueGraphOperation,
  ProviderIssue,
  ProviderLabel,
  ProviderMilestone,
  ProviderSnapshot,
} from "../../domain/issue-graph-operations";
import type { ProviderMapping } from "../../domain/issue-graph-types";

const execute = promisify(execFile);
const apiVersion = "2022-11-28";

export interface GhApiRequest {
  readonly endpoint: string;
  readonly method: "GET" | "POST" | "PATCH" | "DELETE";
  readonly fields?: Readonly<Record<string, string | number | null>>;
  readonly paginate?: boolean;
  readonly absentIsNull?: boolean;
}

export type GhApiRunner = (request: GhApiRequest) => Promise<unknown>;

function pages(value: unknown): readonly unknown[] {
  if (!Array.isArray(value)) throw new Error("GitHub list response must be an array");
  return value.flatMap((page) => Array.isArray(page) ? page : [page]);
}

function object(value: unknown, context: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`GitHub ${context} response must be an object`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, name: string): string {
  if (typeof value !== "string") throw new Error(`GitHub response has invalid ${name}`);
  return value;
}

function integer(value: unknown, name: string): number {
  if (!Number.isSafeInteger(value)) throw new Error(`GitHub response has invalid ${name}`);
  return value as number;
}

function nullableText(value: unknown, name: string): string | null {
  if (value === null) return null;
  return text(value, name);
}

function issueState(value: unknown): "open" | "closed" {
  if (value !== "open" && value !== "closed") throw new Error("GitHub response has invalid issue state");
  return value;
}

async function defaultRunner(request: GhApiRequest): Promise<unknown> {
  const arguments_ = [
    "api",
    "-X",
    request.method,
    "-H",
    `X-GitHub-Api-Version: ${apiVersion}`,
  ];
  if (request.paginate) arguments_.push("--paginate", "--jq", ".[]");
  for (const [name, value] of Object.entries(request.fields ?? {})) {
    arguments_.push("-F", `${name}=${value === null ? "null" : String(value)}`);
  }
  arguments_.push(request.endpoint);
  try {
    const result = await execute("gh", arguments_, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
    const source = result.stdout.trim();
    if (request.paginate) {
      return source === "" ? [] : source.split("\n").map((line) => JSON.parse(line) as unknown);
    }
    return source === "" ? null : JSON.parse(source) as unknown;
  } catch (error: unknown) {
    const failure = error as { stderr?: string; code?: number };
    if (request.absentIsNull && failure.code === 1 && /\b404\b|not found/iu.test(failure.stderr ?? "")) return null;
    throw new Error(`GitHub API request failed: ${(failure.stderr ?? "").trim() || request.endpoint}`);
  }
}

export class GitHubIssueGraphProvider implements IssueGraphProvider {
  private repository: string;
  private readonly labelNames = new Set<string>();
  private readonly milestoneNumbers = new Map<string, number>();

  constructor(private readonly runner: GhApiRunner = defaultRunner, repository = "") {
    this.repository = repository;
  }

  async readSnapshot(repository: string, mappings: readonly ProviderMapping[]): Promise<ProviderSnapshot> {
    this.repository = repository;
    const base = `repos/${repository}`;
    const [labelSource, milestoneSource] = await Promise.all([
      this.runner({ endpoint: `${base}/labels`, method: "GET", paginate: true }),
      this.runner({ endpoint: `${base}/milestones?state=all`, method: "GET", paginate: true }),
    ]);
    const labels: ProviderLabel[] = pages(labelSource).map((value) => {
      const item = object(value, "label");
      return {
        name: text(item.name, "label name"),
        color: text(item.color, "label color"),
        description: nullableText(item.description, "label description") ?? "",
      };
    });
    const milestones: ProviderMilestone[] = pages(milestoneSource).map((value) => {
      const item = object(value, "milestone");
      return {
        number: integer(item.number, "milestone number"),
        title: text(item.title, "milestone title"),
        description: nullableText(item.description, "milestone description") ?? "",
        state: issueState(item.state),
        dueOn: nullableText(item.due_on, "milestone due date"),
      };
    });
    this.labelNames.clear();
    for (const label of labels) this.labelNames.add(label.name);
    this.milestoneNumbers.clear();
    for (const milestone of milestones) this.milestoneNumbers.set(milestone.title, milestone.number);
    const issues: ProviderIssue[] = [];
    for (const mapping of [...mappings].sort((left, right) => left.issueNumber - right.issueNumber)) {
      const prefix = `${base}/issues/${mapping.issueNumber}`;
      const [issueSource, parentSource, subissueSource] = await Promise.all([
        this.runner({ endpoint: prefix, method: "GET" }),
        this.runner({ endpoint: `${prefix}/parent`, method: "GET", absentIsNull: true }),
        this.runner({ endpoint: `${prefix}/sub_issues`, method: "GET", paginate: true }),
      ]);
      const item = object(issueSource, "issue");
      const milestone = item.milestone === null ? null : object(item.milestone, "issue milestone");
      const parent = parentSource === null ? null : object(parentSource, "issue parent");
      issues.push({
        issueId: `${mapping.owner}/${mapping.repository}#${mapping.issueNumber}`,
        databaseId: integer(item.id, "issue database id"),
        number: integer(item.number, "issue number"),
        state: issueState(item.state),
        labels: pages(item.labels).map((label) => text(object(label, "issue label").name, "issue label name")).sort(),
        milestoneNumber: milestone === null ? null : integer(milestone.number, "issue milestone number"),
        parentNumber: parent === null ? null : integer(parent.number, "parent issue number"),
        subissueNumbers: pages(subissueSource).map((subissue) => integer(object(subissue, "subissue").number, "subissue number")).sort((left, right) => left - right),
      });
    }
    return {
      repository,
      labels: labels.sort((left, right) => left.name.localeCompare(right.name)),
      milestones: milestones.sort((left, right) => left.number - right.number),
      issues: issues.sort((left, right) => left.number - right.number),
    };
  }

  async apply(operation: IssueGraphOperation): Promise<void> {
    const base = `repos/${this.repository}`;
    if (this.repository === "") throw new Error("GitHub provider snapshot must be read before apply");
    if (operation.kind === "upsert-label") {
      const exists = this.labelNames.has(operation.name);
      await this.runner({
        endpoint: exists ? `${base}/labels/${encodeURIComponent(operation.name)}` : `${base}/labels`,
        method: exists ? "PATCH" : "POST",
        fields: { name: operation.name, color: operation.color, description: operation.description },
      });
      this.labelNames.add(operation.name);
    } else if (operation.kind === "upsert-milestone") {
      const number = this.milestoneNumbers.get(operation.title);
      const response = await this.runner({
        endpoint: number === undefined ? `${base}/milestones` : `${base}/milestones/${number}`,
        method: number === undefined ? "POST" : "PATCH",
        fields: {
          title: operation.title,
          description: operation.description,
          state: operation.state,
          due_on: operation.dueOn,
        },
      });
      if (number === undefined) {
        this.milestoneNumbers.set(
          operation.title,
          integer(object(response, "created milestone").number, "created milestone number"),
        );
      }
    } else if (operation.kind === "set-issue-state") {
      await this.runner({ endpoint: `${base}/issues/${operation.issueNumber}`, method: "PATCH", fields: { state: operation.state } });
    } else if (operation.kind === "add-issue-label") {
      await this.runner({ endpoint: `${base}/issues/${operation.issueNumber}/labels`, method: "POST", fields: { "labels[]": operation.label } });
    } else if (operation.kind === "remove-issue-label") {
      await this.runner({ endpoint: `${base}/issues/${operation.issueNumber}/labels/${encodeURIComponent(operation.label)}`, method: "DELETE" });
    } else if (operation.kind === "set-issue-milestone") {
      const number = this.milestoneNumbers.get(operation.milestoneTitle);
      if (number === undefined) throw new Error(`GitHub milestone is unavailable: ${operation.milestoneTitle}`);
      await this.runner({ endpoint: `${base}/issues/${operation.issueNumber}`, method: "PATCH", fields: { milestone: number } });
    } else if (operation.kind === "add-subissue") {
      await this.runner({ endpoint: `${base}/issues/${operation.parentNumber}/sub_issues`, method: "POST", fields: { sub_issue_id: operation.subissueDatabaseId } });
    } else if (operation.kind === "move-subissue") {
      await this.runner({ endpoint: `${base}/issues/${operation.currentParentNumber}/sub_issue`, method: "DELETE", fields: { sub_issue_id: operation.subissueDatabaseId } });
      await this.runner({ endpoint: `${base}/issues/${operation.desiredParentNumber}/sub_issues`, method: "POST", fields: { sub_issue_id: operation.subissueDatabaseId } });
    } else {
      throw new Error(`GitHub operation is not implemented: ${operation.kind}`);
    }
  }
}
