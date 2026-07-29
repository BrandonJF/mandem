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

Operator consent comes from a standalone `APPROVED` or `DENIED` response in the active Mandem
conversation. Before requesting it, state one consent-boundary action and its immutable target:
`execute-plan` for a reviewed plan commit and digest, `apply-ruleset` for a plan digest, ruleset
digest, and implementation commit, or `merge-pr` for a repository, pull-request number, and head
commit. Record the exact response in the native issue using `Mandem-Approval: v1`, push that issue
ref, and verify the remote ref before acting. A changed target needs a new response.

Do not substitute a GitHub approval, infer approval from broader wording, or require another
account. Issue-ref and branch publication, pull-request creation, comments, and read-only checks
are ordinary workflow steps. Use `bun run repository-ruleset:apply` and
`bun run pr:merge:approved` for the guarded write actions; do not bypass their approval checks.

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
The orchestrating agent may merge only through the exact approved merge command.
