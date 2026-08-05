---
title: "U3: Server, Docker lifecycle, resident host mode, and reconciliation"
plan_kind: mandem-issue-execplan
issue_key: U3
parent: ../2026-07-21-001-feat-mandem-plan.md
epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253
issue_id: d946e066-84d5-4651-b3b4-30a18e80008c
depends_on_issue_ids:
  - 5abb076c-c5ba-41da-aeab-089664360dbb
promotion: scaffolded
execution_authorized: false
---

# U3: Server, Docker lifecycle, resident host mode, and reconciliation

> This is a dependency scaffold, not an executable plan. Before implementation dispatch, the
> plan author must expand it, obtain a clean-room review, and obtain operator approval.

## Purpose

Expand this scaffold into a self-contained U3 issue ExecPlan that incorporates every applicable
epic constraint. Use the epic ExecPlan to sequence work; do not treat it as a worker's
implementation instruction.

## Dependency Contract

**Depends on:** U2B

### Consumes

- U2A protocol and work-control rules through U2B's approved dependency
- U2B persistence ports, checkpoint schema, and restart recovery
- U1 executable/container composition roots

### Produces

- Project-scoped server runtime
- Local push transport selected from spike evidence
- Resident host capability protocol
- Docker and Linux service lifecycle
- Version handshake and reconciliation engine
- Evidence that restart and interrupt integration works

### Downstream Consumers

- U4 host-executed Git/tracker operations
- U5 bounded provider sessions
- U6 tmux/worktree execution
- U7 live event following
- U8 installed SBP runtime

## Architecture Constraint

Authors must place all source code added for this issue in Mandem's Nucleus-derived clean
architecture. The detailed plan must identify module ownership, layer placement, public API
boundaries, composition roots, and deterministic architecture checks for each behavior implemented
by the issue.

## Decisions Required Before Promotion

- Concrete local transport selected by spike
- Host/server capability ownership
- Service installation and compatibility rules
- Reconciliation conflict taxonomy

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
- Progress, Surprises, Decision Log, and Outcomes sections that the team maintains throughout the
  work.

## Promotion Checklist

- [ ] Expanded using the current repository and complete epic ExecPlan
- [ ] Dependency outputs exist or all provisional assumptions are explicit
- [ ] The plan names module boundaries that conform to the architecture standard
- [ ] Test scenarios cover success, edge, failure, and integration paths as applicable
- [ ] A clean-room reviewer approved the current revision
- [ ] The plan author addressed review findings, and reviewers re-reviewed the revision
- [ ] Operator approved the exact reviewed revision
- [ ] Set `execution_authorized` to `true` only after the operator approves the exact reviewed
  revision

## Dependency Revalidation

When a dependency completes or its producer changes a consumed artifact, the plan author must
compare the output with this plan's assumptions. If it materially differs, the plan author must set
`promotion` to `planned` and obtain a refreshed review before execution.
