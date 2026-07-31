/** @fileoverview Types for the local native-issue graph contract. */

export type NativeIssueState = "open" | "closed";
export type IssuePromotion = "scaffolded" | "planned" | "clean-room-approved" | "executable" | "complete";

export interface NativeGraphMetadata {
  readonly issueKey: string;
  readonly epicIssueId: string;
  readonly plan: string | null;
  readonly parentIssueId: string | null;
  readonly dependsOnIssueIds: readonly string[];
  readonly epicPolicy?: EpicPolicy;
}

export interface EpicPolicy {
  readonly provider: { readonly kind: "github"; readonly owner: string; readonly repository: string };
  readonly milestone: { readonly title: string; readonly description: string; readonly state: "open" | "closed"; readonly dueOn: string | null };
  readonly managedLabels: Readonly<Record<string, { readonly color: string; readonly description: string }>>;
}

export interface ProviderMapping {
  readonly provider: "github";
  readonly owner: string;
  readonly repository: string;
  readonly issueNumber: number;
}

export interface LocalIssueRecord {
  readonly issueId: string;
  readonly state: NativeIssueState;
  readonly labels: readonly string[];
  readonly metadata: NativeGraphMetadata | null;
  readonly providerMappings: readonly ProviderMapping[];
}

export interface PlanDeclaration {
  readonly epicIssueId: string;
  readonly issueId: string;
  readonly dependsOnIssueIds: readonly string[];
  readonly promotion: IssuePromotion;
  readonly executionAuthorized: boolean;
}

export interface IssueGraphFinding {
  readonly ruleId: string;
  readonly issueId: string;
  readonly path: string;
  readonly message: string;
}

export interface IssueGraphResult {
  readonly findings: readonly IssueGraphFinding[];
}
