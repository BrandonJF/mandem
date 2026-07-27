/** @fileoverview CLI adapter for one shared authoring feedback check. */
import { checkAuthoredPath } from "../../src/modules/architecture-standard/api/composition";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execute = promisify(execFile);

async function root(): Promise<string> {
  try { return (await execute("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" })).stdout.trim(); }
  catch { throw new Error("could not resolve the Git repository root"); }
}

function lines(result: Awaited<ReturnType<typeof checkAuthoredPath>>): readonly string[] {
  return [...result.violations.map((violation) => `${violation.ruleId} ${violation.path}: ${violation.message}`), ...result.commandFailures];
}

try {
  const values = Bun.argv.slice(2);
  if (values.length !== 1 || !values[0]) throw new Error("use one repository-relative path");
  const result = await checkAuthoredPath(await root(), values[0]);
  if (result.checks.length === 0) console.log(`Skipped unsupported path: ${values[0]}`);
  const findings = lines(result);
  if (findings.length > 0) {
    console.error(findings.slice(0, 40).join("\n"));
    process.exitCode = 1;
  }
} catch (error: unknown) {
  console.error(`authoring check failed: ${error instanceof Error ? error.message : "unexpected error"}`);
  process.exitCode = 2;
}
