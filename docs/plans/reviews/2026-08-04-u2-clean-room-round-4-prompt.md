# U2 Clean-Room Review, Round 4 Prompt

Date: 2026-08-04

Planning PR: `BrandonJF/mandem#37`

Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md`

Reviewed plan commit: `2c30eebddadc96a49f32084900a73c8cf8d26ea6`

Reviewed plan SHA-256: `35301eae0faf93cd5d7903ef51cb29a7f5e1092e11179121f93a537d9c1834af`

Governing plan contract: `PLANS.md`

Governing commit: `2c30eebddadc96a49f32084900a73c8cf8d26ea6`

Governing `PLANS.md` SHA-256: `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0`

Author and reviser sessions: `/root` using OpenAI Codex; exact served model unavailable.

Reviewer session: `/root/u2_clean_room_round4` using OpenAI Codex with `gpt-5.6-terra`.

Review lens: complete `PLANS.md` conformance, executor safety, adversarial counterexamples, and
closure of all authoritative round-3 findings.

Sole reviewer output path:
`docs/plans/reviews/2026-08-04-u2-clean-room-round-4-reviewer-output.md`

## Reviewer Instructions

Act as a fresh clean-room reviewer. You did not author or revise the plan and must not receive its
authoring conversation. Inspect the repository at the reviewed commit. Read `.agents/OPERATING.md`
and the complete bound `PLANS.md` first. Treat every applicable `PLANS.md` requirement as the
primary rubric.

Write only the sole output path above, and create it yourself with `apply_patch`. Do not edit another
file, commit, push, comment on GitHub, mutate git-native issues, or ask the orchestrator to transcribe
terminal output. Your exact file is authoritative. Return only its path and SHA-256 through the
agent channel.

Read the exact plan and contract, the epic and cited merged dependencies, the repository surfaces
the plan depends on, every prior U2 reviewer output, and this prompt. Challenge the plan and seek
counterexamples. Verify that round three's three P1s are closed:

1. The public snapshot, projection, and pure reducer carry exact plan, governing-contract, review,
   reviewer-risk, approval, gate, and handoff policy values, with complete signatures, freshness,
   alternative-model rules, serialization, replay, fixtures, and exports.
2. Protocol v1 includes complete heartbeat, takeover, and release commands and events, plus one
   replayable lease value with resource, acquisition, heartbeat, expiry, fencing, revocation,
   roles, scopes, errors, next actions, receipts, and tests.
3. Process-finding disposition and supersession derive and record a closed effect with prior and
   resulting state, intent-change decision, exact invalidated review/approval/gates, checkpoint
   behavior, authority, local and intent-changing fixtures, and byte-equivalent restart replay.

Recheck every finding that earlier rounds closed and every applicable `PLANS.md` clause. Do not
require implementation evidence that the plan schedules for implementation.

Write Markdown with `Reviewed Targets`, `PLANS.md Conformance`, `Prior-Finding Closure`, `Verdict`,
`Findings`, and `Verification Notes`. Report only actionable findings. Give each finding a stable
local ID, P0/P1/P2 priority, exact file and line evidence, failure scenario, and smallest repair.
Mark every round-3 finding `CLOSED` or `OPEN`. Finish with `CLEAN` when there are no findings, or
`CHANGES_REQUIRED` with counts. Put all reasoning and caveats in the declared file.
