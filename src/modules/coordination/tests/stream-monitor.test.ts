/** @fileoverview Stream application policy tests using typed ports, without HTTP or SQLite. */
import { expect, it } from "vitest";
import { streamFixture } from "./fakes/streams";
import { parseLiveAgent, roleReference } from "../domain/stream-values";

function need(id = "approval", waiting_on = "user") {
  return { id, session: "engineer", stream: "issue:55", assignment: "run-engineer", ownerRole: roleReference("orchestrator"), version: 1, generation: 0,
    ts: "2026-10-23T00:00:00Z", kind: "decision-needed", waiting_on, need: "Approve dependency" };
}

it("reports an idle stream independently of another working stream", async () => {
  const f = streamFixture(); f.addSession("engineer", "engineer", "issue:55", "idle"); f.addSession("other", "engineer", "issue:other"); f.addSession("orch", "orchestrator");
  f.observations.set("engineer", { assignment: "run-engineer", generation: 0, state: "idle", idleSince: "2026-10-23T00:06:00Z", stopBoundary: false });
  const report = await f.monitor.check();
  expect(report.stalled).toMatchObject([{ source: "idle", session: "engineer", delivery: "routed", owner: "orch", acknowledged: false }]);
  expect(f.deliveries.size).toBe(1);
});

it("routes one decision message and requires the routed owner's acknowledgement", async () => {
  const f = streamFixture(); f.addSession("engineer", "engineer", "issue:55"); f.addSession("comm", "communicator"); f.addStop(need());
  expect((await f.monitor.check()).needs).toMatchObject([{ source: "stop", delivery: "routed", owner: "comm" }]);
  await f.monitor.check(); expect(f.deliveries.size).toBe(1);
  const delivery = f.deliveries.get("stop:approval"); if (!delivery) throw new Error("Expected owner delivery");
  delivery.message.ackedBy.push("someone-else"); expect((await f.monitor.check()).needs).toHaveLength(1);
  delivery.message.ackedBy.push("comm"); expect((await f.monitor.check()).needs).toEqual([]);
});

it.each(["coordinator", "session:reviewer", "external"])("routes %s to its typed accountable owner", async waiting_on => {
  const f = streamFixture(); f.addSession("engineer", "engineer", "issue:55"); f.addSession("orch", "orchestrator"); f.addSession("reviewer", "reviewer"); f.addStop(need("need-1", waiting_on));
  expect((await f.monitor.check()).needs).toMatchObject([{ owner: waiting_on === "session:reviewer" ? "reviewer" : "orch" }]);
});

it("keeps missing and ambiguous owners unresolved until one owner registers", async () => {
  const f = streamFixture(); f.addSession("engineer", "engineer", "issue:55"); f.addStop(need());
  expect((await f.monitor.check()).needs).toMatchObject([{ delivery: "unresolved" }]);
  f.addSession("comm", "communicator"); f.addSession("other-comm", "communicator");
  const ambiguous = await f.monitor.check(); expect(ambiguous.diagnostics.join(" ")).toContain("2 registered"); expect(f.deliveries.size).toBe(0);
  const other = f.sessions.findIndex(session => session.session === "other-comm"); f.sessions.splice(other, 1);
  expect((await f.monitor.check()).needs).toMatchObject([{ delivery: "routed", owner: "comm" }]);
});

it("does not use old generation markers to hide a new idle episode or erase open needs", async () => {
  const f = streamFixture(); f.addSession("engineer", "engineer", "issue:55", "idle"); f.addSession("comm", "communicator"); f.addStop(need());
  f.observations.set("engineer", { assignment: "run-engineer", generation: 1, state: "idle", idleSince: "2026-10-23T00:06:00Z", stopBoundary: false });
  const report = await f.monitor.check(); expect(report.stalled).toHaveLength(1); expect(report.needs).toHaveLength(1);
});

it("reports a working replacement in a bound pane as a staffing mismatch", async () => {
  const f = streamFixture(); f.addSession("engineer", "engineer", "issue:55"); await f.monitor.claim({ stream: "issue:55", session: "engineer" });
  expect((await f.monitor.check()).claims).toEqual([]);
  f.agents.splice(0, 1, parseLiveAgent({ paneId: "w1:p-engineer", name: "replacement", state: "working" }));
  expect((await f.monitor.check()).claims).toMatchObject([{ state: "identity-mismatch" }]);
  await f.monitor.claim({ stream: "issue:55", session: null }); expect((await f.monitor.check()).claims).toEqual([]);
});

it("keeps unknown activity explicit and never treats it as an observable idle state", async () => {
  const f = streamFixture(); f.addSession("engineer", "engineer", "issue:55", "paused");
  const report = await f.monitor.check(); expect(report.diagnostics.join(" ")).toContain("unknown (paused)"); expect(report.stalled).toEqual([]);
});

it("reports activity failures while continuing durable need routing", async () => {
  const f = streamFixture(); f.addSession("engineer", "engineer", "issue:55"); f.addSession("comm", "communicator"); f.addStop(need()); f.failActivity();
  const report = await f.monitor.check(); expect(report.diagnostics).toContain("Herdr unavailable"); expect(report.needs).toMatchObject([{ delivery: "routed", owner: "comm" }]);
});
