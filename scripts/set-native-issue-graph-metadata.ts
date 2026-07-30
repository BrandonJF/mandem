/** @fileoverview Previews or applies one exact approval-gated native graph transaction. */
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import {
  previewNativeIssueGraph,
  runApplyNativeIssueGraph,
} from "../src/modules/architecture-standard/api/issue-graph";
import { parseNativeIssueGraphManifest } from "../src/modules/architecture-standard/domain/issue-graph-manifest";

const execute = promisify(execFile);

function flag(name: string, required = true): string | undefined {
  const index = Bun.argv.indexOf(name);
  const value = index < 0 ? undefined : Bun.argv[index + 1];
  if (required && !value) throw new Error(`missing ${name}`);
  return value;
}

if (import.meta.main) {
  try {
    const root = process.cwd();
    const manifest = parseNativeIssueGraphManifest(await readFile(flag("--file") ?? "", "utf8"));
    const implementationSha = (await execute("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" })).stdout.trim();
    if (Bun.argv.includes("--apply")) {
      const approvalIssueId = flag("--approval-issue");
      const result = await runApplyNativeIssueGraph({
        root,
        manifest,
        implementationSha,
        approvalIssueId: approvalIssueId ?? "",
      });
      console.log(`native issue metadata applied: ${result.commits} commits, ${result.pushes} pushes`);
    } else {
      const target = await previewNativeIssueGraph({ root, manifest, implementationSha });
      console.log(JSON.stringify({ action: "set-issue-graph", target }, null, 2));
    }
  } catch (error: unknown) {
    console.error(`native issue graph failed: ${error instanceof Error ? error.message : "unexpected error"}`);
    process.exitCode = 1;
  }
}
