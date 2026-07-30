/** @fileoverview Provider snapshot and deterministic issue graph operation types. */
import type { NativeIssueState } from "./issue-graph-types";

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
  | (OperationBase & { readonly kind: "move-subissue"; readonly issueId: string; readonly currentParentNumber: number; readonly desiredParentIssueId: string; readonly desiredParentNumber: number; readonly subissueDatabaseId: number });

export interface ReconciliationPlan {
  readonly repository: string;
  readonly operations: readonly IssueGraphOperation[];
}
