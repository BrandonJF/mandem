/** @fileoverview Repository-provided effects; implementations retain launch and readiness authorization checks. */
import type {
  ReviewAction,
  ReviewerSession,
  ReviewTask,
} from "../../domain/reviews";
export interface ReviewEffects {
  /** Start one fresh reviewer for the reserved full/delta task; never retry an uncertain launch. */
  launch(task: ReviewTask): Promise<ReviewerSession>;
  /** Revalidate current head/base, merge parents and eligibility before publishing consumer readiness. */
  readiness(
    action: Extract<ReviewAction, { kind: "readiness" }>,
  ): Promise<void>;
  /** Route the immutable findings to the recorded current author, with the supplied deduplication ID. */
  findings(action: Extract<ReviewAction, { kind: "findings" }>): Promise<void>;
}
