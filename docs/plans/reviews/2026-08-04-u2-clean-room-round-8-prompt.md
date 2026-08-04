# U2 Clean-Room Review, Round 8 Prompt

Date: 2026-08-04

Planning PR: `BrandonJF/mandem#37`

Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md`

Reviewed plan commit: `582b5538cb84f79af61d60bd5abd8af4e9065309`

Reviewed plan SHA-256: `f1ca35b4486a8dc8c3c8fc3a3b0f36385a3c39383c3147f5113f8186c7b44381`

Governing plan contract: `PLANS.md`

Governing commit: `582b5538cb84f79af61d60bd5abd8af4e9065309`

Governing `PLANS.md` SHA-256: `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0`

Author and reviser sessions: `/root` using OpenAI Codex; exact served model unavailable.

Reviewer session: `/root/u2_clean_room_round8` using OpenAI Codex with `gpt-5.6-terra`.

Review lens: complete `PLANS.md` conformance, executor safety, adversarial counterexamples, and
closure of all authoritative round-7 findings.

Sole reviewer output path:
`docs/plans/reviews/2026-08-04-u2-clean-room-round-8-reviewer-output.md`

## Reviewer Instructions

Act as a fresh clean-room reviewer with no authoring conversation. Inspect the reviewed commit.
Read `.agents/OPERATING.md` and the complete bound `PLANS.md` first; use every applicable clause as
the primary rubric.

Write only the sole output path above with `apply_patch`. Do not edit another file, commit, push,
comment on GitHub, mutate git-native issues, or ask the orchestrator to transcribe output. Return
only the path and SHA-256 through the agent channel.

Read the exact plan and contract, epic, cited dependencies, required repository surfaces, every
prior U2 reviewer output, and this prompt. Challenge the plan. Verify the round-7 repair: the sole
dispatch record is embedded in the submitted manifest, binds the canonical prompt digest, reviewer
session, exact provider receipt, and reviewer-attested received-prompt digest, admits no search or
fallback, enters the canonical validated bundle digest, and has absent, changed, substituted, and
decoy-receipt tests. Recheck every earlier closed finding, cross-section consistency, living
sections, and every applicable `PLANS.md` clause. Do not require scheduled implementation evidence.

Write Markdown with `Reviewed Targets`, `PLANS.md Conformance`, `Prior-Finding Closure`, `Verdict`,
`Findings`, and `Verification Notes`. Report only actionable findings with stable ID, priority,
exact evidence, failure scenario, and smallest repair. Mark the round-7 finding `CLOSED` or `OPEN`.
Finish with `CLEAN` when none remain, or `CHANGES_REQUIRED` with counts. Put all reasoning in the
declared file. End the output with exactly one machine-readable final line:
`MANDEM_REVIEW_VERDICT: CLEAN` or `MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED`.
