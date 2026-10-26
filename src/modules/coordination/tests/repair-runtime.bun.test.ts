/** @fileoverview Default-off HTTP and separate CLI repair journeys with fake consumer commands. */
import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { startCoordinationServer } from "../api/composition";
import type { RepairEffect, RepairSnapshot } from "../domain/repairs";
const repository = "team/project"; const roots: string[] = []; const servers: ReturnType<typeof startCoordinationServer>[] = [];
afterEach(async () => { for (const server of servers.splice(0)) await server.stop(); for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
function root() { const parent = join(homedir(), ".local/state/mandem/test-fixtures"); mkdirSync(parent, { recursive: true, mode: 0o700 }); const directory = mkdtempSync(join(parent, "repair-runtime-")); roots.push(directory); return directory; }
function snapshot(): RepairSnapshot { return { repository, observedAt: new Date().toISOString(), main: { state: "red", head: "a".repeat(40) }, issue: { ref: { repository, number: 9 }, state: "open", priority: 0 }, pulls: [{ ref: { repository, number: 1 }, head: "b".repeat(40), createdAt: "2026-10-24T20:00:00.000Z", open: true, draft: false, ready: true, base: "main", linkedIssues: [{ repository, number: 9 }] }] }; }
async function check(url: string) { return fetch(url + "/repairs/check", { method: "POST" }); }
test("default startup exposes read-only repairs but disables policy effects", async () => {
  const server = startCoordinationServer({ databasePath: join(root(), "coord.sqlite"), port: 0, herdr: false }); servers.push(server);
  expect((await check(server.url)).status).toBe(503);
  expect(await (await fetch(server.url + "/repairs")).json()).toEqual([]);
});
test("actual HTTP events designate the exact pair once and clear obsolete authority", async () => {
  const value = snapshot(); const applied: RepairEffect[] = [];
  const server = startCoordinationServer({ databasePath: join(root(), "coord.sqlite"), port: 0, herdr: false,
    repairs: { repository, consumer: { async observe() { return { ...value, observedAt: new Date().toISOString() }; }, async apply(effect) { applied.push(effect); } } } }); servers.push(server);
  expect((await check(server.url)).ok).toBe(true); expect((await check(server.url)).ok).toBe(true);
  expect(applied).toHaveLength(1); expect(applied[0]?.target?.main).toBe("a".repeat(40)); expect(applied[0]?.target?.head).toBe("b".repeat(40));
  value.issue = null; expect((await check(server.url)).ok).toBe(true); expect(applied[1]?.target).toBeNull();
});
test("separate CLI uses the fixed configured command and never republishes a completed target", async () => {
  const directory = root(); const events = join(directory, "effects.jsonl"); const script = join(directory, "consumer.ts");
  writeFileSync(script, "const request=JSON.parse(await Bun.stdin.text());const {appendFileSync}=await import('node:fs');appendFileSync(" + JSON.stringify(events) + ",JSON.stringify(request)+'\\n');if(request.action.kind==='observe')console.log(JSON.stringify({..."+JSON.stringify(snapshot())+",observedAt:new Date().toISOString()}));else console.log(JSON.stringify({ok:true}));");
  const config = join(directory, "consumer.json"); writeFileSync(config, JSON.stringify({ version: 1, repository: "Team/Project", command: [process.execPath, script] }));
  const server = startCoordinationServer({ databasePath: join(directory, "coord.sqlite"), port: 0, herdr: false, repairConfigPath: config }); servers.push(server);
  for (const args of [["repair", "check"], ["repair", "check"], ["repairs"]]) {
    const child = Bun.spawn([process.execPath, "src/cli/main.ts", ...args], { env: { ...process.env, HERDR_ENV: "0", MANDEM_COORD_URL: server.url }, stdout: "pipe", stderr: "pipe" });
    const output = await new Response(child.stdout).text(); const error = await new Response(child.stderr).text();
    expect(await child.exited, error).toBe(0); expect(output).toContain(repository);
  }
  const rows: { action: { kind: string; effect?: RepairEffect } }[] = readFileSync(events, "utf8").trim().split("\n").map(line => JSON.parse(line));
  const writes = rows.filter(row => row.action.kind === "apply"); expect(writes).toHaveLength(1); expect(writes[0]?.action.effect?.target?.number).toBe(1);
});
