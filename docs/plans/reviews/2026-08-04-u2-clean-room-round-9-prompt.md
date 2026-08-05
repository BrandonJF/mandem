# U2 Clean-Room Review, Round 9 Prompt

Date: 2026-08-04

Planning PR: `BrandonJF/mandem#37`

Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md`

Reviewed plan commit: `6f10f84f4a8ff7b066a8a80ab41cf7c34fe777b4`

Reviewed plan SHA-256: `b0bac84b1afe6c115141738bad418075bfbfd01f17e155b1c973452b9f6903ad`

Governing plan contract: `PLANS.md`

Governing commit: `6f10f84f4a8ff7b066a8a80ab41cf7c34fe777b4`

Governing `PLANS.md` SHA-256: `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0`

Author and reviser sessions: `/root` using OpenAI Codex; exact served model unavailable.

Reviewer session: `/root/u2_clean_room_round9` using OpenAI Codex with `gpt-5.6-sol`.

Review lens: complete `PLANS.md` conformance, executor safety, adversarial counterexamples, and
closure of all authoritative round-8 findings.

Sole reviewer output path:
`docs/plans/reviews/2026-08-04-u2-clean-room-round-9-reviewer-output.md`

## Reviewer Instructions

Act as a fresh clean-room reviewer with no authoring conversation. Inspect the reviewed commit.
Read `.agents/OPERATING.md` and the complete bound `PLANS.md` first; use every applicable clause as
the primary rubric.

Write only the sole output path above with `apply_patch`. Do not edit another file, commit, push,
comment on GitHub, mutate git-native issues, or ask the orchestrator to transcribe output. Return
only the path and SHA-256 through the agent channel.

Read the exact plan and contract, epic, cited dependencies, required repository surfaces, every
prior U2 reviewer output, and this prompt. Challenge the plan. Verify the round-8 repair: the review
evidence bundle carries the manifest-bound provider receipt's exact target, committed bytes, and
parsed closed value; validation independently hashes and compares its target, dispatch ID, reviewer
session, prompt digest, dispatch time, provider, and model; the canonical bundle digest and limits
include those bytes; disposable-Git tests alter the real receipt artifact for absent, changed,
substituted, and decoy cases. Recheck every earlier closure, cross-section consistency, living
sections, and every applicable `PLANS.md` clause. Do not require scheduled implementation evidence.

Write Markdown with `Reviewed Targets`, `PLANS.md Conformance`, `Prior-Finding Closure`, `Verdict`,
`Findings`, and `Verification Notes`. Report only actionable findings with stable ID, priority,
exact evidence, failure scenario, and smallest repair. Mark the round-8 finding `CLOSED` or `OPEN`.
Finish with `CLEAN` when none remain, or `CHANGES_REQUIRED` with counts. Put all reasoning in the
declared file. End with exactly one final line: `MANDEM_REVIEW_VERDICT: CLEAN` or
`MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED`.
