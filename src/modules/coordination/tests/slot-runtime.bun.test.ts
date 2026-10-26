/** @fileoverview Automatic typed-stop refill and installed CLI/configured-command journeys with no Herdr. */
import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { startCoordinationServer } from "../api/composition";
import type { SlotSnapshot, SlotTask } from "../domain/slots";
const repository = "team/project";
const releases: (() => void)[] = [];
const roots: string[] = []; const servers: ReturnType<typeof startCoordinationServer>[] = [];
afterEach(async () => { for (const release of releases.splice(0)) release(); for (const server of servers.splice(0)) await server.stop(); for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
function root() { const value = mkdtempSync(join(tmpdir(), "slot-runtime-")); roots.push(value); return value; }
function snapshot(): SlotSnapshot { return { repository, observedAt: new Date().toISOString(), owners: [], diagnostics: [], main: { state: "green", head: "a".repeat(40) }, issues: [{ ref: { repository, number: 1 }, revision: "1", state: "open", kind: "product", priority: 1, estimate: 1, outcome: "Save work", scope: "One change", acceptance: "Test passes", blocked: false, userDecision: false, openPull: false, openDependencies: [] }] }; }
async function post(url: string, path: string, body: unknown) { return fetch(url + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); }
test("default startup leaves refill effects disabled", async () => {
  const server = startCoordinationServer({ databasePath: join(root(), "coord.sqlite"), port: 0, herdr: false }); servers.push(server);
  expect((await post(server.url, "/slots/check", {})).status).toBe(503);
});
test("a real typed stop automatically refills one product slot through configured fake effects", async () => {
  const observed = snapshot(); const launches: SlotTask[] = [];
  let complete: () => void = () => {}; const launched = new Promise<void>(resolve => { complete = resolve; });
  const server = startCoordinationServer({ databasePath: join(root(), "coord.sqlite"), port: 0, herdr: false,
    slots: { repository, template: { name: "engineer", revision: "v1" }, consumer: { async observe() { return { ...observed, observedAt: new Date().toISOString() }; }, async launch(task) { launches.push(task); complete(); return { session: "new-engineer", paneId: "fake:p1" }; }, async report() {} } } }); servers.push(server);
  for (const number of [100,101,102,103]) {
    const session = `owner-${number}`;
    expect((await post(server.url, "/sessions/register", { session, role: "engineer", data: { stream: `issue:${number}`, ownerRole: "orchestrator" } })).ok).toBe(true);
  }
  const registered: { sessions: { session: string; data: { streamAssignment: string } }[] } = await (await fetch(server.url + "/sessions")).json();
  observed.owners = registered.sessions.map(row => ({ session: row.session, assignment: row.data.streamAssignment, ref: { repository, number: Number(row.session.slice(6)) }, kind: Number(row.session.slice(6)) < 102 ? "product" : "platform", priority: 1, state: "working", released: false }));
  expect((await post(server.url, "/slots/check", {})).ok).toBe(true); expect(launches).toHaveLength(0);
  expect((await post(server.url, "/sessions/stop", { id: "done-owner-100", session: "owner-100", kind: "done" })).ok).toBe(true);
  await launched;
  expect(launches.map(task => task.issue.ref.number)).toEqual([1]);
  expect((await post(server.url, "/sessions/stop", { id: "done-owner-100", session: "owner-100", kind: "done" })).ok).toBe(true);
  expect(launches).toHaveLength(1);
});
test("separate CLI and fixed consumer command preserve once-only refill", async () => {
  const directory = root(); const events = join(directory, "effects.jsonl"); const script = join(directory, "consumer.ts");
  writeFileSync(script, `const request=JSON.parse(await Bun.stdin.text());const {appendFileSync}=await import('node:fs');appendFileSync(${JSON.stringify(events)},JSON.stringify(request)+'\\n');if(request.action.kind==='observe')console.log(JSON.stringify({...${JSON.stringify(snapshot())},observedAt:new Date().toISOString()}));else if(request.action.kind==='launch')console.log(JSON.stringify({session:'fixture-engineer',paneId:'fake:p1'}));else console.log(JSON.stringify({ok:true}));`);
  const config = join(directory, "consumer.json");
  writeFileSync(config, JSON.stringify({ version: 1, repository: "Team/Project", template: { name: "engineer", revision: "v1" }, command: [process.execPath, script] }));
  const server = startCoordinationServer({ databasePath: join(directory, "coord.sqlite"), port: 0, herdr: false, slotConfigPath: config }); servers.push(server);
  for (let n = 0; n < 2; n++) {
    const child = Bun.spawn([process.execPath, "src/cli/main.ts", "slot", "check"], { env: { ...process.env, HERDR_ENV: "0", MANDEM_COORD_URL: server.url }, stdout: "pipe", stderr: "pipe" });
    const output = await new Response(child.stdout).text(); const error = await new Response(child.stderr).text();
    expect(await child.exited, error).toBe(0); expect(JSON.parse(output).repository).toBe(repository);
  }
  const actions: { action: { kind: string; task?: SlotTask } }[] = readFileSync(events, "utf8").trim().split("\n").map(line => JSON.parse(line));
  const launches = actions.filter(row => row.action.kind === "launch"); expect(launches).toHaveLength(1);
  expect(launches[0]?.action.task?.template).toEqual({ name: "engineer", revision: "v1" });
});

test("stop acknowledgement does not wait for a pending consumer observation", async () => {
  let release: (value: SlotSnapshot) => void = () => {};
  const held = new Promise<SlotSnapshot>(resolve => { release = resolve; });
  const observed = snapshot(); observed.issues = [];
  const server = startCoordinationServer({ databasePath: join(root(), "coord.sqlite"), port: 0, herdr: false,
    slots: { repository, template: { name: "engineer", revision: "v1" }, consumer: { async observe() { return held; }, async launch() { throw new Error("No issue should launch"); }, async report() {} } } }); servers.push(server);
  releases.push(() => release(observed));
  expect((await post(server.url, "/sessions/register", { session: "stopping-owner", role: "engineer", data: { stream: "issue:100" } })).ok).toBe(true);
  const response = await post(server.url, "/sessions/stop", { id: "stop-with-pending-source", session: "stopping-owner", kind: "done" });
  expect(response.ok).toBe(true);
  release(observed);
});
