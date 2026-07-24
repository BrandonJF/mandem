---
title: "U4: Work items, ExecPlans, queue, gates, primitive CLI, and projections"
plan_kind: mandem-child-execplan
program_unit: U4
parent: ../2026-07-21-001-feat-mandem-plan.md
promotion: scaffolded
execution_authorized: false
---

# U4: Work items, ExecPlans, queue, gates, primitive CLI, and projections

> This is a dependency scaffold, not an executable plan. It must be expanded, clean-room reviewed, and operator approved before implementation dispatch.

## Purpose

Expand this scaffold by incorporating every applicable master-program constraint into one
self-contained U4 child ExecPlan; the master remains sequencing context, not worker authority.

## Dependency Contract

**Depends on:** U2, U3

### Consumes

- U2 lifecycle, approval, event, and lease contracts
- U3 resident host capability path
- git-native-issue v1.3.3 external executable

### Produces

- Git-native work-item adapter
- Child ExecPlan validation and promotion workflow
- Queue/dependency and clean-room review services
- Hash-bound approval and typed gates
- Minimal AXI CLI and TOON envelopes
- GitHub projection and Mandem report workflow

### Downstream Consumers

- U5 skills and bounded sessions
- U6 autonomous execution
- U7 complete CLI/TUI
- U8 SBP migration aliases

## Architecture Constraint

All source introduced by this unit must follow Mandem's own Nucleus-derived clean architecture. The detailed plan must identify module ownership, layer placement, public API boundaries, composition roots, and deterministic architecture checks for every behavior-bearing slice.

## Decisions Required Before Promotion

- Canonical issue/plan mapping
- Plan promotion and invalidation rules
- Queue mutation and dependency failure behavior
- GitHub conflict/import policy
- Report publication boundary

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
