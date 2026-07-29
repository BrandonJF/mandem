/** @fileoverview Verifies that exact-revision gates cannot recursively invoke their orchestrator. */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

interface PackageManifest {
  readonly scripts?: Readonly<Record<string, string>>;
}

function reachableScripts(
  scripts: Readonly<Record<string, string>>,
  start: string,
): ReadonlySet<string> {
  const visited = new Set<string>();
  const pending = [start];
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    const command = scripts[current] ?? "";
    for (const candidate of Object.keys(scripts)) {
      const invocation = new RegExp(
        `\\bbun run ${candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s|$)`,
      );
      if (invocation.test(command)) pending.push(candidate);
    }
  }
  return visited;
}

describe("revision gate package contract", () => {
  it.each(["check:core", "check:revision-target"])(
    "%s cannot reach revision orchestration or the complete developer gate",
    async (entrypoint) => {
      const manifest = JSON.parse(
        await readFile(join(process.cwd(), "package.json"), "utf8"),
      ) as PackageManifest;
      const scripts = manifest.scripts ?? {};
      const reachable = reachableScripts(scripts, entrypoint);

      expect(scripts[entrypoint]).toBeDefined();
      expect(reachable).not.toContain("check:revision");
      expect(reachable).not.toContain("check");
    },
  );
});
