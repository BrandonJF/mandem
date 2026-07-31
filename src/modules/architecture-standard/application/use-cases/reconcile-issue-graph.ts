/** @fileoverview Applies only the exact remaining suffix of an approved provider transaction. */
import { canonicalJson } from "../../domain/approval-contract";
import type { ProjectionTransaction } from "../../domain/projection-transaction";
import type { LocalIssueRecord } from "../../domain/issue-graph-types";
import type { IssueGraphProvider } from "../ports/issue-graph-provider";
import { planIssueGraphReconciliation } from "./plan-issue-graph-reconciliation";

function mappings(records: readonly LocalIssueRecord[]) {
  return records.flatMap((record) => record.providerMappings);
}

function suffixIndex(transaction: ProjectionTransaction, current: ReturnType<typeof planIssueGraphReconciliation>): number {
  for (let index = 0; index <= transaction.operations.length; index += 1) {
    if (canonicalJson(transaction.operations.slice(index)) === canonicalJson(current.operations)) return index;
  }
  throw new Error("IGRAPH-PROVIDER-DRIFT: current operations are not an exact transaction suffix");
}

export async function reconcileIssueGraph(input: {
  readonly records: readonly LocalIssueRecord[];
  readonly transaction: ProjectionTransaction;
  readonly provider: IssueGraphProvider;
}): Promise<{ readonly writes: number; readonly completedOperations: number }> {
  let snapshot = await input.provider.readSnapshot(input.transaction.repository, mappings(input.records));
  let plan = planIssueGraphReconciliation({ records: input.records, snapshot });
  let completedOperations = suffixIndex(input.transaction, plan);
  let writes = 0;
  while (plan.operations.length > 0) {
    const operation = plan.operations[0];
    if (!operation) break;
    try {
      await input.provider.apply(operation);
      writes += 1;
    } catch (error: unknown) {
      snapshot = await input.provider.readSnapshot(input.transaction.repository, mappings(input.records));
      plan = planIssueGraphReconciliation({ records: input.records, snapshot });
      const afterFailure = suffixIndex(input.transaction, plan);
      if (afterFailure === completedOperations) throw error;
      completedOperations = afterFailure;
      continue;
    }
    snapshot = await input.provider.readSnapshot(input.transaction.repository, mappings(input.records));
    plan = planIssueGraphReconciliation({ records: input.records, snapshot });
    const next = suffixIndex(input.transaction, plan);
    if (next <= completedOperations) throw new Error(`IGRAPH-PROVIDER-WRITE: operation was not observed: ${operation.key}`);
    completedOperations = next;
  }
  return { writes, completedOperations };
}
