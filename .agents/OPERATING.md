# Mandem agent operating contract

Mandem orchestrates bounded agent sessions through durable, observable, deterministic workflows.
Reduce the operator's cognitive load with plain language, concise output, and explicit outcomes.

## Vendor-neutral agent policy

Repository behavior must not depend on one agent vendor's instruction file. Keep shared policy,
workflows, and judgment rules in repository-owned documents and skills. Vendor entry files such as
`AGENTS.md` and `CLAUDE.md` are thin discovery adapters that point agents to the same shared
contract.

When adding agent guidance, change the shared document or skill first. Add vendor-specific
configuration only when a harness requires it, keep that adapter as small as possible, and do not
let it become a second source of policy. See
[`docs/architecture/agent-vendor-neutrality.md`](../docs/architecture/agent-vendor-neutrality.md)
for the rationale and placement test.

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
Git for code state, and GitHub for pull-request state. Do not infer the next issue from the plan
registry or pull-request list without reconciling it with the open issues.

## Canonical issue vocabulary

Use one term for each issue concept. Do not introduce synonyms for variety.

- An `epic` is a top-level parent issue that coordinates a larger product or engineering outcome.
- An `issue` is every tracked record, including an epic.
- A `subissue` is an issue that has a parent issue. This term describes hierarchy only.
- Bug, feature, incident, chore, and similar terms classify an issue. They do not define another
  hierarchy level and do not change whether the record is an issue or subissue.
- An `ExecPlan` is the implementation specification associated with an issue when the work requires
  one.
- A `milestone` groups issues toward a release or dated outcome. It is not a parent issue.

Do not use `program`, `work item`, `unit`, `child item`, or `corrective item` as substitutes for
epic, issue, or subissue. Use `parent issue` and `subissue` when describing a relationship. Preserve
an external system's official term only when describing that system, and state the mapping to
Mandem's vocabulary once.

Hierarchy and classification are independent. For example, a bug with a parent is a subissue whose
classification is bug; it is not a special kind of subissue.

## Planning and execution

For a complex feature or significant refactor, use an ExecPlan from design through implementation.
The repository-root [`PLANS.md`](../PLANS.md) governs every ExecPlan.

Immediately before authoring, discussing, reviewing, or executing an ExecPlan, read the complete
`PLANS.md` and follow it to the letter.

The epic ExecPlan provides shared direction. It is not an implementation prompt. Every worker must
receive the complete approved ExecPlan for its issue and keep that plan's living sections current
throughout execution.

Implementation requires a self-contained issue ExecPlan that has passed clean-room review, received
exact operator approval, and has `execution_authorized: true`. Do not infer permission from a
scaffold, epic summary, chat summary, issue, or partial plan.

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
