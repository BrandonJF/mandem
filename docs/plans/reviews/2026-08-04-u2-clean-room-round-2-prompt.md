# U2 Clean-Room Review, Round 2 Prompt

Date: 2026-08-04

Planning PR: `BrandonJF/mandem#37`

Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md`

Reviewed plan commit: `c054c91fd18bf799876247cacd3dbeebb85688e2`

Reviewed plan SHA-256: `dd7f6d8034d83a23134f7bbda77b1d75c21c428fff7cd7a5f84e7b468ce716fa`

Governing plan contract: `PLANS.md`

Governing commit: `c054c91fd18bf799876247cacd3dbeebb85688e2`

Governing `PLANS.md` SHA-256: `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0`

Author and reviser sessions: `/root` using OpenAI Codex; exact served model unavailable.

Reviewer session: `/root/u2_clean_room_round2` using OpenAI Codex with `gpt-5.6-terra`.

Review lens: complete `PLANS.md` conformance, executor safety, adversarial counterexamples, and
closure of the four authoritative round-1 P1 findings.

Sole reviewer output path:
`docs/plans/reviews/2026-08-04-u2-clean-room-round-2-reviewer-output.md`

## Reviewer Instructions

Act as a fresh clean-room reviewer. You did not author or revise the plan and must not receive its
authoring conversation. Inspect the repository at the reviewed commit instead of trusting the
current working tree. Read `.agents/OPERATING.md` and the complete bound `PLANS.md` first. Treat
every applicable `PLANS.md` requirement as the primary rubric; the lenses below supplement it.

You may write only the sole output path declared above. Create that file yourself with `apply_patch`.
Do not edit any other file, commit, push, comment on GitHub, mutate git-native issues, or ask the
orchestrator to transcribe terminal output. The exact bytes you write are the authoritative review.
When finished, report only the output path and SHA-256 through the agent channel.

Read these exact committed artifacts:

- the reviewed U2 plan and governing `PLANS.md` named above;
- `.agents/OPERATING.md`;
- the epic ExecPlan and merged dependencies that the U2 plan cites;
- the repository files, scripts, and public module contracts that its instructions depend on;
- `docs/plans/reviews/2026-08-03-u2-clean-room-round-1-reviewer-output.md` as the authoritative
  prior findings; and
- this prompt as the complete review assignment.

Use PR #37 only to understand how committed work is presented. Git and git-native issue records
must remain enough to reconstruct the process without GitHub.

Challenge the plan rather than trying to confirm it. Seek counterexamples, hidden assumptions,
contradictions, impossible API instructions, lossy review boundaries, and steps that force a novice
executor to invent behavior. In particular, verify that the revision actually closes all four
round-1 P1 findings:

1. Protocol v1 now defines implementable command, event, result, error, receipt, checkpoint, port,
   canonical-byte, and public-export contracts without leaving required schema judgment to the
   worker.
2. A state-preserving command creates and deduplicates process findings with clear authority,
   stable identity, typed origin, bounded evidence, lifecycle blocking, and Plan/Work/Review/Learn
   tests.
3. Every milestone names ordered edits, exports or tests, exact repository-root commands, and
   observable red and green outcomes that a novice can follow.
4. The plan embeds the Bun/SQLite API calls, transaction boundaries, WAL assumptions, backup byte
   checks, restoration order, and failure behavior; external links carry provenance only.

Also verify complete `PLANS.md` conformance: self-containment, novice orientation, defined terms,
purpose and observable outcome, concrete repository context, narrative and independently
verifiable milestones, exact commands and expected observations, validation and acceptance,
idempotence and recovery, interfaces and dependencies, living sections, cross-section consistency,
and the bottom revision note. Check actor permissions, consent, secrets, trusted-principal
boundaries, source precedence, lease fencing, checkpoint recovery, migration safety, replay, and
provider-independent reconstruction. Do not require execution evidence that the plan schedules for
implementation.

Write Markdown with these headings: `Reviewed Targets`, `PLANS.md Conformance`, `Round-1 Closure`,
`Verdict`, `Findings`, and `Verification Notes`. Report only actionable findings. Give each finding
a stable local identifier, P0/P1/P2 priority, exact file and line evidence, a concrete failure
scenario, and the smallest contract repair. Under `Round-1 Closure`, mark each prior finding
`CLOSED` or `OPEN` and explain why. Finish with exactly one verdict:

- `CLEAN` when there are no P0, P1, or P2 findings; or
- `CHANGES_REQUIRED` with a count by priority.

Do not compress the reasoning for the orchestrator. Put all evidence, caveats, and findings in the
declared output file.
