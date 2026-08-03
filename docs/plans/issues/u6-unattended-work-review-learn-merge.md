---
title: "U6: Unattended worktree delivery through Review, Learn, and merge"
plan_kind: mandem-issue-execplan
issue_key: U6
parent: ../2026-07-21-001-feat-mandem-plan.md
epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253
issue_id: 22a35ab0-878b-448b-9341-6679b70a499d
depends_on_issue_ids:
  - 11538b56-bd63-42c2-8242-87ac7a76d35d
  - cb67d131-975c-4d97-9a6f-4934be991ac6
  - cf239716-00e2-46ae-82e7-84ac8f31baaf
  - d946e066-84d5-4651-b3b4-30a18e80008c
promotion: scaffolded
execution_authorized: false
---

# U6: Unattended worktree delivery through Review, Learn, and merge

> This is a dependency scaffold, not an executable plan. Before implementation dispatch, the
> plan author must expand it, obtain a clean-room review, and obtain operator approval.

## Purpose

Expand this scaffold into a self-contained U6 issue ExecPlan that incorporates every applicable
epic constraint. Use the epic ExecPlan to sequence work; do not treat it as a worker's
implementation instruction.

## Dependency Contract

**Depends on:** U2, U3, U4, U5

### Consumes

- Lifecycle and lease kernel
- Resident tmux/Git/provider capabilities
- issue, ExecPlan, queue, and gate services
- Provider/session contracts

### Produces

- Worktree mutation ownership
- TDD iteration and conventional-commit evidence
- Draft PR and independent review-and-repair cycle
- Mandatory Learn outcome
- Automatic routing and repair of stable process findings before phase completion
- Exact-SHA serialized merge and post-merge verification
- Takeover, cancellation, and cleanup behavior

### Downstream Consumers

- U7 worker witnessability and takeover UI
- U8 SBP command migration
- U9 restart-proof end-to-end proof

## Architecture Constraint

Authors must place all source code added for this issue in Mandem's Nucleus-derived clean
architecture. The detailed plan must identify module ownership, layer placement, public API
boundaries, composition roots, and deterministic architecture checks for each behavior implemented
by the issue.

## Decisions Required Before Promotion

- Iteration boundary and completion evidence
- Review invalidation and repair permissions
- Learn prevention mechanisms
- Integration lease transaction
- Post-merge failure disposition
- Process-finding repair leases, approval invalidation, and terminal-disposition rules
- Let each implementation reviewer write one file, keep its exact bytes, and link any later synthesis to that file
- Implementation Review by a fresh non-author, prompts that require counterexamples, and another provider or model when risk policy requires one

## Required issue ExecPlan Content

Before setting `promotion` to `planned`, the plan author must produce a nearly self-contained
ExecPlan that includes:

- goal capsule and traced epic requirements;
- current repository state and the patterns the plan author inspected;
- concrete technical decisions and rejected alternatives;
- repo-relative files and module/layer ownership;
- test-first scenarios with expected red and green evidence;
- failure, restart, idempotency, and rollback behavior where applicable;
- exact consumed artifact versions and produced handoff artifacts;
- verification contract and definition of done;
- test scenarios proving that operator corrections, agent errors, review findings, interruptions,
  and unexpected delays become stable process findings and that Review, Learn, merge, and closure
  reject unresolved findings;
- test scenarios proving each implementation reviewer writes the complete review to its sole
  permitted artifact path, exact bytes remain immutable, and optional synthesis remains separate
  and source-linked;
- Progress, Surprises, Decision Log, and Outcomes sections that the team maintains throughout the
  work.

## Promotion Checklist

- [ ] Expanded using the current repository and complete epic ExecPlan
- [ ] Dependency outputs exist or all provisional assumptions are explicit
- [ ] The plan names module boundaries that conform to the architecture standard
- [ ] Test scenarios cover success, edge, failure, and integration paths as applicable
- [ ] Every process finding has one terminal disposition and linked repair or dismissal evidence;
  scope-changing dispositions return to Plan and invalidate stale review and approval
- [ ] Implementation Review rejects the worker and every session that changed the artifact, then
  records whether it used another provider or model when risk policy required one
- [ ] A clean-room reviewer approved the current revision
- [ ] The plan author addressed review findings, and reviewers re-reviewed the revision
- [ ] Operator approved the exact reviewed revision
- [ ] Set `execution_authorized` to `true` only after the operator approves the exact reviewed
  revision

## Dependency Revalidation

When a dependency completes or its producer changes a consumed artifact, the plan author must
compare the output with this plan's assumptions. If it materially differs, the plan author must set
`promotion` to `planned` and obtain a refreshed review before execution.
