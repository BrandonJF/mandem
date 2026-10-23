/**
 * @fileoverview The live-session registry port (issue #2114 — the session half of the
 * co-designed unified session/pane registry; #2075 owns the ephemeral pane half
 * unchanged, see that issue).
 *
 * `SessionStore` is a **dedicated construct** — its own port, in-memory fake, and
 * Postgres-backed adapter (`session-store-postgres.server.ts`) — mirroring
 * `id-counter-store.ts`'s port+fake+adapter layout exactly. It deliberately replaces
 * #1993's original design (a reserved `__sessions__` topic on the durable message log):
 * that approach let a re-register append a new, never-pruned row to an append-only log
 * (the message-bus review's Finding L1) and mixed registry writes into an all-topics
 * message subscriber's firehose (Finding L2). Both are impossible here by construction —
 * `register` is a last-write-wins UPSERT keyed by `session` (one row per session, ever),
 * and there is no message topic involved at all.
 *
 * A **logical session id** is self-chosen — for a dispatched agent, conventionally its
 * pane `label` (unifying this registry with #2075's `{ label -> paneId }` pane registry
 * on a shared key, per the architect's co-design decision on #2077). Registration is
 * OPTIONAL: a session can post/receive plane messages (`message-store.ts`) without ever
 * registering here — this registry only makes a session *discoverable* via `list()`.
 */

/** A durable, best-effort live-session directory entry. Additive-only, names no runtime. */
import type { SessionRecord } from '../../domain/types';
export type { SessionRecord } from '../../domain/types';

/** Persistence port. Postgres adapter (.server.ts) + in-memory fake both implement it. */
export interface SessionStore {
  /**
   * UPSERT last-write-wins by `session` (fills `ts` from `Date.now()` when absent);
   * returns the stored record. Registering an EXISTING `session` id overwrites its row —
   * never appends a new one, by construction (the anti-growth proof — see
   * `session-store.test.ts`'s "re-registering the same session id N times" case).
   */
  register(rec: Omit<SessionRecord, "ts"> & { ts?: string }): Promise<SessionRecord>;
  /** The full current directory, one record per distinct `session` id. */
  list(): Promise<SessionRecord[]>;
  /** A single session by id, or undefined if never registered. */
  get(session: string): Promise<SessionRecord | undefined>;
}

/**
 * The in-memory `SessionStore` test fake — a `Map` keyed by `session`. `register`
 * overwrites the existing entry in place; the Map can never grow beyond the number of
 * DISTINCT session ids ever registered, regardless of how many times any one of them
 * re-registers.
 */
export function createInMemorySessionStore(): SessionStore {
  const records = new Map<string, SessionRecord>();

  return {
    async register(rec: Omit<SessionRecord, "ts"> & { ts?: string }): Promise<SessionRecord> {
      const stored: SessionRecord = {
        session: rec.session,
        role: rec.role,
        ts: rec.ts ?? new Date().toISOString(),
        ...(rec.data !== undefined ? { data: rec.data } : {}),
      };
      records.set(rec.session, stored);
      return stored;
    },

    async list(): Promise<SessionRecord[]> {
      return Array.from(records.values());
    },

    async get(session: string): Promise<SessionRecord | undefined> {
      return records.get(session);
    },
  };
}
