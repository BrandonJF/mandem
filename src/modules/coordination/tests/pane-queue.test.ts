/**
 * @fileoverview Unit tests for `pane-queue.ts` (#2075, ADR-0148 follow-on to #2074's
 * `pane-lifecycle.ts` consolidation), test-first per the plan's Task 1.
 *
 * Mirrors `id-allocator.test.ts`'s two-part proof:
 *
 *  1. **Raw IO races without the queue** — concurrent, unserialized `launchPane`/`kill`
 *     calls against a Fake IO with a genuine async gap between "read the map" and "write
 *     the map" (modeling a hypothetical future async-backed pane registry — e.g. a
 *     Postgres-backed one, see the plan's "Related work" section — even though today's
 *     REAL `pane-lifecycle.ts` IO is fully synchronous/blocking and therefore already
 *     atomic in-process; see `pane-queue.ts`'s file header for why `PaneQueueIo` is typed
 *     `Promise`-returning rather than the plan's originally-sketched synchronous shape).
 *  2. **`createPaneQueue` closes the race** — the SAME Fake IO, serialized through the
 *     queue, returns N distinct, non-clobbered entries for N concurrent `launch()` calls.
 */

import { describe, expect, it } from "vitest";
import { createPaneQueue, type PaneQueueIo } from "../application/ports/pane-queue";

/** A minimal in-memory Fake IO with a genuine `await` gap between reading and writing the
 *  map — the same "read snapshot, delay, write back" shape id-allocator.test.ts's fake
 *  store uses to expose an unserialized race. */
function createFakeIo(delayMs: number): PaneQueueIo & { paneMap: Record<string, string> } {
  let map: Record<string, string> = {};
  let nextId = 100;

  return {
    get paneMap() {
      return map;
    },
    async launchPane(opts) {
      const snapshot = map;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      const paneId = `%${nextId++}`;
      map = { ...snapshot, [opts.label]: paneId };
      return paneId;
    },
    async killPane(label) {
      const snapshot = map;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      const next = { ...snapshot };
      delete next[label];
      map = next;
    },
    readMap: () => ({ ...map }),
  };
}

describe("raw PaneQueueIo — WITHOUT the queue (demonstrates the race)", () => {
  it("clobbers entries under concurrent unserialized launchPane calls with distinct labels", async () => {
    const io = createFakeIo(5);

    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        io.launchPane({ window: "agents", label: `agent-${i}`, command: "x", fresh: true }),
      ),
    );

    // This is the race, not a desired outcome: every concurrent call read the SAME
    // snapshot before any of them wrote back, so most writes clobber each other.
    expect(Object.keys(io.paneMap).length).toBeLessThan(20);
  });
});

describe("createPaneQueue — concurrency (the invariant the queue exists to prove)", () => {
  it("records N distinct labels with distinct pane ids for N concurrent launch() calls", async () => {
    const io = createFakeIo(5);
    const queue = createPaneQueue(io);

    const paneIds = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        queue.launch({ window: "agents", label: `agent-${i}`, command: "x", fresh: true }),
      ),
    );

    expect(new Set(paneIds).size).toBe(20);
    const snapshot = queue.snapshot();
    expect(Object.keys(snapshot)).toHaveLength(20);
    for (let i = 0; i < 20; i++) {
      expect(snapshot[`agent-${i}`]).toBe(paneIds[i]);
    }
  });

  it("serializes launch() and kill() against each other, not just launch() against launch()", async () => {
    const io = createFakeIo(5);
    const queue = createPaneQueue(io);

    await queue.launch({ window: "agents", label: "keep-me", command: "x", fresh: true });

    const [, killResult] = await Promise.all([
      queue.launch({ window: "agents", label: "throwaway", command: "x", fresh: true }),
      queue.kill("throwaway"),
    ]);
    void killResult;

    // Regardless of interleave order, the queue never loses "keep-me" — the concurrent
    // launch/kill pair for a DIFFERENT label must not clobber an unrelated entry.
    expect(queue.snapshot()["keep-me"]).toBeDefined();
  });

  it("snapshot() returns a COPY — mutating it never corrupts queue state", async () => {
    const io = createFakeIo(1);
    const queue = createPaneQueue(io);
    await queue.launch({ window: "agents", label: "a", command: "x", fresh: true });

    const snapshot = queue.snapshot();
    delete snapshot["a"];

    expect(queue.snapshot()["a"]).toBeDefined();
  });

  it("a rejected launch does not wedge subsequent calls on the SAME queue", async () => {
    let callCount = 0;
    const io: PaneQueueIo = {
      launchPane: () => {
        callCount++;
        if (callCount === 1) return Promise.reject(new Error("tmux down"));
        return Promise.resolve("%42");
      },
      killPane: () => Promise.resolve(),
      readMap: () => ({}),
    };
    const queue = createPaneQueue(io);

    await expect(
      queue.launch({ window: "agents", label: "a", command: "x", fresh: true }),
    ).rejects.toThrow("tmux down");
    await expect(
      queue.launch({ window: "agents", label: "b", command: "x", fresh: true }),
    ).resolves.toBe("%42");
  });

});
