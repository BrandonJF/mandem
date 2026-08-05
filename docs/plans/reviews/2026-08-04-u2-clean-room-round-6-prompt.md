# U2 Clean-Room Review, Round 6 Prompt

Date: 2026-08-04

Planning PR: `BrandonJF/mandem#37`

Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md`

Reviewed plan commit: `d4a9d1fdcbb48feef8e91a69094a8f380a9d7a11`

Reviewed plan SHA-256: `f4bc5834ada1e34c0a5dd1b429ba1bfc77943524522ddc6442fc004b94742146`

Governing plan contract: `PLANS.md`

Governing commit: `d4a9d1fdcbb48feef8e91a69094a8f380a9d7a11`

Governing `PLANS.md` SHA-256: `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0`

Author and reviser sessions: `/root` using OpenAI Codex; exact served model unavailable.

Reviewer session: `/root/u2_clean_room_round6` using OpenAI Codex with `gpt-5.6-terra`.

Review lens: complete `PLANS.md` conformance, executor safety, adversarial counterexamples, and
closure of all authoritative round-5 findings.

Sole reviewer output path:
`docs/plans/reviews/2026-08-04-u2-clean-room-round-6-reviewer-output.md`

## Reviewer Instructions

Act as a fresh clean-room reviewer with no authoring conversation. Inspect the reviewed commit.
Read `.agents/OPERATING.md` and the complete bound `PLANS.md` first and use every applicable clause
as the primary rubric.

Write only the sole output path above with `apply_patch`. Do not edit another file, commit, push,
comment on GitHub, mutate git-native issues, or ask the orchestrator to transcribe output. Return
only the path and SHA-256 through the agent channel.

Read the exact plan and contract, epic, cited dependencies, required repository surfaces, every
prior U2 reviewer output, and this prompt. Challenge the plan. Verify all round-5 repairs:

1. `submit-plan-review` stores the sole manifest target; acceptance cannot substitute another.
   The evidence adapter reads exact manifest/output bytes and committed session attestations for
   that target. The validator checks bound plan, `PLANS.md`, prompt, role, lenses, sole write,
   separate authors and revisers, inherited context, provider/model diversity, and availability.
2. The server-derived accepted-review event stores the complete validated review decision, so
   replay remains byte-identical after external evidence disappears or changes.
3. `return-for-repair` atomically revokes the integration lease and creates the named fenced work
   lease, with exact event, projection, checkpoint, stale-owner, mutation, handoff, and replay rules.
4. Every living section, especially `Outcomes & Retrospective`, states the current review status and
   next permitted action.

Recheck all earlier closed findings and every applicable `PLANS.md` clause. Do not require scheduled
implementation evidence.

Write Markdown with `Reviewed Targets`, `PLANS.md Conformance`, `Prior-Finding Closure`, `Verdict`,
`Findings`, and `Verification Notes`. Report only actionable findings with stable ID, priority,
exact evidence, failure scenario, and smallest repair. Mark every round-5 finding `CLOSED` or
`OPEN`. Finish with `CLEAN` when none remain, or `CHANGES_REQUIRED` with counts. Put all reasoning
in the declared file.
