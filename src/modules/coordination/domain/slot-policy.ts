/** @fileoverview Pure issue ranking, staffing limits and once-only slot effect reservations. */
import type { SlotOwner, IssueRef, SlotAction, SlotEvent, SlotIssue, SlotState, SlotTemplate, SlotTransition } from "./slots";
export function issueKey(ref: IssueRef): string { return JSON.stringify([ref.repository.toLowerCase(), ref.number]); }
export function slotTaskId(repository: string, issue: SlotIssue): string { return JSON.stringify([repository, issueKey(issue.ref), issue.revision]); }
export function emptySlotState(repository: string): SlotState {
  return { version: 1, repository, snapshot: null, owners: [], launches: [], notices: [], status: { kind: "idle", reason: "No observation" } };
}
function ordered(left: SlotIssue, right: SlotIssue): number {
  return left.priority - right.priority || (left.ref.repository < right.ref.repository ? -1 : left.ref.repository > right.ref.repository ? 1 : left.ref.number - right.ref.number);
}
export function transitionSlots(input: SlotState, event: SlotEvent, template: SlotTemplate): SlotTransition {
  const state = structuredClone(input); const actions: SlotAction[] = [];
  if (event.kind === "observe") {
    if (event.snapshot.repository !== state.repository) throw new Error("Snapshot belongs to another repository");
    if (state.snapshot && Date.parse(event.snapshot.observedAt) < Date.parse(state.snapshot.observedAt)) return { state, actions };
    state.snapshot = structuredClone(event.snapshot);
    const owners = new Map(state.owners.map(owner => [owner.session, { ...owner, state: "unknown" as SlotOwner["state"] }]));
    for (const owner of event.snapshot.owners) owners.set(owner.session, structuredClone(owner));
    state.owners = [...owners.values()];
  } else if (event.kind === "launched" || event.kind === "launch-uncertain") {
    const run = state.launches.find(item => item.task.id === event.id);
    if (!run || run.phase.kind !== "reserved") throw new Error("Launch has no matching reservation");
    run.phase = event.kind === "launched" ? { kind: "running", session: event.session } : { kind: "uncertain", reason: event.reason };
  } else {
    const notice = state.notices.find(item => item.id === event.id);
    if (!notice || notice.phase.kind !== "reserved") throw new Error("Report has no matching reservation");
    notice.phase = event.kind === "report-complete" ? { kind: "complete" } : { kind: "uncertain", reason: event.reason };
  }
  const snapshot = state.snapshot;
  if (!snapshot) return { state, actions };
  if (state.launches.some(run => run.phase.kind === "uncertain")) {
    state.status = { kind: "diagnostic", reason: "Inspect uncertain launch before further dispatch" }; return { state, actions };
  }
  const active = state.owners.filter(owner => !owner.released).map(owner => ({ ref: owner.ref, kind: owner.kind, priority: owner.priority }));
  for (const run of state.launches) {
    const phase = run.phase;
    if (phase.kind === "running" && state.owners.some(owner => owner.session === phase.session.session && (owner.assignment !== run.task.id || owner.released))) continue;
    if (!active.some(owner => issueKey(owner.ref) === issueKey(run.task.issue.ref))) active.push(run.task.issue);
  }
  const products = active.filter(owner => owner.kind === "product").length;
  const platforms = active.length - products;
  let reason = "No startable issue";
  let candidates = snapshot.issues.filter(issue => issue.state === "open" && !issue.blocked && !issue.userDecision && !issue.openPull && issue.openDependencies.length === 0
    && !active.some(owner => issueKey(owner.ref) === issueKey(issue.ref)) && !state.launches.some(run => run.task.id === slotTaskId(state.repository, issue))).sort(ordered);
  if (snapshot.main.state === "unknown") { candidates = []; reason = "Main health is unknown"; }
  if (snapshot.main.state === "red") {
    const repair = snapshot.main.repairIssue;
    const staffed = state.owners.some(owner => !owner.released && owner.state === "working" && owner.priority === 0 && issueKey(owner.ref) === issueKey(repair))
      || state.launches.some(run => run.phase.kind === "running" && run.task.issue.priority === 0 && issueKey(run.task.issue.ref) === issueKey(repair)
        && !state.owners.some(owner => run.phase.kind === "running" && owner.session === run.phase.session.session));
    if (!staffed) {
      candidates = candidates.filter(issue => issue.priority === 0 && issueKey(issue.ref) === issueKey(repair));
      reason = "Dedicated P0 repair needs a startable issue and free capacity";
    }
  }
  candidates = candidates.filter(issue => issue.kind === "product" || platforms < 2);
  if (active.length > 4) { candidates = []; reason = "Observed ownership exceeds four streams"; }
  const choice = products < 2 ? candidates.find(issue => issue.kind === "product") ?? candidates[0] : candidates[0];
  if (active.length < 4 && choice) {
    const task = { id: slotTaskId(state.repository, choice), repository: state.repository, issue: choice, template, observedAt: snapshot.observedAt };
    state.launches.push({ task, phase: { kind: "reserved" } }); actions.push({ kind: "launch", task });
    state.status = { kind: "launching", reason: "Reserved next startable issue" };
  } else state.status = active.length > 4 ? { kind: "diagnostic", reason } : active.length >= 4 ? { kind: "full", reason: "Four streams remain reserved or active" } : { kind: snapshot.main.state === "unknown" || reason.startsWith("Dedicated") ? "held" : "waiting-queue", reason };
  if (snapshot.diagnostics.length || (active.length < 4 && !choice) || active.length > 4) {
    const decisions = snapshot.issues.filter(issue => issue.state === "open" && issue.userDecision).map(issue => issue.ref).sort((left, right) => left.number - right.number);
    const id = JSON.stringify([state.repository, choice ? "Malformed issue rows" : reason, snapshot.diagnostics, decisions]);
    if (!state.notices.some(notice => notice.id === id)) {
      const notice = { id, repository: state.repository, reason: choice ? "Malformed issue rows" : reason, diagnostics: snapshot.diagnostics, decisions, phase: { kind: "reserved" as const } };
      state.notices.push(notice); actions.push({ kind: "report", notice });
    }
  }
  return { state, actions };
}
