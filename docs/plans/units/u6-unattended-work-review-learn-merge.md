---
title: "U6: Unattended worktree delivery through Review, Learn, and merge"
plan_kind: mandem-child-execplan
program_unit: U6
parent: ../2026-07-21-001-feat-mandem-plan.md
promotion: scaffolded
execution_authorized: false
---

# U6: Unattended worktree delivery through Review, Learn, and merge

> This is a dependency scaffold, not an executable plan. It must be expanded, clean-room reviewed, and operator approved before implementation dispatch.

## Purpose

Expand this scaffold by incorporating every applicable master-program constraint into one
self-contained U6 child ExecPlan; the master remains sequencing context, not worker authority.

## Dependency Contract

**Depends on:** U2, U3, U4, U5

### Consumes

- Lifecycle and lease kernel
- Resident tmux/Git/provider capabilities
- Work-item, ExecPlan, queue, and gate services
- Provider/session contracts

### Produces

- Worktree mutation ownership
- TDD iteration and conventional-commit evidence
- Draft PR and independent review/repair loop
- Mandatory Learn outcome
- Exact-SHA serialized merge and post-merge verification
- Takeover, cancellation, and cleanup behavior

### Downstream Consumers

- U7 worker witnessability and takeover UI
- U8 SBP command migration
- U9 restart-proof end-to-end proof

## Architecture Constraint

All source introduced by this unit must follow Mandem's own Nucleus-derived clean architecture. The detailed plan must identify module ownership, layer placement, public API boundaries, composition roots, and deterministic architecture checks for every behavior-bearing slice.

## Decisions Required Before Promotion

- Iteration boundary and completion evidence
- Review invalidation and repair permissions
- Learn prevention mechanisms
- Integration lease transaction
- Post-merge failure disposition

## Required Child ExecPlan Content

Before this scaffold becomes `planned`, replace its planning gaps with a nearly self-contained ExecPlan that includes:

- goal capsule and traced master requirements;
- current repository state and patterns actually inspected;
- concrete technical decisions and rejected alternatives;
- repo-relative files and module/layer ownership;
- test-first scenarios with expected red and green evidence;
- failure, restart, idempotency, and rollback behavior where applicable;
- exact consumed artifact versions and produced handoff artifacts;
- verification contract and definition of done;
- living Progress, Surprises, Decision Log, and Outcomes sections.

## Promotion Checklist

- [ ] Expanded against the current repository and complete master ExecPlan
- [ ] Dependency outputs exist or all provisional assumptions are explicit
- [ ] Self-conforming module boundaries are named
- [ ] Test scenarios cover happy, edge, failure, and integration paths as applicable
- [ ] Clean-room review passed at the current revision
- [ ] Review findings repaired and re-reviewed
- [ ] Operator approved the exact reviewed revision
- [ ] `execution_authorized` changed to `true` only after approval

## Dependency Revalidation

When any dependency completes or changes an artifact consumed here, compare the actual output with this plan's assumptions. Any material mismatch returns the child to `planned` and requires review refresh before execution.
