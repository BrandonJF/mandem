/** @fileoverview Stream value types with explicit stop, activity and delivery alternatives. */
import type { PlaneMessage } from "./types";
export interface RoleReference { kind: "role"; name: string; }
export interface SessionReference { kind: "session"; session: string; }
export type OwnerReference = RoleReference | SessionReference;
export type WaitingOn = { kind: "user" } | { kind: "coordinator" } | { kind: "external" } | SessionReference;
export interface StreamMetadata { stream: string; ownerRole: RoleReference; assignment: string; }
export interface StreamBinding extends StreamMetadata { session: string; }
export interface StreamSession { session: string; role: RoleReference; paneId?: string; binding?: StreamBinding; }
export type StopContent = { kind: "done"; waiting_on?: never; need?: never }
  | { kind: "blocked"; waiting_on: WaitingOn; need: string }
  | { kind: "decision-needed"; waiting_on: WaitingOn; need: string };
export type StopInput = { id: string; session: string } & StopContent;
export type NewStopRecord = StopInput & StreamMetadata & { ts: string };
export type StopRecord = NewStopRecord & { version: 1; generation: number };
export type ObservableState = "working" | "idle" | "done";
export type ActivityState = { kind: ObservableState | "blocked" } | { kind: "unknown"; raw: string };
export type SessionState = ActivityState | { kind: "missing" | "ambiguous" | "identity-mismatch" | "unregistered" };
export interface LiveAgent { paneId: string; name?: string; state: ActivityState; }
export interface StreamDelivery { version: 1; owner: string; message: PlaneMessage; }
export type DeliveryStatus = { delivery: "unresolved" }
  | { delivery: "routed"; owner: string; messageId: string; acknowledged: boolean };
interface Finding { stream: string; session: string; need: string; }
export type RecordedNeed = Finding & { source: "stop"; stopId: string } & DeliveryStatus;
export type IdleStall = Finding & { source: "idle"; idleSince: string } & DeliveryStatus;
export type StreamFinding = RecordedNeed | IdleStall;
export interface StaffingClaim { stream: string; session: string; }
export interface ClaimMismatch extends StaffingClaim { state: SessionState["kind"]; reason: string; }
export interface StreamReport { checkedAt: string; stalled: IdleStall[]; needs: RecordedNeed[]; claims: ClaimMismatch[]; diagnostics: string[]; }
export interface StreamObservation { assignment: string; idleSince?: string; state: ObservableState | null; generation: number; stopBoundary: boolean; }
