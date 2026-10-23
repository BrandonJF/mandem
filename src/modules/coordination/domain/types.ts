/** @fileoverview Coordination records preserved from Strategy Builder Pro. */
export interface PlaneMessage {
  /** Server-assigned id — a monotonically increasing integer rendered as a decimal
   *  string ("1", "2", …). Ordering and `sinceId` comparison are NUMERIC, never lexical. */
  id: string;
  /** Addressable key: "issue:1983" | "session:orch-b" | "orchestrator-handoff" | "events" | … */
  topic: string;
  /** Domain type: "handoff" | "needs-harvest.new" | "question.answered" | "report.complete" | … */
  type: string;
  /** What the message is about (issue number as string, report stem, free text). */
  subject: string;
  /** The poster's self-chosen logical session id — NOT a tmux pane id. */
  sender: string;
  /** ISO-8601 emission timestamp (server-filled when absent). */
  ts: string;
  /** Optional framework-agnostic JSON payload (e.g. the handoff context body). */
  data?: Record<string, unknown>;
  /** Read-receipt: logical session ids that have acked. Empty until acked. */
  ackedBy: string[];
}

export interface SessionRecord {
  /** Logical session id (self-chosen). For a dispatched agent, conventionally its pane label. */
  session: string;
  /** Advisory role: "orchestrator" | "engineer" | "planner" | "researcher" | … (free string). */
  role: string;
  /** ISO-8601 last-registration timestamp (server-filled when absent). */
  ts: string;
  /** Optional framework-agnostic metadata (e.g. { worktree, issue }). Names no runtime. */
  data?: Record<string, unknown>;
}

export interface MergeLockRecord {
  /** The lock name — a single global merge lane uses `MERGE_LOCK_NAME` ("merge"),
   *  defined once in `coord-client.ts` (the one home for that string). */
  name: string;
  /** Opaque per-acquire holder token (a UUID). Release is scoped to it. */
  holder: string;
  /** ISO-8601 acquisition timestamp. */
  acquiredAt: string;
  /** Seconds after `acquiredAt` at which the lock is considered abandoned. */
  ttlSeconds: number;
}

/** A {@link MergeLockRecord} enriched with the derived expiry fields the status
 *  surface needs. */
export type MergeLockView = MergeLockRecord & {
  /** ISO-8601 `acquiredAt` + `ttlSeconds`. */
  expiresAt: string;
  /** `true` iff `expiresAt` < now — a stuck/abandoned lock. */
  expired: boolean;
};

/** Result of an acquire attempt. */
export interface MergeLockAcquireResult {
  /** `true` iff THIS call now holds the lock. */
  acquired: boolean;
  /** On success: the record we now hold. On contention: the CURRENT (other) holder's
   *  view, for the diagnostic. */
  view: MergeLockView;
}

/** Current lock status for the read/status surface. */
export interface MergeLockStatus {
  /** `true` iff a non-expired lock currently exists. */
  held: boolean;
  /** The current holder's view when held (or when an expired row lingers, for the
   *  stuck-lock diagnostic); absent when no row exists at all. */
  view?: MergeLockView;
}
