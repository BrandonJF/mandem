# Reviewed Targets

- Review prompt: `docs/plans/reviews/2026-08-04-u2-clean-room-round-6-prompt.md`.
- Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md` at `d4a9d1fdcbb48feef8e91a69094a8f380a9d7a11`; SHA-256 verified as `f4bc5834ada1e34c0a5dd1b429ba1bfc77943524522ddc6442fc004b94742146` from Git object bytes.
- Governing contract: `PLANS.md` at `d4a9d1fdcbb48feef8e91a69094a8f380a9d7a11`; SHA-256 verified as `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0` from Git object bytes.
- Review lens: complete `PLANS.md` conformance, executor safety, adversarial counterexamples, and closure of the round-five findings.

# PLANS.md Conformance

The plan passes the content-only ExecPlan format rule, purpose and observable-outcome requirements, repository orientation, defined core terms, dependency snapshot, ordered milestones, repository-root Bun commands, red/green observations, validation gates, recovery guidance, living sections, and revision-note requirement. The SQLite instructions are repository-local. The plan schedules implementation evidence rather than claiming implementation has occurred.

The plan does not meet the non-negotiable self-containment and novice-execution requirements for review acceptance. Its manifest schema does not retain the complete sanitized prompt that the review contract requires, and its validator has no defined way to derive the review verdict from the reviewer-authored output bytes. Both omissions allow a caller or adapter to supply a favorable assertion while the committed reviewer artifact says something else.

The single-fenced-block rule does not apply because this Markdown file contains the ExecPlan. Prototype and parallel-implementation guidance does not apply because the plan schedules neither.

# Prior-Finding Closure

- `U2-R5-001` — **CLOSED.** `submit-plan-review` stores the submitted manifest target in policy state, and acceptance loads that exact target. The Git-backed evidence adapter, validator, and Milestone 3 tests bind the exact manifest/output bytes, sole write, attestations, author and reviser sets, context, role, lenses, and risk policy at lines 600-604 and 819-822.
- `U2-R5-002` — **CLOSED.** `plan-review-accepted` is a server-derived event carrying `ReviewDecisionV1`, and replay reconstructs it without external evidence at lines 533-537 and 820.
- `U2-R5-003` — **CLOSED.** `return-for-repair` atomically revokes the integration lease and creates the named fenced work lease. The event stores both leases, and the catalog and tests cover first repair work, handoff, stale-owner fencing, and replay at lines 371, 389, 533-537, and 786.
- `U2-R5-004` — **CLOSED.** `Outcomes & Retrospective` records the five completed review rounds, the absence of approval and implementation evidence, and the next permitted clean-room review action at line 1003.

# Verdict

`CHANGES_REQUIRED` — P0: 0, P1: 2, P2: 0.

# Findings

## U2-R6-001 — P1: The review manifest cannot store or validate the complete sanitized prompt

Exact evidence: R12a requires each review manifest to store the complete sanitized prompt at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:80`. `BoundReviewManifestV1` instead contains only `complete_prompt_digest` at line 503. `ReviewEvidenceBundleV1` has manifest and output bytes but no prompt value or prompt artifact at line 504, and `validateReviewEvidence` checks only the digest at line 602. The size table reserves manifest bytes for validation at lines 613-615 but never defines a complete-prompt field or its parsing, byte limit, digest derivation, or comparison to the prompt delivered to the reviewer.

Failure scenario: a planning session commits a manifest whose declared digest names a favorable prompt while dispatching a shorter or differently scoped prompt to the reviewer. The output file and its digest can still be valid, and the validator can compare only the manifest's asserted digest. A later executor cannot prove from the manifest bytes that the reviewer received the required challenge-oriented, complete sanitized prompt, as R12a and R12c require.

Smallest repair: add a required `complete_sanitized_prompt` value to `BoundReviewManifestV1`, define its UTF-8 limit, canonical digest calculation, and exact relationship to `complete_prompt_digest`, and require the Git adapter to return and the validator to compare those bytes with the reviewer-dispatch record. Keep the prompt outside SQLite: store only its digest and validated structured evidence in `ReviewDecisionV1`. Add parser, serializer, adapter, and rejection fixtures for absent, changed, noncanonical, oversized, and dispatch-mismatched prompt bytes.

## U2-R6-002 — P1: The review decision's verdict is an undeclared adapter assertion instead of a result derived from reviewer output

Exact evidence: `ReviewOutputTargetV1` includes a `verdict` field at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:494`, and `ReviewEvidenceBundleV1` returns that target alongside raw `output_bytes` at line 504. The reviewer-output requirements only require a complete reviewer-authored file; no protocol section specifies a closed output marker, parser, or rule that derives `ReviewOutputTargetV1.verdict` from those bytes. `validateReviewEvidence` hashes the output and validates path, digest, write set, identities, and lenses at line 602, but it does not prescribe parsing the output or rejecting a supplied verdict that disagrees with it. `accept-plan-review` then accepts caller payload `verdict: "executor-safe"` at lines 459 and 600.

Failure scenario: a reviewer writes a complete output that ends `CHANGES_REQUIRED` and identifies a P1 finding. A phase agent or adapter supplies a matching path and digest with `ReviewOutputTargetV1.verdict: "executor-safe"`. Every byte, write-set, and session check described in the plan can pass because no required parser compares the output's stated decision to the target's verdict. The lifecycle can therefore append `plan-review-accepted` despite the reviewer rejecting the plan.

Smallest repair: define one machine-readable final decision marker in the reviewer-output contract, map its exact accepted values to `ReviewOutputTargetV1.verdict`, and require the Git adapter or pure validator to parse it from `output_bytes` after canonical byte validation. Reject absent, repeated, malformed, and digest-mismatched markers as `ARTIFACT_MISSING` or `ARTIFACT_STALE`; reject a non-clean decision before the lifecycle reducer. Update the review prompt template, parser/serializer fixtures, `validateReviewEvidence` tests, and the projection-rebuild test to prove that only a reviewer-authored clean marker can produce `plan-review-accepted`.

# Verification Notes

I read the complete bound `PLANS.md`, the exact reviewed plan, this prompt, the complete epic ExecPlan, the U1, U1C, U1A, and WI1 dependency contracts, the architecture and approval contracts, the runtime and architecture-standard public surfaces, package scripts, and every prior U2 reviewer output. All dependency and baseline commits named by the plan are ancestors of the reviewed commit. I verified the bound digests from `git show <commit>:<path>` and did not use working-tree content as review evidence.

I did not require implementation evidence scheduled for Milestones 1-5.

CHANGES_REQUIRED — P0: 0, P1: 2, P2: 0.
