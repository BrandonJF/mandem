/** @fileoverview Parse consumer snapshots narrowly and restore complete versioned slot rows. */
import { slotTaskId } from "./slot-policy";
import type { IssueRef, SlotIssue, SlotMain, SlotOwner, SlotNotice, SlotSession, SlotSnapshot, SlotState, SlotTemplate } from "./slots";
function isSlotObject(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === "object" && !Array.isArray(value); }
export function slotObject(value: unknown): Record<string, unknown> {
  if (!isSlotObject(value)) throw new Error("Expected slot object");
  return value;
}
export function slotText(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new Error("Expected nonempty slot text");
  return value;
}
function list(value: unknown): unknown[] { if (!Array.isArray(value)) throw new Error("Expected slot array"); return value; }
function bool(value: unknown): boolean { if (typeof value !== "boolean") throw new Error("Expected slot boolean"); return value; }
function priority(value: unknown): number { if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 3) throw new Error("Missing or invalid priority"); return value; }
export function slotRepository(value: unknown): string {
  const repository = slotText(value).toLowerCase();
  if (!/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/.test(repository)) throw new Error("Invalid slot repository");
  return repository;
}
export function parseIssueRef(value: unknown): IssueRef {
  const row = slotObject(value); const number = row.number;
  if (typeof number !== "number" || !Number.isSafeInteger(number) || number < 1) throw new Error("Invalid issue number");
  return { repository: slotRepository(row.repository), number };
}
function kind(value: unknown): SlotIssue["kind"] { if (value !== "product" && value !== "platform") throw new Error("Missing or invalid kind"); return value; }
function sha(value: unknown): string { const result = slotText(value); if (!/^[a-f0-9]{40}$/.test(result)) throw new Error("Invalid main head"); return result; }
export function parseSlotIssue(value: unknown): SlotIssue {
  const row = slotObject(value);
  if (row.state !== "open" && row.state !== "closed") throw new Error("Invalid issue state");
  if (typeof row.estimate !== "number" || !Number.isFinite(row.estimate) || row.estimate < 0) throw new Error("Missing or invalid estimate");
  const issue: SlotIssue = { ref: parseIssueRef(row.ref), revision: slotText(row.revision), state: row.state, kind: kind(row.kind), priority: priority(row.priority), estimate: row.estimate,
    outcome: slotText(row.outcome), scope: slotText(row.scope), acceptance: slotText(row.acceptance), blocked: bool(row.blocked), userDecision: bool(row.userDecision), openPull: bool(row.openPull), openDependencies: list(row.openDependencies).map(parseIssueRef) };
  if (slotTaskId(issue.ref.repository, issue).length > 512) throw new Error("Issue revision/reference exceeds the stream assignment limit");
  return issue;
}
function owner(value: unknown, stored: boolean): SlotOwner {
  const row = slotObject(value);
  if (row.state !== "working" && row.state !== "idle" && row.state !== "blocked" && row.state !== "done" && row.state !== "unknown") throw new Error("Invalid slot owner state");
  return { state: row.state, session: slotText(row.session), assignment: slotText(row.assignment), ref: parseIssueRef(row.ref), kind: kind(row.kind), priority: priority(row.priority), released: stored ? bool(row.released) : false };
}
function main(value: unknown): SlotMain {
  const row = slotObject(value);
  if (row.state === "unknown") return { state: "unknown" };
  if (row.state === "green") return { state: "green", head: sha(row.head) };
  if (row.state === "red") return { state: "red", head: sha(row.head), repairIssue: parseIssueRef(row.repairIssue) };
  throw new Error("Invalid main state");
}
export function parseSlotTemplate(value: unknown): SlotTemplate { const row = slotObject(value); return { name: slotText(row.name), revision: slotText(row.revision) }; }
export function parseSlotSession(value: unknown): SlotSession {
  const row = slotObject(value); const session = slotText(row.session);
  if (!/^[a-z][a-z0-9_-]{0,63}$/.test(session)) throw new Error("Invalid engineer session");
  return { session, ...(row.paneId === undefined ? {} : { paneId: slotText(row.paneId) }) };
}
export function parseSlotSnapshot(value: unknown, stored = false): SlotSnapshot {
  const row = slotObject(value); const repository = slotRepository(row.repository); const observedAt = slotText(row.observedAt);
  if (!Number.isFinite(Date.parse(observedAt))) throw new Error("Invalid snapshot time");
  const issues: SlotIssue[] = []; const diagnostics = stored ? list(row.diagnostics).map(slotText) : [];
  for (const [index, candidate] of list(row.issues).entries()) {
    try {
      const issue = parseSlotIssue(candidate);
      if (issue.ref.repository !== repository) throw new Error("Issue belongs to another repository");
      if (issues.some(prior => prior.ref.number === issue.ref.number)) throw new Error("Duplicate issue identity");
      issues.push(issue);
    } catch (error) {
      if (stored) throw error;
      diagnostics.push(`Issue row ${index}: ${error instanceof Error ? error.message : "invalid recorded fields"}`);
    }
  }
  const owners = list(row.owners).map(value => owner(value, stored));
  if (new Set(owners.map(item => item.session)).size !== owners.length || owners.some(item => item.ref.repository !== repository)) throw new Error("Ambiguous owner bindings");
  return { repository, observedAt, issues, owners, main: main(row.main), diagnostics };
}
export function parseSlotState(value: unknown): SlotState {
  const row = slotObject(value); if (row.version !== 1) throw new Error("Unsupported slot state version");
  const repository = slotRepository(row.repository);
  const snapshot = row.snapshot === null ? null : parseSlotSnapshot(row.snapshot, true);
  if (snapshot && snapshot.repository !== repository) throw new Error("Slot snapshot repository changed");
  const owners = list(row.owners).map(value => owner(value, true));
  const launches = list(row.launches).map(value => {
    const run = slotObject(value); const task = slotObject(run.task); const phase = slotObject(run.phase);
    const parsed = { id: slotText(task.id), repository: slotRepository(task.repository), issue: parseSlotIssue(task.issue), template: parseSlotTemplate(task.template), observedAt: slotText(task.observedAt) };
    if (parsed.id !== slotTaskId(repository, parsed.issue)) throw new Error("Slot task identity changed");
    if (phase.kind === "reserved") return { task: parsed, phase: { kind: "reserved" as const } };
    if (phase.kind === "running") return { task: parsed, phase: { kind: "running" as const, session: parseSlotSession(phase.session) } };
    if (phase.kind === "uncertain") return { task: parsed, phase: { kind: "uncertain" as const, reason: slotText(phase.reason) } };
    throw new Error("Invalid launch phase");
  });
  const notices = list(row.notices).map((value): SlotNotice => {
    const notice = slotObject(value); const phase = slotObject(notice.phase);
    if (phase.kind !== "reserved" && phase.kind !== "complete" && phase.kind !== "uncertain") throw new Error("Invalid notice phase");
    return { id: slotText(notice.id), repository: slotRepository(notice.repository), reason: slotText(notice.reason), diagnostics: list(notice.diagnostics).map(slotText), decisions: list(notice.decisions).map(parseIssueRef),
      phase: phase.kind === "uncertain" ? { kind: "uncertain" as const, reason: slotText(phase.reason) } : { kind: phase.kind } };
  });
  const status = slotObject(row.status);
  if (status.kind !== "idle" && status.kind !== "launching" && status.kind !== "full" && status.kind !== "waiting-queue" && status.kind !== "held" && status.kind !== "diagnostic") throw new Error("Invalid slot status");
  if (launches.some(run => run.task.repository !== repository || run.task.issue.ref.repository !== repository) || new Set(launches.map(run => run.task.id)).size !== launches.length || new Set(notices.map(notice => notice.id)).size !== notices.length) throw new Error("Invalid slot identities");
  return { version: 1, repository, snapshot, owners, launches, notices, status: { kind: status.kind, reason: slotText(status.reason) } };
}
