# U2 Clean-Room Review, Round 13 Prompt

Date: 2026-08-04

Planning PR: `BrandonJF/mandem#37`

Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md`

Reviewed plan commit: `e3b8ec185eac9280213ce8f7f59d75012b39251b`

Reviewed plan SHA-256: `b4939425b0311d79c62ce2fc7b4e2cb660aee0ea1d1ab19c52c0e99bed240765`

Governing plan contract: `PLANS.md`

Governing commit: `e3b8ec185eac9280213ce8f7f59d75012b39251b`

Governing `PLANS.md` SHA-256: `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0`

Author and reviser sessions: `/root` using OpenAI Codex; exact served model unavailable.

Reviewer session: `/root/u2_clean_room_round13` using OpenAI Codex with `gpt-5.6-terra`.

Review lens: complete `PLANS.md` conformance, executor safety, adversarial counterexamples, and
closure of all authoritative round-12 findings.

Sole reviewer output path:
`docs/plans/reviews/2026-08-04-u2-clean-room-round-13-reviewer-output.md`

## Reviewer Instructions

Act as a fresh clean-room reviewer with no authoring conversation. Inspect the reviewed commit.
Read `.agents/OPERATING.md` and the complete bound `PLANS.md` first; use every applicable clause as
the primary rubric.

Write only the sole output path above with `apply_patch`. Do not edit another file, commit, push,
comment on GitHub, mutate git-native issues, or ask the orchestrator to transcribe output. Return
only the path and SHA-256 through the agent channel.

Read the exact plan and contract, epic, cited dependencies, required repository surfaces, every
prior U2 reviewer output, and this prompt. Challenge the plan. Verify the round-12 repair: for both
checkpoint destination kinds, the named tests capture canonical lifecycle, lease, gate,
routed-item, and checkpoint projection bytes; delete all five disposable projection sets; fail if
replay calls `PortableCheckpointPort`; rebuild only from events; and compare every reconstructed
value byte-for-byte before replacement. The receipt case must then accept review through the
rebuilt non-null receipt target. Recheck every earlier closure, cross-section consistency, living
sections, and every applicable `PLANS.md` clause. Do not require scheduled implementation evidence.

Write Markdown with `Reviewed Targets`, `PLANS.md Conformance`, `Prior-Finding Closure`, `Verdict`,
`Findings`, and `Verification Notes`. Report only actionable findings with stable ID, priority,
exact evidence, failure scenario, and smallest repair. Mark the round-12 finding `CLOSED` or `OPEN`.
Finish with `CLEAN` when none remain, or `CHANGES_REQUIRED` with counts. Put all reasoning in the
declared file. End with exactly one final line: `MANDEM_REVIEW_VERDICT: CLEAN` or
`MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED`.
