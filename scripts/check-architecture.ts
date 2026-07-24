/** @fileoverview Thin CLI wrapper around Mandem's architecture composition root. */
import { analyzeDirectory } from "@/modules/architecture-standard/api/composition";

const root = Bun.argv[2] ?? ".";
try {
  const result = await analyzeDirectory(root);
  for (const finding of result.violations) console.log(`${finding.ruleId} ${finding.path}: ${finding.message}`);
  process.exitCode = result.violations.length === 0 ? 0 : 1;
} catch (error: unknown) {
  console.error(`architecture checker failed: ${error instanceof Error ? error.message : "unexpected error"}`);
  process.exitCode = 2;
}
