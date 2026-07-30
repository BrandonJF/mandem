/** @fileoverview Domain exports for architecture analysis. */
export { architectureRules, documentationRules, evaluateArchitecture, repositoryRules } from "./rules";
export { authoredSourcePolicyV1, documentationPolicyV1, evaluateAuthoredSources, evaluateDocumentation, hasUsefulFileoverview, isExcludedAuthoredPath, isIncludedAuthoredTypeScriptPath, isProductionTypeScriptPath } from "./repository-policy";
export type { AnalysisResult, ArchitectureRule, RepositoryFile, RepositoryPolicy, RepositorySnapshot, RuleViolation } from "./types";
export { ApprovalContractError, canonicalJson, parseApproval, selectApproval, serializeApproval } from "./approval-contract";
export type { ApprovalAction, ApprovalCommit, ApprovalDecision, ApprovalRecord, ApprovalTarget, ApplyRulesetTarget, ExecutePlanTarget, MergePullRequestTarget, SetIssueGraphTarget, SyncIssueProjectionTarget } from "./approval-contract";
export { evaluateIssueGraph, parseGraphMetadata, parsePlanDeclaration, serializeGraphMetadata } from "./issue-graph-policy";
export type { IssueGraphFinding, IssueGraphResult, IssuePromotion, LocalIssueRecord, NativeGraphMetadata, NativeIssueState, PlanDeclaration, ProviderMapping } from "./issue-graph-types";
export { graphDigest, parseNativeIssueGraphManifest } from "./issue-graph-manifest";
export type { NativeIssueGraphEntry, NativeIssueGraphManifest } from "./issue-graph-manifest";
