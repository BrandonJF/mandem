/** @fileoverview Recorded-fact queue selection without a board or model call. */
import { expect, test } from "vitest";
import { emptySlotState, transitionSlots } from "../domain/slot-policy";
import { parseSlotSnapshot } from "../domain/slot-values";
import type { SlotIssue, SlotSnapshot } from "../domain/slots";
const repository = "team/project";
const template = { name: "engineer", revision: "v1" };
function issue(number: number, kind: "product" | "platform" = "product", priority = 1): SlotIssue {
  return { ref: { repository, number }, revision: "1", state: "open", kind, priority, estimate: 1, outcome: "Save work", scope: "One change", acceptance: "Owned test passes", blocked: false, userDecision: false, openPull: false, openDependencies: [] };
}
function snapshot(issues: SlotIssue[]): SlotSnapshot {
  return { repository, observedAt: "2026-10-25T20:00:00.000Z", issues, owners: [], main: { state: "green", head: "a".repeat(40) }, diagnostics: [] };
}
test("refills product first, then reserves once per issue revision", () => {
  const observed = snapshot([issue(1, "platform", 0), issue(7), issue(4)]);
  const first = transitionSlots(emptySlotState(repository), { kind: "observe", snapshot: observed }, template);
  expect(first.actions[0]?.kind).toBe("launch");
  expect(first.state.launches[0]?.task.issue.ref.number).toBe(4);
  const repeated = transitionSlots(first.state, { kind: "observe", snapshot: observed }, template);
  expect(repeated.state.launches.filter(run => run.task.issue.ref.number === 4)).toHaveLength(1);
  expect(repeated.state.launches[1]?.task.issue.ref.number).toBe(7);
});
test("skips malformed rows and still starts complete work", () => {
  const input = snapshot([issue(8)]);
  const parsed = parseSlotSnapshot({ ...input, issues: [{ ref: { repository, number: 1 }, kind: "product" }, issue(8)] });
  expect(parsed.issues.map(row => row.ref.number)).toEqual([8]);
  expect(parsed.diagnostics).toHaveLength(1);
  const result = transitionSlots(emptySlotState(repository), { kind: "observe", snapshot: parsed }, template);
  expect(result.state.launches[0]?.task.issue.ref.number).toBe(8);
});
test("reports an empty approved queue once across repeated observations", () => {
  const observed = snapshot([{ ...issue(1), userDecision: true }]);
  const first = transitionSlots(emptySlotState(repository), { kind: "observe", snapshot: observed }, template);
  expect(first.actions.map(action => action.kind)).toEqual(["report"]);
  const repeat = transitionSlots(first.state, { kind: "observe", snapshot: observed }, template);
  expect(repeat.actions).toEqual([]);
  expect(repeat.state.launches).toEqual([]);
});
test("requires the dedicated P0 repair before ordinary refill on red main", () => {
  const observed = snapshot([issue(1), issue(9, "platform", 0)]);
  observed.main = { state: "red", head: "b".repeat(40), repairIssue: { repository, number: 9 } };
  const first = transitionSlots(emptySlotState(repository), { kind: "observe", snapshot: observed }, template);
  expect(first.state.launches[0]?.task.issue.ref.number).toBe(9);
});
test("counts reservations toward four total and at most two platform streams", () => {
  const observed = snapshot([issue(1), issue(2), issue(3, "platform"), issue(4, "platform"), issue(5, "platform")]);
  let state = emptySlotState(repository);
  for (let n = 0; n < 8; n++) state = transitionSlots(state, { kind: "observe", snapshot: observed }, template).state;
  expect(state.launches).toHaveLength(4);
  expect(state.launches.filter(run => run.task.issue.kind === "platform")).toHaveLength(2);
});
test("retains uncertain launches instead of retrying them", () => {
  const observed = snapshot([issue(1)]);
  const first = transitionSlots(emptySlotState(repository), { kind: "observe", snapshot: observed }, template);
  const id = first.state.launches[0]?.task.id;
  if (!id) throw new Error("Missing reserved launch");
  const failed = transitionSlots(first.state, { kind: "launch-uncertain", id, reason: "lost response" }, template);
  expect(transitionSlots(failed.state, { kind: "observe", snapshot: observed }, template).actions).toEqual([]);
  expect(failed.state.status.kind).toBe("diagnostic");
});
test("an oversized revision skips only that row before it can become a stream assignment", () => {
  const parsed = parseSlotSnapshot(snapshot([{ ...issue(1), revision: "x".repeat(600) }, issue(2)]));
  expect(parsed.issues.map(row => row.ref.number)).toEqual([2]);
  expect(parsed.diagnostics).toHaveLength(1);
});
test("unknown main and over-capacity observations never start another engineer", () => {
  const observed = snapshot([issue(1)]); observed.main = { state: "unknown" };
  expect(transitionSlots(emptySlotState(repository), { kind: "observe", snapshot: observed }, template).state.launches).toEqual([]);
  observed.main = { state: "green", head: "a".repeat(40) };
  observed.owners = [10,11,12,13,14].map(number => ({ session: `owner-${number}`, assignment: `a-${number}`, ref: { repository, number }, kind: "product", priority: 1, state: "working", released: false }));
  const result = transitionSlots(emptySlotState(repository), { kind: "observe", snapshot: observed }, template);
  expect(result.state.launches).toEqual([]);
  expect(result.state.status.kind).toBe("diagnostic");
});
test("a reserved repair is not yet a live dedicated P0 owner", () => {
  const observed = snapshot([issue(1), issue(9, "platform", 0)]);
  observed.main = { state: "red", head: "b".repeat(40), repairIssue: { repository, number: 9 } };
  const first = transitionSlots(emptySlotState(repository), { kind: "observe", snapshot: observed }, template);
  const repeated = transitionSlots(first.state, { kind: "observe", snapshot: observed }, template);
  expect(repeated.actions.filter(action => action.kind === "launch")).toEqual([]);
  expect(repeated.state.launches).toHaveLength(1);
  const id = first.state.launches[0]?.task.id; if (!id) throw new Error("Missing repair reservation");
  const confirmed = transitionSlots(first.state, { kind: "launched", id, session: { session: "dedicated-p0" } }, template);
  expect(confirmed.state.launches.map(run => run.task.issue.ref.number)).toEqual([9,1]);
});

test("only current working P0 ownership permits ordinary starts on red main", () => {
  for (const state of ["idle", "blocked", "done", "unknown", "working"] as const) {
    const observed = snapshot([issue(1)]);
    observed.main = { state: "red", head: "b".repeat(40), repairIssue: { repository, number: 9 } };
    observed.owners = [{ session: "repair", assignment: "repair-9", ref: { repository, number: 9 }, kind: "platform", priority: 0, state, released: false }];
    const result = transitionSlots(emptySlotState(repository), { kind: "observe", snapshot: observed }, template);
    expect(result.state.launches).toHaveLength(state === "working" ? 1 : 0);
  }
});
test("omitted P0 owners retain capacity but lose live staffing evidence", () => {
  const observed = snapshot([]);
  observed.main = { state: "red", head: "b".repeat(40), repairIssue: { repository, number: 9 } };
  observed.owners = [{ session: "repair", assignment: "repair-9", ref: { repository, number: 9 }, kind: "platform", priority: 0, state: "working", released: false }];
  const first = transitionSlots(emptySlotState(repository), { kind: "observe", snapshot: observed }, template);
  const next = transitionSlots(first.state, { kind: "observe", snapshot: { ...observed, owners: [], issues: [issue(1)] } }, template);
  expect(next.state.launches).toEqual([]);
  expect(next.state.owners).toHaveLength(1);
});
