/** @fileoverview Tests canonical provider projection transaction records. */
import { describe, expect, it } from "vitest";
import { parseProjectionTransaction, projectionTransactionDigest, serializeProjectionTransaction } from "./projection-transaction";

const transaction = {
  repository: "BrandonJF/mandem" as const,
  graphSha256: "1".repeat(64),
  providerSnapshot: { repository: "BrandonJF/mandem", labels: [], milestones: [], issues: [] },
  providerSnapshotSha256: "63b44bffabe6b483f90c72858dd238468c28bcaca9fa55abf271abad2d0de1d0",
  operations: [],
  operationsSha256: "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
  implementationSha: "2".repeat(40),
};

describe("projection transaction", () => {
  it("round trips one canonical LF-terminated record", () => {
    const source = serializeProjectionTransaction(transaction);
    expect(parseProjectionTransaction(source)).toEqual(transaction);
    expect(projectionTransactionDigest(transaction)).toMatch(/^[0-9a-f]{64}$/u);
  });

  it("rejects a changed snapshot or noncanonical JSON", () => {
    expect(() => serializeProjectionTransaction({ ...transaction, providerSnapshot: { ...transaction.providerSnapshot, labels: [{ name: "x", color: "fff", description: "" }] } })).toThrow("snapshot digest");
    expect(() => parseProjectionTransaction(`Mandem-Projection-Transaction: v1\n${JSON.stringify(transaction, null, 2)}\n`)).toThrow("not canonical");
  });
});
