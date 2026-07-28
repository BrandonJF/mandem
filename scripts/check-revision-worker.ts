/** @fileoverview Reconciles and executes one bounded exact-revision verification transaction. */
import { execFileSync, spawn } from "node:child_process";
import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  statfsSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve, sep } from "node:path";
import { randomBytes } from "node:crypto";

interface RunRecord {
  readonly schemaVersion: 1;
  readonly runId: string;
  readonly canonicalCheckout: string;
  readonly commonGitDirectory: string;
  readonly commit: string;
  readonly runDirectory: string;
  readonly checkoutPath: string;
  readonly createdAt: string;
}

const maximumBytes = 8 * 1024 ** 3;
const reserveBytes = 2 * 1024 ** 3;
const recordKeys = [
  "schemaVersion", "runId", "canonicalCheckout", "commonGitDirectory",
  "commit", "runDirectory", "checkoutPath", "createdAt",
] as const;

function fail(message: string): never {
  throw new Error(message);
}

function directoryFsync(path: string): void {
  const descriptor = openSync(path, "r");
  try { fsyncSync(descriptor); } finally { closeSync(descriptor); }
}

function durableJson(path: string, temporary: string, value: RunRecord): void {
  const descriptor = openSync(temporary, "wx", 0o600);
  try {
    writeFileSync(descriptor, `${JSON.stringify(value)}\n`);
    fsyncSync(descriptor);
  } finally { closeSync(descriptor); }
  renameSync(temporary, path);
  directoryFsync(dirname(path));
}

function isContained(parent: string, child: string): boolean {
  return child === parent || child.startsWith(`${parent}${sep}`);
}

function parseRecord(path: string): RunRecord {
  const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) fail(`invalid transaction record: ${path}`);
  const value = raw as Readonly<Record<string, unknown>>;
  if (
    Object.keys(value).sort().join("\0") !== [...recordKeys].sort().join("\0") ||
    value.schemaVersion !== 1 ||
    !recordKeys.slice(1).every((key) => typeof value[key] === "string" && value[key] !== "")
  ) fail(`invalid transaction record: ${path}`);
  return value as unknown as RunRecord;
}

function validateRecord(
  record: RunRecord,
  canonicalCheckout: string,
  commonGitDirectory: string,
  runsDirectory: string,
): void {
  const runPattern = /^run-([0-9a-f]{40})-([0-9a-f]{32})$/;
  const match = runPattern.exec(record.runId);
  if (
    !match || match[1] !== record.commit ||
    record.canonicalCheckout !== canonicalCheckout ||
    record.commonGitDirectory !== commonGitDirectory ||
    record.runDirectory !== join(runsDirectory, record.runId) ||
    record.checkoutPath !== join(record.runDirectory, "checkout") ||
    !isContained(runsDirectory, record.runDirectory) ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(record.createdAt)
  ) fail("transaction record does not match this repository");
}

function worktreeEntries(root: string): readonly { path: string; head: string; detached: boolean }[] {
  const output = execFileSync("git", ["worktree", "list", "--porcelain"], { cwd: root, encoding: "utf8" });
  return output.trim().split(/\n\n+/).filter(Boolean).map((section) => {
    const lines = section.split("\n");
    return {
      path: lines[0]?.slice("worktree ".length) ?? "",
      head: lines.find((line) => line.startsWith("HEAD "))?.slice(5) ?? "",
      detached: lines.includes("detached"),
    };
  });
}

