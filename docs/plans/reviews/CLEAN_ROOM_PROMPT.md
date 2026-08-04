# Mandem Clean-Room ExecPlan Review Prompt

Read the immutable target bindings in the dispatch manifest. Then read `AGENTS.md`,
`.agents/OPERATING.md`, the complete bound `PLANS.md`, and the complete bound ExecPlan. Inspect the
repository files needed to test whether the ExecPlan is accurate and executable. Do not read the
originating conversation or prior review prompts and outputs.

Perform a fresh review as a novice autonomous executor with no context beyond the repository and
the ExecPlan. Judge the quality and safety of the whole plan. Identify only concrete blockers,
ambiguities, contradictions, missing prerequisites, missing inputs or consumers, unverifiable
recovery behavior, or unsafe instructions that would force the executor to guess or cross an
unapproved boundary. Challenge assumptions and seek counterexamples. Do not require implementation
evidence that the plan schedules for execution, prescribe theoretical perfection, or review only a
previous finding list.

Write the complete review only to the sole output path in the dispatch manifest. Do not edit any
other file, commit, push, mutate an issue or provider, or ask another agent to transcribe the
review. Use these headings:

1. `Reviewed Targets` — identify the exact ExecPlan and `PLANS.md` commits and SHA-256 values you
   verified.
2. `Verdict` — state either that the ExecPlan is executor-safe for a novice autonomous executor or
   that it is not yet executor-safe.
3. `Blocking Findings` — report only concrete blockers. For each, give a stable `CR-NNN` ID,
   priority, exact repository evidence, the failure scenario, and the smallest required repair. If
   there are no blockers, write `None.`
4. `Residual Low-Risk Concerns` — record non-blocking caveats separately. If there are none, write
   `None.`
5. `Verification Notes` — summarize what you inspected and confirm that you used the bound bytes.

The completion bar is executor-safe with clearly scoped residual low-risk concerns, not zero
caveats. End with exactly one final line: `MANDEM_REVIEW_VERDICT: CLEAN` when the plan is
executor-safe, or `MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED` when any blocking finding remains.
