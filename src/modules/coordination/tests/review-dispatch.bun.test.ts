/** @fileoverview End-to-end application journeys through SQLite and consumer-provided effects. */
import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openCoordinationStores } from "../infrastructure/sqlite-stores";
import { createReviewDispatcher } from "../application/review-dispatch";
import type { ReviewEffects } from "../application/ports/review-effects";
import type {
  ReviewObservation,
  ReviewPolicy,
  ReviewResult,
  ReviewTask,
} from "../domain/reviews";
const ref = { repository: "team/journey", number: 5 };
const policy: ReviewPolicy = {
  full: { name: "full", revision: "1" },
  delta: { name: "delta", revision: "1" },
};
const artifact = { reference: "/private/input", sha256: "a".repeat(64) };
const observation: ReviewObservation = {
  ref,
  head: "1".repeat(40),
  base: { name: "main", sha: "2".repeat(40) },
  patch: { id: "3".repeat(40), artifact },
  authorSession: "author",
  eligibility: { kind: "eligible" },
  mergeRef: null,
  activeReviewHeads: [],
  delta: null,
};
const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});
function database() {
  const root = mkdtempSync(join(tmpdir(), "review-dispatch-"));
  roots.push(root);
  return join(root, "coord.sqlite");
}
test("dispatches once, records the reviewer, waits for merge parents, then publishes readiness once", async () => {
  const path = database();
  let stores = openCoordinationStores(path);
  const launched: ReviewTask[] = [];
  const ready: string[] = [];
  const effects: ReviewEffects = {
    async launch(task) {
      launched.push(task);
      return { session: "reviewer" };
    },
    async readiness(action) {
      ready.push(action.id);
    },
    async findings() {
      throw new Error("Unexpected findings");
    },
  };
  const dispatcher = createReviewDispatcher({
    store: stores.reviewStore,
    policy,
    effects,
  });
  try {
    const first = await dispatcher.submit({
      version: 1,
      ref,
      event: { kind: "observe", observation },
    });
    await dispatcher.submit({
      version: 1,
      ref,
      event: { kind: "observe", observation },
    });
    expect(launched).toHaveLength(1);
    expect(await stores.sessionStore.get("reviewer")).toMatchObject({
      role: "reviewer",
    });
    const task = first.runs[0]?.task;
    if (!task) throw new Error("No task");
    const result = await dispatcher.submit({
      version: 1,
      ref,
      event: {
        kind: "result",
        runId: task.id,
        session: "reviewer",
        result: { verdict: "CLEAN", artifact },
      },
    });
    expect(result.status.kind).toBe("waiting-for-merge-ref");
    expect(ready).toEqual([]);
    stores.close();
    stores = openCoordinationStores(path);
    const restarted = createReviewDispatcher({
      store: stores.reviewStore,
      policy,
      effects,
    });
    expect((await stores.reviewStore.get(ref))?.status.kind).toBe(
      "waiting-for-merge-ref",
    );
    const observed = {
      ...observation,
      mergeRef: {
        sha: "4".repeat(40),
        parents: [observation.base.sha, observation.head],
      },
    };
    expect(
      (
        await restarted.submit({
          version: 1,
          ref,
          event: { kind: "observe", observation: observed },
        })
      ).status.kind,
    ).toBe("complete");
    await restarted.submit({
      version: 1,
      ref,
      event: { kind: "observe", observation: observed },
    });
    expect(ready).toHaveLength(1);
  } finally {
    stores.close();
  }
});
const publications: ReviewResult[] = [
  { verdict: "CLEAN", artifact },
  { verdict: "FIX-NOW", artifact, findings: "Fix duplicate publication" },
];
test.each(publications)(
  "does not retry uncertain $verdict publication after held/eligible observations and restart",
  async (result) => {
    const path = database();
    let launches = 0;
    const attempts: string[] = [];
    const effects: ReviewEffects = {
      async launch() {
        launches++;
        return { session: "reviewer" };
      },
      async readiness(action) {
        expect(result.verdict).toBe("CLEAN");
        attempts.push(action.id);
        throw new Error("Response interrupted; may have committed");
      },
      async findings(action) {
        expect(result.verdict).toBe("FIX-NOW");
        expect(action.recipient).toBe("author");
        attempts.push(action.id);
        throw new Error("Response interrupted; may have committed");
      },
    };
    const eligible: ReviewObservation = {
      ...observation,
      mergeRef: {
        sha: "4".repeat(40),
        parents: [observation.base.sha, observation.head],
      },
    };
    let stores = openCoordinationStores(path);
    try {
      const dispatcher = createReviewDispatcher({
        store: stores.reviewStore,
        policy,
        effects,
      });
      const state = await dispatcher.submit({
        version: 1,
        ref,
        event: { kind: "observe", observation: eligible },
      });
      const task = state.runs[0]?.task;
      if (!task) throw new Error("No task");
      const uncertain = await dispatcher.submit({
        version: 1,
        ref,
        event: {
          kind: "result",
          runId: task.id,
          session: "reviewer",
          result,
        },
      });
      expect(uncertain.status.kind).toBe("diagnostic");
      expect(uncertain.effects).toHaveLength(1);
      expect(uncertain.effects[0]?.phase.kind).toBe("uncertain");
      await dispatcher.submit({
        version: 1,
        ref,
        event: {
          kind: "observe",
          observation: {
            ...eligible,
            eligibility: { kind: "held", reason: "Checks pending" },
          },
        },
      });
      stores.close();
      stores = openCoordinationStores(path);
      const restarted = createReviewDispatcher({
        store: stores.reviewStore,
        policy,
        effects,
      });
      const resumed = await restarted.submit({
        version: 1,
        ref,
        event: { kind: "observe", observation: eligible },
      });
      expect(attempts).toHaveLength(1);
      expect(launches).toBe(1);
      expect(resumed.status.kind).toBe("diagnostic");
      expect(resumed.effects).toEqual(uncertain.effects);
      await restarted.submit({
        version: 1,
        ref,
        event: { kind: "observe", observation: eligible },
      });
      expect(attempts).toHaveLength(1);
    } finally {
      stores.close();
    }
  },
);
test("accepts a fast reviewer result before launch returns without losing it or granting early readiness", async () => {
  const stores = openCoordinationStores(database());
  let ready = 0;
  const effects: ReviewEffects = {
    async launch(task) {
      const state = await dispatcher.submit({
        version: 1,
        ref,
        event: {
          kind: "result",
          runId: task.id,
          session: "fast-reviewer",
          result: { verdict: "CLEAN", artifact },
        },
      });
      expect(state.status.kind).toBe("waiting-review");
      expect(ready).toBe(0);
      return { session: "fast-reviewer", paneId: "w1:p2" };
    },
    async readiness() {
      ready++;
    },
    async findings() {
      throw new Error("Unexpected findings");
    },
  };
  const dispatcher = createReviewDispatcher({
    store: stores.reviewStore,
    policy,
    effects,
  });
  try {
    const state = await dispatcher.submit({
      version: 1,
      ref,
      event: {
        kind: "observe",
        observation: {
          ...observation,
          mergeRef: {
            sha: "4".repeat(40),
            parents: [observation.base.sha, observation.head],
          },
        },
      },
    });
    expect(state.status.kind).toBe("complete");
    expect(ready).toBe(1);
    expect(await stores.sessionStore.get("fast-reviewer")).toMatchObject({
      role: "reviewer",
      data: { herdrPaneId: "w1:p2" },
    });
  } finally {
    stores.close();
  }
});