function reconcile(
  root: string,
  verificationDirectory: string,
  runsDirectory: string,
  canonicalCheckout: string,
  commonGitDirectory: string,
): void {
  if (!existsSync(verificationDirectory)) return;
  const verificationStat = lstatSync(verificationDirectory);
  if (!verificationStat.isDirectory() || verificationStat.isSymbolicLink()) fail("verification namespace is not a real directory");
  if (!existsSync(runsDirectory)) {
    const entries = Array.from(new Bun.Glob("*").scanSync({ cwd: verificationDirectory, dot: true }));
    if (entries.length !== 0) fail("verification namespace requires manual inspection");
    mkdirSync(runsDirectory);
    directoryFsync(verificationDirectory);
    return;
  }
  const runsStat = lstatSync(runsDirectory);
  if (!runsStat.isDirectory() || runsStat.isSymbolicLink()) fail("verification runs path is not a real directory");
  const manifestPath = join(verificationDirectory, "active-run.json");
  const entries = Array.from(new Bun.Glob("*").scanSync({ cwd: verificationDirectory, dot: true }));
  if (!existsSync(manifestPath)) {
    if (entries.some((entry) => entry !== "runs")) fail("verification namespace requires manual inspection");
    const runEntries = Array.from(new Bun.Glob("*").scanSync({ cwd: runsDirectory, dot: true }));
    if (runEntries.length !== 0) fail("unmanifested verification run requires manual inspection");
    return;
  }
  if (entries.some((entry) => entry !== "runs" && entry !== "active-run.json")) fail("verification namespace requires manual inspection");
  const record = parseRecord(manifestPath);
  validateRecord(record, canonicalCheckout, commonGitDirectory, runsDirectory);
  if (existsSync(record.runDirectory)) {
    const runStat = lstatSync(record.runDirectory);
    if (!runStat.isDirectory() || runStat.isSymbolicLink() || realpathSync(record.runDirectory) !== record.runDirectory) {
      fail(`unsafe run directory: ${record.runDirectory}`);
    }
    const markerPath = join(record.runDirectory, "owner.json");
    if (existsSync(markerPath)) {
      const marker = parseRecord(markerPath);
      validateRecord(marker, canonicalCheckout, commonGitDirectory, runsDirectory);
      if (JSON.stringify(marker) !== JSON.stringify(record)) fail("ownership marker does not match transaction record");
    } else if (Array.from(new Bun.Glob("*").scanSync({ cwd: record.runDirectory, dot: true })).length !== 0) {
      fail(`unmarked run directory requires manual inspection: ${record.runDirectory}`);
    }
    const registrations = worktreeEntries(root).filter((entry) => resolve(entry.path) === record.checkoutPath);
    if (registrations.length > 1) fail("multiple verification worktree registrations found");
    if (registrations.length === 1) {
      const registration = registrations[0];
      if (!registration?.detached || registration.head !== record.commit) fail("verification worktree registration does not match transaction");
      execFileSync("git", ["worktree", "remove", "--force", record.checkoutPath], { cwd: root, encoding: "utf8" });
    } else if (existsSync(record.checkoutPath)) {
      rmSync(record.checkoutPath, { recursive: true, force: true });
    }
    rmSync(record.runDirectory, { recursive: true });
    directoryFsync(runsDirectory);
  }
  unlinkSync(manifestPath);
  directoryFsync(verificationDirectory);
}

function ensurePersistent(path: string): void {
  const mountInfo = readFileSync("/proc/self/mountinfo", "utf8").trim().split("\n");
  const decoded = mountInfo.map((line) => {
    const [left, right] = line.split(" - ");
    const fields = left?.split(" ") ?? [];
    return { mount: (fields[4] ?? "").replaceAll("\\040", " "), type: right?.split(" ")[0] ?? "" };
  }).filter((entry) => entry.mount && isContained(entry.mount, path))
    .sort((a, b) => b.mount.length - a.mount.length)[0];
  if (!decoded || !["ext2", "ext3", "ext4", "xfs", "btrfs", "zfs"].includes(decoded.type)) {
    fail(`verification storage must use a supported persistent filesystem, found ${decoded?.type || "unknown"}`);
  }
}

function directoryBytes(path: string): number {
  if (!existsSync(path)) return 0;
  const result = execFileSync("du", ["-sb", path], { encoding: "utf8" }).trim().split(/\s+/)[0];
  return Number(result ?? maximumBytes);
}

