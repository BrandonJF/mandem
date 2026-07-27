/** @fileoverview Temporary compile seam for architecture analysis composition. */
import { evaluateArchitecture } from "../domain/rules";
import { analyzeRepository } from "../application/use-cases/analyze-repository";
import { analyzeAuthoredSources } from "../application/use-cases/analyze-authored-sources";
import { analyzeDocumentation } from "../application/use-cases/analyze-documentation";
import { checkAuthoredPath as checkPath } from "../application/use-cases/check-authored-path";
import { FileSystemTree } from "../infrastructure/repositories/file-system-tree";
import { FileSystemSnapshot } from "../infrastructure/repositories/file-system-snapshot";
import { GitRepositorySnapshot } from "../infrastructure/repositories/git-repository-snapshot";
import { BunCommandRunner } from "../infrastructure/services/bun-command-runner";
import type { AnalysisResult, RepositoryFile } from "../domain/types";
import type { GitChange } from "../application/repositories/repository-snapshot";

export function analyzeRepositoryFiles(files: readonly RepositoryFile[]): AnalysisResult {
  return evaluateArchitecture(files);
}

export async function analyzeDirectory(root: string): Promise<AnalysisResult> { return analyzeRepository(new FileSystemTree(), root); }

export async function analyzeDocumentationDirectory(root: string): Promise<AnalysisResult> { return analyzeDocumentation(new FileSystemSnapshot(), { root, mode: "working" }); }
export async function analyzeAuthoredSourceDirectory(root: string): Promise<AnalysisResult> { return analyzeAuthoredSources(new FileSystemSnapshot(), { root, mode: "working" }); }
export async function analyzeStagedRepository(root: string): Promise<{ documentation: AnalysisResult; authoredSources: AnalysisResult }> {
  const snapshots = new GitRepositorySnapshot();
  return { documentation: await analyzeDocumentation(snapshots, { root, mode: "staged" }), authoredSources: await analyzeAuthoredSources(snapshots, { root, mode: "staged" }) };
}
export async function analyzeStagedDocumentation(root: string): Promise<AnalysisResult> { return analyzeDocumentation(new GitRepositorySnapshot(), { root, mode: "staged" }); }
export async function analyzeStagedAuthoredSources(root: string): Promise<AnalysisResult> { return analyzeAuthoredSources(new GitRepositorySnapshot(), { root, mode: "staged" }); }
export async function analyzeDocumentationRevision(root: string, revision: string, changes?: readonly GitChange[]): Promise<AnalysisResult> { return analyzeDocumentation(new GitRepositorySnapshot(), { root, mode: "revision", revision, changes }); }
export async function analyzeAuthoredSourceRevision(root: string, revision: string, changes?: readonly GitChange[]): Promise<AnalysisResult> { return analyzeAuthoredSources(new GitRepositorySnapshot(), { root, mode: "revision", revision, changes }); }
export async function changedGitEntries(root: string, base: string, head: string): Promise<readonly GitChange[]> { return new GitRepositorySnapshot().changedEntries(root, base, head); }
export async function checkAuthoredPath(root: string, path: string) { return checkPath(root, path, new FileSystemSnapshot(), new BunCommandRunner()); }
