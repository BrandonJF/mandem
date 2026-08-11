# U2 Clean-Room Review, Round 7 Prompt

Date: 2026-08-04

Planning PR: `BrandonJF/mandem#37`

Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md`

Reviewed plan commit: `4caa87f4ed21bafac1c506b5463e97c9514a6028`

Reviewed plan SHA-256: `0f684ecaa9fa17617a71d35a86795926561e330b47c2d6669c7b5ef1f2ceaa4f`

Governing plan contract: `PLANS.md`

Governing commit: `4caa87f4ed21bafac1c506b5463e97c9514a6028`

Governing `PLANS.md` SHA-256: `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0`

Author and reviser sessions: `/root` using OpenAI Codex; exact served model unavailable.

Reviewer session: `/root/u2_clean_room_round7` using OpenAI Codex with `gpt-5.6-sol`.

Review lens: complete `PLANS.md` conformance, executor safety, adversarial counterexamples, and
closure of all authoritative round-6 findings.

Sole reviewer output path:
`docs/plans/reviews/2026-08-04-u2-clean-room-round-7-reviewer-output.md`

## Reviewer Instructions

Act as a fresh clean-room reviewer with no authoring conversation. Inspect the reviewed commit.
Read `.agents/OPERATING.md` and the complete bound `PLANS.md` first; use every applicable clause as
the primary rubric.

Write only the sole output path above with `apply_patch`. Do not edit another file, commit, push,
comment on GitHub, mutate git-native issues, or ask the orchestrator to transcribe output. Return
only the path and SHA-256 through the agent channel.

Read the exact plan and contract, epic, cited dependencies, required repository surfaces, every
prior U2 reviewer output, and this prompt. Challenge the plan. Verify both round-6 repairs:

1. The manifest stores the complete bounded canonical sanitized prompt, its digest, and exact
   dispatch record. The adapter and validator compare the prompt bytes, reviewer session, plan,
   `PLANS.md`, role, lenses, attestations, and risk rules; only the digest enters SQLite.
2. The reviewer-authored output must end with one strict final verdict marker. The application
   derives the verdict from canonical output bytes, rejects missing/repeated/malformed markers and
   `CHANGES_REQUIRED`, and stores the derived clean decision for external-state-independent replay.

Recheck all earlier closed findings, cross-section consistency, living sections, and every
applicable `PLANS.md` clause. Do not require scheduled implementation evidence.

Write Markdown with `Reviewed Targets`, `PLANS.md Conformance`, `Prior-Finding Closure`, `Verdict`,
`Findings`, and `Verification Notes`. Report only actionable findings with stable ID, priority,
exact evidence, failure scenario, and smallest repair. Mark both round-6 findings `CLOSED` or
`OPEN`. Finish with `CLEAN` when none remain, or `CHANGES_REQUIRED` with counts. Put all reasoning
in the declared file. End the output with exactly one machine-readable final line:
`MANDEM_REVIEW_VERDICT: CLEAN` or `MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED`.
