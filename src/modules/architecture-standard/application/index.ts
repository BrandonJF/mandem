/** @fileoverview Public application layer exports. */
export { analyzeRepository } from "./use-cases/analyze-repository";
export { analyzeAuthoredSources } from "./use-cases/analyze-authored-sources";
export { analyzeDocumentation } from "./use-cases/analyze-documentation";
export { checkAuthoredPath } from "./use-cases/check-authored-path";
export { checkIssueGraph } from "./use-cases/check-issue-graph";
export type { LocalIssueGraphRepository } from "./ports/issue-graph-repository";
export { planNativeIssueGraphMetadata } from "./use-cases/set-native-issue-graph-metadata";
export { planIssueGraphReconciliation } from "./use-cases/plan-issue-graph-reconciliation";
export type { PlanReconciliationInput } from "./use-cases/plan-issue-graph-reconciliation";
export type { IssueGraphProvider } from "./ports/issue-graph-provider";
