/** @fileoverview Domain exports for architecture analysis. */
export { architectureRules, documentationRules, evaluateArchitecture, repositoryRules } from "./rules";
export { authoredSourcePolicyV1, documentationPolicyV1, evaluateAuthoredSources, evaluateDocumentation, hasUsefulFileoverview, isExcludedAuthoredPath, isIncludedAuthoredTypeScriptPath, isProductionTypeScriptPath } from "./repository-policy";
export type { AnalysisResult, ArchitectureRule, RepositoryFile, RepositoryPolicy, RepositorySnapshot, RuleViolation } from "./types";
