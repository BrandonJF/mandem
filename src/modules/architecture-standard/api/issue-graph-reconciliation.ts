/** @fileoverview Composes native graph validation with provider comparison. */
import { createHash } from "node:crypto";
import { canonicalJson } from "../domain/approval-contract";
import type { IssueGraphProvider } from "../application/ports/issue-graph-provider";
import { planIssueGraphReconciliation } from "../application/use-cases/plan-issue-graph-reconciliation";
import type { IssueGraphOperation, ReconciliationPlan } from "../domain/issue-graph-operations";
import type { ProviderSnapshot } from "../domain/issue-graph-operations";
import type { LocalIssueRecord } from "../domain/issue-graph-types";
import { graphDigestFromRecords } from "../domain/issue-graph-manifest";
import { GitNativeIssueGraphRepository } from "../infrastructure/repositories/git-native-issue-graph-repository";
import { GitHubIssueGraphProvider } from "../infrastructure/services/github-issue-graph-provider";
import { ProjectionTransactionWriter } from "../infrastructure/services/projection-transaction-writer";
import { ProjectionApprovalReader } from "../infrastructure/services/projection-approval";
import { reconcileIssueGraph } from "../application/use-cases/reconcile-issue-graph";
import type { SyncIssueProjectionTarget } from "../domain/approval-contract";
import type { ProjectionTransaction } from "../domain/projection-transaction";
import { runLocalIssueGraphCheck } from "./issue-graph";

function digestOperations(operations: readonly IssueGraphOperation[]): string {
  return createHash("sha256").update(canonicalJson(operations)).digest("hex");
}

export interface RemoteIssueGraphPlan extends ReconciliationPlan {
  readonly graphSha256: string;
  readonly providerSnapshotSha256: string;
  readonly operationsSha256: string;
  readonly snapshot: ProviderSnapshot;
  readonly records: readonly LocalIssueRecord[];
}

export async function runIssueGraphRemoteCheck(
  root: string,
  provider: IssueGraphProvider = new GitHubIssueGraphProvider(),
): Promise<RemoteIssueGraphPlan> {
  const local = await runLocalIssueGraphCheck(root);
  if (local.findings.length > 0) {
    throw new Error(`IGRAPH-LOCAL: ${local.findings[0]?.ruleId ?? "local graph is invalid"}`);
  }
  const repository = new GitNativeIssueGraphRepository(root);
  const records = (await Promise.all(
    (await repository.listIssueRefs()).map(async (issueId) => repository.readIssue(issueId)),
  )).filter((record): record is LocalIssueRecord => record?.metadata !== null && record !== null);
  const epic = records.find((record) => record.metadata?.epicPolicy !== undefined);
  const policy = epic?.metadata?.epicPolicy;
  if (!policy) throw new Error("IGRAPH-EPIC: provider policy is missing");
  const repositoryName = `${policy.provider.owner}/${policy.provider.repository}`;
  const mappings = records.flatMap((record) => record.providerMappings);
  const snapshot = await provider.readSnapshot(repositoryName, mappings);
  const plan = planIssueGraphReconciliation({ records, snapshot });
  return {
    ...plan,
    graphSha256: graphDigestFromRecords(records),
    providerSnapshotSha256: createHash("sha256").update(canonicalJson(snapshot)).digest("hex"),
    operationsSha256: digestOperations(plan.operations),
    snapshot,
    records,
  };
}

export async function prepareIssueGraphProjection(input: {
  readonly root: string;
  readonly approvalIssueId: string;
  readonly implementationSha: string;
  readonly provider?: IssueGraphProvider;
}): Promise<{ readonly target: SyncIssueProjectionTarget; readonly transactionCommit: string; readonly created: boolean; readonly pushed: boolean }> {
  const plan = await runIssueGraphRemoteCheck(input.root, input.provider);
  const transaction: ProjectionTransaction = {
    repository: "BrandonJF/mandem",
    graphSha256: plan.graphSha256,
    providerSnapshot: plan.snapshot,
    providerSnapshotSha256: plan.providerSnapshotSha256,
    operations: plan.operations,
    operationsSha256: plan.operationsSha256,
    implementationSha: input.implementationSha,
  };
  const prepared = await new ProjectionTransactionWriter(input.root).prepare(input.approvalIssueId, transaction);
  return {
    target: {
      repository: "BrandonJF/mandem",
      graph_sha256: plan.graphSha256,
      transaction_sha256: prepared.transactionSha256,
      provider_snapshot_sha256: plan.providerSnapshotSha256,
      operations_sha256: plan.operationsSha256,
      implementation_sha: input.implementationSha,
    },
    transactionCommit: prepared.commit,
    created: prepared.created,
    pushed: prepared.pushed,
  };
}

export async function runApplyIssueGraphProjection(input: {
  readonly root: string;
  readonly approvalIssueId: string;
  readonly implementationSha: string;
  readonly provider?: IssueGraphProvider;
}): Promise<{ readonly writes: number; readonly completedOperations: number }> {
  const approval = await new ProjectionApprovalReader(input.root).authorize({
    approvalIssueId: input.approvalIssueId,
    implementationSha: input.implementationSha,
  });
  const repository = new GitNativeIssueGraphRepository(input.root);
  const records = (await Promise.all(
    (await repository.listIssueRefs()).map(async (issueId) => repository.readIssue(issueId)),
  )).filter((record): record is LocalIssueRecord => record?.metadata !== null && record !== null);
  if (graphDigestFromRecords(records) !== approval.target.graph_sha256) {
    throw new Error("native issue graph differs from the approved projection target");
  }
  return reconcileIssueGraph({
    records,
    transaction: approval.transaction,
    provider: input.provider ?? new GitHubIssueGraphProvider(),
  });
}
