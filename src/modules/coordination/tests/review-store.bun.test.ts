/** @fileoverview SQLite review contracts across connections, restart and corrupt rows. */
import { afterEach, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openCoordinationStores } from "../infrastructure/sqlite-stores";
import { transitionReview } from "../domain/review-policy";
import type { ReviewObservation, ReviewPolicy } from "../domain/reviews";
const ref = { repository: "team/store", number: 4 };
const policy: ReviewPolicy = {
  full: { name: "review", revision: "1" },
  delta: { name: "delta", revision: "1" },
};
const observation: ReviewObservation = {
  ref,
  head: "1".repeat(40),
  base: { name: "main", sha: "2".repeat(40) },
  patch: {
    id: "3".repeat(40),
    artifact: { reference: "/patch", sha256: "4".repeat(64) },
  },
  authorSession: "author",
  eligibility: { kind: "eligible" },
  mergeRef: null,
  activeReviewHeads: [],
  delta: null,
};
const roots: string[] = [];
afterEach(() => {
  for (const path of roots.splice(0))
    rmSync(path, { recursive: true, force: true });
});
function location() {
  const root = mkdtempSync(join(tmpdir(), "review-store-"));
  roots.push(root);
  return join(root, "coord.sqlite");
}
test("reserves one launch across connections and after restart", async () => {
  const path = location();
  const left = openCoordinationStores(path);
  const right = openCoordinationStores(path);
  try {
    const events = await Promise.all([
      left.reviewStore.transition(ref, (state) =>
        transitionReview(state, { kind: "observe", observation }, policy),
      ),
      right.reviewStore.transition(ref, (state) =>
        transitionReview(state, { kind: "observe", observation }, policy),
      ),
    ]);
    expect(events.flatMap((event) => event.actions)).toHaveLength(1);
  } finally {
    left.close();
    right.close();
  }
  const reopened = openCoordinationStores(path);
  try {
    expect(
      (
        await reopened.reviewStore.transition(ref, (state) =>
          transitionReview(state, { kind: "observe", observation }, policy),
        )
      ).actions,
    ).toEqual([]);
  } finally {
    reopened.close();
  }
});
test("records a fresh reviewer in the session registry atomically", async () => {
  const stores = openCoordinationStores(location());
  try {
    const started = await stores.reviewStore.transition(ref, (state) =>
      transitionReview(state, { kind: "observe", observation }, policy),
    );
    const run = started.state.runs[0];
    if (!run) throw new Error("No review");
    await stores.reviewStore.transition(ref, (state) =>
      transitionReview(
        state,
        {
          kind: "launched",
          runId: run.task.id,
          session: { session: "fresh-reviewer", paneId: "w1:p2" },
        },
        policy,
      ),
    );
    expect(await stores.sessionStore.get("fresh-reviewer")).toMatchObject({
      role: "reviewer",
      data: {
        herdrPaneId: "w1:p2",
        reviewDispatch: {
          version: 1,
          runId: run.task.id,
          head: observation.head,
        },
      },
    });
  } finally {
    stores.close();
  }
});
test("rolls back a reviewer identity collision instead of overwriting another session", async () => {
  const stores = openCoordinationStores(location());
  try {
    await stores.sessionStore.register({
      session: "occupied",
      role: "engineer",
    });
    const started = await stores.reviewStore.transition(ref, (state) =>
      transitionReview(state, { kind: "observe", observation }, policy),
    );
    const run = started.state.runs[0];
    if (!run) throw new Error("No review");
    await expect(
      stores.reviewStore.transition(ref, (state) =>
        transitionReview(
          state,
          {
            kind: "launched",
            runId: run.task.id,
            session: { session: "occupied" },
          },
          policy,
        ),
      ),
    ).rejects.toThrow(/session/i);
    expect((await stores.reviewStore.get(ref))?.runs[0]?.phase.kind).toBe(
      "reserved",
    );
    expect((await stores.sessionStore.get("occupied"))?.role).toBe("engineer");
  } finally {
    stores.close();
  }
});
test("parses persisted versions and refuses corrupt state on read", async () => {
  const path = location();
  const stores = openCoordinationStores(path);
  try {
    await stores.reviewStore.transition(ref, (state) =>
      transitionReview(state, { kind: "observe", observation }, policy),
    );
    const db = new Database(path);
    try {
      db.query("UPDATE review_states SET payload=?").run('{"version":2}');
    } finally {
      db.close();
    }
    await expect(stores.reviewStore.get(ref)).rejects.toThrow(/version/i);
  } finally {
    stores.close();
  }
});
