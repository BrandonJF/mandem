/** @fileoverview Pure constructors and parsers for values crossing stream boundaries. */
import type { PlaneMessage } from "./types";
import type { ActivityState, ClaimMismatch, DeliveryStatus, IdleStall, LiveAgent, NewStopRecord, ObservableState, OwnerReference, RecordedNeed, RoleReference, SessionState, StaffingClaim, StopInput, StopRecord, StreamBinding, StreamDelivery, StreamObservation, StreamReport, StreamSession, WaitingOn } from "./streams";

export function isRecord(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === "object" && !Array.isArray(value); }
export function record(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error("Expected an object");
  return value;
}
export function line(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim() || value.length > 512 || /[\r\n]/.test(value)) throw new Error(`${name} must be a nonempty single line of at most 512 characters`);
  return value;
}
function integer(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error(`${name} must be a nonnegative integer`);
  return value;
}
function timestamp(value: unknown): string { const result = line(value, "timestamp"); if (!Number.isFinite(Date.parse(result))) throw new Error("Invalid timestamp"); return result; }
function text(value: unknown): string { if (typeof value !== "string") throw new Error("Expected text"); return value; }
function array(value: unknown): unknown[] { if (!Array.isArray(value)) throw new Error("Expected an array"); return value; }
function boolean(value: unknown): boolean { if (typeof value !== "boolean") throw new Error("Expected a boolean"); return value; }
export function roleReference(value: unknown): RoleReference { return { kind: "role", name: line(value, "role") }; }
function storedRole(value: unknown): RoleReference { const input = record(value); if (input.kind !== "role") throw new Error("Invalid role reference"); return roleReference(input.name); }
export function parseWaitingOn(value: unknown): WaitingOn {
  if (value === "user" || value === "coordinator" || value === "external") return { kind: value };
  if (typeof value === "string" && /^session:[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(value)) return { kind: "session", session: value.slice(8) };
  const input = record(value);
  if (input.kind === "user" || input.kind === "coordinator" || input.kind === "external") return { kind: input.kind };
  if (input.kind === "session" && typeof input.session === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(input.session)) return { kind: "session", session: input.session };
  throw new Error("waiting_on must name user, coordinator, external or a session");
}
export function ownerReference(waiting: WaitingOn, fallback: RoleReference): OwnerReference {
  switch (waiting.kind) {
    case "user": return roleReference("communicator");
    case "coordinator": return roleReference("orchestrator");
    case "external": return fallback;
    case "session": return waiting;
  }
}
export function parseStopInput(value: unknown): StopInput {
  const input = record(value); const common = { id: line(input.id, "id"), session: line(input.session, "session") };
  switch (input.kind) {
    case "done":
      if (input.need !== undefined || input.waiting_on !== undefined) throw new Error("done carries no open need");
      return { ...common, kind: "done" };
    case "blocked": return { ...common, kind: "blocked", need: line(input.need, "need"), waiting_on: parseWaitingOn(input.waiting_on) };
    case "decision-needed": return { ...common, kind: "decision-needed", need: line(input.need, "need"), waiting_on: parseWaitingOn(input.waiting_on) };
    default: throw new Error("kind must be done, blocked or decision-needed");
  }
}
export function parseBinding(value: unknown): StreamBinding {
  const input = record(value);
  return { session: line(input.session, "session"), stream: line(input.stream, "stream"), assignment: line(input.assignment, "assignment"), ownerRole: storedRole(input.ownerRole) };
}
export function parseStreamSession(value: unknown): StreamSession {
  const input = record(value); const session = line(input.session, "session");
  const metadata = input.data === undefined ? {} : record(input.data);
  const binding: StreamBinding | undefined = metadata.stream === undefined ? undefined : {
    session, stream: line(metadata.stream, "stream"), assignment: line(metadata.streamAssignment, "assignment"), ownerRole: roleReference(metadata.ownerRole ?? "orchestrator"),
  };
  return { session, role: roleReference(input.role), ...(metadata.herdrPaneId === undefined ? {} : { paneId: line(metadata.herdrPaneId, "paneId") }), ...(binding ? { binding } : {}) };
}
export function parseNewStop(value: unknown): NewStopRecord {
  const input = record(value);
  return { ...parseBinding(input), ...parseStopInput(input), ts: timestamp(input.ts) };
}
export function parseStoredStop(value: unknown): StopRecord {
  const input = record(value); if (input.version !== 1) throw new Error("Unsupported stop version");
  return { ...parseNewStop(input), version: 1, generation: integer(input.generation, "generation") };
}
export function parseObservableState(value: unknown): ObservableState {
  if (value === "working" || value === "idle" || value === "done") return value;
  throw new Error("Observation requires working, idle or done");
}
export function parseActivityState(value: unknown): ActivityState {
  if (value === "working" || value === "idle" || value === "done" || value === "blocked") return { kind: value };
  return { kind: "unknown", raw: line(value, "activity state") };
}
export function parseLiveAgent(value: unknown): LiveAgent {
  const input = record(value);
  return { paneId: line(input.paneId, "paneId"), state: parseActivityState(input.state), ...(input.name === undefined ? {} : { name: line(input.name, "agent name") }) };
}
export function parseObservation(value: unknown): StreamObservation {
  const input = record(value);
  if (input.stop_boundary !== 0 && input.stop_boundary !== 1) throw new Error("Invalid stop boundary");
  return { assignment: line(input.assignment, "assignment"), generation: integer(input.generation, "generation"), stopBoundary: input.stop_boundary === 1,
    state: input.state === null ? null : parseObservableState(input.state), ...(input.idle_since === null ? {} : { idleSince: timestamp(input.idle_since) }) };
}
export function parseMessage(value: unknown): PlaneMessage {
  const input = record(value); const id = line(input.id, "message ID"); if (!/^[1-9][0-9]*$/.test(id)) throw new Error("Invalid message ID");
  return { id, topic: line(input.topic, "topic"), sender: line(input.sender, "sender"), type: line(input.type, "type"), subject: line(input.subject, "subject"), ts: timestamp(input.ts),
    ackedBy: array(input.ackedBy).map(item => line(item, "acknowledgement")), ...(input.data === undefined ? {} : { data: record(input.data) }) };
}
export function parseMessages(value: unknown): PlaneMessage[] { return array(value).map(parseMessage); }
export function parseStoredDelivery(value: unknown): StreamDelivery {
  const input = record(value); if (input.version !== 1) throw new Error("Unsupported delivery version");
  return { version: 1, owner: line(input.owner, "owner"), message: parseMessage(input.message) };
}
export function parseClaim(value: unknown): StaffingClaim { const input = record(value); return { stream: line(input.stream, "stream"), session: line(input.session, "session") }; }
export function parseClaimCommand(value: unknown): { stream: string; session: string | null } {
  const input = record(value); return { stream: line(input.stream, "stream"), session: input.session === null ? null : line(input.session, "session") };
}
function deliveryStatus(input: Record<string, unknown>): DeliveryStatus {
  if (input.delivery === "unresolved") return { delivery: "unresolved" };
  if (input.delivery === "routed") return { delivery: "routed", owner: line(input.owner, "owner"), messageId: line(input.messageId, "messageId"), acknowledged: boolean(input.acknowledged) };
  throw new Error("Invalid delivery state");
}
function finding(input: Record<string, unknown>) { return { stream: line(input.stream, "stream"), session: line(input.session, "session"), need: line(input.need, "need") }; }
function idleStall(value: unknown): IdleStall { const input = record(value); if (input.source !== "idle") throw new Error("Expected idle finding"); return { ...finding(input), source: "idle", idleSince: timestamp(input.idleSince), ...deliveryStatus(input) }; }
function recordedNeed(value: unknown): RecordedNeed { const input = record(value); if (input.source !== "stop") throw new Error("Expected stop finding"); return { ...finding(input), source: "stop", stopId: line(input.stopId, "stopId"), ...deliveryStatus(input) }; }
function claimState(value: unknown): SessionState["kind"] {
  switch (value) {
    case "working": case "idle": case "done": case "blocked": case "unknown": case "missing": case "ambiguous": case "identity-mismatch": case "unregistered": return value;
    default: throw new Error("Invalid claim state");
  }
}
function claimMismatch(value: unknown): ClaimMismatch { const input = record(value); return { ...parseClaim(input), state: claimState(input.state), reason: line(input.reason, "reason") }; }
export function parseStreamReport(value: unknown): StreamReport {
  const input = record(value);
  return { checkedAt: timestamp(input.checkedAt), stalled: array(input.stalled).map(idleStall), needs: array(input.needs).map(recordedNeed), claims: array(input.claims).map(claimMismatch), diagnostics: array(input.diagnostics).map(text) };
}
