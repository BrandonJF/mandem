/** @fileoverview Application use case for documentation-policy analysis. */
import { documentationPolicyV1, evaluateDocumentation } from "../../domain/repository-policy";
import type { AnalysisResult, RepositoryPolicy } from "../../domain/types";
import type { GitChange, RepositorySnapshotReader } from "../repositories/repository-snapshot";
import { readRepositorySnapshot, type SnapshotMode } from "./read-repository-snapshot";

export type { SnapshotMode } from "./read-repository-snapshot";
export interface DocumentationAnalysisRequest {
  readonly root: string;
  readonly mode: SnapshotMode;
  readonly revision?: string;
  readonly changes?: readonly GitChange[];
}

export async function analyzeDocumentation(
  reader: RepositorySnapshotReader,
  request: DocumentationAnalysisRequest,
  policy: RepositoryPolicy = documentationPolicyV1,
): Promise<AnalysisResult> {
  const result = evaluateDocumentation(await readRepositorySnapshot(reader, request), policy);
  if (!request.changes || request.changes.length === 0) return result;
  const affected = new Set<string>();
  for (const change of request.changes) for (const candidate of [change.path, change.oldPath]) {
    if (!candidate) continue;
    let current = candidate.includes("/") ? candidate.slice(0, candidate.lastIndexOf("/")) : "";
    while (current === "docs" || current.startsWith("docs/")) { affected.add(current); current = current.includes("/") ? current.slice(0, current.lastIndexOf("/")) : ""; }
    affected.add(candidate);
  }
  const rootOrSpecialIndex = (path: string): boolean =>
    path === "README.md" ||
    policy.rootIndexEntries.includes(path) ||
    Object.keys(policy.specialIndexes).some(
      (root) => path === root || path.startsWith(`${root}/`),
    );
  return { violations: result.violations.filter((violation) => rootOrSpecialIndex(violation.path) || [...affected].some((path) => violation.path === path || violation.path.startsWith(`${path}/`))) };
}
