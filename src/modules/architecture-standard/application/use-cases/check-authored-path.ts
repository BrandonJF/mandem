/** @fileoverview Focused authoring check use case shared by future provider adapters. */
import { authoredSourcePolicyV1, documentationPolicyV1, evaluateAuthoredSources, evaluateDocumentation } from "../../domain/repository-policy";
import type { RuleViolation } from "../../domain/types";
import type { RepositorySnapshotReader } from "../repositories/repository-snapshot";

export interface CommandRunner {
  run(command: readonly string[], cwd: string): Promise<{ readonly exitCode: number; readonly output: string }>;
}

export interface AuthoringCheckResult {
  readonly path: string;
  readonly checks: readonly ("documentation" | "architecture" | "lint" | "typecheck")[];
  readonly violations: readonly RuleViolation[];
  readonly commandFailures: readonly string[];
}

function bounded(label: string, output: string): string { return `${label}: ${output.split("\n").slice(0, 40).join("\n")}`.trim(); }

export async function checkAuthoredPath(root: string, path: string, snapshotReader: RepositorySnapshotReader, commandRunner: CommandRunner): Promise<AuthoringCheckResult> {
  if (path.startsWith("/") || path.split("/").includes("..") || path === "") throw new Error("path must be repository-relative and contained");
  const snapshot = await snapshotReader.readWorkingTree(root);
  if (/\.(?:ts|tsx)$/.test(path)) {
    const architecture = evaluateAuthoredSources(snapshot, authoredSourcePolicyV1);
    const commands = [["bunx", "eslint", path], ["bunx", "tsc", "--noEmit"]] as const;
    const outcomes = await Promise.all(commands.map(async (command) => ({ command, result: await commandRunner.run(command, root) })));
    return { path, checks: ["architecture", "lint", "typecheck"], violations: architecture.violations.filter((violation) => violation.path === path), commandFailures: outcomes.filter(({ result }) => result.exitCode !== 0).map(({ command, result }) => bounded(command[1] ?? command[0], result.output)) };
  }
  if (/\.(?:md|ya?ml)$/i.test(path)) return { path, checks: ["documentation"], violations: evaluateDocumentation(snapshot, documentationPolicyV1).violations, commandFailures: [] };
  return { path, checks: [], violations: [], commandFailures: [] };
}
