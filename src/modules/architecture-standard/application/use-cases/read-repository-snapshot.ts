/** @fileoverview Shared repository-snapshot selection for policy analysis. */
import type { RepositorySnapshot } from "../../domain/types";
import type { RepositorySnapshotReader } from "../repositories/repository-snapshot";

export type SnapshotMode = "working" | "staged" | "revision";

export interface SnapshotRequest {
  readonly root: string;
  readonly mode: SnapshotMode;
  readonly revision?: string;
}

export async function readRepositorySnapshot(reader: RepositorySnapshotReader, request: SnapshotRequest): Promise<RepositorySnapshot> {
  if (request.mode === "working") return reader.readWorkingTree(request.root);
  if (request.mode === "staged") return reader.readStagedTree(request.root);
  if (!request.revision) throw new Error("revision mode requires a revision");
  return reader.readRevision(request.root, request.revision);
}
