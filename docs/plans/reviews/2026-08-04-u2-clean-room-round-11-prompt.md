# U2 Clean-Room Review, Round 11 Prompt

Date: 2026-08-04

Planning PR: `BrandonJF/mandem#37`

Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md`

Reviewed plan commit: `e1c3e607de4d2e3ffdee7bfba0d8543bbaedd2ba`

Reviewed plan SHA-256: `d24ad203b8fc6b41aa278e0af7ace94ab8efb2a5b7eef5b5826cae21214d1a47`

Governing plan contract: `PLANS.md`

Governing commit: `e1c3e607de4d2e3ffdee7bfba0d8543bbaedd2ba`

Governing `PLANS.md` SHA-256: `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0`

Author and reviser sessions: `/root` using OpenAI Codex; exact served model unavailable.

Reviewer session: `/root/u2_clean_room_round11` using OpenAI Codex with `gpt-5.6-sol`.

Review lens: complete `PLANS.md` conformance, executor safety, adversarial counterexamples, and
closure of all authoritative round-10 findings.

Sole reviewer output path:
`docs/plans/reviews/2026-08-04-u2-clean-room-round-11-reviewer-output.md`

## Reviewer Instructions

Act as a fresh clean-room reviewer with no authoring conversation. Inspect the reviewed commit.
Read `.agents/OPERATING.md` and the complete bound `PLANS.md` first; use every applicable clause as
the primary rubric.

Write only the sole output path above with `apply_patch`. Do not edit another file, commit, push,
comment on GitHub, mutate git-native issues, or ask the orchestrator to transcribe output. Return
only the path and SHA-256 through the agent channel.

Read the exact plan and contract, epic, cited dependencies, required repository surfaces, every
prior U2 reviewer output, and this prompt. Challenge the plan. Verify the round-10 repair: every
pending checkpoint carries a closed bounded payload with exact bytes and digest; pure policy derives
the sole destination; the port observes or writes those bytes and returns exact read-back bytes and
committed target; dispatch receipts use the one UUID-derived review path; issue-ref checkpoints
extract the originating event's canonical record; completion compares bytes and digest; replay
stores the verified receipt target; interruption, matching-existing, and conflict tests cover both
destination kinds. Recheck every earlier closure, cross-section consistency, living sections, and
every applicable `PLANS.md` clause. Do not require scheduled implementation evidence.

Write Markdown with `Reviewed Targets`, `PLANS.md Conformance`, `Prior-Finding Closure`, `Verdict`,
`Findings`, and `Verification Notes`. Report only actionable findings with stable ID, priority,
exact evidence, failure scenario, and smallest repair. Mark the round-10 finding `CLOSED` or `OPEN`.
Finish with `CLEAN` when none remain, or `CHANGES_REQUIRED` with counts. Put all reasoning in the
declared file. End with exactly one final line: `MANDEM_REVIEW_VERDICT: CLEAN` or
`MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED`.
