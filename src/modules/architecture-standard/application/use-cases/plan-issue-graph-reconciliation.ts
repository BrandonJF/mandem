/** @fileoverview Produces a stable provider operation plan from native issue records. */
import type {
  IssueGraphOperation,
  ProviderIssue,
  ProviderSnapshot,
  ReconciliationPlan,
} from "../../domain/issue-graph-operations";
import type { LocalIssueRecord, ProviderMapping } from "../../domain/issue-graph-types";

export interface PlanReconciliationInput {
  readonly records: readonly LocalIssueRecord[];
  readonly snapshot: ProviderSnapshot;
}

function fail(rule: string, message: string): never {
  throw new Error(`${rule}: ${message}`);
}

function mapping(record: LocalIssueRecord, repository: string): ProviderMapping {
  const matches = record.providerMappings.filter((candidate) =>
    candidate.provider === "github" &&
    `${candidate.owner}/${candidate.repository}` === repository
  );
  if (matches.length !== 1 || record.providerMappings.length !== 1) {
    return fail("IGRAPH-PROVIDER-MAPPING", `issue ${record.issueId} must have one mapping to ${repository}`);
  }
  return matches[0] as ProviderMapping;
}

function operationKey(order: number, ...parts: readonly (string | number)[]): string {
  return [String(order).padStart(2, "0"), ...parts.map(String)].join(":");
}

export function planIssueGraphReconciliation(input: PlanReconciliationInput): ReconciliationPlan {
  const epic = input.records.find((record) => record.metadata?.epicPolicy !== undefined);
  const policy = epic?.metadata?.epicPolicy;
  if (!epic || !policy) return fail("IGRAPH-EPIC", "provider planning requires one epic policy");
  if (policy.provider.kind !== "github") return fail("IGRAPH-PROVIDER", "only GitHub is supported");
  const repository = `${policy.provider.owner}/${policy.provider.repository}`;
  if (input.snapshot.repository !== repository) {
    return fail("IGRAPH-PROVIDER", `snapshot repository must be ${repository}`);
  }

  const records = [...input.records].sort((left, right) => left.issueId.localeCompare(right.issueId));
  const mappingByIssue = new Map(records.map((record) => [record.issueId, mapping(record, repository)]));
  const managedNumbers = new Set([...mappingByIssue.values()].map((value) => value.issueNumber));
  if (managedNumbers.size !== records.length) return fail("IGRAPH-PROVIDER-MAPPING", "provider issue mappings must be unique");
  const snapshotByNumber = new Map(input.snapshot.issues.map((issue) => [issue.number, issue]));
  const providerIssue = (issueId: string): ProviderIssue => {
    const expectedNumber = mappingByIssue.get(issueId)?.issueNumber;
    const issue = expectedNumber === undefined ? undefined : snapshotByNumber.get(expectedNumber);
    if (!issue) {
      return fail("IGRAPH-PROVIDER-MAPPING", `provider snapshot is missing issue ${issueId}`);
    }
    return issue;
  };

  for (const issue of input.snapshot.issues) {
    if (!managedNumbers.has(issue.number)) continue;
    if (issue.parentNumber !== null && !managedNumbers.has(issue.parentNumber)) {
      fail("IGRAPH-PROVIDER-UNMANAGED-PARENT", `issue ${issue.issueId} has parent ${issue.parentNumber}`);
    }
    const unmanaged = issue.subissueNumbers.find((number) => !managedNumbers.has(number));
    if (unmanaged !== undefined) {
      fail("IGRAPH-PROVIDER-UNMANAGED-SUBISSUE", `issue ${issue.issueId} has subissue ${unmanaged}`);
    }
  }

  const matchingMilestones = input.snapshot.milestones.filter(
    (milestone) => milestone.title === policy.milestone.title,
  );
  if (matchingMilestones.length > 1) {
    fail("IGRAPH-PROVIDER-MILESTONE", `milestone ${policy.milestone.title} is ambiguous`);
  }
  const milestone = matchingMilestones[0];
  const operations: IssueGraphOperation[] = [];

  const providerLabels = new Map(input.snapshot.labels.map((label) => [label.name, label]));
  for (const name of Object.keys(policy.managedLabels).sort()) {
    const desired = policy.managedLabels[name];
    if (!desired) continue;
    const current = providerLabels.get(name);
    if (
      !current ||
      current.color.toLowerCase() !== desired.color.toLowerCase() ||
      current.description !== desired.description
    ) {
      operations.push({
        kind: "upsert-label",
        key: operationKey(1, "label", name),
        name,
        color: desired.color,
        description: desired.description,
      });
    }
  }
  if (
    !milestone ||
    milestone.description !== policy.milestone.description ||
    milestone.state !== policy.milestone.state ||
    milestone.dueOn !== policy.milestone.dueOn
  ) {
    operations.push({
      kind: "upsert-milestone",
      key: operationKey(2, "milestone", policy.milestone.title),
      title: policy.milestone.title,
      description: policy.milestone.description,
      state: policy.milestone.state,
      dueOn: policy.milestone.dueOn,
    });
  }

  const managedLabelNames = new Set(Object.keys(policy.managedLabels));
  for (const record of records) {
    const issue = providerIssue(record.issueId);
    if (issue.state !== record.state) {
      operations.push({
        kind: "set-issue-state",
        key: operationKey(3, record.issueId, "state"),
        issueId: record.issueId,
        issueNumber: issue.number,
        state: record.state,
      });
    }
    const desiredLabels = new Set(record.labels.filter((label) => managedLabelNames.has(label)));
    const currentLabels = new Set(issue.labels.filter((label) => managedLabelNames.has(label)));
    for (const label of [...desiredLabels].sort()) {
      if (!currentLabels.has(label)) operations.push({
        kind: "add-issue-label",
        key: operationKey(4, record.issueId, "label", label, "add"),
        issueId: record.issueId,
        issueNumber: issue.number,
        label,
      });
    }
    for (const label of [...currentLabels].sort()) {
      if (!desiredLabels.has(label)) operations.push({
        kind: "remove-issue-label",
        key: operationKey(4, record.issueId, "label", label, "remove"),
        issueId: record.issueId,
        issueNumber: issue.number,
        label,
      });
    }
    if (!milestone || issue.milestoneNumber !== milestone.number) {
      operations.push({
        kind: "set-issue-milestone",
        key: operationKey(5, record.issueId, "milestone"),
        issueId: record.issueId,
        issueNumber: issue.number,
        milestoneTitle: policy.milestone.title,
      });
    }
  }

  for (const record of records) {
    const desiredParentId = record.metadata?.parentIssueId;
    if (desiredParentId === null || desiredParentId === undefined) continue;
    const issue = providerIssue(record.issueId);
    const desiredParent = providerIssue(desiredParentId);
    if (issue.parentNumber === desiredParent.number) continue;
    if (issue.parentNumber === null) {
      operations.push({
        kind: "add-subissue",
        key: operationKey(6, record.issueId, "parent"),
        issueId: record.issueId,
        parentIssueId: desiredParentId,
        parentNumber: desiredParent.number,
        subissueDatabaseId: issue.databaseId,
      });
    } else {
      operations.push({
        kind: "move-subissue",
        key: operationKey(6, record.issueId, "parent"),
        issueId: record.issueId,
        currentParentNumber: issue.parentNumber,
        desiredParentIssueId: desiredParentId,
        desiredParentNumber: desiredParent.number,
        subissueDatabaseId: issue.databaseId,
      });
    }
  }

  return { repository, operations: operations.sort((left, right) => left.key.localeCompare(right.key)) };
}
