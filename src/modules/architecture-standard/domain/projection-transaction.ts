/** @fileoverview Canonical native record for one immutable provider projection transaction. */
import { createHash } from "node:crypto";
import { canonicalJson } from "./approval-contract";
import type { IssueGraphOperation, ProviderSnapshot } from "./issue-graph-operations";

export interface ProjectionTransaction {
  readonly repository: "BrandonJF/mandem";
  readonly graphSha256: string;
  readonly providerSnapshot: ProviderSnapshot;
  readonly providerSnapshotSha256: string;
  readonly operations: readonly IssueGraphOperation[];
  readonly operationsSha256: string;
  readonly implementationSha: string;
}

const marker = "Mandem-Projection-Transaction: v1";

function digest(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

export function serializeProjectionTransaction(transaction: ProjectionTransaction): string {
  if (digest(transaction.providerSnapshot) !== transaction.providerSnapshotSha256) {
    throw new Error("provider snapshot digest is invalid");
  }
  if (digest(transaction.operations) !== transaction.operationsSha256) {
    throw new Error("provider operations digest is invalid");
  }
  return `${marker}\n${canonicalJson(transaction)}\n`;
}

export function projectionTransactionDigest(transaction: ProjectionTransaction): string {
  return createHash("sha256").update(serializeProjectionTransaction(transaction)).digest("hex");
}

export function parseProjectionTransaction(source: string): ProjectionTransaction {
  if (!source.startsWith(`${marker}\n`) || !source.endsWith("\n") || source.includes("\r")) {
    throw new Error("projection transaction envelope is invalid");
  }
  let value: unknown;
  try { value = JSON.parse(source.slice(marker.length + 1, -1)); }
  catch { throw new Error("projection transaction JSON is invalid"); }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("projection transaction must be an object");
  }
  const transaction = value as ProjectionTransaction;
  if (
    transaction.repository !== "BrandonJF/mandem" ||
    typeof transaction.graphSha256 !== "string" ||
    typeof transaction.providerSnapshotSha256 !== "string" ||
    typeof transaction.operationsSha256 !== "string" ||
    typeof transaction.implementationSha !== "string" ||
    !Array.isArray(transaction.operations) ||
    typeof transaction.providerSnapshot !== "object" ||
    transaction.providerSnapshot === null
  ) throw new Error("projection transaction fields are invalid");
  if (serializeProjectionTransaction(transaction) !== source) {
    throw new Error("projection transaction is not canonical");
  }
  return transaction;
}
