/** @fileoverview Application use case for documentation-policy analysis. */
import { documentationPolicyV1, evaluateDocumentation } from "../../domain/repository-policy";
import type { AnalysisResult, RepositorySnapshot } from "../../domain/types";
import type { GitChange, RepositorySnapshotReader } from "../repositories/repository-snapshot";

export type SnapshotMode = "working" | "staged" | "revision";
export interface DocumentationAnalysisRequest {
  readonly root: string;
  readonly mode: SnapshotMode;
  readonly revision?: string;
  readonly changes?: readonly GitChange[];
}

async function snapshot(reader: RepositorySnapshotReader, request: DocumentationAnalysisRequest): Promise<RepositorySnapshot> {
  if (request.mode === "working") return reader.readWorkingTree(request.root);
  if (request.mode === "staged") return reader.readStagedTree(request.root);
  if (!request.revision) throw new Error("revision mode requires a revision");
  return reader.readRevision(request.root, request.revision);
}

export async function analyzeDocumentation(reader: RepositorySnapshotReader, request: DocumentationAnalysisRequest): Promise<AnalysisResult> {
  const result = evaluateDocumentation(await snapshot(reader, request), documentationPolicyV1);
  if (!request.changes || request.changes.length === 0) return result;
  const affected = new Set<string>();
  for (const change of request.changes) for (const candidate of [change.path, change.oldPath]) {
    if (!candidate) continue;
    let current = candidate.includes("/") ? candidate.slice(0, candidate.lastIndexOf("/")) : "";
    while (current === "docs" || current.startsWith("docs/")) { affected.add(current); current = current.includes("/") ? current.slice(0, current.lastIndexOf("/")) : ""; }
    affected.add(candidate);
  }
  return { violations: result.violations.filter((violation) => [...affected].some((path) => violation.path === path || violation.path.startsWith(`${path}/`))) };
}
