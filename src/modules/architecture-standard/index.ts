/** @fileoverview Public architecture-standard API. */
export type { AnalysisResult, ArchitectureRule, RepositoryFile, RepositoryPolicy, RepositorySnapshot, RuleViolation } from "./domain/types";
export { architectureRules, documentationRules, repositoryRules } from "./domain/rules";
export { authoredSourcePolicyV1, documentationPolicyV1, evaluateAuthoredSources, evaluateDocumentation } from "./domain/repository-policy";
export { ApprovalContractError, canonicalJson, parseApproval, selectApproval, serializeApproval } from "./domain/approval-contract";
export type { ApprovalAction, ApprovalCommit, ApprovalDecision, ApprovalRecord, ApprovalTarget, ApplyRulesetTarget, ExecutePlanTarget, MergePullRequestTarget, SetIssueGraphTarget, SyncIssueProjectionTarget } from "./domain/approval-contract";
export { analyzeAuthoredSourceDirectory, analyzeDocumentationDirectory, analyzeRepositoryFiles, analyzeStagedRepository, analyzeStagedDocumentation, analyzeStagedAuthoredSources, checkAuthoredPath, checkProviderPostWrite } from "./api/composition";
export { previewNativeIssueGraph, runApplyNativeIssueGraph, runLocalIssueGraphCheck } from "./api/issue-graph";
export { prepareIssueGraphProjection, runApplyIssueGraphProjection, runIssueGraphRemoteCheck } from "./api/issue-graph-reconciliation";
export type { RemoteIssueGraphPlan } from "./api/issue-graph-reconciliation";
export { allowedReviewChoices } from "./domain/plan-review-choice-policy";
export type { PlanReviewChoice, PlanReviewHistory } from "./domain/plan-review-choice-policy";
