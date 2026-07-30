---
title: "U8: SBP installation, architecture baseline, and migration shims"
plan_kind: mandem-issue-execplan
issue_key: U8
parent: ../2026-07-21-001-feat-mandem-plan.md
epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253
issue_id: 9e6cde19-27d2-4228-8a93-628829ae1b92
depends_on_issue_ids:
  - 11538b56-bd63-42c2-8242-87ac7a76d35d
  - 22a35ab0-878b-448b-9341-6679b70a499d
  - 6ca36caa-37e2-447b-935e-792a6f6566b6
  - cb67d131-975c-4d97-9a6f-4934be991ac6
  - cf239716-00e2-46ae-82e7-84ac8f31baaf
  - d946e066-84d5-4651-b3b4-30a18e80008c
  - da645bd0-9899-40b3-9f23-3b48d65362a4
promotion: scaffolded
execution_authorized: false
---

# U8: SBP installation, architecture baseline, and migration shims

> This is a dependency scaffold, not an executable plan. Before implementation dispatch, the
> plan author must expand it, obtain a clean-room review, and obtain operator approval.

## Purpose

Expand this scaffold into a self-contained U8 issue ExecPlan that incorporates every applicable
master-program constraint. Use the master program to sequence work; do not treat it as a worker's
implementation instruction.

## Dependency Contract

**Depends on:** U1, U2, U3, U4, U5, U6, U7

### Consumes

- Complete Mandem client/server vertical capability
- Versioned architecture standard and checker
- Operating-doc compiler
- SBP repository and current orchestration

### Produces

- Transactional Mandem init
- Committed SBP project identity/configuration
- Stable architecture-debt baseline and ratchet
- Generated agent entry files
- Selected one-way legacy command shims
- Evidence that workers receive implementation instructions from only one authority

### Downstream Consumers

- U9 real SBP lifecycle acceptance
- Future architecture remediation issues

## Architecture Constraint

Authors must place all source code added for this unit in Mandem's Nucleus-derived clean
architecture. The detailed plan must identify module ownership, layer placement, public API
boundaries, composition roots, and deterministic architecture checks for each behavior implemented
by the unit.

## Decisions Required Before Promotion

- Baseline fingerprint identity
- Init backup/rollback transaction
- First migrated command boundaries
- Legacy coexistence cutoff

## Required issue ExecPlan Content

Before setting `promotion` to `planned`, the plan author must produce a nearly self-contained
ExecPlan that includes:

- goal capsule and traced master requirements;
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

- [ ] Expanded using the current repository and complete master ExecPlan
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
