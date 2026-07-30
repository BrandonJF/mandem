/** @fileoverview Tests deterministic planning from native graph state to provider state. */
import { describe, expect, it } from "vitest";
import type { LocalIssueRecord } from "../domain/issue-graph-types";
import type { ProviderSnapshot } from "../domain/issue-graph-operations";
import { planIssueGraphReconciliation } from "../application/use-cases/plan-issue-graph-reconciliation";

const epicId = "abe862d6-b052-49fe-8611-bc1ab6e24253";
const issueId = "cb67d131-975c-4d97-9a6f-4934be991ac6";

function records(): readonly LocalIssueRecord[] {
  return [
    {
      issueId: epicId,
      state: "open",
      labels: ["in-progress"],
      providerMappings: [{ provider: "github", owner: "BrandonJF", repository: "mandem", issueNumber: 29 }],
      metadata: {
        issueKey: "EPIC",
        epicIssueId: epicId,
        plan: "docs/plans/epic.md",
        parentIssueId: null,
        dependsOnIssueIds: [],
        epicPolicy: {
          provider: { kind: "github", owner: "BrandonJF", repository: "mandem" },
          milestone: { title: "Mandem v1", description: "Release", state: "open", dueOn: null },
          managedLabels: {
            blocked: { color: "B60205", description: "Blocked" },
            "in-progress": { color: "EDEDED", description: "" },
          },
        },
      },
    },
    {
      issueId,
      state: "closed",
      labels: ["blocked", "feature"],
      providerMappings: [{ provider: "github", owner: "BrandonJF", repository: "mandem", issueNumber: 22 }],
      metadata: {
        issueKey: "U2",
        epicIssueId: epicId,
        plan: "docs/plans/u2.md",
        parentIssueId: epicId,
        dependsOnIssueIds: [],
      },
    },
  ];
}

function snapshot(): ProviderSnapshot {
  return {
    repository: "BrandonJF/mandem",
    labels: [{ name: "blocked", color: "ffffff", description: "old" }],
    milestones: [],
    issues: [
      { issueId: epicId, databaseId: 2900, number: 29, state: "closed", labels: [], milestoneNumber: null, parentNumber: null, subissueNumbers: [] },
      { issueId, databaseId: 2200, number: 22, state: "open", labels: ["feature"], milestoneNumber: null, parentNumber: null, subissueNumbers: [] },
    ],
  };
}

describe("planIssueGraphReconciliation", () => {
  it("returns the same stable complete operation plan for any input ordering", () => {
    const expected = planIssueGraphReconciliation({ records: records(), snapshot: snapshot() });
    const reordered = planIssueGraphReconciliation({
      records: [...records()].reverse(),
      snapshot: {
        ...snapshot(),
        issues: [...snapshot().issues].reverse(),
        labels: [...snapshot().labels].reverse(),
      },
    });
    expect(reordered).toEqual(expected);
    expect(expected.operations.map((operation) => operation.kind)).toEqual([
      "upsert-label",
      "upsert-label",
      "upsert-milestone",
      "set-issue-state",
      "set-issue-state",
      "add-issue-label",
      "add-issue-label",
      "set-issue-milestone",
      "set-issue-milestone",
      "add-subissue",
    ]);
    expect(expected.operations.map((operation) => operation.key)).toEqual(
      [...expected.operations.map((operation) => operation.key)].sort(),
    );
  });

  it("returns no operations when every managed field already matches", () => {
    const current = snapshot();
    const aligned: ProviderSnapshot = {
      repository: current.repository,
      labels: [
        { name: "blocked", color: "B60205", description: "Blocked" },
        { name: "in-progress", color: "EDEDED", description: "" },
      ],
      milestones: [{ number: 1, title: "Mandem v1", description: "Release", state: "open", dueOn: null }],
      issues: [
        { issueId: epicId, databaseId: 2900, number: 29, state: "open", labels: ["in-progress"], milestoneNumber: 1, parentNumber: null, subissueNumbers: [22] },
        { issueId, databaseId: 2200, number: 22, state: "closed", labels: ["blocked", "feature"], milestoneNumber: 1, parentNumber: 29, subissueNumbers: [] },
      ],
    };
    expect(planIssueGraphReconciliation({ records: records(), snapshot: aligned }).operations).toEqual([]);
  });

  it("fails before planning for unsafe or ambiguous provider state", () => {
    const missingMapping = records().map((record) => record.issueId === issueId ? { ...record, providerMappings: [] } : record);
    expect(() => planIssueGraphReconciliation({ records: missingMapping, snapshot: snapshot() }))
      .toThrow("IGRAPH-PROVIDER-MAPPING");

    const duplicateMilestone = { ...snapshot(), milestones: [
      { number: 1, title: "Mandem v1", description: "", state: "open" as const, dueOn: null },
      { number: 2, title: "Mandem v1", description: "", state: "open" as const, dueOn: null },
    ] };
    expect(() => planIssueGraphReconciliation({ records: records(), snapshot: duplicateMilestone }))
      .toThrow("IGRAPH-PROVIDER-MILESTONE");

    const unmanagedParent = { ...snapshot(), issues: snapshot().issues.map((issue) =>
      issue.issueId === issueId ? { ...issue, parentNumber: 999 } : issue) };
    expect(() => planIssueGraphReconciliation({ records: records(), snapshot: unmanagedParent }))
      .toThrow("IGRAPH-PROVIDER-UNMANAGED-PARENT");

    const unmanagedSubissue = { ...snapshot(), issues: snapshot().issues.map((issue) =>
      issue.issueId === epicId ? { ...issue, subissueNumbers: [999] } : issue) };
    expect(() => planIssueGraphReconciliation({ records: records(), snapshot: unmanagedSubissue }))
      .toThrow("IGRAPH-PROVIDER-UNMANAGED-SUBISSUE");
  });
});
