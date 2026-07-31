/** @fileoverview Prepares one immutable GitHub issue graph projection transaction. */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { prepareIssueGraphProjection, runApplyIssueGraphProjection } from "../src/modules/architecture-standard/api/issue-graph-reconciliation";

const execute = promisify(execFile);

function flag(name: string): string {
  const index = Bun.argv.indexOf(name);
  const value = index < 0 ? undefined : Bun.argv[index + 1];
  if (!value) throw new Error(`missing ${name}`);
  return value;
}

if (import.meta.main) {
  try {
    const root = process.cwd();
    const implementationSha = (await execute("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" })).stdout.trim();
    const approvalIssueId = flag("--approval-issue");
    if (Bun.argv.includes("--apply")) {
      const result = await runApplyIssueGraphProjection({ root, implementationSha, approvalIssueId });
      console.log(`issue graph projection applied: ${result.writes} writes, ${result.completedOperations} completed operations`);
      process.exit(0);
    }
    const result = await prepareIssueGraphProjection({
      root,
      implementationSha,
      approvalIssueId,
    });
    console.log(JSON.stringify({
      action: "sync-issue-projection",
      target: result.target,
      transaction_commit: result.transactionCommit,
      native_writes: { commits: result.created ? 1 : 0, pushes: result.pushed ? 1 : 0 },
    }, null, 2));
  } catch (error: unknown) {
    console.error(`issue graph projection preparation failed: ${error instanceof Error ? error.message : "unexpected error"}`);
    process.exitCode = 2;
  }
}
