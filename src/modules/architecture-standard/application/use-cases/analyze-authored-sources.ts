/** @fileoverview Application use case for authored-source policy analysis. */
import { authoredSourcePolicyV1, evaluateAuthoredSources } from "../../domain/repository-policy";
import type { AnalysisResult } from "../../domain/types";
import type { GitChange, RepositorySnapshotReader } from "../repositories/repository-snapshot";
import { readRepositorySnapshot, type SnapshotMode } from "./read-repository-snapshot";

export interface AuthoredSourceAnalysisRequest {
  readonly root: string;
  readonly mode: SnapshotMode;
  readonly revision?: string;
  readonly changes?: readonly GitChange[];
}

export async function analyzeAuthoredSources(reader: RepositorySnapshotReader, request: AuthoredSourceAnalysisRequest): Promise<AnalysisResult> {
  const result = evaluateAuthoredSources(await readRepositorySnapshot(reader, request), authoredSourcePolicyV1);
  if (!request.changes || request.changes.length === 0) return result;
  const affected = new Set(request.changes.flatMap((change) => [change.path, change.oldPath].filter((path): path is string => path !== undefined)));
  return { violations: result.violations.filter((violation) => affected.has(violation.path)) };
}
