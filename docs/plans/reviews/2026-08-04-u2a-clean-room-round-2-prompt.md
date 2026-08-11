# U2A Clean-Room Review, Round 2 Prompt

Date: 2026-08-04

Planning PR: `BrandonJF/mandem#37`

Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md`

Reviewed plan commit: `85018c7a0532e1a64c4dac208c37cfb46f800cd3`

Reviewed plan SHA-256: `f02e7414ac5b974752740e0fca29f35b9aa4f21270ff6bdda57a1ac1f1731025`

Governing plan contract: `PLANS.md`

Governing commit: `85018c7a0532e1a64c4dac208c37cfb46f800cd3`

Governing `PLANS.md` SHA-256: `009eb0f26084005cdee79b555239f758de806ac1f1e15bcc731523b98826a6d3`

Author and reviser sessions: `/root` using OpenAI Codex; exact served model unavailable.

Prior reviewer session: `/root/u2a_clean_room_round1` using OpenAI Codex; exact served model
unavailable. That session did not revise the plan.

Reviewer session: `/root/u2a_clean_room_round2` using OpenAI Codex; exact served model unavailable.

Reviewer role: independent clean-room issue ExecPlan reviewer with no role in authoring or revising
the reviewed plan and no access to the originating conversation.

Review lens: complete `PLANS.md` conformance, fresh-novice executability, pure-domain boundary,
deterministic event replay, closed-schema compatibility, adversarial counterexamples, and exact
closure of U2A round-1 findings `U2A-CR1-001` through `U2A-CR1-004`.

Sole reviewer output path:
`docs/plans/reviews/2026-08-04-u2a-clean-room-round-2-reviewer-output.md`

## Reviewer Instructions

Act as a fresh clean-room reviewer with no authoring conversation. Inspect the reviewed commit.
Read `.agents/OPERATING.md` and the complete bound `PLANS.md` first; use every applicable clause as
the primary rubric.

Write only the sole output path above with `apply_patch`. Do not edit another file, commit, push,
comment on GitHub, mutate git-native issues, or ask the orchestrator to transcribe output. Return
only the path and SHA-256 through the agent channel.

Read the exact plan and contract, its parent epic, cited dependencies, required repository
surfaces, all thirteen former U2 reviewer outputs, U2A round-1 prompt and exact reviewer output, and
this prompt. Challenge assumptions and seek falsifying cases. Determine whether a fresh novice can
implement U2A from the repository and plan alone without inventing contracts. Do not require
scheduled implementation evidence.

Recheck the whole plan, not only the prior findings. Specifically try to falsify these repairs:

1. The retained issue preserves thirteen former failures plus U2A round 1 as lifetime failure
   fourteen, carries the recorded operator-selected split lineage without resetting the count, and
   gives U2B an event-only producer for imported history.
2. The exhaustive role/scope matrix permits control-plane `integrate` for both merge commands and
   denies unlisted combinations.
3. Exact merge and verification records retain approved head, merge SHA, evidence, outcome, and
   failure code in events and snapshots; replay restores them without Git or inference and rejects
   mismatched verification.
4. Artifact, handoff, reason, resolution, failure, lineage, and parse-result values have closed
   shapes, validation, transition mappings, stable failures, round trips, and unknown-value tests.

Verify every promised behavior has an exact input, record, restoration or replay path, consumer,
and test. Verify all public wire values, commands, events, results, errors, snapshots, transition
rules, trust boundaries, lease fencing, approval and review binding, process-finding rules,
failed-review limits, and U2B handoff values are complete and mutually consistent. Verify U2A
remains pure and does not absorb SQLite, durable storage, checkpoint I/O, provider adapters, or
later-issue responsibilities.

Write Markdown with `Reviewed Targets`, `PLANS.md Conformance`, `Prior-Finding Closure`, `Verdict`,
`Findings`, and `Verification Notes`. Mark each round-1 finding `CLOSED` or `OPEN`. Report only
actionable findings with a stable ID, priority, exact evidence, failure scenario, and smallest
repair. Finish with `CLEAN` when none remain, or `CHANGES_REQUIRED` with counts. Put all reasoning
in the declared file. End with exactly one final line: `MANDEM_REVIEW_VERDICT: CLEAN` or
`MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED`.
