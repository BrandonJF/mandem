/** @fileoverview Provider-neutral CLI adapter for PostToolUse feedback. */
import { checkProviderPostWrite } from "../../src/modules/architecture-standard/api/composition";

async function input(): Promise<unknown> {
  const text = await Bun.stdin.text();
  try { return JSON.parse(text); } catch { throw new Error("expected event JSON"); }
}

try {
  const provider = Bun.argv[2];
  if (provider !== "claude" && provider !== "codex" || Bun.argv.length !== 3) throw new Error("use provider claude or codex");
  const results = await checkProviderPostWrite(provider, await input());
  const findings = results.flatMap(({ result }) => [
    ...result.violations.map((violation) => `${violation.ruleId} ${violation.path}: ${violation.message}`),
    ...result.commandFailures,
  ]);
  if (findings.length > 0) {
    console.error(findings.slice(0, 40).join("\n"));
    process.exitCode = 2;
  }
} catch (error: unknown) {
  console.error(`provider post-write adapter failed: ${error instanceof Error ? error.message : "unexpected error"}`);
  process.exitCode = 2;
}
