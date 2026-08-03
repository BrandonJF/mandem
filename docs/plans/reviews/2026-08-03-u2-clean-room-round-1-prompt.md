# U2 Clean-Room Review, Round 1 Prompt

Date: 2026-08-03

Planning PR: `BrandonJF/mandem#37`

Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md`

Reviewed plan commit: `f008fddc51d5b5fe30cd69af02303fa5f40154f2`

Reviewed plan SHA-256: `96985a9e941f0b6061d256967fb11d01126cc2b0309b8ff6d7abd9e5b5cef08f`

## Reviewer Instructions

Act as a fresh, read-only clean-room reviewer. You have no access to the planning conversation and
must not edit files, commit, push, comment on GitHub, or mutate git-native issues. Inspect the
repository at the reviewed commit rather than relying on the current working tree.

Read `.agents/OPERATING.md` and the complete `PLANS.md` at the reviewed commit. Then read the exact
U2 plan bytes identified above, the epic ExecPlan it references, its merged dependency outputs, and
the repository files and public module contracts that its implementation instructions depend on.
Use PR #37 only as a presentation of the committed Git history; Git and git-native issue records
must remain sufficient without GitHub.

Determine whether a fresh implementation worker can execute the U2 plan without private context or
unresolved judgment. Check all of these areas:

1. Missing prerequisites, dependency assumptions, files, commands, interfaces, or ownership.
2. Hidden design judgment, ambiguous lifecycle transitions, incomplete guards, or contradictory
   source-precedence rules.
3. Unsafe or non-idempotent instructions, especially approval, lease, checkpoint, migration,
   corruption, retry, and recovery behavior.
4. Ambiguous actor permissions, operator consent, secret handling, trusted-principal boundaries,
   and filesystem or database access.
5. Observable proof: red-first tests, deterministic verification, expected failure evidence, and
   end-to-end behavior that demonstrates the promised outcome.
6. The new continuous-product-feedback contract: stable process-finding identity, five closed
   dispositions, phase-completion blocking, return-to-Plan invalidation, provider-independent
   reconstruction, and clear downstream ownership.
7. Consistency among `.agents/OPERATING.md`, the epic requirements and acceptance examples, U2,
   and the affected U4-U10 issue contracts.

Report only actionable findings. Classify each as P0, P1, or P2, cite exact file and line evidence,
explain the failure scenario, and state the smallest contract repair that resolves it. Finish with
one verdict:

- `CLEAN` when there are no P0, P1, or P2 findings; or
- `CHANGES_REQUIRED` with a count by priority.

Return the review as Markdown with these headings: `Reviewed Target`, `Verdict`, `Findings`, and
`Verification Notes`. Do not treat execution-time evidence that the plan explicitly schedules as a
planning prerequisite.
