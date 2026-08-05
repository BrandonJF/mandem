# U2A Clean-Room Review, Round 3 Prompt

Date: 2026-08-04

Planning PR: `BrandonJF/mandem#37`

Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md`

Reviewed plan commit: `e5a629ce57d11902403b4fc421bf34b4576b6032`

Reviewed plan SHA-256: `5b008b924eb3eab7fbef90f174e1e9f2df271d0c9ff1761d617cd3d4c59adedc`

Governing plan contract: `PLANS.md`

Governing commit: `e5a629ce57d11902403b4fc421bf34b4576b6032`

Governing `PLANS.md` SHA-256: `009eb0f26084005cdee79b555239f758de806ac1f1e15bcc731523b98826a6d3`

Author and reviser sessions: `/root` using OpenAI Codex; exact served model unavailable.

Prior reviewer sessions: `/root/u2a_clean_room_round1` and `/root/u2a_clean_room_round2` using
OpenAI Codex; exact served models unavailable. Neither session revised the plan.

Reviewer session: `/root/u2a_clean_room_round3` using OpenAI Codex; exact served model unavailable.

Reviewer role: independent clean-room issue ExecPlan reviewer with no role in authoring or revising
the reviewed plan and no access to the originating conversation.

Review lens: complete `PLANS.md` conformance, fresh-novice executability, pure-domain boundary,
closed review-evidence schema, deterministic event replay, adversarial counterexamples, and exact
closure of U2A round-2 findings `U2A-CR2-001` through `U2A-CR2-004`.

Sole reviewer output path:
`docs/plans/reviews/2026-08-04-u2a-clean-room-round-3-reviewer-output.md`

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

Recheck the whole plan. Specifically try to falsify the aligned control-plane scope matrix; every
review manifest, participant, risk, trusted-attestation, validated-evidence, validator-input, and
result field; the exact digest-domain/byte/length/update equation; and the single-writer lease
semantics and intermediate states for review repair, Learn integration, and merge repair. Verify
the fixed fixtures can distinguish plausible incompatible implementations. Verify every promised
behavior has an exact input, event record, restoration path, consumer, and test, and that U2A stays
pure without SQLite, durable storage, checkpoint I/O, provider adapters, or later-issue work.

Write Markdown with `Reviewed Targets`, `PLANS.md Conformance`, `Prior-Finding Closure`, `Verdict`,
`Findings`, and `Verification Notes`. Mark each round-2 finding `CLOSED` or `OPEN`. Report only
actionable findings with a stable ID, priority, exact evidence, failure scenario, and smallest
repair. Finish with `CLEAN` when none remain, or `CHANGES_REQUIRED` with counts. Put all reasoning
in the declared file. End with exactly one final line: `MANDEM_REVIEW_VERDICT: CLEAN` or
`MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED`.
