# Reviewed Targets

I reviewed `docs/plans/issues/u2a1-runtime-protocol-foundation.md` from commit `5590ff13a0dff2b5b8976f1f992ed4489f7e3d2b`. Its verified SHA-256 is `a9721501cffb2da87daf33555e7d00650daaca6080536e12aa763af6fbc242ea`.

I reviewed `PLANS.md` from commit `5590ff13a0dff2b5b8976f1f992ed4489f7e3d2b`. Its verified SHA-256 is `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0`.

# Verdict

The ExecPlan is not yet executor-safe for a novice autonomous executor.

# Blocking Findings

## CR-001 — P1: The generic canonical JSON parser conflicts with a required fixture

Repository evidence: The plan defines `parseCanonicalJsonV1(bytes)` as the parser for a recursive canonical JSON value, whose object form permits readonly objects with canonical JSON values. It separately states that the parser accepts a successful canonical parse and returns that value. `docs/plans/contracts/u2a1-runtime-protocol-contract.ts` nevertheless places `unknown-envelope-key` in `canonicalFixtureOraclesV1` with the complete bytes `{"extra":0}\n` and requires `invalid-envelope` at `/extra` with detail `unknown envelope key`. Those bytes are a valid, key-sorted canonical JSON object, and the generic parser has no envelope schema or payload decoder from which it could determine that `extra` is unknown.

Failure scenario: An executor can correctly implement `parseCanonicalJsonV1` to accept the valid object, while another can add undocumented envelope-specific validation and reject it. The required fixture and the declared generic parser contract cannot both hold, so the Milestone 1 test instruction does not identify a valid expected result.

Smallest required repair: Remove `unknown-envelope-key` from the canonical JSON fixture catalog and its generic parser oracle. Add an envelope-specific fixture that supplies a complete otherwise-valid command envelope with the extra key, and require `parseCommandEnvelopeV1` or `serializeCommandEnvelopeV1` to produce the stated `invalid-envelope` result.

# Residual Low-Risk Concerns

None.

# Verification Notes

I read the bound `AGENTS.md`, `.agents/OPERATING.md`, `PLANS.md`, and ExecPlan, then inspected the referenced runtime module, architecture standard, package scripts, and U2A1 planning contract. I verified all bound SHA-256 values from the specified Git commit and confirmed that the bound plan is an ancestor of the review worktree. I ran `bunx vitest run docs/plans/contracts/u2a1-runtime-protocol-contract.test.ts`; it passed with one file and ten tests. I used the bound plan and contract bytes for this review.

MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED
