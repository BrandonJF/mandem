/** @fileoverview Pure review transitions; reserve effects before any consumer executes them. */
import type {
  ReviewAction,
  ReviewEvent,
  ReviewObservation,
  ReviewPolicy,
  ReviewRef,
  ReviewState,
  ReviewTask,
  ReviewTarget,
  ReviewTransition,
} from "./reviews";

export function reviewRefKey(ref: ReviewRef): string {
  return JSON.stringify([ref.repository.toLowerCase(), ref.number]);
}
export function reviewRunId(target: ReviewTarget): string {
  return JSON.stringify([
    reviewRefKey(target.ref),
    target.head,
    target.patch.id,
  ]);
}
export function emptyReviewState(ref: ReviewRef): ReviewState {
  return {
    version: 1,
    ref,
    observation: null,
    context: 0,
    runs: [],
    effects: [],
    status: { kind: "idle" },
  };
}
function contextKey(value: ReviewObservation): string {
  return JSON.stringify([
    value.head,
    value.base.name,
    value.base.sha,
    value.patch.id,
    value.authorSession,
    value.eligibility.kind,
    value.eligibility.kind === "held" ? value.eligibility.reason : null,
  ]);
}
function target(value: ReviewObservation): ReviewTarget {
  return {
    ref: value.ref,
    head: value.head,
    base: value.base,
    patch: value.patch,
    authorSession: value.authorSession,
  };
}
function same(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

/** Reduce one fact/result into stored state and once-only commands; no clock, I/O or random identity enters policy. */
export function transitionReview(
  input: ReviewState,
  event: ReviewEvent,
  policy: ReviewPolicy,
): ReviewTransition {
  const state = structuredClone(input);
  event = structuredClone(event);
  if (event.kind === "observe") {
    if (reviewRefKey(event.observation.ref) !== reviewRefKey(state.ref))
      throw new Error("Observation belongs to another PR");
    if (
      !state.observation ||
      contextKey(state.observation) !== contextKey(event.observation)
    )
      state.context++;
    state.observation = event.observation;
  } else if (event.kind === "adopt") {
    if (
      reviewRefKey(event.task.target.ref) !== reviewRefKey(state.ref) ||
      event.task.id !== reviewRunId(event.task.target)
    )
      throw new Error("Invalid adopted review identity");
    if (event.session.session === event.task.target.authorSession)
      throw new Error("Reviewer must be independent of the author");
    const prior = state.runs.find((run) => run.task.id === event.task.id);
    if (prior) {
      if (!same(prior.task, event.task))
        throw new Error("Adopted task conflicts with reserved review");
      if (
        prior.phase.kind === "reviewed" &&
        (!same(prior.phase.result, event.result) ||
          !same(prior.phase.session, event.session))
      )
        throw new Error("Review result is immutable");
      prior.phase = {
        kind: "reviewed",
        session: event.session,
        result: event.result,
      };
    } else {
      if (
        event.task.mode.kind === "full" &&
        state.runs.some(
          (run) =>
            run.task.target.head === event.task.target.head &&
            run.task.mode.kind === "full",
        )
      )
        throw new Error("A full review already exists for this head");
      const mode = event.task.mode;
      if (
        mode.kind === "delta" &&
        !state.runs.some(
          (run) =>
            run.task.id === mode.baseline.reviewId &&
            run.phase.kind === "reviewed" &&
            run.task.target.head === event.task.target.head &&
            run.task.target.patch.id === mode.baseline.patchId &&
            same(run.phase.result, mode.baseline.result),
        )
      )
        throw new Error("Delta baseline is not recorded");
      state.runs.push({
        task: event.task,
        phase: {
          kind: "reviewed",
          session: event.session,
          result: event.result,
        },
      });
    }
  } else if (
    event.kind === "launched" ||
    event.kind === "launch-uncertain" ||
    event.kind === "result"
  ) {
    const run = state.runs.find(
      (candidate) => candidate.task.id === event.runId,
    );
    if (!run) throw new Error("Unknown review reservation");
    if (event.kind === "launched") {
      if (event.session.session === run.task.target.authorSession)
        throw new Error("Reviewer must be independent of the author");
      if (run.phase.kind === "reserved") {
        if (
          run.phase.pendingResult &&
          run.phase.pendingResult.session !== event.session.session
        )
          throw new Error("Early result does not match confirmed reviewer");
        run.phase = run.phase.pendingResult
          ? {
              kind: "reviewed",
              session: event.session,
              result: run.phase.pendingResult.result,
            }
          : { kind: "running", session: event.session };
      } else if (
        (run.phase.kind !== "running" && run.phase.kind !== "reviewed") ||
        !same(run.phase.session, event.session)
      )
        throw new Error("Conflicting reviewer session");
    } else if (event.kind === "launch-uncertain") {
      if (run.phase.kind !== "reserved")
        throw new Error("Launch no longer reserved");
      run.phase = {
        kind: "uncertain",
        reason: event.reason,
        pendingResult: run.phase.pendingResult,
      };
    } else {
      if (run.phase.kind === "reserved") {
        if (event.session === run.task.target.authorSession)
          throw new Error("Reviewer must be independent of the author");
        const pendingResult = { session: event.session, result: event.result };
        if (
          run.phase.pendingResult &&
          !same(run.phase.pendingResult, pendingResult)
        )
          throw new Error("Early review result is immutable");
        run.phase = { kind: "reserved", pendingResult };
      } else {
        if (
          (run.phase.kind !== "running" && run.phase.kind !== "reviewed") ||
          run.phase.session.session !== event.session
        )
          throw new Error("Result must name the recorded reviewer session");
        if (
          run.phase.kind === "reviewed" &&
          !same(run.phase.result, event.result)
        )
          throw new Error("Review result is immutable");
        run.phase = {
          kind: "reviewed",
          session: run.phase.session,
          result: event.result,
        };
      }
    }
  } else {
    const effect = state.effects.find(
      (candidate) => candidate.id === event.effectId,
    );
    if (!effect) throw new Error("Unknown review effect");
    if (event.kind === "effect-complete") {
      if (effect.phase.kind === "uncertain")
        throw new Error("Uncertain effect requires operator reconciliation");
      effect.phase = { kind: "complete" };
    } else {
      if (effect.phase.kind !== "reserved")
        throw new Error("Effect no longer reserved");
      effect.phase = { kind: "uncertain", reason: event.reason };
    }
  }
  const observation = state.observation;
  if (!observation) return { state, actions: [] };
  if (observation.eligibility.kind === "held") {
    state.status = { kind: "held", reason: observation.eligibility.reason };
    return { state, actions: [] };
  }
  const current = state.runs.find(
    (run) =>
      run.task.target.head === observation.head &&
      run.task.target.patch.id === observation.patch.id,
  );
  if (!current) {
    const pending = state.runs.find(
      (run) =>
        run.task.target.head === observation.head &&
        run.phase.kind !== "reviewed",
    );
    if (pending) {
      state.status =
        pending.phase.kind === "uncertain"
          ? { kind: "diagnostic", reason: pending.phase.reason }
          : { kind: "waiting-review", runId: pending.task.id };
      return { state, actions: [] };
    }
    if (observation.activeReviewHeads.includes(observation.head)) {
      state.status = {
        kind: "waiting-external-review",
        head: observation.head,
      };
      return { state, actions: [] };
    }
    const baseline = state.runs
      .filter(
        (run) =>
          run.task.target.head === observation.head &&
          run.phase.kind === "reviewed",
      )
      .at(-1);
    let task: ReviewTask;
    const id = reviewRunId(observation);
    if (baseline && baseline.phase.kind === "reviewed") {
      if (
        !observation.delta ||
        observation.delta.fromPatchId !== baseline.task.target.patch.id
      ) {
        state.status = { kind: "waiting-delta", baselineId: baseline.task.id };
        return { state, actions: [] };
      }
      task = {
        id,
        target: target(observation),
        template: { ...policy.delta },
        mode: {
          kind: "delta",
          baseline: {
            reviewId: baseline.task.id,
            patchId: baseline.task.target.patch.id,
            result: baseline.phase.result,
          },
          artifact: observation.delta.artifact,
        },
      };
    } else
      task = {
        id,
        target: target(observation),
        template: { ...policy.full },
        mode: { kind: "full" },
      };
    state.runs.push({ task, phase: { kind: "reserved", pendingResult: null } });
    state.status = { kind: "waiting-review", runId: id };
    return { state, actions: [{ kind: "launch", task }] };
  }
  const expectedTemplate =
    current.task.mode.kind === "full" ? policy.full : policy.delta;
  if (!same(current.task.template, expectedTemplate)) {
    state.status = {
      kind: "diagnostic",
      reason:
        "Recorded review uses another template revision; reconcile before reuse",
    };
    return { state, actions: [] };
  }
  if (current.phase.kind !== "reviewed") {
    state.status =
      current.phase.kind === "uncertain"
        ? { kind: "diagnostic", reason: current.phase.reason }
        : { kind: "waiting-review", runId: current.task.id };
    return { state, actions: [] };
  }
  const result = current.phase.result;
  if (
    result.verdict === "CLEAN" &&
    (!observation.mergeRef ||
      !observation.mergeRef.parents.includes(observation.base.sha) ||
      !observation.mergeRef.parents.includes(observation.head))
  ) {
    state.status = { kind: "waiting-for-merge-ref", runId: current.task.id };
    return { state, actions: [] };
  }
  const operation = result.verdict === "CLEAN" ? "readiness" : "findings";
  const effectId = JSON.stringify([current.task.id, state.context, operation]);
  const existing = state.effects.find((effect) => effect.id === effectId);
  if (existing) {
    state.status =
      existing.phase.kind === "uncertain"
        ? { kind: "diagnostic", reason: existing.phase.reason }
        : existing.phase.kind === "complete"
          ? { kind: "complete", effectId }
          : { kind: "effect-pending", effectId };
    return { state, actions: [] };
  }
  state.effects.push({
    id: effectId,
    runId: current.task.id,
    context: state.context,
    operation,
    phase: { kind: "reserved" },
  });
  state.status = { kind: "effect-pending", effectId };
  const action: ReviewAction =
    result.verdict === "CLEAN"
      ? {
          kind: "readiness",
          id: effectId,
          task: current.task,
          target: target(observation),
          result,
        }
      : {
          kind: "findings",
          id: effectId,
          task: current.task,
          target: target(observation),
          recipient: observation.authorSession,
          result,
        };
  return { state, actions: [action] };
}
