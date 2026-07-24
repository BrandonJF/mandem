---
title: "U9: Restart-proof SBP vertical slice and v1 release candidate"
plan_kind: mandem-child-execplan
program_unit: U9
parent: ../2026-07-21-001-feat-mandem-plan.md
promotion: scaffolded
execution_authorized: false
---

# U9: Restart-proof SBP vertical slice and v1 release candidate

> This is a dependency scaffold, not an executable plan. It must be expanded, clean-room reviewed, and operator approved before implementation dispatch.

## Purpose

Expand this scaffold by incorporating every applicable master-program constraint into one
self-contained U9 child ExecPlan; the master remains sequencing context, not worker authority.

## Dependency Contract

**Depends on:** U1, U2, U3, U4, U5, U6, U7, U8

### Consumes

- Installed SBP control plane
- All provider, lifecycle, architecture, and operator surfaces
- Master acceptance examples AE1-AE12

### Produces

- Real Claude-primary and Codex-primary lifecycle evidence
- Process-kill/restart matrix
- Clean-install proof
- Reconstructable completed SBP work item
- Pinned v1 release candidate

### Downstream Consumers

- U10 observability validation and final v1 publication

## Architecture Constraint

All source introduced by this unit must follow Mandem's own Nucleus-derived clean architecture. The detailed plan must identify module ownership, layer placement, public API boundaries, composition roots, and deterministic architecture checks for every behavior-bearing slice.

## Decisions Required Before Promotion

- Live-provider versus deterministic CI evidence boundary
- Chaos checkpoint matrix
- Release evidence manifest
- Release-candidate acceptance threshold

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
