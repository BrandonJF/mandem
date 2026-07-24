# AGENTS.md — Mandem

`CLAUDE.md` is the canonical operating contract for this repository. Read it before acting.

When writing a complex feature or significant refactor, use an ExecPlan from design through
implementation. In Mandem, an ExecPlan is a self-contained living plan governed by the
repository-root `PLANS.md`.

For any work that authors, discusses, reviews, or executes an ExecPlan, read the complete
repository-root `PLANS.md` immediately before working with the plan. Follow it to the letter.
An agent may execute only a self-contained child ExecPlan whose metadata says
`execution_authorized: true`.

The program plan provides shared direction. It is not an implementation prompt. Every worker must
receive the complete approved child ExecPlan for its unit and must keep that plan's living sections
current throughout execution.
