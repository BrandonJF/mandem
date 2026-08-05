# U2A Clean-Room Review, Round 5 Prompt

Date: 2026-08-04

Planning PR: `BrandonJF/mandem#37`

Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md`

Reviewed plan commit: `afcbbd569b396ccda4792b73d4e9dfc95ec7b4fd`

Reviewed plan SHA-256: `741cf7e0f8a3be756f50ebedf8a0c676b6a503591b3fc34403ad1b2afb51a84f`

Current readiness artifact: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md` at the reviewed plan
commit and SHA-256 above, specifically its `Behavior Readiness Check` bound to lineage ID
`723787f06b1e33896b70cbaabdfc9555dbbab306e4b9da09690b72a7218262a1`.

Immutable lineage declaration: native issue `cb67d131-975c-4d97-9a6f-4934be991ac6` commit
`5de15b514dc4acfb127b2a76291b2ccf1c741ed6`, exact message SHA-256
`adb31761bd72af5a6bad15780dc5c518aa118040558f7c5f74c63f63990d5957`.

Governing plan contract: `PLANS.md`

Governing commit: `afcbbd569b396ccda4792b73d4e9dfc95ec7b4fd`

Governing `PLANS.md` SHA-256: `009eb0f26084005cdee79b555239f758de806ac1f1e15bcc731523b98826a6d3`

Author and reviser sessions: `/root` using OpenAI Codex; exact served model unavailable.

Prior reviewer sessions: `/root/u2a_clean_room_round1` through `/root/u2a_clean_room_round4`
using OpenAI Codex; exact served models unavailable. None revised the plan.

Reviewer session: `/root/u2a_clean_room_round5` using OpenAI Codex; exact served model unavailable.

Reviewer role: independent clean-room issue ExecPlan reviewer with no role in authoring or revising
the reviewed plan and no access to the originating conversation.

Review lens: complete `PLANS.md` conformance, fresh-novice executability, immutable review lineage,
deterministic rejection recovery, trusted workspace provenance, complete event replay, adversarial
counterexamples, and exact closure of U2A round-4 findings `U2A-CR4-001` through `U2A-CR4-003`.

Sole reviewer output path:
`docs/plans/reviews/2026-08-04-u2a-clean-room-round-5-reviewer-output.md`

## Reviewer Instructions

Act as a fresh clean-room reviewer with no authoring conversation. Inspect the reviewed commit.
Read `.agents/OPERATING.md` and the complete bound `PLANS.md` first; use every applicable clause as
the primary rubric.

Write only the sole output path above with `apply_patch`. Do not edit another file, commit, push,
comment on GitHub, mutate git-native issues, or ask the orchestrator to transcribe output. Return
only the path and SHA-256 through the agent channel.

Read the exact plan and contract, its parent epic, cited dependencies, required repository
surfaces, all prior U2 and U2A reviewer outputs, the exact native lineage declaration, and this
prompt. Challenge assumptions and seek falsifying cases. Determine whether a fresh novice can
implement U2A from the repository and plan alone without inventing contracts. Do not require
scheduled implementation evidence.

Recheck the whole plan. Try to create a self-reference or authorize another issue/scope/readiness
set through the immutable lineage declaration. For every error code and ordered guard, try to
produce two different retry/evidence/next-action results. For every workspace-bearing command, try
absence, wrong-command presence, foreign repository, stale head, identity/branch/path mismatch,
and active/no-active lease branches. Verify every promised behavior has an exact input, event
record, restoration path, consumer, and test, and that U2A stays pure without SQLite, durable
storage, checkpoint I/O, provider adapters, or later work.

Write Markdown with `Reviewed Targets`, `PLANS.md Conformance`, `Prior-Finding Closure`, `Verdict`,
`Findings`, and `Verification Notes`. Mark each round-4 finding `CLOSED` or `OPEN`. Report only
actionable findings with a stable ID, priority, exact evidence, failure scenario, and smallest
repair. Finish with `CLEAN` when none remain, or `CHANGES_REQUIRED` with counts. Put all reasoning
in the declared file. End with exactly one final line: `MANDEM_REVIEW_VERDICT: CLEAN` or
`MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED`.
