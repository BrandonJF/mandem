/** @fileoverview Atomic review-state transitions; callbacks stay synchronous inside one transaction. */
import type {
  ReviewRef,
  ReviewState,
  ReviewTransition,
} from "../../domain/reviews";
export interface ReviewStore {
  get(ref: ReviewRef): Promise<ReviewState | undefined>;
  list(): Promise<ReviewState[]>;
  transition(
    ref: ReviewRef,
    reduce: (state: ReviewState) => ReviewTransition,
  ): Promise<ReviewTransition>;
}
