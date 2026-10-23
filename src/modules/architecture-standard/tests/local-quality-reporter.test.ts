/** @fileoverview Local quality reporter completes checks before posting commit status. */
import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { reportLocalQuality, executeQualityCommand, resolvePersistentQualityDirectory, type QualityCommandRunner } from "../infrastructure/services/local-quality-reporter";

const roots: string[] = [];
afterEach(() => { for(const root of roots.splice(0)) rmSync(root,{recursive:true,force:true}); });
const sha = "a".repeat(40);
function fixture(fail?: string, head = sha) {
  const root=mkdtempSync(join(tmpdir(),"quality-reporter-test-")); roots.push(root);
  const commands: string[][]=[];
  let checkout="";
  const run: QualityCommandRunner = async (command,cwd,logFile) => {
    commands.push([...command]);
    if(command[0]==="gh" && command[1]==="pr") return {exitCode:0,stdout:JSON.stringify({headRefOid:head})};
    if(command[0]==="git" && command[1]==="worktree" && command[2]==="add") {
      checkout=command[4]!;
      mkdirSync(join(checkout,".github/workflows"),{recursive:true});
      writeFileSync(join(checkout,".github/workflows/repository-quality.yml"),"steps:\n  - run: bun install --frozen-lockfile\n  - run: bun run check\n  - run: bun run build\n  - run: git issue fsck\n");
    }
    if(command.join(" ")===fail) return {exitCode:1,stdout:"failed as configured"};
    if(command[0]==="git" && command[1]==="rev-parse") return {exitCode:0,stdout:sha};
    if(command[0]==="git" && command[1]==="issue" && command[2]==="version") return {exitCode:0,stdout:"git-issue version 1.3.3"};
    if(command[0]==="bun") {
      expect(cwd).toBe(checkout);
      expect(commands.some(row=>row[0]==="gh" && row[1]==="api")).toBe(false);
      writeFileSync(logFile,`ran ${command.join(" ")}\n`,{flag:"a"});
    }
    return {exitCode:0,stdout:""};
  };
  return {root,commands,run};
}
describe("local repository quality",()=>{
  it("checks the exact clean head and completes all workflow targets before posting success",async()=>{
    const f=fixture();
    const result=await reportLocalQuality({pr:52,sha,repositoryRoot:f.root,logDirectory:f.root},f.run);
    expect(result.state).toBe("success");
    expect(f.commands.filter(row=>row[0]==="bun")).toEqual([["bun","install","--frozen-lockfile"],["bun","run","check"],["bun","run","build"]]);
    expect(f.commands).toContainEqual(["git","status","--porcelain"]);
    expect(f.commands).toContainEqual(["git","rev-parse","HEAD"]);
    expect(f.commands).toContainEqual(["git","issue","fsck"]);
    const posted=f.commands.find(row=>row[0]==="gh" && row[1]==="api")!;
    expect(posted).toContain(`repos/BrandonJF/mandem/statuses/${sha}`);
    expect(posted).toContain("context=repository-quality");
    expect(posted).toContain("state=success");
    expect(readFileSync(result.logFile,"utf8")).toContain("bun run check");
  });
  it("posts failure and never success or later targets after a failed check",async()=>{
    const f=fixture("bun run check");
    const result=await reportLocalQuality({pr:52,sha,repositoryRoot:f.root,logDirectory:f.root},f.run);
    expect(result.state).toBe("failure");
    expect(f.commands.some(row=>row.includes("state=success"))).toBe(false);
    expect(f.commands.find(row=>row[0]==="gh" && row[1]==="api")).toContain("state=failure");
    expect(f.commands).not.toContainEqual(["bun","run","build"]);
  });
  it("rejects a mismatched PR head without posting a status",async()=>{
    const f=fixture(undefined,"b".repeat(40));
    await expect(reportLocalQuality({pr:52,sha,repositoryRoot:f.root,logDirectory:f.root},f.run)).rejects.toThrow("head");
    expect(f.commands.some(row=>row[0]==="gh" && row[1]==="api")).toBe(false);
  });
});

it("fails without installing or checking a dirty disposable checkout", async () => {
  const f=fixture();
  const run: QualityCommandRunner = (command,cwd,log) => command.join(" ")==="git status --porcelain"
    ? Promise.resolve({exitCode:0,stdout:" M package.json"}) : f.run(command,cwd,log);
  const result=await reportLocalQuality({pr:52,sha,repositoryRoot:f.root,logDirectory:f.root},run);
  expect(result.state).toBe("failure");
  expect(f.commands.some(row=>row[0]==="bun")).toBe(false);
  expect(f.commands.some(row=>row.includes("state=success"))).toBe(false);
});

