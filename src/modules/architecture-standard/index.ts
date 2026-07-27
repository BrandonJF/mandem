/** @fileoverview Public architecture-standard API. */
export type { AnalysisResult, ArchitectureRule, RepositoryFile, RepositoryPolicy, RepositorySnapshot, RuleViolation } from "./domain/types";
export { architectureRules, documentationRules, repositoryRules } from "./domain/rules";
export { authoredSourcePolicyV1, documentationPolicyV1, evaluateAuthoredSources, evaluateDocumentation } from "./domain/repository-policy";
export { analyzeAuthoredSourceDirectory, analyzeDocumentationDirectory, analyzeRepositoryFiles, analyzeStagedRepository, analyzeStagedDocumentation, analyzeStagedAuthoredSources, checkAuthoredPath } from "./api/composition";
