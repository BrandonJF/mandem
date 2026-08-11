# U2 Clean-Room Review, Round 3 Prompt

Date: 2026-08-04

Planning PR: `BrandonJF/mandem#37`

Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md`

Reviewed plan commit: `5c18fffddbdf180702cd58ec284090aa1c8700b0`

Reviewed plan SHA-256: `6dad78b76409f477e4eda818f9dcf12185a8a471245a0b55dd6629d3b6298c44`

Governing plan contract: `PLANS.md`

Governing commit: `5c18fffddbdf180702cd58ec284090aa1c8700b0`

Governing `PLANS.md` SHA-256: `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0`

Author and reviser sessions: `/root` using OpenAI Codex; exact served model unavailable.

Reviewer session: `/root/u2_clean_room_round3` using OpenAI Codex with `gpt-5.6-sol`.

Review lens: complete `PLANS.md` conformance, executor safety, adversarial counterexamples, and
closure of the authoritative round-2 findings.

Sole reviewer output path:
`docs/plans/reviews/2026-08-04-u2-clean-room-round-3-reviewer-output.md`

## Reviewer Instructions

Act as a fresh clean-room reviewer. You did not author or revise the plan and must not receive its
authoring conversation. Inspect the repository at the reviewed commit. Read `.agents/OPERATING.md`
and the complete bound `PLANS.md` first, and treat every applicable `PLANS.md` requirement as the
primary rubric.

You may write only the sole output path above. Create that file yourself with `apply_patch`. Do not
edit another file, commit, push, comment on GitHub, mutate git-native issues, or ask the orchestrator
to transcribe terminal output. The exact bytes you write are authoritative. When finished, report
only the path and SHA-256 through the agent channel.

Read the exact U2 plan, `PLANS.md`, `.agents/OPERATING.md`, the epic and merged dependencies that
the plan cites, the repository contracts and scripts its instructions depend on, the round-1
reviewer output, the round-2 reviewer output, and this prompt. Use PR #37 only as a view of committed
history; Git and git-native issues must remain sufficient without GitHub.

Challenge the plan. Seek counterexamples, contradictions, impossible API instructions, undefined
wire values, lossy boundaries, and choices left to the executor. Verify both round-2 P1 repairs:

1. The plan literally defines every protocol catalog member, nested command and event payload,
   result, error, receipt, checkpoint, public port value, causation rule, guard outcome, parser,
   serializer, reducer, fixture inventory, and root export that U3-U7 need.
2. The lifecycle catalog includes process-finding creation, disposition, and supersession with
   exact per-phase roles and scopes, lease rules, deterministic identity inputs, uniqueness,
   duplicate and changed-evidence behavior, stable events and errors, phase blocking, and
   Plan/Work/Review/Learn/restart fixtures.

Also verify the two round-1 findings that round two closed, plus every applicable `PLANS.md` clause:
self-containment, novice orientation, defined terms, observable outcome, repository context,
independently verifiable milestones, exact commands and observations, validation, recovery,
interfaces, dependencies, living sections, cross-section consistency, and bottom revision note.
Do not require execution evidence that the plan schedules for implementation.

Write Markdown with `Reviewed Targets`, `PLANS.md Conformance`, `Prior-Finding Closure`, `Verdict`,
`Findings`, and `Verification Notes`. Report only actionable findings. Give each finding a stable
local ID, P0/P1/P2 priority, exact file and line evidence, failure scenario, and smallest repair.
Mark each round-2 finding `CLOSED` or `OPEN`. Finish with exactly one verdict: `CLEAN` when there are
no findings, or `CHANGES_REQUIRED` with a count by priority. Put all reasoning and caveats in the
declared file; do not compress them for the orchestrator.
