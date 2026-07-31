/** @fileoverview Port for reading and changing a provider issue graph. */
import type { IssueGraphOperation, ProviderSnapshot } from "../../domain/issue-graph-operations";
import type { ProviderMapping } from "../../domain/issue-graph-types";

export interface IssueGraphProvider {
  readSnapshot(repository: string, mappings: readonly ProviderMapping[]): Promise<ProviderSnapshot>;
  apply(operation: IssueGraphOperation): Promise<void>;
}
