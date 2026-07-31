/** @fileoverview Tests exact-suffix projection execution and lost-response recovery. */
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { IssueGraphProvider } from "../application/ports/issue-graph-provider";
import { reconcileIssueGraph } from "../application/use-cases/reconcile-issue-graph";
import { canonicalJson } from "../domain/approval-contract";
import { managedProviderSnapshot, type IssueGraphOperation, type ProviderSnapshot } from "../domain/issue-graph-operations";
import type { ProjectionTransaction } from "../domain/projection-transaction";
import type { LocalIssueRecord } from "../domain/issue-graph-types";

const epicId = "abe862d6-b052-49fe-8611-bc1ab6e24253";
const record: LocalIssueRecord = {
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
      managedLabels: { "in-progress": { color: "EDEDED", description: "" } },
    },
  },
};

function snapshot(state: "open" | "closed"): ProviderSnapshot {
  return {
    repository: "BrandonJF/mandem",
    labels: [
      { name: "in-progress", color: "EDEDED", description: "" },
      { name: "unmanaged", color: "000000", description: "outside Mandem's policy" },
    ],
    milestones: [{ number: 1, title: "Mandem v1", description: "Release", state: "open", dueOn: null }],
    issues: [{ issueId: "BrandonJF/mandem#29", databaseId: 2900, number: 29, state, labels: ["in-progress", "unmanaged"], milestoneNumber: 1, parentNumber: null, subissueNumbers: [] }],
  };
}

function digest(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function transaction(operation: IssueGraphOperation): ProjectionTransaction {
  const initial = managedProviderSnapshot([record], snapshot("closed"));
  return {
    repository: "BrandonJF/mandem",
    graphSha256: "1".repeat(64),
    providerSnapshot: initial,
    providerSnapshotSha256: digest(initial),
    operations: [operation],
    operationsSha256: digest([operation]),
    implementationSha: "2".repeat(40),
  };
}

class FakeProvider implements IssueGraphProvider {
  state: "open" | "closed" = "closed";
  writes = 0;
  loseResponse = false;
  async readSnapshot(): Promise<ProviderSnapshot> { return snapshot(this.state); }
  async apply(): Promise<void> {
    this.writes += 1;
    this.state = "open";
    if (this.loseResponse) throw new Error("response lost");
  }
}

describe("reconcileIssueGraph", () => {
  const operation: IssueGraphOperation = { kind: "set-issue-state", key: `03:${epicId}:state`, issueId: epicId, issueNumber: 29, state: "open" };

  it("applies once and then proves a zero-write retry", async () => {
    const provider = new FakeProvider();
    let approvalChecks = 0;
    const beforeWrite = async () => { approvalChecks += 1; };
    expect(await reconcileIssueGraph({ records: [record], transaction: transaction(operation), provider, beforeWrite })).toEqual({ writes: 1, completedOperations: 1 });
    expect(await reconcileIssueGraph({ records: [record], transaction: transaction(operation), provider })).toEqual({ writes: 0, completedOperations: 1 });
    expect(provider.writes).toBe(1);
    expect(approvalChecks).toBe(1);
  });

  it("accepts a lost response only after the provider proves the write", async () => {
    const provider = new FakeProvider();
    provider.loseResponse = true;
    expect(await reconcileIssueGraph({ records: [record], transaction: transaction(operation), provider })).toEqual({ writes: 1, completedOperations: 1 });
    expect(provider.writes).toBe(1);
  });

  it("rejects provider drift that is not an exact remaining suffix", async () => {
    const provider = new FakeProvider();
    const changed = { ...operation, state: "closed" as const };
    await expect(reconcileIssueGraph({ records: [record], transaction: transaction(changed), provider }))
      .rejects.toThrow("IGRAPH-PROVIDER-DRIFT");
    expect(provider.writes).toBe(0);
  });
});
