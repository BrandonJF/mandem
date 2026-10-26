/** @fileoverview Strict repair observation parsing and durable state identity validation. */
import type { RepairEffect, RepairSnapshot, RepairState, RepairTarget } from "./repairs";
import { chooseRepair, repairEffectId } from "./repair-policy";
import { parseIssueRef, slotObject, slotRepository, slotText } from "./slot-values";
function list(value: unknown): unknown[] { if (!Array.isArray(value)) throw new Error("Expected repair array"); return value; }
function bool(value: unknown): boolean { if (typeof value !== "boolean") throw new Error("Expected repair boolean"); return value; }
function timestamp(value: unknown): string { const text = slotText(value); if (!/^\d{4}-\d\d-\d\dT.*Z$/.test(text) || !Number.isFinite(Date.parse(text))) throw new Error("Expected UTC repair timestamp"); return text; }
function sha(value: unknown): string { const text = slotText(value); if (!/^[a-f0-9]{40}$/.test(text)) throw new Error("Invalid repair commit"); return text; }
export function parseRepairSnapshot(value: unknown): RepairSnapshot {
  const row = slotObject(value); const repository = slotRepository(row.repository); const main = slotObject(row.main);
  if (main.state !== "red" && main.state !== "green" && main.state !== "unknown") throw new Error("Invalid repair main state");
  let issue: RepairSnapshot["issue"] = null;
  if (row.issue !== null) {
    const item = slotObject(row.issue); const ref = parseIssueRef(item.ref);
    if (ref.repository !== repository || (item.state !== "open" && item.state !== "closed") || typeof item.priority !== "number" || !Number.isInteger(item.priority) || item.priority < 0 || item.priority > 3) throw new Error("Invalid repair issue");
    issue = { ref, state: item.state, priority: item.priority };
  }
  const pulls = list(row.pulls).map(value => {
    const pull = slotObject(value); const ref = parseIssueRef(pull.ref);
    if (ref.repository !== repository) throw new Error("Repair PR belongs to another repository");
    return { ref, head: sha(pull.head), createdAt: timestamp(pull.createdAt), open: bool(pull.open), draft: bool(pull.draft), ready: bool(pull.ready), base: slotText(pull.base), linkedIssues: list(pull.linkedIssues).map(parseIssueRef) };
  });
  if (new Set(pulls.map(pull => pull.ref.number)).size !== pulls.length) throw new Error("Duplicate repair PR identity");
  return { repository, observedAt: timestamp(row.observedAt), main: main.state === "unknown" ? { state: "unknown" } : { state: main.state, head: sha(main.head) }, issue, pulls };
}
function parseTarget(value: unknown): RepairTarget | null {
  if (value === null) return null;
  const row = slotObject(value); const ref = parseIssueRef({ repository: row.repository, number: row.number });
  const issue = parseIssueRef(row.issue); if (issue.repository !== ref.repository) throw new Error("Repair target issue repository changed");
  return { repository: ref.repository, main: sha(row.main), issue, number: ref.number, head: sha(row.head) };
}
export function parseRepairState(value: unknown): RepairState {
  const row = slotObject(value); if (row.version !== 1) throw new Error("Unsupported repair state version");
  const repository = slotRepository(row.repository); const snapshot = row.snapshot === null ? null : parseRepairSnapshot(row.snapshot);
  if (snapshot && snapshot.repository !== repository) throw new Error("Repair state repository changed");
  const effects = list(row.effects).map((value, index): RepairEffect => {
    const effect = slotObject(value); const target = parseTarget(effect.target); const source = parseRepairSnapshot(effect.snapshot); const phase = slotObject(effect.phase);
    const id = slotText(effect.id);
    if (source.repository !== repository || JSON.stringify(chooseRepair(source)) !== JSON.stringify(target) || id !== repairEffectId(repository, index, target)) throw new Error("Repair reservation identity changed");
    if (phase.kind !== "reserved" && phase.kind !== "complete" && phase.kind !== "uncertain") throw new Error("Invalid repair effect phase");
    return { id, target, snapshot: source, phase: phase.kind === "uncertain" ? { kind: "uncertain", reason: slotText(phase.reason) } : { kind: phase.kind } };
  });
  if (effects.filter(effect => effect.phase.kind !== "complete").length > 1) throw new Error("Concurrent repair effects violate serialization");
  const status = slotObject(row.status);
  if (status.kind !== "idle" && status.kind !== "pending" && status.kind !== "complete" && status.kind !== "diagnostic") throw new Error("Invalid repair status");
  return { version: 1, repository, snapshot, effects, status: { kind: status.kind, reason: slotText(status.reason) } };
}
