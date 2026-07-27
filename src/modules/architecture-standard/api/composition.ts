/** @fileoverview Temporary compile seam for architecture analysis composition. */
import { evaluateArchitecture } from "../domain/rules";
import { analyzeRepository } from "../application/use-cases/analyze-repository";
import { analyzeAuthoredSources } from "../application/use-cases/analyze-authored-sources";
import { analyzeDocumentation } from "../application/use-cases/analyze-documentation";
import { checkAuthoredPath as checkPath } from "../application/use-cases/check-authored-path";
import { FileSystemTree } from "../infrastructure/repositories/file-system-tree";
import { FileSystemSnapshot } from "../infrastructure/repositories/file-system-snapshot";
import { GitRepositorySnapshot } from "../infrastructure/repositories/git-repository-snapshot";
import { BunCommandRunner } from "../infrastructure/services/bun-command-runner";
import { parseClaudePostToolUse, type ProviderPathEvent } from "../infrastructure/provider-events/claude-post-tool-use";
import { parseCodexPostToolUse } from "../infrastructure/provider-events/codex-post-tool-use";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { realpath } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import type { AnalysisResult, RepositoryFile } from "../domain/types";
import type { GitChange } from "../application/repositories/repository-snapshot";

export function analyzeRepositoryFiles(files: readonly RepositoryFile[]): AnalysisResult {
  return evaluateArchitecture(files);
}

export async function analyzeDirectory(root: string): Promise<AnalysisResult> { return analyzeRepository(new FileSystemTree(), root); }

export async function analyzeDocumentationDirectory(root: string): Promise<AnalysisResult> { return analyzeDocumentation(new FileSystemSnapshot(), { root, mode: "working" }); }
export async function analyzeAuthoredSourceDirectory(root: string): Promise<AnalysisResult> { return analyzeAuthoredSources(new FileSystemSnapshot(), { root, mode: "working" }); }
export async function analyzeStagedRepository(root: string): Promise<{ documentation: AnalysisResult; authoredSources: AnalysisResult }> {
  const snapshots = new GitRepositorySnapshot();
  return { documentation: await analyzeDocumentation(snapshots, { root, mode: "staged" }), authoredSources: await analyzeAuthoredSources(snapshots, { root, mode: "staged" }) };
}
export async function analyzeStagedDocumentation(root: string): Promise<AnalysisResult> { return analyzeDocumentation(new GitRepositorySnapshot(), { root, mode: "staged" }); }
export async function analyzeStagedAuthoredSources(root: string): Promise<AnalysisResult> { return analyzeAuthoredSources(new GitRepositorySnapshot(), { root, mode: "staged" }); }
export async function analyzeDocumentationRevision(root: string, revision: string, changes?: readonly GitChange[]): Promise<AnalysisResult> { return analyzeDocumentation(new GitRepositorySnapshot(), { root, mode: "revision", revision, changes }); }
export async function analyzeAuthoredSourceRevision(root: string, revision: string, changes?: readonly GitChange[]): Promise<AnalysisResult> { return analyzeAuthoredSources(new GitRepositorySnapshot(), { root, mode: "revision", revision, changes }); }
export async function changedGitEntries(root: string, base: string, head: string): Promise<readonly GitChange[]> { return new GitRepositorySnapshot().changedEntries(root, base, head); }
export async function checkAuthoredPath(root: string, path: string) { return checkPath(root, path, new FileSystemSnapshot(), new BunCommandRunner()); }

export interface ProviderPostWriteResult {
  readonly event: ProviderPathEvent;
  readonly result: Awaited<ReturnType<typeof checkPath>>;
}

function eventCwd(input: unknown): string {
  if (typeof input !== "object" || input === null || Array.isArray(input)) throw new Error("expected an event object");
  const cwd = (input as Record<string, unknown>).cwd;
  if (typeof cwd !== "string" || cwd === "") throw new Error("expected event cwd");
  return cwd;
}

const execute = promisify(execFile);

async function gitRoot(cwd: string): Promise<string> {
  try {
    const result = await execute("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8" });
    return resolve(result.stdout.trim());
  } catch {
    throw new Error("could not resolve the Git repository root");
  }
}

async function physicalPath(path: string): Promise<string> {
  const missing: string[] = [];
  let current = path;
  while (true) {
    try { return join(await realpath(current), ...missing.reverse()); }
    catch {
      const parent = dirname(current);
      if (parent === current) throw new Error("event path could not be resolved");
      missing.push(current.slice(parent.length + 1));
      current = parent;
    }
  }
}

async function repositoryPath(root: string, cwd: string, path: string): Promise<string> {
  const resolved = isAbsolute(path) ? resolve(path) : resolve(cwd, path);
  const value = relative(root, resolved).replaceAll("\\", "/");
  const physicalRoot = await realpath(root);
  const physicalTarget = await physicalPath(resolved);
  const physicalValue = relative(physicalRoot, physicalTarget);
  if (value === "" || value === ".." || value.startsWith("../") || isAbsolute(value) || physicalValue === ".." || physicalValue.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) || isAbsolute(physicalValue)) throw new Error("event path is outside the Git repository");
  return value;
}

export async function checkProviderPostWrite(provider: "claude" | "codex", input: unknown): Promise<readonly ProviderPostWriteResult[]> {
  const cwd = resolve(eventCwd(input));
  const root = await gitRoot(cwd);
  const parsed = provider === "claude" ? parseClaudePostToolUse(input) : parseCodexPostToolUse(input);
  const normalizedEvents = await Promise.all(parsed.map(async (event) => ({ ...event, path: await repositoryPath(root, cwd, event.path) })));
  const events = [...new Map(normalizedEvents.map((event) => [`${event.operation}:${event.path}`, event] as const)).values()].sort((left, right) => left.path.localeCompare(right.path) || left.operation.localeCompare(right.operation));
  if (events.length === 0) throw new Error("event contains no valid paths");
  const snapshots = new FileSystemSnapshot();
  const runner = new BunCommandRunner();
  return Promise.all(events.map(async (event) => ({ event, result: await checkPath(root, event.path, snapshots, runner, event.operation) })));
}
