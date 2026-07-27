# CLAUDE.md — Mandem

Mandem orchestrates bounded agent sessions through durable, observable, deterministic workflows.
Reduce the operator's cognitive load: use plain language, concise output, and explicit outcomes.

Before producing any natural-language output about this repository, load and follow the
`write-clearly` skill at `.agents/skills/write-clearly/SKILL.md`. This includes chat, plans, commit
messages, code comments, and script output. Tools without project-skill discovery must read that
file and its required style guide directly.

## Work tracking

Before substantial repository work or a status answer, load and follow
`.agents/skills/track-git-native-issues/SKILL.md`. Start with the open git-native issues, then use
the selected issue's references to inspect its ExecPlan, branch, pull request, and commits. Keep the
issue's phase, blocker, verified result, and next action current through meaningful transitions.

Use git-native issues for live work status, ExecPlans for complete implementation instructions, Git
for code state, and GitHub for pull-request state. Do not infer the next work item from the plan
registry or pull-request list without reconciling it with the open issues.

## Planning and execution

Before authoring, discussing, reviewing, or executing an ExecPlan, read the complete root
`PLANS.md` and follow it to the letter.

The program ExecPlan is context, not executable authority. Implementation requires a
self-contained child ExecPlan that has passed clean-room review, received exact operator approval,
and has `execution_authorized: true`. No agent may infer permission from a scaffold, program unit,
chat summary, issue, or partial plan.

During implementation, keep `Progress`, `Surprises & Discoveries`, `Decision Log`, and
`Outcomes & Retrospective` current. Continue through the approved milestones without asking the
operator for routine next steps. Stop only when the plan requires operator judgment, authorization
would expand, or a material discovery invalidates the approved plan.

## Architecture and implementation

Mandem must conform to the architecture it enforces. Preserve clean module boundaries, keep
external input/output behind application ports and infrastructure adapters, and expose cross-module
behavior only through public module barrels. Use Bun commands only. Do not use `any`.

Write a behaviorally meaningful failing test before implementation, make it pass with the smallest
appropriate change, and refactor only while tests remain green.

Workers use isolated Git worktrees. They commit, push, and open a pull request, but never merge.
