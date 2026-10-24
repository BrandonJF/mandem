/** @fileoverview Typed stream stops, live activity and durable owner delivery records. */
import type { PlaneMessage } from "./types";
export type StopKind = "done" | "blocked" | "decision-needed";
export interface StreamBinding { session: string; stream: string; ownerRole: string; assignment: string; }
export interface StopRecord extends StreamBinding {
  id: string; generation?: number; kind: StopKind; ts: string; waiting_on?: string; need?: string;
}
export interface LiveAgent { paneId: string; name?: string; state: string; }
export interface StreamDelivery { owner: string; message: PlaneMessage; }
export interface StreamFinding {
  stream: string; session: string; need: string; stopId?: string; idleSince?: string;
  owner?: string; messageId?: string; acknowledged?: boolean;
}
export interface StreamReport {
  checkedAt: string; stalled: StreamFinding[]; needs: StreamFinding[];
  claims: { stream: string; session: string; state: string; reason: string }[];
  diagnostics: string[];
}
