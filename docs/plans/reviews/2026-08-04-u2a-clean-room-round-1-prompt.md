# U2A Clean-Room Review, Round 1 Prompt

Date: 2026-08-04

Planning PR: `BrandonJF/mandem#37`

Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md`

Reviewed plan commit: `af034d892bac36f8b2571cee51951222a0f17c7a`

Reviewed plan SHA-256: `be7a694339bcb4d164fac2035206d1c82a0fad9eaadfaac73fe1e6d87758172d`

Governing plan contract: `PLANS.md`

Governing commit: `af034d892bac36f8b2571cee51951222a0f17c7a`

Governing `PLANS.md` SHA-256: `009eb0f26084005cdee79b555239f758de806ac1f1e15bcc731523b98826a6d3`

Author and reviser sessions: `/root` using OpenAI Codex; exact served model unavailable.

Reviewer session: `/root/u2a_clean_room_round1` using OpenAI Codex; exact served model unavailable.

Reviewer role: independent clean-room issue ExecPlan reviewer with no role in authoring or revising
the reviewed plan.

Review lens: complete `PLANS.md` conformance, fresh-novice executability, pure-domain boundary,
deterministic replay semantics, adversarial counterexamples, and closure of the common causes behind
the former combined U2 plan's thirteen failed reviews.

Sole reviewer output path:
`docs/plans/reviews/2026-08-04-u2a-clean-room-round-1-reviewer-output.md`

## Reviewer Instructions

Act as a fresh clean-room reviewer with no authoring conversation. Inspect the reviewed commit.
Read `.agents/OPERATING.md` and the complete bound `PLANS.md` first; use every applicable clause as
the primary rubric.

Write only the sole output path above with `apply_patch`. Do not edit another file, commit, push,
comment on GitHub, mutate git-native issues, or ask the orchestrator to transcribe output. Return
only the path and SHA-256 through the agent channel.

Read the exact plan and contract, its parent epic, cited dependencies, required repository
surfaces, all thirteen prior U2 reviewer outputs, and this prompt. Treat the prior outputs as design
evidence, not approval of U2A. Challenge assumptions and seek falsifying cases. Determine whether a
fresh novice can implement U2A from the repository and this plan alone without inventing contracts.
Verify every promised behavior has an exact input, record, restoration or replay path, consumer,
and test. Verify all public wire values, commands, events, results, errors, snapshots, transition
rules, trust boundaries, lease fencing, approval and review binding, process-finding rules,
failed-review limits, and U2B handoff values are complete and mutually consistent. Verify U2A
remains pure and does not absorb SQLite, durable storage, checkpoint I/O, provider adapters, or
later-issue responsibilities. Do not require scheduled implementation evidence.

Write Markdown with `Reviewed Targets`, `PLANS.md Conformance`, `Prior-Failure Common-Cause
Closure`, `Verdict`, `Findings`, and `Verification Notes`. Report only actionable findings with a
stable ID, priority, exact evidence, failure scenario, and smallest repair. Finish with `CLEAN` when
none remain, or `CHANGES_REQUIRED` with counts. Put all reasoning in the declared file. End with
exactly one final line: `MANDEM_REVIEW_VERDICT: CLEAN` or
`MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED`.
