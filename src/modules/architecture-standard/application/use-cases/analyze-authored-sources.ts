/** @fileoverview Application use case for authored-source policy analysis. */
import { authoredSourcePolicyV1, evaluateAuthoredSources } from "../../domain/repository-policy";
import type { AnalysisResult, RepositorySnapshot } from "../../domain/types";
import type { GitChange, RepositorySnapshotReader } from "../repositories/repository-snapshot";
import type { SnapshotMode } from "./analyze-documentation";

export interface AuthoredSourceAnalysisRequest {
  readonly root: string;
  readonly mode: SnapshotMode;
  readonly revision?: string;
  readonly changes?: readonly GitChange[];
}

async function snapshot(reader: RepositorySnapshotReader, request: AuthoredSourceAnalysisRequest): Promise<RepositorySnapshot> {
  if (request.mode === "working") return reader.readWorkingTree(request.root);
  if (request.mode === "staged") return reader.readStagedTree(request.root);
  if (!request.revision) throw new Error("revision mode requires a revision");
  return reader.readRevision(request.root, request.revision);
}

export async function analyzeAuthoredSources(reader: RepositorySnapshotReader, request: AuthoredSourceAnalysisRequest): Promise<AnalysisResult> {
  const result = evaluateAuthoredSources(await snapshot(reader, request), authoredSourcePolicyV1);
  if (!request.changes || request.changes.length === 0) return result;
  const affected = new Set(request.changes.flatMap((change) => [change.path, change.oldPath].filter((path): path is string => path !== undefined)));
  return { violations: result.violations.filter((violation) => affected.has(violation.path)) };
}
