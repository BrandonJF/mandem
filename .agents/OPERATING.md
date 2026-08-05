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

Do not use `program`, `unit`, or legacy hierarchy terms as substitutes for
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

Before writing or revising an ExecPlan, also read
[`PLAN_AUTHORING.md`](./PLAN_AUTHORING.md) completely. It records recurring plan-design errors and
the principles used to detect them before clean-room review.

The epic ExecPlan provides shared direction. It is not an implementation prompt. Every worker must
receive the complete approved ExecPlan for its issue and keep that plan's living sections current
throughout execution.

Implementation requires a self-contained issue ExecPlan that has passed clean-room review, received
exact operator approval, and has `execution_authorized: true`. Do not infer permission from a
scaffold, epic summary, chat summary, issue, or partial plan.

A clean-room plan reviewer uses the complete current `PLANS.md` as the primary review contract, not
a copied checklist or remembered convention. Before dispatch, commit a review manifest that binds
the plan path, plan commit and digest, `PLANS.md` path, governing commit and digest, the canonical
`docs/plans/reviews/CLEAN_ROOM_PROMPT.md` path, commit and digest, reviewer role, and one
repo-relative output path. The canonical prompt is the complete review prompt. A dispatch may add
only those immutable bindings and reviewer identity; it must not name prior findings, describe
repairs, request expected closures, add a plan-specific lens, or otherwise steer the verdict. The
reviewer does not receive prior review prompts or outputs. The reviewer is read-only except for the
sole output file and must write the complete review there directly. The reviewer inspects the bound
bytes, verifies every applicable `PLANS.md` requirement, and determines whether a fresh novice can
execute the plan from the repository and plan alone.

Terminal output, an orchestrator-authored transcription, or a summary is not a review artifact.
After the reviewer finishes, hash and commit the exact file unchanged. Any synthesis must be a
separate derived artifact that links the source path and digest, describes the transformation, and
never replaces the reviewer's file. A change to the plan, governing `PLANS.md`, prompt, role, or
output bytes invalidates the verdict and requires a fresh manifest and reviewer.

The reviewer must be independent of the governed output. At minimum, use a fresh session that did
not author or revise the plan or implementation and does not receive the originating conversation.
Record which sessions authored or revised the artifact, which session reviewed it, the provider
and model when available. The review lens is always the canonical prompt's novice autonomous
executor plan-quality review. For high-risk work, use another provider or
model when available. Never weaken the fresh-context and non-author rules to do so. The review
canonical prompt asks the reviewer to challenge assumptions and seek falsifying cases rather than
confirm the author's conclusion. The originating agent may repair findings or write a separate synthesis;
it may not act as the independent reviewer or replace the reviewer's verdict. If no independent
reviewer is available, block the transition instead of substituting self-review.

Do not use clean-room review as the main way to finish a plan. Before the first review, the author
must trace each promised behavior from its input through the code that records it, restores it after
a restart, and proves it in a test. The author must also confirm that every stored value has a
declared input and every output has a named consumer. Store this readiness check with the plan.

Count every `CHANGES_REQUIRED` verdict for the same issue ExecPlan. After the third failed verdict,
stop dispatching reviewers and return the issue to planning. The author must review the whole plan,
resolve the common cause of the findings, update the readiness check, and decide whether to reduce
or split the scope. Do not reset the count after a rewrite. After the fifth failed verdict, block
another review until the operator chooses to split the issue, redesign the plan, or explicitly
permit one more review. Record the count, the required response, and the operator's choice in the
git-native issue. A stale manifest or unavailable reviewer does not count because no reviewer
judged the plan.

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

## Process feedback while building Mandem

Treat Mandem's own development workflow as continuous product evidence. When an operator correction,
agent error, review finding, interruption, or unexpected delay reveals a possible orchestration
gap, record one process finding in the active issue before the current phase closes. Give it a
stable identity, concise evidence, affected phase, and one terminal disposition:

- `execution-deviation`: the existing contract was sufficient; repair the current run and record
  why the agent did not follow it;
- `issue-contract-gap`: revise the active issue ExecPlan and repeat any invalidated review or
  approval;
- `product-contract-gap`: revise the epic ExecPlan and every affected issue contract, then add an
  enforcement mechanism to existing scope or create a linked issue;
- `operating-contract-gap`: revise repository-owned operating guidance through its required review
  process; or
- `no-reusable-change`: record why the evidence does not justify a durable change.

One finding may require several linked repairs, but it has one current disposition. Do not close a
phase with an unresolved process finding. If a finding changes approved intent or implementation
scope, return to planning and obtain fresh review and approval. Preserve the finding, disposition,
and artifact links in Git and the git-native issue; provider comments may project that record but
must not be its only copy.

## Architecture and implementation

Conform to the architecture the repository checks. Preserve clean module boundaries, keep external
input and output behind application ports and infrastructure adapters, and expose cross-module
behavior only through public module barrels. Use Bun commands only. Do not use `any`.

Write a behaviorally meaningful failing test before implementation. Make it pass with the smallest
appropriate change, then refactor only while tests remain green.

Workers use isolated Git worktrees. They commit, push, and open a pull request, but never merge.
The orchestrating agent may merge only through the exact approved merge command.
