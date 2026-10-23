/**
 * @fileoverview The coord service's pane-state serialization queue (#2075, follow-on to
 * ADR-0148 Phase 1 / #2074's `pane-lifecycle.ts` consolidation).
 *
 * `createPaneQueue` wraps `pane-lifecycle.ts`'s mutating primitives (`launchPane`/
 * `killPane`) with the SAME **in-process serialization queue** pattern `id-allocator.ts`
 * uses for atomic ID allocation: every `launch`/`kill` call is chained onto a single
 * promise so, no matter how many callers invoke this ONE process's queue concurrently, a
 * mutation is never in flight twice at once — the second caller's turn does not start
 * until the first's has fully resolved (or rejected). `readMap`/`snapshot()` needs no
 * queueing — a read never races a write in a way that corrupts state, it can only ever
 * observe a slightly-stale-but-consistent snapshot (which is fine — see `pane-client.ts`'s
 * READ-degrades posture).
 *
 * **Why `PaneQueueIo`'s methods are typed `Promise`-returning, not the plain synchronous
 * `string`/`void` shape `pane-lifecycle.ts`'s REAL functions have today:** the real
 * implementation (`execFileSync`/`writeFileSync`) is fully synchronous with no internal
 * `await`, so it is already atomic with respect to any other JS running in this process —
 * a queue over purely-synchronous IO cannot, by construction, ever observe a genuine race
 * (there is no yield point for another call to interleave through). Typing the seam as
 * async instead (a) lets `pane-queue.test.ts` actually exercise + prove the queue's
 * serialization discipline with a Fake IO that has a real `await` gap between reading and
 * writing (mirroring `id-allocator.test.ts`'s Postgres-backed race), and (b) keeps this
 * module correct-by-construction if the pane registry ever moves off a local JSON file
 * onto something genuinely async (e.g. a Postgres-backed registry, the same evolution
 * `id-counter-store.ts` already went through, and the direction #1983's shared
 * live-session registry gestures at). The REAL_IO below wraps the synchronous
 * `pane-lifecycle.ts` functions in trivial `async` wrappers — this changes nothing about
 * their actual execution (no new yield point is introduced; the wrapped call still runs to
 * completion synchronously before the wrapping promise resolves).
 */

export type PaneWindow = 'agents' | 'orchestration' | 'services';
/** A single pane-launch request — mirrors `pane-lifecycle.ts`'s `launchPane` options. */
export interface PaneLaunchRequest {
  window: PaneWindow;
  label: string;
  command: string;
  cwd?: string;
  fresh: boolean;
}

/** The injectable IO the queue serializes over — the pane-lifecycle primitives, async-typed
 *  (see file header for why). Defaults (via `createPaneQueue()`'s no-arg form) to the real
 *  `pane-lifecycle.ts` functions. */
export interface PaneQueueIo {
  launchPane: (opts: PaneLaunchRequest) => Promise<string>;
  killPane: (label: string) => Promise<void>;
  readMap: () => Record<string, string>;
}

/** The coord service's in-process pane-state authority. */
export interface PaneQueue {
  /** Serialized launch — awaits every prior queued mutation; returns the new (or reused,
   *  when `fresh: false` and already alive) pane id. */
  launch(req: PaneLaunchRequest): Promise<string>;
  /** Serialized kill by label. Idempotent — killing an unknown/already-dead label is a
   *  no-op (mirrors `pane-lifecycle.ts`'s `killPane`). */
  kill(label: string): Promise<void>;
  /** Current pane map snapshot. Returns a fresh COPY, never the internal reference, so a
   *  caller mutating the returned object can never corrupt queue state. Not queued — reads
   *  never need to wait behind in-flight mutations. */
  snapshot(): Record<string, string>;
}

/**
 * Build a {@link PaneQueue} over the given {@link PaneQueueIo} (real `pane-lifecycle.ts`
 * IO by default; a Fake in tests).
 *
 * A rejected launch/kill does not permanently wedge the queue — the next caller's turn
 * starts as soon as the failed call settles (success or failure), it just never starts
 * BEFORE the prior call settles (mirrors `id-allocator.ts`'s `createIdAllocator`).
 */
export function createPaneQueue(io: PaneQueueIo): PaneQueue {
  // The queue always resolves (rejections are swallowed at the tail) so a failed
  // mutation never poisons every subsequent one — only the caller who made the failing
  // call sees its rejection (via `launch`/`kill`, not via `tail`).
  let tail: Promise<unknown> = Promise.resolve();

  return {
    launch(req: PaneLaunchRequest): Promise<string> {
      const claim = tail.then(() => io.launchPane(req));
      tail = claim.catch(() => undefined);
      return claim;
    },
    kill(label: string): Promise<void> {
      const claim = tail.then(() => io.killPane(label));
      tail = claim.catch(() => undefined);
      return claim;
    },
    snapshot(): Record<string, string> {
      return { ...io.readMap() };
    },
  };
}
