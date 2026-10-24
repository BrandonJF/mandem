/** @fileoverview Independent examples for deterministic review dispatch and retargets. */
import { describe, expect, it } from "vitest";
import { emptyReviewState, transitionReview } from "../domain/review-policy";
import type {
  ReviewObservation,
  ReviewPolicy,
  ReviewResult,
  ReviewState,
} from "../domain/reviews";
const ref = { repository: "team/project", number: 7 };
const policy: ReviewPolicy = {
  full: { name: "review", revision: "v1" },
  delta: { name: "review-delta", revision: "v1" },
};
const artifact = { reference: "/private/patch", sha256: "a".repeat(64) };
const observation: ReviewObservation = {
  ref,
  head: "1".repeat(40),
  base: { name: "main", sha: "2".repeat(40) },
  patch: { id: "3".repeat(40), artifact },
  authorSession: "author",
  eligibility: { kind: "eligible" },
  mergeRef: { sha: "4".repeat(40), parents: ["2".repeat(40), "1".repeat(40)] },
  activeReviewHeads: [],
  delta: null,
};
const clean: ReviewResult = {
  verdict: "CLEAN",
  artifact: { reference: "/private/review", sha256: "b".repeat(64) },
};
function observe(state = emptyReviewState(ref), input = observation) {
  return transitionReview(
    state,
    { kind: "observe", observation: input },
    policy,
  );
}
function reviewed(input = observation, result = clean): ReviewState {
  const initial = observe(emptyReviewState(ref), input);
  const [launch] = initial.actions;
  if (!launch || launch.kind !== "launch")
    throw new Error("Expected initial full review");
  const running = transitionReview(
    initial.state,
    {
      kind: "launched",
      runId: launch.task.id,
      session: { session: "reviewer" },
    },
    policy,
  );
  return transitionReview(
    running.state,
    { kind: "result", runId: launch.task.id, session: "reviewer", result },
    policy,
  ).state;
}
describe("review policy", () => {
  it("gives the same decision without mutating the original state", () => {
    const state = emptyReviewState(ref);
    const before = structuredClone(state);
    const first = observe(state);
    expect(first).toEqual(observe(state));
    expect(state).toEqual(before);
    expect(first.actions).toHaveLength(1);
    expect(first.actions[0]).toMatchObject({
      kind: "launch",
      task: { mode: { kind: "full" } },
    });
    expect(observe(first.state).actions).toEqual([]);
  });
  it("holds an existing external reviewer for the head", () => {
    const result = observe(emptyReviewState(ref), {
      ...observation,
      activeReviewHeads: [observation.head],
    });
    expect(result.actions).toEqual([]);
    expect(result.state.status.kind).toBe("waiting-external-review");
  });
  it("publishes clean readiness once for the current context", () => {
    const state = reviewed();
    expect(state.effects).toHaveLength(1);
    expect(state.effects[0]?.operation).toBe("readiness");
    expect(observe(state).actions).toEqual([]);
  });
  it("routes FIX-NOW to the author without waiting for a merge ref", () => {
    const result: ReviewResult = {
      verdict: "FIX-NOW",
      artifact: clean.artifact,
      findings: "Fix the duplicate publication.",
    };
    const state = reviewed({ ...observation, mergeRef: null }, result);
    expect(state.effects[0]?.operation).toBe("findings");
  });
  it("reuses an identical effective patch after a same-head retarget", () => {
    const state = reviewed();
    const next = {
      ...observation,
      base: { name: "main", sha: "5".repeat(40) },
      mergeRef: null,
    };
    const waiting = observe(state, next);
    expect(waiting.actions).toEqual([]);
    expect(waiting.state.status.kind).toBe("waiting-for-merge-ref");
    expect(waiting.state.runs).toHaveLength(1);
    const released = observe(waiting.state, {
      ...next,
      mergeRef: { sha: "6".repeat(40), parents: [next.base.sha, next.head] },
    });
    expect(released.actions).toHaveLength(1);
    expect(released.actions[0]?.kind).toBe("readiness");
    expect(released.state.runs).toHaveLength(1);
  });
  it("requests only a delta for a changed effective patch on the same head", () => {
    const state = reviewed();
    const next = {
      ...observation,
      patch: {
        id: "7".repeat(40),
        artifact: { ...artifact, reference: "/private/new-patch" },
      },
      delta: {
        fromPatchId: observation.patch.id,
        artifact: { ...artifact, reference: "/private/delta" },
      },
    };
    const result = observe(state, next);
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]).toMatchObject({
      kind: "launch",
      task: {
        mode: {
          kind: "delta",
          baseline: { patchId: observation.patch.id },
          artifact: { reference: "/private/delta" },
        },
      },
    });
    expect(observe(result.state, next).actions).toEqual([]);
  });
  it("waits for the correct delta artifact instead of launching another full review", () => {
    const result = observe(reviewed(), {
      ...observation,
      patch: { ...observation.patch, id: "7".repeat(40) },
    });
    expect(result.actions).toEqual([]);
    expect(result.state.status.kind).toBe("waiting-delta");
  });
  it("starts a fresh full review for a new head", () => {
    const result = observe(reviewed(), {
      ...observation,
      head: "8".repeat(40),
    });
    expect(result.actions[0]).toMatchObject({
      kind: "launch",
      task: { mode: { kind: "full" } },
    });
  });
  it("keeps uncertain launches diagnostic across duplicate observations", () => {
    const initial = observe();
    const task = initial.state.runs[0]?.task;
    if (!task) throw new Error("Missing task");
    const uncertain = transitionReview(
      initial.state,
      {
        kind: "launch-uncertain",
        runId: task.id,
        reason: "Consumer timed out; inspect the reserved session",
      },
      policy,
    );
    expect(observe(uncertain.state).actions).toEqual([]);
    expect(observe(uncertain.state).state.status.kind).toBe("diagnostic");
  });
  it("holds a clean result behind the current merge-ref parents across repeated events", () => {
    const state = reviewed({ ...observation, mergeRef: null });
    expect(state.effects).toEqual([]);
    expect(state.status.kind).toBe("waiting-for-merge-ref");
    for (let i = 0; i < 3; i++)
      expect(
        observe(state, { ...observation, mergeRef: null }).actions,
      ).toEqual([]);
  });
});
it("retains an early result but waits for the launcher to confirm that reviewer", () => {
  const initial = observe();
  const task = initial.state.runs[0]?.task;
  if (!task) throw new Error("No task");
  const early = transitionReview(
    initial.state,
    { kind: "result", runId: task.id, session: "reviewer", result: clean },
    policy,
  );
  expect(early.actions).toEqual([]);
  expect(early.state.runs[0]?.phase.kind).toBe("reserved");
  const confirmed = transitionReview(
    early.state,
    {
      kind: "launched",
      runId: task.id,
      session: { session: "reviewer", paneId: "w1:p2" },
    },
    policy,
  );
  expect(confirmed.actions[0]?.kind).toBe("readiness");
});

it("does not repeat readiness when the same facts use another object property order", () => {
  const state = reviewed();
  const next = {
    ...observation,
    base: { sha: observation.base.sha, name: observation.base.name },
  };
  const result = observe(state, next);
  expect(result.state.context).toBe(state.context);
  expect(result.actions).toEqual([]);
});
