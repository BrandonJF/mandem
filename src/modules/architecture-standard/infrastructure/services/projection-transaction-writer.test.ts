/** @fileoverview Disposable Git test for idempotent projection transaction publication. */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { canonicalJson } from "../../domain/approval-contract";
import type { ProjectionTransaction } from "../../domain/projection-transaction";
import { ProjectionTransactionWriter } from "./projection-transaction-writer";

function git(root: string, arguments_: readonly string[]): string {
  return execFileSync("git", [...arguments_], { cwd: root, encoding: "utf8" }).trim();
}

function digest(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

describe("ProjectionTransactionWriter", () => {
  it("publishes once and reuses the exact current transaction", async () => {
    const temporary = await mkdtemp(join(tmpdir(), "mandem-projection-transaction-"));
    const remote = join(temporary, "remote.git");
    const root = join(temporary, "repository");
    const issueId = "6a6a8bab-853f-4658-9bc0-38e2386b642d";
    const reference = `refs/issues/${issueId}`;
    try {
      git(temporary, ["init", "--bare", remote]);
      git(temporary, ["clone", remote, root]);
      git(root, ["config", "user.name", "Test"]); git(root, ["config", "user.email", "test@example.com"]);
      const tree = git(root, ["mktree"]);
      const baseline = git(root, ["commit-tree", tree, "-m", "Initial issue\n\nState: open\nFormat-Version: 1"]);
      git(root, ["update-ref", reference, baseline]);
      git(root, ["push", "origin", reference]);
      const snapshot = { repository: "BrandonJF/mandem", labels: [], milestones: [], issues: [] };
      const operations: readonly [] = [];
      const transaction: ProjectionTransaction = {
        repository: "BrandonJF/mandem",
        graphSha256: "1".repeat(64),
        providerSnapshot: snapshot,
        providerSnapshotSha256: digest(snapshot),
        operations,
        operationsSha256: digest(operations),
        implementationSha: "2".repeat(40),
      };
      const writer = new ProjectionTransactionWriter(root);
      const first = await writer.prepare(issueId, transaction);
      const second = await writer.prepare(issueId, transaction);
      expect(first).toMatchObject({ created: true, pushed: true });
      expect(second).toMatchObject({ commit: first.commit, created: false, pushed: false });
      expect(git(root, ["ls-remote", "origin", reference]).split(/\s+/u)[0]).toBe(first.commit);
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  });
});
