---
title: "U8: SBP installation, architecture baseline, and migration shims"
plan_kind: mandem-child-execplan
program_unit: U8
parent: ../2026-07-21-001-feat-mandem-plan.md
promotion: scaffolded
execution_authorized: false
---

# U8: SBP installation, architecture baseline, and migration shims

> This is a dependency scaffold, not an executable plan. It must be expanded, clean-room reviewed, and operator approved before implementation dispatch.

## Purpose

Expand this scaffold by incorporating every applicable master-program constraint into one
self-contained U8 child ExecPlan; the master remains sequencing context, not worker authority.

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
- No-dual-authority evidence

### Downstream Consumers

- U9 real SBP lifecycle acceptance
- Future architecture remediation work items

## Architecture Constraint

All source introduced by this unit must follow Mandem's own Nucleus-derived clean architecture. The detailed plan must identify module ownership, layer placement, public API boundaries, composition roots, and deterministic architecture checks for every behavior-bearing slice.

## Decisions Required Before Promotion

- Baseline fingerprint identity
- Init backup/rollback transaction
- First migrated command boundaries
- Legacy coexistence cutoff

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
