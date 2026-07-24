/** @fileoverview Temporary compile seam for architecture analysis composition. */
import { evaluateArchitecture } from "../domain/rules";
import { analyzeRepository } from "../application/use-cases/analyze-repository";
import { FileSystemTree } from "../infrastructure/repositories/file-system-tree";
import type { AnalysisResult, RepositoryFile } from "../domain/types";

export function analyzeRepositoryFiles(files: readonly RepositoryFile[]): AnalysisResult {
  return evaluateArchitecture(files);
}

export async function analyzeDirectory(root: string): Promise<AnalysisResult> { return analyzeRepository(new FileSystemTree(), root); }
