/** @fileoverview Stream stall detection, owner routing and durable acknowledgement journeys. */
import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseMessages, parseStoredStop, parseStreamReport, record } from "../domain/stream-values";
import { startCoordinationServer } from "../api/composition";

const cleanup: (() => Promise<void>)[] = [];
afterEach(async () => { for (const close of cleanup.splice(0)) await close(); });
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "mandem-streams-"));
  const databasePath = join(dir, "coord.sqlite");
  let time = Date.parse("2026-10-23T00:00:00Z");
  const states: Record<string, string> = { engineer: "idle", other: "working", comm: "idle", orch: "working" };
  const wakes: string[][] = [];
  const options = { databasePath, port: 0, now: () => new Date(time),
    herdr: { parentPaneId: "w1:p0", workspaceId: "w1", runAsync: async (args: string[]) => {
      if (args[0] === "pane") return { result: { panes: [] } };
      if (args[1] === "list") {
        return { result: { agents: Object.entries(states).map(([name, agent_status]) => ({ name, agent_status, pane_id: `w1:p-${name}`, workspace_id: "w1" })) } };
      }
      wakes.push(args); return { result: { type: "agent_prompted" } };
    } } };
  let service = startCoordinationServer(options);
  cleanup.push(async () => { await service.stop(); rmSync(dir, { recursive: true, force: true }); });
  async function post(path: string, data: unknown): Promise<unknown> {
    const response = await fetch(service.url + path, { method: "POST", body: JSON.stringify(data) });
    expect(response.status, await response.clone().text()).toBe(200);
    const value: unknown = await response.json(); return value;
  }
  const register = (session: string, role = "engineer", stream = "issue:55") => post("/sessions/register", {
    session, role, data: { herdrPaneId: `w1:p-${session}`, ...(stream ? { stream, ownerRole: "orchestrator" } : {}) },
  });
  const check = async (idleMinutes = 3) => parseStreamReport(await post("/streams/check", { idleMinutes }));
  const stop = async (id = "approval", waiting_on = "user") => parseStoredStop(await post("/sessions/stop", { id, session: "engineer", kind: "decision-needed", waiting_on, need: "Approve the dependency" }));
  const inbox = async (session: string) => parseMessages(await (await fetch(service.url + `/messages?topic=session:${session}`)).json());
  return { post, register, check, stop, inbox, states, wakes,
    health: async () => record(await (await fetch(service.url + "/health")).json()),
    raw: (path: string, input: unknown) => fetch(service.url + path, { method: "POST", body: JSON.stringify(input) }),
    secondCheck: async () => {
      const second = startCoordinationServer(options);
      try { return parseStreamReport(await (await fetch(second.url + "/streams/check", { method: "POST", body: "{}" })).json()); }
      finally { await second.stop(); }
    },
    advance: (minutes: number) => { time += minutes * 60_000; },
    restart: async () => { await service.stop(); service = startCoordinationServer(options); },
    cli: async (...args: string[]): Promise<unknown> => {
      const child = Bun.spawn(["bun", "src/cli/main.ts", ...args], { env: { ...process.env, MANDEM_COORD_URL: service.url }, stdout: "pipe", stderr: "pipe" });
      const out = await new Response(child.stdout).text();
      const err = await new Response(child.stderr).text();
      expect(await child.exited, err).toBe(0);
      const value: unknown = JSON.parse(out); return value;
    },
  };
}

test("an idle stream stalls after N minutes while a working peer does not hide it; restart retains idle age", async () => {
  const f = fixture();
  await f.register("engineer"); await f.register("other", "engineer", "issue:other"); await f.register("orch", "orchestrator", "");
  await f.cli("stream", "claim", "--stream", "issue:55", "--session", "engineer");
  expect((await f.check()).claims).toHaveLength(1);
  expect((await f.check()).stalled).toEqual([]);
  f.advance(2); expect((await f.check()).stalled).toEqual([]);
  await f.restart(); f.advance(1);
  const report = await f.check();
  expect(report.stalled.map((row: { session: string }) => row.session)).toEqual(["engineer"]);
  expect((await f.inbox("orch"))).toHaveLength(1);
  await f.check(); expect((await f.inbox("orch"))).toHaveLength(1);
  f.states.engineer = "working"; expect((await f.check()).claims).toEqual([]);
  await f.cli("stream", "release", "--stream", "issue:55");
  expect((await f.check()).stalled).toEqual([]);
  f.states.engineer = "done"; expect((await f.check()).stalled).toEqual([]);
});

test("separate CLI stop/check/inbox/ack journey survives restart", async () => {
  const f = fixture();
  await f.cli("session", "register", "--session", "engineer", "--role", "engineer", "--stream", "issue:55", "--owner-role", "orchestrator");
  await f.cli("session", "register", "--session", "comm", "--role", "communicator", "--pane", "w1:p-comm");
  await f.cli("session", "stop", "--id", "cli-need", "--session", "engineer", "--kind", "decision-needed", "--waiting-on", "user", "--need", "Approve dependency");
  expect((await f.raw("/sessions/stop", { id: "bad", session: "engineer", kind: ["done"], waiting_on: "user", need: "Invalid kind" })).status).toBe(400);
  const report = parseStreamReport(await f.cli("streams")); expect(report.needs).toMatchObject([{ delivery: "routed", owner: "comm" }]);
  const inbox = parseMessages(await f.cli("msg", "inbox", "--topic", "session:comm")); expect(inbox).toHaveLength(1);
  const [message] = inbox; if (!message) throw new Error("Expected owner message");
  await f.restart(); await f.cli("streams"); expect(await f.cli("msg", "inbox", "--topic", "session:comm")).toHaveLength(1);
  await f.cli("msg", "ack", "--id", message.id, "--session", "comm");
  expect(parseStreamReport(await f.cli("streams")).needs).toEqual([]);
}, 15_000);


test("concurrent polls through two SQLite connections create one owner message and one wake", async () => {
  const f = fixture(); await f.register("engineer"); await f.register("comm", "communicator", ""); await f.stop();
  await Promise.all([f.check(), f.check(), f.secondCheck(), f.check(), f.secondCheck()]);
  expect(await f.inbox("comm")).toHaveLength(1);
  await new Promise(resolve => setTimeout(resolve, 30)); expect(f.wakes).toHaveLength(1);
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


test("a stop before the first working observation cannot hide the next idle episode", async () => {
  const f = fixture(); await f.register("engineer");
  await f.post("/sessions/stop", { id: "done-before-working", session: "engineer", kind: "done" });
  f.states.engineer = "working"; await f.check();
  f.states.engineer = "idle"; await f.check(); f.advance(4);
  expect((await f.check()).stalled).toHaveLength(1);
});
