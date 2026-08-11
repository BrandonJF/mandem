# U2 Clean-Room Review, Round 1 Prompt

Date: 2026-08-03

Planning PR: `BrandonJF/mandem#37`

Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md`

Reviewed plan commit: `d177fb06ae69762c0ee7857b5b8b0700fe40dc91`

Reviewed plan SHA-256: `0bb1f0505f1507c5c1a08c277381d68e0ccb87456e8ae86be22efd5543860605`

Governing plan contract: `PLANS.md`

Governing commit: `d177fb06ae69762c0ee7857b5b8b0700fe40dc91`

Governing `PLANS.md` SHA-256: `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0`

## Reviewer Instructions

Act as a fresh, read-only clean-room reviewer. You have no access to the planning conversation and
must not edit files, commit, push, comment on GitHub, or mutate git-native issues. Inspect the
repository at the reviewed commit rather than relying on the current working tree.

Read `.agents/OPERATING.md` and the complete bound `PLANS.md` at the governing commit. Treat every
applicable requirement in `PLANS.md` as the primary review rubric; the lenses below supplement that
contract and cannot replace or narrow it. Then read the exact U2 plan bytes identified above, the
epic ExecPlan it references, its merged dependency outputs, and the repository files and public
module contracts that its implementation instructions depend on.
Use PR #37 only as a presentation of the committed Git history; Git and git-native issue records
must remain sufficient without GitHub.

Determine whether a fresh implementation worker can execute the U2 plan without private context or
unresolved judgment. Check all of these areas:

1. Complete `PLANS.md` conformance, including self-containment, novice orientation, defined terms,
   purpose and observable outcome, concrete repository context, narrative and independently
   verifiable milestones, exact commands and expected observations, validation and acceptance,
   idempotence and recovery, interfaces and dependencies, required living sections, comprehensive
   cross-section consistency, and a bottom revision note.
2. Missing prerequisites, dependency assumptions, files, commands, interfaces, or ownership.
3. Hidden design judgment, ambiguous lifecycle transitions, incomplete guards, or contradictory
   source-precedence rules.
4. Unsafe or non-idempotent instructions, especially approval, lease, checkpoint, migration,
   corruption, retry, and recovery behavior.
5. Ambiguous actor permissions, operator consent, secret handling, trusted-principal boundaries,
   and filesystem or database access.
6. Observable proof: red-first tests, deterministic verification, expected failure evidence, and
   end-to-end behavior that demonstrates the promised outcome.
7. The new continuous-product-feedback contract: stable process-finding identity, five closed
   dispositions, phase-completion blocking, return-to-Plan invalidation, provider-independent
   reconstruction, and clear downstream ownership.
8. Consistency among `.agents/OPERATING.md`, the epic requirements and acceptance examples, U2,
   and the affected U4-U10 issue contracts.

Report only actionable findings. Classify each as P0, P1, or P2, cite exact file and line evidence,
explain the failure scenario, and state the smallest contract repair that resolves it. Finish with
one verdict:

- `CLEAN` when there are no P0, P1, or P2 findings; or
- `CHANGES_REQUIRED` with a count by priority.

Return the review as Markdown with these headings: `Reviewed Targets`, `PLANS.md Conformance`,
`Verdict`, `Findings`, and `Verification Notes`. In `PLANS.md Conformance`, state whether every
applicable requirement passed and name any non-applicable clause with a reason. Do not treat
execution-time evidence that the plan explicitly schedules as a planning prerequisite.
