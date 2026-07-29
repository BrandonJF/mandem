/** @fileoverview CLI adapter for authored-source conformance checks. */
import { analyzeAuthoredSourceDirectory, analyzeAuthoredSourceRevision, analyzeStagedAuthoredSources } from "@/modules/architecture-standard/api/composition";

function parse(values: readonly string[]): { readonly mode: "full" | "staged" | "revision"; readonly revision?: string } {
  const [modeFlag, mode, ...rest] = values;
  if (modeFlag !== "--mode" || !["full", "staged", "revision"].includes(mode ?? "")) throw new Error("use --mode full|staged|revision");
  if (mode === "revision" && rest.length === 2 && rest[0] === "--revision" && rest[1]) return { mode, revision: rest[1] };
  if (mode !== "revision" && rest.length === 0) return { mode: mode as "full" | "staged" };
  throw new Error("invalid authored-source checker arguments");
}

try {
  const arguments_ = parse(Bun.argv.slice(2));
  const result = arguments_.mode === "full"
    ? await analyzeAuthoredSourceDirectory(process.cwd())
    : arguments_.mode === "staged"
      ? await analyzeStagedAuthoredSources(process.cwd())
      : await analyzeAuthoredSourceRevision(process.cwd(), arguments_.revision ?? "");
  for (const violation of result.violations) console.log(`${violation.ruleId} ${violation.path}: ${violation.message}`);
  process.exitCode = result.violations.length === 0 ? 0 : 1;
} catch (error: unknown) {
  console.error(`authored-source checker failed: ${error instanceof Error ? error.message : "unexpected error"}`);
  process.exitCode = 2;
}
