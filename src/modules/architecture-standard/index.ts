/** @fileoverview Public architecture-standard API. */
export type { AnalysisResult, ArchitectureRule, RepositoryFile, RuleViolation } from "./domain/types";
export { architectureRules } from "./domain/rules";
export { analyzeRepositoryFiles } from "./api/composition";
