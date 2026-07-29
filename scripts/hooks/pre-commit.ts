/** @fileoverview Staged-snapshot conformance hook. */
import { analyzeStagedRepository } from "../../src/modules/architecture-standard/api/composition";

try {
  const result = await analyzeStagedRepository(process.cwd());
  const violations = [...result.documentation.violations, ...result.authoredSources.violations];
  for (const violation of violations) console.error(`${violation.ruleId} ${violation.path}: ${violation.message}`);
  process.exitCode = violations.length === 0 ? 0 : 1;
} catch (error: unknown) {
  console.error(`pre-commit hook failed: ${error instanceof Error ? error.message : "unexpected error"}`);
  process.exitCode = 2;
}
