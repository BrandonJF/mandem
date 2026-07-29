/** @fileoverview Ports for repository snapshots and Git change entries. */
import type { RepositorySnapshot } from "../../domain/types";

export interface RepositorySnapshotReader {
  readWorkingTree(root: string): Promise<RepositorySnapshot>;
  readStagedTree(root: string): Promise<RepositorySnapshot>;
  readRevision(root: string, revision: string): Promise<RepositorySnapshot>;
}

export interface GitChange {
  readonly status: "A" | "C" | "M" | "R" | "D";
  readonly oldPath?: string;
  readonly path: string;
}

export interface GitChangeReader {
  changedEntries(root: string, base: string, head: string): Promise<readonly GitChange[]>;
}