async function runBounded(
  executable: string,
  arguments_: readonly string[],
  cwd: string,
  environment: NodeJS.ProcessEnv,
  runDirectory: string,
  timeoutMilliseconds: number,
): Promise<number> {
  return await new Promise((resolvePromise, reject) => {
    const child = spawn(executable, [...arguments_], {
      cwd, env: environment, detached: true, stdio: ["ignore", "inherit", "inherit"],
    });
    let reason: string | undefined;
    const stop = (message: string): void => {
      if (reason) return;
      reason = message;
      try { process.kill(-child.pid!, "SIGTERM"); } catch { /* The process may have exited. */ }
      setTimeout(() => {
        try { process.kill(-child.pid!, "SIGKILL"); } catch { /* The process may have exited. */ }
      }, 2_000).unref();
    };
    const timer = setTimeout(() => stop(`child exceeded ${timeoutMilliseconds / 60_000} minute timeout`), timeoutMilliseconds);
    const watcher = setInterval(() => {
      const stats = statfsSync(runDirectory);
      if (directoryBytes(runDirectory) >= maximumBytes) stop("verification run reached the 8 GiB limit");
      else if (stats.bavail * stats.bsize <= reserveBytes) stop("verification filesystem reached the 2 GiB reserve");
    }, 250);
    child.once("error", reject);
    child.once("exit", (code) => {
      clearTimeout(timer); clearInterval(watcher);
      if (reason) reject(new Error(reason));
      else resolvePromise(code ?? 2);
    });
  });
}

async function main(): Promise<void> {
  const root = process.cwd();
  const commonGitDirectory = realpathSync(execFileSync(
    "git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: root, encoding: "utf8" },
  ).trim());
  const canonicalCheckout = realpathSync(dirname(commonGitDirectory));
  const namespaceParent = join(dirname(canonicalCheckout), `${basename(canonicalCheckout)}-worktrees`);
  mkdirSync(namespaceParent, { recursive: true });
  ensurePersistent(realpathSync(namespaceParent));
  const verificationDirectory = join(namespaceParent, ".verification");
  const runsDirectory = join(verificationDirectory, "runs");
  if (!existsSync(verificationDirectory)) {
    mkdirSync(verificationDirectory);
    directoryFsync(namespaceParent);
  }
  if (!existsSync(runsDirectory)) {
    mkdirSync(runsDirectory);
    directoryFsync(verificationDirectory);
  }
  reconcile(root, verificationDirectory, runsDirectory, canonicalCheckout, commonGitDirectory);
  if (Bun.argv[2] === "--reconcile-only") {
    console.log("revision verification state is clean");
    return;
  }
  const requested = Bun.argv[2];
  if (!requested) fail("missing revision");
  const commit = execFileSync("git", ["rev-parse", "--verify", `${requested}^{commit}`], {
    cwd: root, encoding: "utf8",
  }).trim();
  if (!/^[0-9a-f]{40}$/.test(commit)) fail("revision did not resolve to a commit");
  const runId = `run-${commit}-${randomBytes(16).toString("hex")}`;
  const runDirectory = join(runsDirectory, runId);
  const checkoutPath = join(runDirectory, "checkout");
  const record: RunRecord = {
    schemaVersion: 1, runId, canonicalCheckout, commonGitDirectory, commit,
    runDirectory, checkoutPath, createdAt: new Date().toISOString(),
  };
  const manifestPath = join(verificationDirectory, "active-run.json");
  durableJson(manifestPath, `${manifestPath}.tmp-${runId}`, record);
  mkdirSync(runDirectory);
  directoryFsync(runsDirectory);
  durableJson(join(runDirectory, "owner.json"), join(runDirectory, `owner.json.tmp-${runId}`), record);
  let result = 2;
  try {
    execFileSync("git", ["worktree", "add", "--detach", checkoutPath, commit], { cwd: root, encoding: "utf8" });
    const temporary = join(runDirectory, "tmp");
    const cache = join(runDirectory, "bun-cache");
    mkdirSync(temporary);
    const environment = { ...process.env, TMPDIR: temporary, TMP: temporary, TEMP: temporary };
    const install = await runBounded("bun", ["install", "--frozen-lockfile", "--cache-dir", cache], checkoutPath, environment, runDirectory, 10 * 60_000);
    if (install !== 0) fail("dependency installation failed");
    result = await runBounded("bun", ["run", "check:revision-target"], checkoutPath, environment, runDirectory, 20 * 60_000);
  } finally {
    reconcile(root, verificationDirectory, runsDirectory, canonicalCheckout, commonGitDirectory);
  }
  if (result === 1) process.exit(1);
  if (result !== 0) fail("revision quality gate failed to execute");
  console.log(`revision ${commit} passed the repository quality gate`);
}

try {
  await main();
} catch (error: unknown) {
  console.error(`revision checker failed: ${error instanceof Error ? error.message : "unexpected error"}`);
  process.exit(2);
}
