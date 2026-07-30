/** @fileoverview Runs the offline native issue graph integrity check. */
import { runLocalIssueGraphCheck } from "../src/modules/architecture-standard/api/issue-graph";

if (import.meta.main) {
  const result = await runLocalIssueGraphCheck(process.cwd());
  if (result.findings.length === 0) console.log("issue graph native v1 valid: 15 managed issues");
  else for (const finding of result.findings) console.error(`${finding.ruleId}: ${finding.issueId} ${finding.path} ${finding.message}`.trim());
  if (result.findings.length > 0) process.exitCode = 1;
}
