/** @fileoverview Untrusted review command and persisted-shape parsing boundaries. */
import { expect, it } from "vitest";
import { parseReviewCommand, parseReviewState } from "../domain/review-values";
import { emptyReviewState } from "../domain/review-policy";
it("rejects internal transition commands at the public boundary", () => {
  expect(() =>
    parseReviewCommand({
      version: 1,
      ref: { repository: "team/project", number: 7 },
      event: { kind: "effect-complete", effectId: "forged" },
    }),
  ).toThrow();
});
it("rejects unsupported storage versions and missing discriminated payloads", () => {
  const state = emptyReviewState({ repository: "team/project", number: 7 });
  expect(parseReviewState(state)).toEqual(state);
  expect(() => parseReviewState({ ...state, version: 2 })).toThrow();
  expect(() =>
    parseReviewState({ ...state, status: { kind: "diagnostic" } }),
  ).toThrow();
  expect(() =>
    parseReviewState({ ...state, status: { kind: ["idle"] } }),
  ).toThrow();
});
it("does not coerce head/number or artifact values from arrays", () => {
  expect(() =>
    parseReviewCommand({
      version: 1,
      ref: { repository: "team/project", number: ["7"] },
      event: {},
    }),
  ).toThrow();
});
