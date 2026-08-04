---
title: "Define Mandem work-control rules - Plan"
type: feat
date: 2026-08-04
artifact_contract: ce-unified-plan/v1
artifact_readiness: draft
product_contract_source: mandem-epic
execution: code
plan_kind: mandem-issue-execplan
issue_key: U2A
parent: ../2026-07-21-001-feat-mandem-plan.md
epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253
issue_id: cb67d131-975c-4d97-9a6f-4934be991ac6
depends_on_issue_ids:
  - 6a6a8bab-853f-4658-9bc0-38e2386b642d
  - 745eda80-1e74-4866-bc95-2f2983b31025
  - da645bd0-9899-40b3-9f23-3b48d65362a4
promotion: planned
execution_authorized: false
---

# Define Mandem work-control rules

This ExecPlan is a living document governed by `PLANS.md`. Keep `Progress`, `Surprises &
Discoveries`, `Decision Log`, and `Outcomes & Retrospective` current as planning and work proceed.

This issue was split from the former combined U2 plan after thirteen failed clean-room reviews.
Those reviews remain in Git history and `docs/plans/reviews/`. They apply to the former combined
scope and do not approve this plan. Do not request review or begin implementation until this plan's
readiness check is complete.

## Purpose / Big Picture

U2A defines the rules Mandem follows when an operator or agent asks it to change work. After U2A,
Mandem can interpret one request consistently, decide whether the request is allowed, identify the
agent that currently controls the work, and bind reviews and approvals to exact files.

U2A does not store those facts in SQLite, recover them after a restart, run a server, launch an
agent, or provide the final CLI. U2B will add durable storage and recovery. U3 will add the running
server. Later issues will add issue management, provider sessions, and user interfaces.

## Operator-visible behaviors

1. Mandem accepts a well-formed request and returns one stable result shape.
2. Mandem rejects a request that arrives in the wrong phase or lacks required evidence.
3. Mandem gives one agent control of work for a limited time and rejects an older agent after that
   control expires or transfers.
4. Mandem accepts a plan review only when a fresh reviewer wrote the complete review to the one
   declared file.
5. Mandem accepts operator approval only for the exact reviewed plan commit and digest.
6. Mandem records a failed-review count in its domain state. The third failed review requires
   replanning, and the fifth requires an operator choice before another review.

An operator can see these behaviors in deterministic tests that do not use SQLite, GitHub, Docker,
or a provider CLI.

## Scope boundary

U2A owns the versioned command, result, error, event, agent-control, review, approval, gate, finding,
and lifecycle values. It owns pure functions that accept current state plus one validated request
and either return the events and next state or return one typed rejection.

U2A supplies U2B with complete public values. U2B may store and replay those values without adding
new lifecycle meaning. If U2B discovers that it needs a missing fact, planning returns to U2A
instead of letting the storage code invent one.

## Behavior Readiness Check

Before clean-room review, replace every `Needs design` entry with `Ready` and cite the exact section,
public type, reducer rule, and test that proves it.

| Behavior | Required plan evidence | Status |
| --- | --- | --- |
| Interpret one request | Complete request, result, error, and event shapes with size limits | Needs design |
| Reject invalid order | Full phase table with roles, required evidence, next state, and typed error | Needs design |
| Control one active agent | Acquisition, expiry, heartbeat, transfer, release, and stale-agent tests | Needs design |
| Bind a clean-room review | Exact plan and `PLANS.md` targets, fresh reviewer evidence, sole output file, and verdict parser | Needs design |
| Bind operator approval | Existing `Mandem-Approval: v1` input, exact target comparison, denial, and stale-target tests | Needs design |
| Stop repeated failed reviews | Lifetime failure count, third-failure replanning proof, fifth-failure operator choice, and no-reset tests | Needs design |
| Hand complete values to U2B | Public event and state values that contain every fact U2B must store and replay | Needs design |

## Context and Orientation

The repository already exposes approval parsing through `src/modules/architecture-standard/` and
module-boundary checks through `bun run architecture:check`. The new `runtime` module will own the
shared protocol values. The new `execution` module will depend on `runtime` and own the pure work
rules. Neither module may read SQLite, Git, a clock, the filesystem, or a provider from domain code.

The former combined U2 plan tried to specify these rules and the complete SQLite implementation in
one document. The repeated review failures showed that storage concerns hid gaps in the work rules
and that work-rule repairs repeatedly changed the storage design. This split makes U2A prove the
meaning of each fact before U2B decides how to store it.

## Plan of Work

Planning must first define the small set of operator-visible requests and results. It must then
define the allowed phase changes, agent-control rules, review evidence, approval comparison, gate
facts, findings, and failed-review limits. Each rule needs one allowed example and the important
rejected examples. The final planning pass must define the complete events and current-state value
that U2B will consume.

