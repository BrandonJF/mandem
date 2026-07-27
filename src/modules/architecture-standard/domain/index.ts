/** @fileoverview Domain exports for architecture analysis. */
export { architectureRules, evaluateArchitecture } from "./rules";
export { isExcludedAuthoredPath, isIncludedAuthoredTypeScriptPath, isProductionTypeScriptPath } from "./repository-policy";
export type { AnalysisResult, ArchitectureRule, RepositoryFile, RuleViolation } from "./types";
