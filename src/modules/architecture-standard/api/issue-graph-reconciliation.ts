/** @fileoverview Composes native graph validation with provider comparison. */
import { createHash } from "node:crypto";
import { canonicalJson } from "../domain/approval-contract";
import type { IssueGraphProvider } from "../application/ports/issue-graph-provider";
import { planIssueGraphReconciliation } from "../application/use-cases/plan-issue-graph-reconciliation";
import type { IssueGraphOperation, ReconciliationPlan } from "../domain/issue-graph-operations";
import type { LocalIssueRecord } from "../domain/issue-graph-types";
import { GitNativeIssueGraphRepository } from "../infrastructure/repositories/git-native-issue-graph-repository";
import { GitHubIssueGraphProvider } from "../infrastructure/services/github-issue-graph-provider";
import { runLocalIssueGraphCheck } from "./issue-graph";

function digestOperations(operations: readonly IssueGraphOperation[]): string {
  return createHash("sha256").update(canonicalJson(operations)).digest("hex");
}

export interface RemoteIssueGraphPlan extends ReconciliationPlan {
  readonly operationsSha256: string;
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
    operationsSha256: digestOperations(plan.operations),
    records,
  };
}