it("fails if the checkout resolves to a different commit", async () => {
  const f=fixture();
  const run: QualityCommandRunner = (command,cwd,log) => command.join(" ")==="git rev-parse HEAD"
    ? Promise.resolve({exitCode:0,stdout:"b".repeat(40)}) : f.run(command,cwd,log);
  const result=await reportLocalQuality({pr:52,sha,repositoryRoot:f.root,logDirectory:f.root},run);
  expect(result.state).toBe("failure");
  expect(f.commands.some(row=>row[0]==="bun")).toBe(false);
  expect(f.commands.some(row=>row.includes("state=success"))).toBe(false);
});


it.each(["HEAD", "tracked sources"])("fails when checks change %s before cleanup", async (changed) => {
  const f = fixture();
  let complete = false;
  const run: QualityCommandRunner = async (command, cwd, log, environment) => {
    if (command.join(" ") === "git issue fsck") complete = true;
    if (complete && command.join(" ") === "git rev-parse HEAD" && changed === "HEAD") return { exitCode: 0, stdout: "b".repeat(40) };
    if (complete && command.join(" ").startsWith("git status --porcelain") && changed === "tracked sources") return { exitCode: 0, stdout: " M package.json" };
    return f.run(command, cwd, log, environment);
  };
  const result = await reportLocalQuality({ pr: 54, sha, repositoryRoot: f.root, logDirectory: f.root }, run);
  expect(result.state).toBe("failure");
  expect(f.commands.some(row => row.includes("state=success"))).toBe(false);
});

it("gives GitHub credential variables only to the final status post", async () => {
  const f = fixture();
  const previous = process.env.GH_TOKEN;
  process.env.GH_TOKEN = "review-secret";
  try {
    const run: QualityCommandRunner = (command, cwd, log, environment) => {
      expect(environment?.GH_TOKEN).toBe(command[0] === "gh" && command[1] === "api" ? "review-secret" : undefined);
      expect(environment?.GITHUB_TOKEN).toBeUndefined();
      return f.run(command, cwd, log, environment);
    };
    expect((await reportLocalQuality({ pr: 54, sha, repositoryRoot: f.root, logDirectory: f.root }, run)).state).toBe("success");
  } finally { if (previous === undefined) delete process.env.GH_TOKEN; else process.env.GH_TOKEN = previous; }
});

it("redacts credential values and GitHub token patterns from retained subprocess output", async () => {
  const f = fixture();
  const log = join(f.root, "output.log");
  const previous = process.env.GH_TOKEN;
  process.env.GH_TOKEN = "known+review/secret=";
  try {
    const result = await executeQualityCommand([process.execPath, "-e", `
      const secret = 'known+review/secret=';
      process.stdout.write(secret.slice(0, 6));
      setTimeout(() => {
        process.stdout.write(secret.slice(6) + ' ' + Buffer.from(secret).toString('base64') + ' ' + encodeURIComponent(secret));
        process.stderr.write('ghp_' + 'a'.repeat(36) + ' github_pat_' + 'b'.repeat(40));
      }, 100);
    `], f.root, log, {});
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("[REDACTED]");
    const output = readFileSync(log, "utf8");
    expect(output).not.toContain("known+review/secret=");
    expect(output).not.toContain(Buffer.from("known+review/secret=").toString("base64"));
    expect(output).not.toContain(encodeURIComponent("known+review/secret="));
    expect(output).not.toMatch(/ghp_|github_pat_/);
    expect(output).toContain("[REDACTED]");
  } finally { if (previous === undefined) delete process.env.GH_TOKEN; else process.env.GH_TOKEN = previous; }
});

it("rejects temporary log locations, including a symlink, before running commands", async () => {
  const f = fixture();
  const link = join(f.root, "temporary-link");
  symlinkSync("/tmp", link);
  for (const logDirectory of ["/tmp", link]) {
    expect(() => resolvePersistentQualityDirectory(logDirectory)).toThrow(/persistent/);
  }
  expect(f.commands).toEqual([]);
});


it.each([0, 1])("verifies sources immediately after install exits %s, before another target or cleanup", async (exitCode) => {
  const f = fixture();
  let dirty = false;
  const trace: string[] = [];
  const run: QualityCommandRunner = async (command, cwd, log, environment) => {
    const text = command.join(" ");
    trace.push(text);
    if (text === "bun install --frozen-lockfile") { dirty = true; return { exitCode, stdout: "" }; }
    if (text === "bun run build") dirty = false;
    if (dirty && text.startsWith("git status --porcelain")) return { exitCode: 0, stdout: " M package.json" };
    return f.run(command, cwd, log, environment);
  };
  const result = await reportLocalQuality({ pr: 54, sha, repositoryRoot: f.root, logDirectory: f.root }, run);
  expect(result.state).toBe("failure");
  const install = trace.indexOf("bun install --frozen-lockfile");
  expect(trace.slice(install + 1, install + 3)).toEqual(["git rev-parse HEAD", "git status --porcelain --untracked-files=no"]);
  expect(trace).not.toContain("bun run check");
  expect(trace.indexOf("git status --porcelain --untracked-files=no")).toBeLessThan(trace.findIndex(row => row.startsWith("git worktree remove")));
  expect(f.commands.some(row => row.includes("state=success"))).toBe(false);
});
