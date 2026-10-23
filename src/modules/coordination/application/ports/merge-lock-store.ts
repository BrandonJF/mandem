/**
 * @fileoverview The TTL'd advisory merge-lock port (issue #2409 — mechanizes the
 * single-writer merge-pipeline convention that, before this, was enforced only by
 * orchestrator discipline, per issue #2358).
 *
 * `MergeLockStore` is a **dedicated construct** — its own port, in-memory fake, and
 * Postgres-backed adapter (`merge-lock-store-postgres.server.ts`) — mirroring
 * `session-store.ts`'s port+fake+adapter layout exactly (ADR-0144: reuse the repo's
 * established coord-service pattern rather than invent a new one).
 *
 * **Advisory, not enforced.** This lock is honored by cooperating callers
 * (`gate-and-merge.ts` / `finish-task.ts`) — it is not enforced by the database or OS
 * against a caller that ignores it. That's deliberate and sufficient: the only two
 * callers that ever land code on `main` are those two scripts, and both are wired to
 * acquire/release it (see their own file headers).
 *
 * **Acquire semantics — succeeds when the lock is free, EXPIRED, or already held by the
 * SAME holder (an idempotent refresh); fails when a DIFFERENT holder's lock is still
 * valid.** The TTL is the crash-recovery mechanism: a pipeline that dies without
 * releasing does not wedge the merge lane forever — the next acquirer steals it once the
 * TTL elapses. See the architect's decision on issue #2368: "a TTL'd advisory merge-lock
 * in the coord-service (acquire before gate-and-merge, release after, fail-closed on
 * acquisition failure, status visible for the stuck-lock case). Not a full merge queue."
 */

/** A durable advisory-lock row. */
import type { MergeLockRecord, MergeLockView, MergeLockAcquireResult, MergeLockStatus } from '../../domain/types';
export type { MergeLockRecord, MergeLockView, MergeLockAcquireResult, MergeLockStatus } from '../../domain/types';

/** Persistence port. Postgres adapter (`.server.ts`) + in-memory fake both implement it. */
export interface MergeLockStore {
  /**
   * Atomically acquire `name` for `holder` with `ttlSeconds`. Succeeds when the lock is
   * free, EXPIRED, or already held by the SAME `holder` (idempotent refresh). Returns
   * `{ acquired: false, view: <other holder> }` when a DIFFERENT holder's lock is still
   * valid. One atomic statement in the Postgres adapter — never a read-then-write.
   * `now` is injectable for the fake's TTL tests; the Postgres adapter uses SQL `now()`
   * and ignores it.
   */
  acquire(
    name: string,
    holder: string,
    ttlSeconds: number,
    now?: Date,
  ): Promise<MergeLockAcquireResult>;
  /**
   * Release `name` iff currently held by `holder`. Idempotent: releasing a lock not held
   * by `holder` (already released, stolen, or never held) is a no-op returning
   * `{ released: false }`.
   */
  release(name: string, holder: string): Promise<{ released: boolean }>;
  /** Read `name`'s current status (with derived expiry), or `{ held: false }` when free. */
  status(name: string, now?: Date): Promise<MergeLockStatus>;
}

function toView(record: MergeLockRecord, now: Date): MergeLockView {
  const acquiredAtMs = Date.parse(record.acquiredAt);
  const expiresAtMs = acquiredAtMs + record.ttlSeconds * 1000;
  return {
    ...record,
    expiresAt: new Date(expiresAtMs).toISOString(),
    expired: expiresAtMs < now.getTime(),
  };
}

/**
 * In-memory `MergeLockStore` test fake — a single-row-per-name map with an injectable
 * clock (via each method's `now` parameter). NOT durable — tests only; the process-level
 * store is `merge-lock-store-postgres.server.ts`'s `createRealPostgresMergeLockStore`.
 */
export function createInMemoryMergeLockStore(): MergeLockStore {
  const records = new Map<string, MergeLockRecord>();

  return {
    async acquire(
      name: string,
      holder: string,
      ttlSeconds: number,
      now: Date = new Date(),
    ): Promise<MergeLockAcquireResult> {
      const existing = records.get(name);
      const canAcquire = !existing || existing.holder === holder || toView(existing, now).expired;

      if (!canAcquire) {
        return { acquired: false, view: toView(existing, now) };
      }

      const record: MergeLockRecord = { name, holder, acquiredAt: now.toISOString(), ttlSeconds };
      records.set(name, record);
      return { acquired: true, view: toView(record, now) };
    },

    async release(name: string, holder: string): Promise<{ released: boolean }> {
      const existing = records.get(name);
      if (!existing || existing.holder !== holder) {
        return { released: false };
      }
      records.delete(name);
      return { released: true };
    },

    async status(name: string, now: Date = new Date()): Promise<MergeLockStatus> {
      const existing = records.get(name);
      if (!existing) return { held: false };
      const view = toView(existing, now);
      return { held: !view.expired, view };
    },
  };
}
