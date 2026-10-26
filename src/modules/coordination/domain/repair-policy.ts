/** @fileoverview Pure oldest-ready P0 selection and serialized designation reservations. */
import type { RepairEvent, RepairSnapshot, RepairState, RepairTarget, RepairTransition } from "./repairs";
import { issueKey } from "./slot-policy";
export function emptyRepairState(repository: string): RepairState {
  return { version: 1, repository, snapshot: null, effects: [], status: { kind: "idle", reason: "No observation" } };
}
export function chooseRepair(snapshot: RepairSnapshot): RepairTarget | null {
  const issue = snapshot.issue;
  if (snapshot.main.state !== "red" || !issue || issue.state !== "open" || issue.priority !== 0) return null;
  const candidates = snapshot.pulls.filter(pull => pull.open && !pull.draft && pull.ready && pull.base === "main"
    && pull.ref.repository === snapshot.repository && pull.linkedIssues.some(ref => issueKey(ref) === issueKey(issue.ref)));
  candidates.sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt) || left.ref.number - right.ref.number);
  const pull = candidates[0];
  return pull ? { repository: snapshot.repository, main: snapshot.main.head, issue: issue.ref, number: pull.ref.number, head: pull.head } : null;
}
export function repairEffectId(repository: string, index: number, target: RepairTarget | null): string { return JSON.stringify([repository, index, target]); }
export function transitionRepair(input: RepairState, event: RepairEvent): RepairTransition {
  const state = structuredClone(input);
  if (event.kind === "observe") {
    if (event.snapshot.repository !== state.repository) throw new Error("Repair snapshot belongs to another repository");
    if (state.snapshot && Date.parse(event.snapshot.observedAt) < Date.parse(state.snapshot.observedAt)) return { state, actions: [] };
    state.snapshot = structuredClone(event.snapshot);
  } else {
    const effect = state.effects.find(effect => effect.id === event.id);
    if (!effect || effect.phase.kind !== "reserved") throw new Error("Repair effect has no matching reservation");
    effect.phase = event.kind === "complete" ? { kind: "complete" } : { kind: "uncertain", reason: event.reason };
  }
  if (state.effects.some(effect => effect.phase.kind === "uncertain")) {
    state.status = { kind: "diagnostic", reason: "Inspect uncertain designation before further writes" }; return { state, actions: [] };
  }
  if (state.effects.some(effect => effect.phase.kind === "reserved") || !state.snapshot) return { state, actions: [] };
  const target = chooseRepair(state.snapshot); const previous = state.effects.at(-1);
  if (previous && JSON.stringify(previous.target) === JSON.stringify(target)) {
    state.status = { kind: "complete", reason: target ? "Exact repair designated" : "No repair authority" }; return { state, actions: [] };
  }
  const effect = { id: repairEffectId(state.repository, state.effects.length, target), snapshot: state.snapshot, target, phase: { kind: "reserved" as const } };
  state.effects.push(effect); state.status = { kind: "pending", reason: target ? "Reserved exact repair designation" : "Reserved obsolete designation clearing" };
  return { state, actions: [effect] };
}
