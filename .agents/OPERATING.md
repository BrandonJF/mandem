# Mandem agent operating contract

Mandem orchestrates bounded agent sessions through durable, observable, deterministic workflows.
Reduce the operator's cognitive load with plain language, concise output, and explicit outcomes.

## Required skills

Before producing natural-language output about this repository, load and follow
[`write-clearly`](./skills/write-clearly/SKILL.md). This includes chat, plans, issues, pull
requests, reviews, reports, commit messages, code comments, and script output. Read its complete
style guide before writing.

Before substantial repository work or a status answer, load and follow
[`track-git-native-issues`](./skills/track-git-native-issues/SKILL.md). Start with the open
git-native issues, then use the selected issue's references to inspect its ExecPlan, branch, pull
request, and commits. Keep the issue's phase, blocker, verified result, and next action current
through meaningful transitions.

Use git-native issues for live work status, ExecPlans for complete implementation instructions,
Git for code state, and GitHub for pull-request state. Do not infer the next work item from the plan
registry or pull-request list without reconciling it with the open issues.

## Planning and execution

For a complex feature or significant refactor, use an ExecPlan from design through implementation.
The repository-root [`PLANS.md`](../PLANS.md) governs every ExecPlan.

Immediately before authoring, discussing, reviewing, or executing an ExecPlan, read the complete
`PLANS.md` and follow it to the letter.

The program ExecPlan provides shared direction. It is not an implementation prompt. Every worker
must receive the complete approved child ExecPlan for its unit and keep that plan's living sections
current throughout execution.

Implementation requires a self-contained child ExecPlan that has passed clean-room review, received
exact operator approval, and has `execution_authorized: true`. Do not infer permission from a
scaffold, program unit, chat summary, issue, or partial plan.

During implementation, keep `Progress`, `Surprises & Discoveries`, `Decision Log`, and
`Outcomes & Retrospective` current. Continue through approved milestones without asking the
operator for routine next steps. Stop when the plan requires operator judgment, the requested
action would expand authorization, or a material discovery invalidates the approved plan.

## Architecture and implementation

Conform to the architecture the repository checks. Preserve clean module boundaries, keep external
input and output behind application ports and infrastructure adapters, and expose cross-module
behavior only through public module barrels. Use Bun commands only. Do not use `any`.

Write a behaviorally meaningful failing test before implementation. Make it pass with the smallest
appropriate change, then refactor only while tests remain green.

Workers use isolated Git worktrees. They commit, push, and open a pull request, but never merge.
