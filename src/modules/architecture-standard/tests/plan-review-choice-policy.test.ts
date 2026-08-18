/** @fileoverview Verifies that repeated failed plan reviews force structural planning changes. */

import { allowedReviewChoices } from "@/modules/architecture-standard";
import { describe, expect, it } from "vitest";

describe("plan-review choice policy", () => {
  it("allows ordinary review before the third failed verdict", () => {
    expect(allowedReviewChoices({ failedVerdicts: 2, permitsUsed: 0 })).toEqual(["review"]);
  });

  it("requires structural planning after the third failed verdict", () => {
    expect(allowedReviewChoices({ failedVerdicts: 3, permitsUsed: 0 })).toEqual(["redesign", "split"]);
  });

  it("allows one explicit exception after the fifth failed verdict", () => {
    expect(allowedReviewChoices({ failedVerdicts: 5, permitsUsed: 0 })).toEqual([
      "permit-one-more", "redesign", "split",
    ]);
  });

  it("prohibits repeated review permits for the retained issue", () => {
    expect(allowedReviewChoices({ failedVerdicts: 26, permitsUsed: 1 })).toEqual(["redesign", "split"]);
  });

  it("rejects invalid history counts", () => {
    expect(() => allowedReviewChoices({ failedVerdicts: -1, permitsUsed: 0 })).toThrow(
      "failedVerdicts must be a non-negative safe integer",
    );
    expect(() => allowedReviewChoices({ failedVerdicts: 5, permitsUsed: 0.5 })).toThrow(
      "permitsUsed must be a non-negative safe integer",
    );
  });
});
