# U2 Clean-Room Review, Round 12 Prompt

Date: 2026-08-04

Planning PR: `BrandonJF/mandem#37`

Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md`

Reviewed plan commit: `8346d06443aecf557bb72e1f686a8b3982dcd3ef`

Reviewed plan SHA-256: `81374b4bdad5ecd35b53082aba239317d7e69b3a49fef5a39e220ce8abd2a713`

Governing plan contract: `PLANS.md`

Governing commit: `8346d06443aecf557bb72e1f686a8b3982dcd3ef`

Governing `PLANS.md` SHA-256: `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0`

Author and reviser sessions: `/root` using OpenAI Codex; exact served model unavailable.

Reviewer session: `/root/u2_clean_room_round12` using OpenAI Codex with `gpt-5.6-terra`.

Review lens: complete `PLANS.md` conformance, executor safety, adversarial counterexamples, and
closure of all authoritative round-11 findings.

Sole reviewer output path:
`docs/plans/reviews/2026-08-04-u2-clean-room-round-12-reviewer-output.md`

## Reviewer Instructions

Act as a fresh clean-room reviewer with no authoring conversation. Inspect the reviewed commit.
Read `.agents/OPERATING.md` and the complete bound `PLANS.md` first; use every applicable clause as
the primary rubric.

Write only the sole output path above with `apply_patch`. Do not edit another file, commit, push,
comment on GitHub, mutate git-native issues, or ask the orchestrator to transcribe output. Return
only the path and SHA-256 through the agent channel.

Read the exact plan and contract, epic, cited dependencies, required repository surfaces, every
prior U2 reviewer output, and this prompt. Challenge the plan. Verify the round-11 repair:
`completeCheckpoint` derives one closed `ValidatedCheckpointEvidenceV1` from trusted read-back,
passes it only to `complete-checkpoint`, stores the exact committed target in
`portable-checkpoint-verified`, and event-only replay restores checkpoint state and the dispatch
receipt target without calling the external port. Both destination kinds delete and rebuild every
projection byte-identically, and review acceptance uses the rebuilt receipt target. Recheck every
earlier closure, cross-section consistency, living sections, and every applicable `PLANS.md` clause.
Do not require scheduled implementation evidence.

Write Markdown with `Reviewed Targets`, `PLANS.md Conformance`, `Prior-Finding Closure`, `Verdict`,
`Findings`, and `Verification Notes`. Report only actionable findings with stable ID, priority,
exact evidence, failure scenario, and smallest repair. Mark the round-11 finding `CLOSED` or `OPEN`.
Finish with `CLEAN` when none remain, or `CHANGES_REQUIRED` with counts. Put all reasoning in the
declared file. End with exactly one final line: `MANDEM_REVIEW_VERDICT: CLEAN` or
`MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED`.
