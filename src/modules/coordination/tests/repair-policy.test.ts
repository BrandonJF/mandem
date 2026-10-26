/** @fileoverview Exact-main oldest-ready P0 choice and durable effect transition regressions. */
import { expect, test } from "vitest";
import { emptyRepairState, transitionRepair } from "../domain/repair-policy";
import { parseRepairSnapshot } from "../domain/repair-values";
import type { RepairSnapshot } from "../domain/repairs";
const repository = "team/project";
function snapshot(): RepairSnapshot {
  return { repository, observedAt: "2026-10-25T20:00:00.000Z", main: { state: "red", head: "a".repeat(40) },
    issue: { ref: { repository, number: 9 }, state: "open", priority: 0 },
    pulls: [2,1].map(number => ({ ref: { repository, number }, head: String(number).repeat(40), createdAt: "2026-10-24T20:00:00.000Z", open: true, draft: false, ready: true, base: "main", linkedIssues: [{ repository, number: 9 }] })) };
}
const observe = (value: RepairSnapshot) => ({ kind: "observe" as const, snapshot: value });
test("selects oldest ready linked PR then number, with exact main and PR heads", () => {
  const value = snapshot(); const first = value.pulls[0]; if (!first) throw new Error("Missing fixture");
  first.createdAt = "2026-10-23T20:00:00.000Z";
  const result = transitionRepair(emptyRepairState(repository), observe(value));
  expect(result.actions[0]?.target).toEqual({ repository, main: "a".repeat(40), issue: { repository, number: 9 }, number: 2, head: "2".repeat(40) });
  first.createdAt = "2026-10-24T20:00:00.000Z";
  expect(transitionRepair(emptyRepairState(repository), observe(value)).actions[0]?.target?.number).toBe(1);
});
test("filters draft, closed, unready, wrong-base and unlinked PRs", () => {
  for (const changes of [{ draft: true }, { open: false }, { ready: false }, { base: "other" }, { linkedIssues: [] }]) {
    const value = snapshot(); value.pulls = value.pulls.map(pull => ({ ...pull, ...changes }));
    expect(transitionRepair(emptyRepairState(repository), observe(value)).actions[0]?.target).toBeNull();
  }
});
test("green, unknown or non-open P0 facts clear rather than designate", () => {
  for (const changes of [{ main: { state: "green" as const, head: "a".repeat(40) } }, { main: { state: "unknown" as const } }, { issue: null }, { issue: { ref: { repository, number: 9 }, state: "closed" as const, priority: 0 } }, { issue: { ref: { repository, number: 9 }, state: "open" as const, priority: 1 } }]) {
    expect(transitionRepair(emptyRepairState(repository), observe({ ...snapshot(), ...changes })).actions[0]?.target).toBeNull();
  }
});
test("serializes changed desired heads behind the first reserved effect", () => {
  const first = transitionRepair(emptyRepairState(repository), observe(snapshot()));
  expect(transitionRepair(first.state, observe(snapshot())).actions).toEqual([]);
  const changed = snapshot(); changed.main = { state: "red", head: "b".repeat(40) };
  const pending = transitionRepair(first.state, observe(changed)); expect(pending.actions).toEqual([]);
  const effect = first.actions[0]; if (!effect) throw new Error("Missing reservation");
  const next = transitionRepair(pending.state, { kind: "complete", id: effect.id });
  expect(next.actions[0]?.target?.main).toBe("b".repeat(40));
  expect(next.actions[0]?.id).not.toBe(effect.id);
});
test("a completed target stays once-only, changes away and back, and never replays uncertainty", () => {
  const first = transitionRepair(emptyRepairState(repository), observe(snapshot()));
  const effect = first.actions[0]; if (!effect) throw new Error("Missing reservation");
  const done = transitionRepair(first.state, { kind: "complete", id: effect.id });
  expect(transitionRepair(done.state, observe(snapshot())).actions).toEqual([]);
  const green = snapshot(); green.main = { state: "green", head: "a".repeat(40) };
  const clear = transitionRepair(done.state, observe(green)); expect(clear.actions[0]?.target).toBeNull();
  const id = clear.actions[0]?.id; if (!id) throw new Error("Missing clear");
  const cleared = transitionRepair(clear.state, { kind: "complete", id });
  expect(transitionRepair(cleared.state, observe(snapshot())).actions[0]?.target?.number).toBe(1);
  const failed = transitionRepair(first.state, { kind: "uncertain", id: effect.id, reason: "lost reply" });
  expect(transitionRepair(failed.state, observe(green)).actions).toEqual([]);
  expect(failed.state.status.kind).toBe("diagnostic");
});
test("rejects ambiguous or malformed PR facts and ignores older snapshots", () => {
  const value = snapshot(); expect(() => parseRepairSnapshot({ ...value, pulls: [...value.pulls, value.pulls[0]] })).toThrow();
  expect(() => parseRepairSnapshot({ ...value, pulls: [{ ...value.pulls[0], head: "bad" }] })).toThrow();
  const first = transitionRepair(emptyRepairState(repository), observe(value));
  const older = { ...value, observedAt: "2026-10-25T19:59:00.000Z", issue: null };
  expect(transitionRepair(first.state, observe(older)).state).toEqual(first.state);
});
