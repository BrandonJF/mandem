/** @fileoverview Parsed review facts, full/delta coverage and durable effect alternatives. */
export interface ReviewRef {
  repository: string;
  number: number;
}
export interface ReviewArtifact {
  reference: string;
  sha256: string;
}
export interface ReviewTemplate {
  name: string;
  revision: string;
}
export interface ReviewPolicy {
  full: ReviewTemplate;
  delta: ReviewTemplate;
}
export interface ReviewPatch {
  id: string;
  artifact: ReviewArtifact;
}
export interface ReviewTarget {
  ref: ReviewRef;
  head: string;
  base: { name: string; sha: string };
  patch: ReviewPatch;
  authorSession: string;
}
/** Consumer observations bind stable patch IDs to immutable inputs; merge parents are facts, not a readiness assertion. */
export interface ReviewObservation extends ReviewTarget {
  eligibility: { kind: "eligible" } | { kind: "held"; reason: string };
  mergeRef: { sha: string; parents: string[] } | null;
  activeReviewHeads: string[];
  delta: { fromPatchId: string; artifact: ReviewArtifact } | null;
}
export type ReviewResult =
  | { verdict: "CLEAN"; artifact: ReviewArtifact }
  | { verdict: "FIX-NOW"; artifact: ReviewArtifact; findings: string };
/** A delta covers only the new effective patch against a recorded prior review, including its unresolved findings. */
export type ReviewMode =
  | { kind: "full" }
  | {
      kind: "delta";
      baseline: { reviewId: string; patchId: string; result: ReviewResult };
      artifact: ReviewArtifact;
    };
export interface ReviewTask {
  id: string;
  target: ReviewTarget;
  template: ReviewTemplate;
  mode: ReviewMode;
}
export interface ReviewerSession {
  session: string;
  paneId?: string;
}
export interface EarlyReviewResult {
  session: string;
  result: ReviewResult;
}
export interface ReviewRun {
  task: ReviewTask;
  phase:
    | { kind: "reserved"; pendingResult: EarlyReviewResult | null }
    | { kind: "running"; session: ReviewerSession }
    | { kind: "reviewed"; session: ReviewerSession; result: ReviewResult }
    | {
        kind: "uncertain";
        reason: string;
        pendingResult: EarlyReviewResult | null;
      };
}
export interface ReviewEffect {
  id: string;
  runId: string;
  context: number;
  operation: "readiness" | "findings";
  phase:
    | { kind: "reserved" }
    | { kind: "complete" }
    | { kind: "uncertain"; reason: string };
}
export type ReviewStatus =
  | { kind: "idle" }
  | { kind: "held"; reason: string }
  | { kind: "waiting-review"; runId: string }
  | { kind: "waiting-external-review"; head: string }
  | { kind: "waiting-delta"; baselineId: string }
  | { kind: "waiting-for-merge-ref"; runId: string }
  | { kind: "effect-pending"; effectId: string }
  | { kind: "complete"; effectId: string }
  | { kind: "diagnostic"; reason: string };
export interface ReviewState {
  version: 1;
  ref: ReviewRef;
  observation: ReviewObservation | null;
  context: number;
  runs: ReviewRun[];
  effects: ReviewEffect[];
  status: ReviewStatus;
}
export type ReviewEvent =
  | { kind: "observe"; observation: ReviewObservation }
  | {
      kind: "adopt";
      task: ReviewTask;
      session: ReviewerSession;
      result: ReviewResult;
    }
  | { kind: "result"; runId: string; session: string; result: ReviewResult }
  | { kind: "launched"; runId: string; session: ReviewerSession }
  | { kind: "launch-uncertain"; runId: string; reason: string }
  | { kind: "effect-complete"; effectId: string }
  | { kind: "effect-uncertain"; effectId: string; reason: string };
export type ReviewAction =
  | { kind: "launch"; task: ReviewTask }
  | {
      kind: "readiness";
      id: string;
      task: ReviewTask;
      target: ReviewTarget;
      result: Extract<ReviewResult, { verdict: "CLEAN" }>;
    }
  | {
      kind: "findings";
      id: string;
      task: ReviewTask;
      target: ReviewTarget;
      recipient: string;
      result: Extract<ReviewResult, { verdict: "FIX-NOW" }>;
    };
export interface ReviewTransition {
  state: ReviewState;
  actions: ReviewAction[];
}
