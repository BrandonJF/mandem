/** @fileoverview Local quality reporter completes checks before posting commit status. */
import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { reportLocalQuality, type QualityCommandRunner } from "../infrastructure/services/local-quality-reporter";

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
