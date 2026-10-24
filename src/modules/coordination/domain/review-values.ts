/** @fileoverview Parse external commands and versioned review rows before policy consumes them. */
import type {
  ReviewArtifact,
  ReviewEffect,
  ReviewEvent,
  ReviewMode,
  ReviewObservation,
  ReviewPatch,
  ReviewPolicy,
  ReviewRef,
  ReviewResult,
  ReviewerSession,
  ReviewRun,
  ReviewState,
  ReviewStatus,
  ReviewTarget,
  ReviewTask,
  ReviewTemplate,
} from "./reviews";
import { reviewEffectId, reviewRefKey, reviewRunId } from "./review-policy";
export type PublicReviewEvent = Extract<
  ReviewEvent,
  { kind: "observe" | "result" | "adopt" }
>;
export interface ReviewCommand {
  version: 1;
  ref: ReviewRef;
  event: PublicReviewEvent;
}
function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function object(value: unknown): Record<string, unknown> {
  if (!isObject(value)) throw new Error("Expected review object");
  return value;
}
function text(value: unknown): string {
  if (typeof value !== "string" || !value.trim())
    throw new Error("Expected nonempty review text");
  return value;
}
function number(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0)
    throw new Error("Expected nonnegative review integer");
  return value;
}
function hash(value: unknown): string {
  const result = text(value);
  if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(result))
    throw new Error("Invalid Git object or patch ID");
  return result;
}
function sessionName(value: unknown): string {
  const result = text(value);
  if (!/^[a-z][a-z0-9_-]{0,63}$/.test(result))
    throw new Error("Invalid reviewer/author session");
  return result;
}
function list(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error("Expected review array");
  return value;
}
export function parseReviewRef(value: unknown): ReviewRef {
  const row = object(value);
  const repository = text(row.repository).toLowerCase();
  const pr = number(row.number);
  if (!/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/.test(repository) || pr === 0)
    throw new Error("Invalid review repository/PR");
  return { repository, number: pr };
}
function artifact(value: unknown): ReviewArtifact {
  const row = object(value);
  const sha256 = text(row.sha256);
  if (!/^[a-f0-9]{64}$/.test(sha256))
    throw new Error("Invalid artifact digest");
  return { reference: text(row.reference), sha256 };
}
function template(value: unknown): ReviewTemplate {
  const row = object(value);
  return { name: text(row.name), revision: text(row.revision) };
}
export function parseReviewPolicy(value: unknown): ReviewPolicy {
  const row = object(value);
  return { full: template(row.full), delta: template(row.delta) };
}
function patch(value: unknown): ReviewPatch {
  const row = object(value);
  return { id: hash(row.id), artifact: artifact(row.artifact) };
}
function target(value: unknown): ReviewTarget {
  const row = object(value);
  const base = object(row.base);
  return {
    ref: parseReviewRef(row.ref),
    head: hash(row.head),
    base: { name: text(base.name), sha: hash(base.sha) },
    patch: patch(row.patch),
    authorSession: sessionName(row.authorSession),
  };
}
export function parseReviewObservation(value: unknown): ReviewObservation {
  const row = object(value);
  const gate = object(row.eligibility);
  let eligibility: ReviewObservation["eligibility"];
  if (gate.kind === "eligible") eligibility = { kind: "eligible" };
  else if (gate.kind === "held")
    eligibility = { kind: "held", reason: text(gate.reason) };
  else throw new Error("Invalid review eligibility");
  let mergeRef: ReviewObservation["mergeRef"] = null;
  if (row.mergeRef !== null) {
    const ref = object(row.mergeRef);
    mergeRef = { sha: hash(ref.sha), parents: list(ref.parents).map(hash) };
  }
  let delta: ReviewObservation["delta"] = null;
  if (row.delta !== null) {
    const diff = object(row.delta);
    delta = {
      fromPatchId: hash(diff.fromPatchId),
      artifact: artifact(diff.artifact),
    };
  }
  return {
    ...target(row),
    eligibility,
    mergeRef,
    activeReviewHeads: list(row.activeReviewHeads).map(hash),
    delta,
  };
}
export function parseReviewResult(value: unknown): ReviewResult {
  const row = object(value);
  const record = artifact(row.artifact);
  if (row.verdict === "CLEAN") {
    if ("findings" in row)
      throw new Error("CLEAN cannot carry FIX-NOW findings");
    return { verdict: "CLEAN", artifact: record };
  }
  if (row.verdict === "FIX-NOW")
    return {
      verdict: "FIX-NOW",
      artifact: record,
      findings: text(row.findings),
    };
  throw new Error("Invalid review verdict");
}
export function parseReviewerSession(value: unknown): ReviewerSession {
  const row = object(value);
  return {
    session: sessionName(row.session),
    ...(row.paneId === undefined ? {} : { paneId: text(row.paneId) }),
  };
}
function mode(value: unknown): ReviewMode {
  const row = object(value);
  if (row.kind === "full") {
    if ("baseline" in row || "artifact" in row)
      throw new Error("Full review cannot carry delta fields");
    return { kind: "full" };
  }
  if (row.kind === "delta") {
    const baseline = object(row.baseline);
    return {
      kind: "delta",
      baseline: {
        reviewId: text(baseline.reviewId),
        patchId: hash(baseline.patchId),
        result: parseReviewResult(baseline.result),
      },
      artifact: artifact(row.artifact),
    };
  }
  throw new Error("Invalid full/delta review mode");
}
function task(value: unknown): ReviewTask {
  const row = object(value);
  const result = {
    id: text(row.id),
    target: target(row.target),
    template: template(row.template),
    mode: mode(row.mode),
  };
  if (result.id !== reviewRunId(result.target))
    throw new Error("Review ID does not bind its target");
  return result;
}
function run(value: unknown): ReviewRun {
  const row = object(value);
  const phase = object(row.phase);
  const request = task(row.task);
  if (phase.kind === "reserved" || phase.kind === "uncertain") {
    const pending =
      phase.pendingResult === null ? null : object(phase.pendingResult);
    const pendingResult = pending
      ? {
          session: sessionName(pending.session),
          result: parseReviewResult(pending.result),
        }
      : null;
    if (pendingResult?.session === request.target.authorSession)
      throw new Error("Early reviewer is the author");
    return phase.kind === "reserved"
      ? { task: request, phase: { kind: "reserved", pendingResult } }
      : {
          task: request,
          phase: {
            kind: "uncertain",
            reason: text(phase.reason),
            pendingResult,
          },
        };
  }
  const session = parseReviewerSession(phase.session);
  if (session.session === request.target.authorSession)
    throw new Error("Reviewer is the author");
  if (phase.kind === "running")
    return { task: request, phase: { kind: "running", session } };
  if (phase.kind === "reviewed")
    return {
      task: request,
      phase: {
        kind: "reviewed",
        session,
        result: parseReviewResult(phase.result),
      },
    };
  throw new Error("Invalid review run phase");
}
function effect(value: unknown): ReviewEffect {
  const row = object(value);
  const phase = object(row.phase);
  if (row.operation !== "readiness" && row.operation !== "findings")
    throw new Error("Invalid review operation");
  const base = object(row.base);
  const common: Omit<ReviewEffect, "phase"> = {
    id: text(row.id),
    runId: text(row.runId),
    base: { name: text(base.name), sha: hash(base.sha) },
    context: number(row.context),
    operation: row.operation,
  };
  if (phase.kind === "reserved")
    return { ...common, phase: { kind: "reserved" } };
  if (phase.kind === "complete")
    return { ...common, phase: { kind: "complete" } };
  if (phase.kind === "uncertain")
    return {
      ...common,
      phase: { kind: "uncertain", reason: text(phase.reason) },
    };
  throw new Error("Invalid review effect phase");
}
function status(value: unknown): ReviewStatus {
  const row = object(value);
  if (row.kind === "idle") return { kind: "idle" };
  if (row.kind === "held") return { kind: "held", reason: text(row.reason) };
  if (row.kind === "diagnostic")
    return { kind: "diagnostic", reason: text(row.reason) };
  if (row.kind === "waiting-review")
    return { kind: "waiting-review", runId: text(row.runId) };
  if (row.kind === "waiting-for-merge-ref")
    return { kind: "waiting-for-merge-ref", runId: text(row.runId) };
  if (row.kind === "waiting-external-review")
    return { kind: "waiting-external-review", head: hash(row.head) };
  if (row.kind === "waiting-delta")
    return { kind: "waiting-delta", baselineId: text(row.baselineId) };
  if (row.kind === "effect-pending")
    return { kind: "effect-pending", effectId: text(row.effectId) };
  if (row.kind === "complete")
    return { kind: "complete", effectId: text(row.effectId) };
  throw new Error("Invalid review status");
}
export function parseReviewState(value: unknown): ReviewState {
  const row = object(value);
  if (row.version !== 1) throw new Error("Unsupported review state version");
  const state: ReviewState = {
    version: 1,
    ref: parseReviewRef(row.ref),
    observation:
      row.observation === null ? null : parseReviewObservation(row.observation),
    context: number(row.context),
    runs: list(row.runs).map(run),
    effects: list(row.effects).map(effect),
    status: status(row.status),
  };
  if (
    state.observation &&
    reviewRefKey(state.observation.ref) !== reviewRefKey(state.ref)
  )
    throw new Error("Review observation belongs to another PR");
  const ids = new Set<string>();
  const fullHeads = new Set<string>();
  for (const item of state.runs) {
    if (
      ids.has(item.task.id) ||
      reviewRefKey(item.task.target.ref) !== reviewRefKey(state.ref)
    )
      throw new Error("Duplicate or foreign review run");
    if (item.task.mode.kind === "full") {
      if (fullHeads.has(item.task.target.head))
        throw new Error("Duplicate full reviewer for head");
      fullHeads.add(item.task.target.head);
    } else {
      const baselineId = item.task.mode.baseline.reviewId;
      const baseline = state.runs.find(
        (candidate) => candidate.task.id === baselineId,
      );
      if (
        !ids.has(baselineId) ||
        !baseline ||
        baseline.phase.kind !== "reviewed" ||
        baseline.task.target.head !== item.task.target.head ||
        baseline.task.target.patch.id !== item.task.mode.baseline.patchId ||
        JSON.stringify(baseline.phase.result) !==
          JSON.stringify(item.task.mode.baseline.result)
      )
        throw new Error("Invalid recorded delta baseline");
    }
    ids.add(item.task.id);
  }
  const effects = new Set<string>();
  for (const item of state.effects) {
    const source = state.runs.find(
      (candidate) => candidate.task.id === item.runId,
    );
    if (
      !source ||
      source.phase.kind !== "reviewed" ||
      effects.has(item.id) ||
      item.context < 1 ||
      item.context > state.context ||
      item.id !== reviewEffectId(item.runId, item.base, item.operation) ||
      item.operation !==
        (source.phase.result.verdict === "CLEAN" ? "readiness" : "findings")
    )
      throw new Error("Invalid recorded review effect");
    effects.add(item.id);
  }
  return state;
}
export function parseReviewCommand(value: unknown): ReviewCommand {
  const row = object(value);
  if (row.version !== 1) throw new Error("Unsupported review command version");
  const ref = parseReviewRef(row.ref);
  const event = object(row.event);
  if (event.kind === "observe")
    return {
      version: 1,
      ref,
      event: {
        kind: "observe",
        observation: parseReviewObservation(event.observation),
      },
    };
  if (event.kind === "result")
    return {
      version: 1,
      ref,
      event: {
        kind: "result",
        runId: text(event.runId),
        session: sessionName(event.session),
        result: parseReviewResult(event.result),
      },
    };
  if (event.kind === "adopt")
    return {
      version: 1,
      ref,
      event: {
        kind: "adopt",
        task: task(event.task),
        session: parseReviewerSession(event.session),
        result: parseReviewResult(event.result),
      },
    };
  throw new Error("Only observe, result and adopt review commands are public");
}
