/** @fileoverview Domain exports for architecture analysis. */
export { architectureRules, documentationRules, evaluateArchitecture, repositoryRules } from "./rules";
export { authoredSourcePolicyV1, documentationPolicyV1, evaluateAuthoredSources, evaluateDocumentation, hasUsefulFileoverview, isExcludedAuthoredPath, isIncludedAuthoredTypeScriptPath, isProductionTypeScriptPath } from "./repository-policy";
export type { AnalysisResult, ArchitectureRule, RepositoryFile, RepositoryPolicy, RepositorySnapshot, RuleViolation } from "./types";
export { ApprovalContractError, canonicalJson, parseApproval, selectApproval, serializeApproval } from "./approval-contract";
export type { ApprovalAction, ApprovalCommit, ApprovalDecision, ApprovalRecord, ApprovalTarget, ApplyRulesetTarget, ExecutePlanTarget, MergePullRequestTarget } from "./approval-contract";
