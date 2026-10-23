/** @fileoverview Run exact-head local quality checks and report their completed result. */
import { spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statfsSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

export type QualityCommandRunner = (command: readonly string[], cwd: string, logFile: string, environment?: NodeJS.ProcessEnv) => Promise<{ exitCode: number; stdout: string }>;
export interface LocalQualityOptions { pr: number; sha: string; repositoryRoot?: string; logDirectory?: string; }
const repository = "BrandonJF/mandem";
const qualityCommands = [["bun", "install", "--frozen-lockfile"], ["bun", "run", "check"], ["bun", "run", "build"], ["git", "issue", "fsck"]];

const credentialNames = ["GH_TOKEN", "GITHUB_TOKEN", "GH_ENTERPRISE_TOKEN", "GITHUB_ENTERPRISE_TOKEN"];
function redact(text: string): string {
  for (const name of credentialNames) {
    const secret = process.env[name];
    if (secret) text = text.replaceAll(secret, "[REDACTED]");
  }
  return text.replace(/\b(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)\b/g, "[REDACTED]");
}
export function resolvePersistentQualityDirectory(path: string): string {
  const absolute = resolve(path);
  let ancestor = absolute;
  while (!existsSync(ancestor)) ancestor = dirname(ancestor);
  const physical = resolve(realpathSync(ancestor), absolute.slice(ancestor.length).replace(/^\//, ""));
  if (["/tmp", "/var/tmp", "/dev/shm"].some(base => physical === base || physical.startsWith(`${base}/`)) || statfsSync(ancestor).type === 0x01021994) {
    throw new Error("Use a persistent filesystem for local quality logs and scratch");
  }
  return physical;
}
export const executeQualityCommand: QualityCommandRunner = async (command, cwd, logFile, environment = {}) => new Promise((resolve, reject) => {
  const temporaryDirectory = join(dirname(logFile), "tmp");
  mkdirSync(temporaryDirectory, { recursive: true, mode: 0o700 });
  const child = spawn(command[0]!, command.slice(1), { cwd, stdio: ["ignore", "pipe", "pipe"],
    env: { ...environment, TMPDIR: temporaryDirectory, TMP: temporaryDirectory, TEMP: temporaryDirectory } });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  // Buffer output so a credential split across process chunks still gets redacted.
  child.stdout.on("data", (chunk: string) => { stdout += chunk; });
  child.stderr.on("data", (chunk: string) => { stderr += chunk; });
  child.on("error", reject);
  child.on("close", code => {
    appendFileSync(logFile, redact(stdout + stderr));
    resolve({ exitCode: code ?? 1, stdout: redact(stdout) });
  });
});

export async function reportLocalQuality(options: LocalQualityOptions, run: QualityCommandRunner = executeQualityCommand) {
  if (!Number.isInteger(options.pr) || options.pr <= 0 || !/^[a-f0-9]{40}$/.test(options.sha)) throw new Error("Supply a PR number and its full 40-character head SHA");
  const root = options.repositoryRoot ?? process.cwd();
  const directory = resolvePersistentQualityDirectory(options.logDirectory ?? join(homedir(), ".local", "state", "mandem", "local-ci"));
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const logFile = join(directory, `${options.sha}-${randomUUID()}.log`);
  writeFileSync(logFile, `Repository: ${repository}\nPR: ${options.pr}\nHead: ${options.sha}\nStarted: ${new Date().toISOString()}\n`, { mode: 0o600 });
  console.log(`Local quality log: ${logFile}`);
  async function checked(command: string[], cwd = root) {
    appendFileSync(logFile, redact(`\n$ ${command.map(value => JSON.stringify(value)).join(" ")}\n`));
    const environment = { ...process.env };
    if (command[0] !== "gh") for (const name of credentialNames) delete environment[name];
    const result = await run(command, cwd, logFile, environment);
    if (result.exitCode !== 0) throw new Error(`${command.join(" ")} exited ${result.exitCode}`);
    return result.stdout.trim();
  }
  const pr = JSON.parse(await checked(["gh", "pr", "view", String(options.pr), "-R", repository, "--json", "headRefOid"])) as { headRefOid?: string };
  if (pr.headRefOid !== options.sha) throw new Error(`Requested SHA differs from PR head; no status posted. Log: ${logFile}`);
  const scratch = mkdtempSync(join(directory, "run-"));
  const checkout = join(scratch, "checkout");
  let created = false;
  let removed = false;
  let failure: string | undefined;
  try {
    await checked(["git", "fetch", `git@github.com:${repository}.git`, options.sha]);
    await checked(["git", "fetch", `git@github.com:${repository}.git`, "+refs/issues/*:refs/issues/*"]);
    await checked(["git", "worktree", "add", "--detach", checkout, options.sha]);
    created = true;
    if (await checked(["git", "rev-parse", "HEAD"], checkout) !== options.sha) throw new Error("Disposable checkout does not match requested SHA");
    if (await checked(["git", "status", "--porcelain"], checkout)) throw new Error("Disposable checkout is dirty before quality checks");
    if (await checked(["git", "issue", "version"], checkout) !== "git-issue version 1.3.3") throw new Error("Install the workflow's git-issue version 1.3.3 before reporting quality");
    const workflow = readFileSync(join(checkout, ".github/workflows/repository-quality.yml"), "utf8");
    const targets = [...workflow.matchAll(/^\s*- run: (.+)$/gm)].map(match => match[1]!.trim());
    if (JSON.stringify(targets) !== JSON.stringify(qualityCommands.map(command => command.join(" ")))) throw new Error("Workflow quality commands changed; update this reporter before running them");
    for (const command of qualityCommands) await checked(command, checkout);
    if (await checked(["git", "rev-parse", "HEAD"], checkout) !== options.sha) throw new Error("Quality commands changed the checked-out HEAD");
    if (await checked(["git", "status", "--porcelain", "--untracked-files=no"], checkout)) throw new Error("Quality commands changed tracked sources");
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
    appendFileSync(logFile, redact(`\nQuality failed: ${failure}\n`));
  } finally {
    if (created) {
      try { await checked(["git", "worktree", "remove", "--force", checkout]); removed = true; }
      catch (error) {
        failure ??= `Disposable checkout cleanup failed: ${String(error)}`;
        appendFileSync(logFile, redact(`\n${failure}\n`));
      }
    }
    // Only remove this run's scratch directory after Git removed its worktree.
    if (!created || removed) rmSync(scratch, { recursive: true, force: true });
  }
  const state = failure ? "failure" : "success";
  appendFileSync(logFile, `\nCompleted: ${new Date().toISOString()}\nResult: ${state}\n`);
  await checked(["gh", "api", "--method", "POST", `repos/${repository}/statuses/${options.sha}`,
    "-f", `state=${state}`, "-f", "context=repository-quality", "-f",
    `description=${failure ? `Local quality failed: ${failure}`.slice(0, 140) : "Local install, check, build and issue validation passed"}`]);
  return { sha: options.sha, state, logFile, ...(failure ? { failure } : {}) };
}
