# U2 Clean-Room Review, Round 10 Prompt

Date: 2026-08-04

Planning PR: `BrandonJF/mandem#37`

Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md`

Reviewed plan commit: `f832920825b24377bdc69d78d3815548c747c573`

Reviewed plan SHA-256: `8b500f0eb48a1829ed3096bdf0410f78013ea65f44b26e7f8e4504a1d4a78eaf`

Governing plan contract: `PLANS.md`

Governing commit: `f832920825b24377bdc69d78d3815548c747c573`

Governing `PLANS.md` SHA-256: `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0`

Author and reviser sessions: `/root` using OpenAI Codex; exact served model unavailable.

Reviewer session: `/root/u2_clean_room_round10` using OpenAI Codex with `gpt-5.6-terra`.

Review lens: complete `PLANS.md` conformance, executor safety, adversarial counterexamples, and
closure of all authoritative round-9 findings.

Sole reviewer output path:
`docs/plans/reviews/2026-08-04-u2-clean-room-round-10-reviewer-output.md`

## Reviewer Instructions

Act as a fresh clean-room reviewer with no authoring conversation. Inspect the reviewed commit.
Read `.agents/OPERATING.md` and the complete bound `PLANS.md` first; use every applicable clause as
the primary rubric.

Write only the sole output path above with `apply_patch`. Do not edit another file, commit, push,
comment on GitHub, mutate git-native issues, or ask the orchestrator to transcribe output. Return
only the path and SHA-256 through the agent channel.

Read the exact plan and contract, epic, cited dependencies, required repository surfaces, every
prior U2 reviewer output, and this prompt. Challenge the plan. Verify both round-9 repairs:

1. The accepted pre-dispatch manifest contains only deterministic intent. Provider launch is a
   separate authorized observe-before-dispatch use case after manifest checkpoint completion. It
   validates and records the post-launch receipt, survives lost responses, and checkpoints that
   exact receipt before verdict acceptance.
2. Review completion supplies one exact untrusted reviewer commit. The adapter proves ancestry from
   manifest and receipt commits, uses no branch-head or descendant search, reads the sole output
   path and parent diff from that commit, makes output and reviewer commits identical, and derives
   path, digest, session, marker, and verdict independently. Ambiguous, stale, and non-descendant
   commits are rejected.

Recheck every earlier closure, cross-section consistency, living sections, and every applicable
`PLANS.md` clause. Do not require scheduled implementation evidence.

Write Markdown with `Reviewed Targets`, `PLANS.md Conformance`, `Prior-Finding Closure`, `Verdict`,
`Findings`, and `Verification Notes`. Report only actionable findings with stable ID, priority,
exact evidence, failure scenario, and smallest repair. Mark both round-9 findings `CLOSED` or
`OPEN`. Finish with `CLEAN` when none remain, or `CHANGES_REQUIRED` with counts. Put all reasoning
in the declared file. End with exactly one final line: `MANDEM_REVIEW_VERDICT: CLEAN` or
`MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED`.
