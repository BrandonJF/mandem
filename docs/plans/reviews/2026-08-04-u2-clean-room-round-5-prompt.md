# U2 Clean-Room Review, Round 5 Prompt

Date: 2026-08-04

Planning PR: `BrandonJF/mandem#37`

Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md`

Reviewed plan commit: `f17752b086ebcf59c5ba895cf3404488387433a0`

Reviewed plan SHA-256: `85ba4163effd34c503ff69223378d454073c27e3f66b717a625079d45e3129b1`

Governing plan contract: `PLANS.md`

Governing commit: `f17752b086ebcf59c5ba895cf3404488387433a0`

Governing `PLANS.md` SHA-256: `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0`

Author and reviser sessions: `/root` using OpenAI Codex; exact served model unavailable.

Reviewer session: `/root/u2_clean_room_round5` using OpenAI Codex with `gpt-5.6-sol`.

Review lens: complete `PLANS.md` conformance, executor safety, adversarial counterexamples, and
closure of all authoritative round-4 findings.

Sole reviewer output path:
`docs/plans/reviews/2026-08-04-u2-clean-room-round-5-reviewer-output.md`

## Reviewer Instructions

Act as a fresh clean-room reviewer with no authoring conversation. Inspect the repository at the
reviewed commit. Read `.agents/OPERATING.md` and the complete bound `PLANS.md` first; every
applicable `PLANS.md` requirement is the primary rubric.

Write only the sole output path above with `apply_patch`. Do not edit another file, commit, push,
comment on GitHub, mutate git-native issues, or ask the orchestrator to transcribe terminal output.
Return only the path and SHA-256 through the agent channel.

Read the exact plan and contract, epic, cited dependencies, required repository surfaces, every
prior U2 reviewer output, and this prompt. Challenge the plan and verify both round-4 repairs:

1. Review acceptance now derives manifest bytes, output bytes, sole write set, separate author and
   reviser identities, reviewer identity, inherited-context status, provider/model choice, and risk
   availability from a trusted evidence port. Verify exact values, adapter work, validator flow,
   stored evidence, errors, fixtures, serialization, replay, and exports; no caller assertion may
   grant review acceptance.
2. Work-lease release now requires operator summary, reconciliation and workspace evidence, moves
   `Working` to `Queued`, checkpoints that outcome, and permits a fresh dispatch. `Merging` must
   reject generic release and direct the takeover owner only to exact merge, repair, or source
   reconciliation. Verify event bytes, next actions, errors, replay, and takeover-release tests.

Recheck every earlier closed finding and every applicable `PLANS.md` clause. Do not require
implementation evidence that the plan schedules for implementation.

Write Markdown with `Reviewed Targets`, `PLANS.md Conformance`, `Prior-Finding Closure`, `Verdict`,
`Findings`, and `Verification Notes`. Report only actionable findings, each with stable ID,
P0/P1/P2 priority, exact evidence, failure scenario, and smallest repair. Mark both round-4 findings
`CLOSED` or `OPEN`. Finish with `CLEAN` when there are no findings, or `CHANGES_REQUIRED` with
counts. Put all reasoning in the declared file.
