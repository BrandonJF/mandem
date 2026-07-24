/** @fileoverview Temporary compile seam for architecture analysis composition. */
import { evaluateArchitecture } from "../domain/rules";
import type { AnalysisResult, RepositoryFile } from "../domain/types";

export function analyzeRepositoryFiles(files: readonly RepositoryFile[]): AnalysisResult {
  return evaluateArchitecture(files);
}
