/** @fileoverview Pure architecture-standard data types. */
export interface RepositoryFile { path: string; text: string; }
export interface RepositorySnapshot { readonly files: readonly RepositoryFile[]; }
export interface RepositoryPolicy {
  readonly recursiveDocumentationRoots: readonly string[];
  readonly rootIndexEntries: readonly string[];
  readonly specialIndexes: Readonly<Record<string, readonly string[]>>;
  readonly excludedSegments: readonly string[];
  readonly excludedPrefixes: readonly string[];
  readonly authoredSourceIncludes: readonly string[];
  readonly authoredSourceExcludes: readonly string[];
}
export interface RuleViolation { ruleId: string; severity: "error"; path: string; message: string; context?: string; }
export interface AnalysisResult { violations: RuleViolation[]; }
export interface ArchitectureRule { id: string; severity: "error"; description: string; }
