/** @fileoverview Provider snapshot and deterministic issue graph operation types. */
import type { NativeIssueState } from "./issue-graph-types";
import { createHash } from "node:crypto";
import { canonicalJson } from "./approval-contract";

export interface ProviderLabel {
  readonly name: string;
  readonly color: string;
  readonly description: string;
}

export interface ProviderMilestone {
  readonly number: number;
  readonly title: string;
  readonly description: string;
  readonly state: NativeIssueState;
  readonly dueOn: string | null;
}

export interface ProviderIssue {
  readonly issueId: string;
  readonly databaseId: number;
  readonly number: number;
  readonly state: NativeIssueState;
  readonly labels: readonly string[];
  readonly milestoneNumber: number | null;
  readonly parentNumber: number | null;
  readonly subissueNumbers: readonly number[];
}

export interface ProviderSnapshot {
  readonly repository: string;
  readonly labels: readonly ProviderLabel[];
  readonly milestones: readonly ProviderMilestone[];
  readonly issues: readonly ProviderIssue[];
}

type OperationBase = { readonly key: string };

export type IssueGraphOperation =
  | (OperationBase & { readonly kind: "upsert-label"; readonly name: string; readonly color: string; readonly description: string })
  | (OperationBase & { readonly kind: "upsert-milestone"; readonly title: string; readonly description: string; readonly state: NativeIssueState; readonly dueOn: string | null })
  | (OperationBase & { readonly kind: "set-issue-state"; readonly issueId: string; readonly issueNumber: number; readonly state: NativeIssueState })
  | (OperationBase & { readonly kind: "add-issue-label" | "remove-issue-label"; readonly issueId: string; readonly issueNumber: number; readonly label: string })
  | (OperationBase & { readonly kind: "set-issue-milestone"; readonly issueId: string; readonly issueNumber: number; readonly milestoneTitle: string })
  | (OperationBase & { readonly kind: "add-subissue"; readonly issueId: string; readonly parentIssueId: string; readonly parentNumber: number; readonly subissueDatabaseId: number })
  | (OperationBase & { readonly kind: "remove-subissue"; readonly issueId: string; readonly parentNumber: number; readonly subissueDatabaseId: number });

export interface ReconciliationPlan {
  readonly repository: string;
  readonly operations: readonly IssueGraphOperation[];
}

export function managedProviderSnapshot(
  records: readonly import("./issue-graph-types").LocalIssueRecord[],
  snapshot: ProviderSnapshot,
): ProviderSnapshot {
  const epic = records.find((record) => record.metadata?.epicPolicy !== undefined);
  const policy = epic?.metadata?.epicPolicy;
  if (!policy) throw new Error("IGRAPH-EPIC: managed provider snapshot requires epic policy");
  const labels = new Set(Object.keys(policy.managedLabels));
  return {
    repository: snapshot.repository,
    labels: snapshot.labels.filter((label) => labels.has(label.name)),
    milestones: snapshot.milestones.filter((milestone) => milestone.title === policy.milestone.title),
    issues: snapshot.issues.map((issue) => ({
      ...issue,
      labels: issue.labels.filter((label) => labels.has(label)),
    })),
  };
}

export function providerSnapshotDigest(snapshot: ProviderSnapshot): string {
  return createHash("sha256").update(canonicalJson(snapshot)).digest("hex");
}
