/** @fileoverview Reports managed GitHub issue graph drift without mutation. */
import { runIssueGraphRemoteCheck } from "../src/modules/architecture-standard/api/issue-graph-reconciliation";

if (import.meta.main) {
  try {
    const result = await runIssueGraphRemoteCheck(process.cwd());
    if (result.operations.length === 0) {
      console.log(`issue graph remote valid: ${result.records.length} managed issues, 0 operations`);
    } else {
      console.log(JSON.stringify({
        repository: result.repository,
        operations_sha256: result.operationsSha256,
        operations: result.operations,
      }, null, 2));
      process.exitCode = 1;
    }
  } catch (error: unknown) {
    console.error(`issue graph remote check failed: ${error instanceof Error ? error.message : "unexpected error"}`);
    process.exitCode = 2;
  }
}