Implementation will proceed test-first after review and approval. The worker will add protocol
tests under `src/modules/runtime/domain/` and pure rule tests under
`src/modules/execution/domain/`. The worker will expose only the values and functions that U2B and
later modules need through the two module root barrels.

## Concrete Steps

Planning remains incomplete. Before review, this section must name each file and function, the
order in which the worker creates them, the exact failing tests, the exact Bun commands, and the
expected passing output. Do not fill those details by copying the former combined plan without
checking them against the seven readiness rows above.

The final implementation check will run from the repository root:

    bun run check

The exact focused test commands and expected test names must be added before review.

## Validation and Acceptance

Acceptance requires pure tests for every operator-visible behavior, every phase row, every agent
control boundary, exact review and approval binding, and both failed-review limits. Tests must show
that the same input and state always produce the same output and that domain code performs no I/O.

U2A is complete only when U2B can implement storage and replay from U2A's public values without
adding a command, event field, lifecycle judgment, or authority rule.

## Idempotence and Recovery

U2A defines deterministic values and rules. U2B owns durable duplicate-request handling and restart
recovery. U2A must still define the request identity and event facts that make those U2B behaviors
possible. Planning and checks are safe to repeat. Any change after a clean review requires a new
review, and any change after approval requires a new review and approval.

## Progress

- [x] (2026-08-04) Preserved thirteen failed reviews of the former combined U2 plan in Git.
- [x] (2026-08-04) Added shared third- and fifth-failure limits and returned U2 to planning.
- [x] (2026-08-04) Split the former U2 scope into U2A work-control rules and U2B durable recovery.
- [ ] Complete all seven U2A readiness rows.
- [ ] Add exact file, function, test, and command instructions.
- [ ] Run one author-side whole-plan check before requesting clean-room review.
- [ ] Obtain a clean review and exact operator approval before implementation.

## Surprises & Discoveries

- Observation: Thirteen reviews found connected omissions because one plan mixed the meaning of work
  with the details of storing it.
  Evidence: `docs/plans/reviews/2026-08-03-u2-clean-room-round-1-reviewer-output.md` through
  `docs/plans/reviews/2026-08-04-u2-clean-room-round-13-reviewer-output.md`.

## Decision Log

- Decision: Keep U2A in progress during replanning and keep U2B planned and blocked by U2A.
  Rationale: U2A has no unmet dependency for planning, while U2B cannot finish planning until U2A
  publishes reviewed and approved public values. The issue-graph manifest must include every
  managed status label already recorded on those native issues before its metadata writer runs.
  Date/Author: 2026-08-04 / Codex
- Decision: Record WI1 as complete in the managed issue graph.
  Rationale: WI1 implemented the issue-graph integrity workflow and its native issue is closed. The
  split manifest incorrectly retained its earlier open and blocked planning state. A complete audit
  of all sixteen managed issues found no other state or managed-label mismatch.
  Date/Author: 2026-08-04 / Codex
- Decision: Split work-control rules from durable storage and restart recovery.
  Rationale: The work rules must define complete facts before storage can persist and reconstruct
  them. Separate plans let each reviewer judge one clear outcome.
  Date/Author: 2026-08-04 / Brandon and Codex
- Decision: Keep the existing issue and plan path for U2A.
  Rationale: The existing review history remains attached to the work-control contract that produced
  most of it, while a new issue and plan give durable recovery its own approval boundary.
  Date/Author: 2026-08-04 / Codex

## Outcomes & Retrospective

The former U2 implementation plan has been replaced by this U2A planning scaffold. No U2A design,
clean verdict, approval, or implementation exists yet. The next action is to complete the readiness
rows and exact execution instructions without dispatching a reviewer.

## Artifacts and Notes

The former combined plan remains recoverable from Git at commit
`2b53f63257744cf6ec67962a8bc92282787b1057`. PR #37 preserves its complete review history. The new
split does not treat any earlier verdict as approval of U2A or U2B.

## Interfaces and Dependencies

U2A depends on the merged architecture, approval, documentation, and issue-graph work named in its
front matter. It will produce the public `runtime` protocol values and `execution` rule functions
that U2B consumes. Exact TypeScript interfaces and function signatures remain planning work and
must appear here before review.

Split-scope revision note (2026-08-04): Replaced the combined protocol, lifecycle, and SQLite plan
with a smaller U2A planning scaffold for work-control rules. Moved durable storage, Git checkpoint,
migration, backup, and restart recovery to U2B. This plan remains unauthorized and is not ready for
clean-room review.

Issue-graph status revision note (2026-08-04): Kept U2A in progress for replanning and U2B planned
and blocked by U2A. Updated the graph manifest to match those native issue phases before the guarded
metadata operation. A subsequent complete managed-issue audit also corrected WI1 from its obsolete
open and blocked planning state to its delivered closed state.
