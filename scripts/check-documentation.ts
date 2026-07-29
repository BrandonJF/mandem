/** @fileoverview CLI adapter for documentation conformance checks. */
import { analyzeDocumentationDirectory, analyzeDocumentationRevision, analyzeStagedDocumentation, changedGitEntries } from "@/modules/architecture-standard/api/composition";

interface Arguments { readonly mode: "full" | "changed" | "staged" | "revision"; readonly baseRef?: string; readonly headRef?: string; readonly revision?: string; }

function parse(values: readonly string[]): Arguments {
  const [modeFlag, mode, ...rest] = values;
  if (modeFlag !== "--mode" || !["full", "changed", "staged", "revision"].includes(mode ?? "")) throw new Error("use --mode full|changed|staged|revision");
  const options = new Map<string, string>();
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index]; const value = rest[index + 1];
    if (!key || !value || !["--base-ref", "--head-ref", "--revision"].includes(key) || options.has(key)) throw new Error("invalid documentation checker arguments");
    options.set(key, value);
  }
  if (mode === "changed" && !options.has("--base-ref")) throw new Error("changed mode requires --base-ref");
  if (mode === "revision" && !options.has("--revision")) throw new Error("revision mode requires --revision");
  if ((mode === "full" || mode === "staged") && options.size > 0) throw new Error("this mode accepts no additional arguments");
  return { mode: mode as Arguments["mode"], baseRef: options.get("--base-ref"), headRef: options.get("--head-ref"), revision: options.get("--revision") };
}

try {
  const arguments_ = parse(Bun.argv.slice(2));
  const root = process.cwd();
  if (arguments_.mode === "changed") {
    const head = arguments_.headRef ?? "HEAD";
    const changes = await changedGitEntries(root, arguments_.baseRef ?? "", head);
    const changed = await analyzeDocumentationRevision(root, head, changes);
    for (const violation of changed.violations) console.log(`${violation.ruleId} ${violation.path}: ${violation.message}`);
    process.exitCode = changed.violations.length === 0 ? 0 : 1;
  } else {
    const result = arguments_.mode === "full"
      ? await analyzeDocumentationDirectory(root)
      : arguments_.mode === "staged"
        ? await analyzeStagedDocumentation(root)
        : await analyzeDocumentationRevision(root, arguments_.revision ?? "");
    for (const violation of result.violations) console.log(`${violation.ruleId} ${violation.path}: ${violation.message}`);
    process.exitCode = result.violations.length === 0 ? 0 : 1;
  }
} catch (error: unknown) {
  console.error(`documentation checker failed: ${error instanceof Error ? error.message : "unexpected error"}`);
  process.exitCode = 2;
}
