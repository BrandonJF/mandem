/** @fileoverview Pure stream value and type contracts without SQLite, HTTP or Herdr. */
import { expect, expectTypeOf, it } from "vitest";
import { ownerReference, parseActivityState, parseObservableState, parseStopInput, parseStoredStop, parseStoredDelivery, parseStreamReport, parseStreamSession, parseWaitingOn, roleReference } from "../domain/stream-values";
import type { DeliveryStatus, ObservableState, StopInput } from "../domain/streams";

const common = { id: "approval", session: "engineer" };
const blocked = { ...common, kind: "blocked", waiting_on: "user", need: "Approve dependency" };
const stored = { ...blocked, stream: "issue:55", ownerRole: roleReference("orchestrator"), assignment: "run-1", ts: "2026-10-23T00:00:00Z", version: 1, generation: 0 };

it("represents done without a need and makes blocked/decision fields required", () => {
  expectTypeOf<Extract<StopInput, { kind: "done" }>["need"]>().toEqualTypeOf<undefined>();
  expectTypeOf<Extract<StopInput, { kind: "blocked" }>["need"]>().toEqualTypeOf<string>();
  expectTypeOf<ObservableState>().toEqualTypeOf<"working" | "idle" | "done">();
  expectTypeOf<Extract<DeliveryStatus, { delivery: "routed" }>>().toEqualTypeOf<{ delivery: "routed"; owner: string; messageId: string; acknowledged: boolean }>();
  expect(parseStopInput({ ...common, kind: "done" })).toEqual({ ...common, kind: "done" });
  expect(parseStopInput(blocked)).toEqual({ ...blocked, waiting_on: { kind: "user" } });
});

it.each([
  { ...blocked, kind: ["done"] }, { ...blocked, kind: ["blocked"] },
  { ...blocked, kind: "done" }, { ...blocked, need: undefined },
  { ...blocked, waiting_on: undefined }, { ...blocked, waiting_on: "nobody" },
  { ...blocked, need: "two\nlines" }, { ...blocked, id: "" },
])("rejects invalid stop input %#", input => { expect(() => parseStopInput(input)).toThrow(); });

it.each(["user", "coordinator", "external", "session:reviewer"])("parses waiting owner %s and resolves a typed reference", value => {
  const waiting = parseWaitingOn(value);
  const owner = ownerReference(waiting, roleReference("stream-owner"));
  expect(owner).toEqual(value === "user" ? roleReference("communicator") : value === "coordinator" ? roleReference("orchestrator") : value === "external" ? roleReference("stream-owner") : { kind: "session", session: "reviewer" });
});

it("parses stream metadata into typed role and assignment values", () => {
  const session = parseStreamSession({ session: "engineer", role: "engineer", data: { stream: "issue:55", ownerRole: "orchestrator", streamAssignment: "run-1", herdrPaneId: "w1:p2" } });
  expect(session.binding).toEqual({ session: "engineer", stream: "issue:55", ownerRole: roleReference("orchestrator"), assignment: "run-1" });
  expect(() => parseStreamSession({ session: "engineer", role: "engineer", data: { stream: "issue:55" } })).toThrow("assignment");
  expect(() => parseStreamSession({ session: "engineer", role: "engineer", data: { stream: "issue:55", streamAssignment: "run", ownerRole: ["orchestrator"] } })).toThrow("role");
});

it("preserves known activity and models future states explicitly as unknown", () => {
  expect(parseActivityState("working")).toEqual({ kind: "working" });
  expect(parseActivityState("paused")).toEqual({ kind: "unknown", raw: "paused" });
  expect(() => parseActivityState(["working"])).toThrow();
  expect(() => parseObservableState("blocked")).toThrow();
});

it.each([undefined, 0, 2])("rejects unsupported stop version %s", version => { expect(() => parseStoredStop({ ...stored, version })).toThrow("version"); });
it("requires stored generation and validates nested delivery shape", () => {
  expect(parseStoredStop(stored).generation).toBe(0);
  expect(() => parseStoredStop({ ...stored, generation: undefined })).toThrow("generation");
  expect(() => parseStoredDelivery({ version: 2 })).toThrow("version");
  expect(() => parseStoredDelivery({ version: 1, owner: "comm", message: { id: "1" } })).toThrow();
});

it("rejects partial routed findings and distinguishes idle versus recorded sources", () => {
  const input = { checkedAt: stored.ts, stalled: [], claims: [], diagnostics: [], needs: [{ source: "stop", stopId: "approval", stream: "issue:55", session: "engineer", need: "Approve", delivery: "routed", owner: "comm" }] };
  expect(() => parseStreamReport(input)).toThrow("messageId");
  const report = parseStreamReport({ ...input, needs: [{ ...input.needs[0], delivery: "unresolved" }] });
  expect(report.needs[0]).toEqual({ source: "stop", stopId: "approval", stream: "issue:55", session: "engineer", need: "Approve", delivery: "unresolved" });
  expect(() => parseStreamReport({ ...input, stalled: [{ ...input.needs[0], source: "stop" }] })).toThrow("idle");
});
