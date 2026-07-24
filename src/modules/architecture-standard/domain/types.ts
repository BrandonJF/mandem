/** @fileoverview Pure architecture-standard data types. */
export interface RepositoryFile { path: string; text: string; }
export interface RuleViolation { ruleId: string; severity: "error"; path: string; message: string; context?: string; }
export interface AnalysisResult { violations: RuleViolation[]; }
export interface ArchitectureRule { id: string; severity: "error"; description: string; }
