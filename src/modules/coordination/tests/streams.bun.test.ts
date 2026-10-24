/** @fileoverview Stream stall detection, owner routing and durable acknowledgement journeys. */
import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { startCoordinationServer } from "../api/composition";

const cleanup: (() => Promise<void>)[] = [];
afterEach(async () => { for (const close of cleanup.splice(0)) await close(); });
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "mandem-streams-"));
  const databasePath = join(dir, "coord.sqlite");
  let time = Date.parse("2026-10-23T00:00:00Z");
  let activityError = false;
  const states: Record<string, string> = { engineer: "idle", other: "working", comm: "idle", orch: "working" };
  const wakes: string[][] = [];
  const replacements: Record<string, string> = {};
  const options = { databasePath, port: 0, now: () => new Date(time),
    herdr: { parentPaneId: "w1:p0", workspaceId: "w1", runAsync: async (args: string[]) => {
      if (args[0] === "pane") return { result: { panes: [] } };
      if (args[1] === "list") {
        if (activityError) throw new Error("Herdr unavailable");
        return { result: { agents: Object.entries(states).map(([name, agent_status]) => ({ name: replacements[name] ?? name, agent_status, pane_id: `w1:p-${name}`, workspace_id: "w1" })) } };
      }
      wakes.push(args); return { result: { type: "agent_prompted" } };
    } } };
  let service = startCoordinationServer(options);
  cleanup.push(async () => { await service.stop(); rmSync(dir, { recursive: true, force: true }); });
  async function post(path: string, data: unknown) {
    const response = await fetch(service.url + path, { method: "POST", body: JSON.stringify(data) });
    expect(response.status, await response.clone().text()).toBe(200);
    return response.json();
  }
  const register = (session: string, role = "engineer", stream = "issue:55") => post("/sessions/register", {
    session, role, data: { herdrPaneId: `w1:p-${session}`, ...(stream ? { stream, ownerRole: "orchestrator" } : {}) },
  });
  const check = (idleMinutes = 3) => post("/streams/check", { idleMinutes });
  const stop = (id = "approval", waiting_on = "user") => post("/sessions/stop", { id, session: "engineer", kind: "decision-needed", waiting_on, need: "Approve the dependency" });
  const inbox = async (session: string) => (await fetch(service.url + `/messages?topic=session:${session}`)).json();
  return { post, register, check, stop, inbox, states, wakes,
    health: async () => (await fetch(service.url + "/health")).json(),
    raw: (path: string, input: unknown) => fetch(service.url + path, { method: "POST", body: JSON.stringify(input) }),
    secondCheck: async () => {
      const second = startCoordinationServer(options);
      try { return await (await fetch(second.url + "/streams/check", { method: "POST", body: "{}" })).json(); }
      finally { await second.stop(); }
    },
    advance: (minutes: number) => { time += minutes * 60_000; },
    replaceAgent: (session: string, name: string) => { replacements[session] = name; },
    failActivity: () => { activityError = true; },
    restart: async () => { await service.stop(); service = startCoordinationServer(options); },
    cli: async (...args: string[]) => {
      const child = Bun.spawn(["bun", "src/cli/main.ts", ...args], { env: { ...process.env, MANDEM_COORD_URL: service.url }, stdout: "pipe", stderr: "pipe" });
      const out = await new Response(child.stdout).text();
      const err = await new Response(child.stderr).text();
      expect(await child.exited, err).toBe(0);
      return JSON.parse(out);
    },
  };
}

test("an idle stream stalls after N minutes while a working peer does not hide it; restart retains idle age", async () => {
  const f = fixture();
  await f.register("engineer"); await f.register("other", "engineer", "issue:other"); await f.register("orch", "orchestrator", "");
  expect((await f.check()).stalled).toEqual([]);
  f.advance(2); expect((await f.check()).stalled).toEqual([]);
  await f.restart(); f.advance(1);
  const report = await f.check();
  expect(report.stalled.map((row: { session: string }) => row.session)).toEqual(["engineer"]);
  expect((await f.inbox("orch"))).toHaveLength(1);
  await f.check(); expect((await f.inbox("orch"))).toHaveLength(1);
  f.states.engineer = "working"; expect((await f.check()).stalled).toEqual([]);
  f.states.engineer = "done"; expect((await f.check()).stalled).toEqual([]);
});

test("decision needs route once to communicator across restart; only its ack clears the need", async () => {
  const f = fixture(); await f.register("engineer"); await f.register("comm", "communicator", "");
  await f.stop(); await f.stop();
  const report = await f.check(); expect(report.needs).toHaveLength(1);
  expect(report.needs[0].owner).toBe("comm");
  const messages = await f.inbox("comm"); expect(messages).toHaveLength(1);
  await f.restart(); await f.check(); expect(await f.inbox("comm")).toHaveLength(1);
  await f.post(`/messages/${messages[0].id}/ack`, { session: "other" });
  expect((await f.check()).needs).toHaveLength(1);
  await f.post(`/messages/${messages[0].id}/ack`, { session: "comm" });
  expect((await f.check()).needs).toEqual([]);
  await new Promise(resolve => setTimeout(resolve, 30));
  expect(f.wakes).toHaveLength(1);
});

test("missing and ambiguous owners remain visible and route only after an owner registers", async () => {
  const f = fixture(); await f.register("engineer"); await f.stop();
  expect((await f.check()).diagnostics.join(" ")).toContain("communicator");
  await f.register("comm", "communicator", ""); await f.register("other", "communicator", "");
  expect((await f.check()).needs[0].messageId).toBeUndefined();
  expect(await f.inbox("comm")).toHaveLength(0);
  await f.register("other", "engineer", "");
  expect((await f.check()).needs[0].owner).toBe("comm");
});

