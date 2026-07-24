/** @fileoverview Public architecture-standard API. */
export type { AnalysisResult, RepositoryFile, RuleViolation } from "./domain/types";
export { analyzeRepositoryFiles } from "./api/composition";
