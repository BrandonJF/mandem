# U2A Clean-Room Review, Round 4 Prompt

Date: 2026-08-04

Planning PR: `BrandonJF/mandem#37`

Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md`

Reviewed plan commit: `d80749aff3820ac53dbbf10b1aa191c75cb5eab3`

Reviewed plan SHA-256: `860b47c83a47de93b788f4dd87aa27473cb1a6563f07ad7ed4206c46eb807e65`

Governing plan contract: `PLANS.md`

Governing commit: `d80749aff3820ac53dbbf10b1aa191c75cb5eab3`

Governing `PLANS.md` SHA-256: `009eb0f26084005cdee79b555239f758de806ac1f1e15bcc731523b98826a6d3`

Author and reviser sessions: `/root` using OpenAI Codex; exact served model unavailable.

Prior reviewer sessions: `/root/u2a_clean_room_round1`, `/root/u2a_clean_room_round2`, and
`/root/u2a_clean_room_round3` using OpenAI Codex; exact served models unavailable. None revised the
plan.

Reviewer session: `/root/u2a_clean_room_round4` using OpenAI Codex; exact served model unavailable.

Reviewer role: independent clean-room issue ExecPlan reviewer with no role in authoring or revising
the reviewed plan and no access to the originating conversation.

Review lens: complete `PLANS.md` conformance, post-third-failure whole-plan readiness,
fresh-novice executability, complete state-change values, trusted participant provenance,
deterministic event replay, adversarial counterexamples, and exact closure of U2A round-3 findings
`U2A-CR3-001` through `U2A-CR3-004`.

Sole reviewer output path:
`docs/plans/reviews/2026-08-04-u2a-clean-room-round-4-reviewer-output.md`

## Reviewer Instructions

Act as a fresh clean-room reviewer with no authoring conversation. Inspect the reviewed commit.
Read `.agents/OPERATING.md` and the complete bound `PLANS.md` first; use every applicable clause as
the primary rubric.

Write only the sole output path above with `apply_patch`. Do not edit another file, commit, push,
comment on GitHub, mutate git-native issues, or ask the orchestrator to transcribe output. Return
only the path and SHA-256 through the agent channel.

Read the exact plan and contract, its parent epic, cited dependencies, required repository
surfaces, all prior U2 and U2A reviewer outputs, and this prompt. Challenge assumptions and seek
falsifying cases. Determine whether a fresh novice can implement U2A from the repository and plan
alone without inventing contracts. Do not require scheduled implementation evidence.

Recheck the whole plan. Verify the author actually completed the required post-third-failure
whole-plan audit, updated readiness/living sections, and made a defensible keep-or-split decision.
Try to falsify every with/without-lease pause and cancellation branch, resume's null-lease result,
reconciliation with no lease/work lease/integration lease, exact token and revocation folding, and
stale-owner replay. Try to omit or substitute an author/reviser/reviewer from the independently
verified participant inventory and prove the manifest cannot self-attest around it. Verify every
promised behavior has an exact input, event record, restoration path, consumer, and test, and that
U2A stays pure without SQLite, durable storage, checkpoint I/O, provider adapters, or later work.

Write Markdown with `Reviewed Targets`, `PLANS.md Conformance`, `Prior-Finding Closure`, `Verdict`,
`Findings`, and `Verification Notes`. Mark each round-3 finding `CLOSED` or `OPEN`. Report only
actionable findings with a stable ID, priority, exact evidence, failure scenario, and smallest
repair. Finish with `CLEAN` when none remain, or `CHANGES_REQUIRED` with counts. Put all reasoning
in the declared file. End with exactly one final line: `MANDEM_REVIEW_VERDICT: CLEAN` or
`MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED`.