test("coordination, named and external needs route to their accountable owner", async () => {
  const f = fixture(); await f.register("engineer"); await f.register("orch", "orchestrator", ""); await f.register("other", "reviewer", "");
  await f.stop("coord", "coordinator"); await f.stop("named", "session:other"); await f.stop("external", "external");
  const report = await f.check(); expect(report.needs).toHaveLength(3);
  expect(await f.inbox("orch")).toHaveLength(2); expect(await f.inbox("other")).toHaveLength(1);
});

test("done records suppress missing stops only for their assignment and do not erase old needs", async () => {
  const f = fixture(); await f.register("engineer"); await f.register("comm", "communicator", "");
  await f.stop(); await f.post("/sessions/stop", { id: "done", session: "engineer", kind: "done" });
  await f.check(); f.advance(4); expect((await f.check()).stalled).toEqual([]);
  await f.register("engineer"); await f.check(); f.advance(4);
  const report = await f.check(); expect(report.stalled).toHaveLength(1); expect(report.needs).toHaveLength(1);
});

test("claim mismatches and unavailable activity remain explicit", async () => {
  const f = fixture(); await f.register("engineer");
  await f.post("/streams/claim", { stream: "issue:55", session: "engineer" });
  expect((await f.check()).claims).toHaveLength(1);
  f.states.engineer = "working"; expect((await f.check()).claims).toEqual([]);
  f.failActivity(); const report = await f.check();
  expect(report.diagnostics.join(" ")).toContain("Herdr unavailable"); expect(report.claims).toHaveLength(1);
});

test("separate CLI stop/check/inbox/ack journey survives restart", async () => {
  const f = fixture();
  await f.cli("session", "register", "--session", "engineer", "--role", "engineer", "--stream", "issue:55", "--owner-role", "orchestrator");
  await f.cli("session", "register", "--session", "comm", "--role", "communicator", "--pane", "w1:p-comm");
  await f.cli("session", "stop", "--id", "cli-need", "--session", "engineer", "--kind", "decision-needed", "--waiting-on", "user", "--need", "Approve dependency");
  const report = await f.cli("streams"); expect(report.needs[0].owner).toBe("comm");
  const inbox = await f.cli("msg", "inbox", "--topic", "session:comm"); expect(inbox).toHaveLength(1);
  await f.restart(); await f.cli("streams"); expect(await f.cli("msg", "inbox", "--topic", "session:comm")).toHaveLength(1);
  await f.cli("msg", "ack", "--id", inbox[0].id, "--session", "comm");
  expect((await f.cli("streams")).needs).toEqual([]);
}, 15_000);


test("resumed working activity invalidates an old done marker in the same assignment", async () => {
  const f = fixture(); await f.register("engineer");
  await f.post("/sessions/stop", { id: "done-first", session: "engineer", kind: "done" });
  await f.check(); f.advance(1); f.states.engineer = "working"; await f.check();
  f.states.engineer = "idle"; await f.check(); f.advance(3);
  expect((await f.check()).stalled).toHaveLength(1);
});

test("concurrent polls through two SQLite connections create one owner message and one wake", async () => {
  const f = fixture(); await f.register("engineer"); await f.register("comm", "communicator", ""); await f.stop();
  await Promise.all([f.check(), f.check(), f.secondCheck(), f.check(), f.secondCheck()]);
  expect(await f.inbox("comm")).toHaveLength(1);
  await new Promise(resolve => setTimeout(resolve, 30)); expect(f.wakes).toHaveLength(1);
});

test("invalid stops and conflicting stop IDs fail without creating extra needs", async () => {
  const f = fixture(); await f.register("engineer");
  for (const input of [
    { id: "bad", session: "engineer", kind: "blocked", waiting_on: "user", need: "two\nlines" },
    { id: "bad", session: "engineer", kind: "done", need: "open need" },
    { id: "bad", session: "missing", kind: "done" },
    { id: "bad", session: "engineer", kind: "decision-needed", waiting_on: "nobody", need: "Need owner" },
  ]) expect((await f.raw("/sessions/stop", input)).status).toBe(400);
  expect((await f.check()).needs).toEqual([]);
  await f.stop();
  expect((await f.raw("/sessions/stop", { id: "approval", session: "engineer", kind: "blocked", waiting_on: "coordinator", need: "Changed" })).status).toBe(400);
  expect((await f.check()).needs).toHaveLength(1);
});


test("a routed need without a wake binding remains durable and reports one wake failure", async () => {
  const f = fixture(); await f.register("engineer");
  await f.post("/sessions/register", { session: "comm", role: "communicator" });
  await f.stop(); await f.check();
  await new Promise(resolve => setTimeout(resolve, 40));
  expect((await f.health()).wakeFailures).toBe(1);
  expect((await f.health()).lastWakeError).toContain("pane");
  await f.check(); await new Promise(resolve => setTimeout(resolve, 20));
  expect((await f.health()).wakeFailures).toBe(1);
  expect(await f.inbox("comm")).toHaveLength(1);
});


test("a reused pane occupied by a different named session fails the staffing claim", async () => {
  const f = fixture(); await f.register("engineer"); f.states.engineer = "working";
  await f.post("/streams/claim", { stream: "issue:55", session: "engineer" });
  expect((await f.check()).claims).toEqual([]);
  f.replaceAgent("engineer", "replacement");
  const report = await f.check();
  expect(report.claims).toHaveLength(1);
  expect(report.claims[0].state).toBe("identity-mismatch");
});
