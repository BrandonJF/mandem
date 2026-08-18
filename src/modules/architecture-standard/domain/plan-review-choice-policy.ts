/** @fileoverview Limits repeated plan review after structural failure signals. */

export type PlanReviewChoice = "permit-one-more" | "redesign" | "review" | "split";

export interface PlanReviewHistory {
  failedVerdicts: number;
  permitsUsed: number;
}

function requireCount(name: string, value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${name} must be a non-negative safe integer`);
  }
}

export function allowedReviewChoices(history: PlanReviewHistory): PlanReviewChoice[] {
  requireCount("failedVerdicts", history.failedVerdicts);
  requireCount("permitsUsed", history.permitsUsed);

  if (history.failedVerdicts < 3) return ["review"];
  if (history.failedVerdicts < 5 || history.permitsUsed > 0) return ["redesign", "split"];
  return ["permit-one-more", "redesign", "split"];
}
