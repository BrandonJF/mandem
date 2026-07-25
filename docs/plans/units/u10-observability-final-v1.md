---
title: "U10: Alloy, Loki, Grafana, and final v1 publication"
plan_kind: mandem-child-execplan
program_unit: U10
parent: ../2026-07-21-001-feat-mandem-plan.md
promotion: scaffolded
execution_authorized: false
---

# U10: Alloy, Loki, Grafana, and final v1 publication

> This is a dependency scaffold, not an executable plan. Before implementation dispatch, the
> plan author must expand it, obtain a clean-room review, and obtain operator approval.

## Purpose

Expand this scaffold into a self-contained U10 child ExecPlan that incorporates every applicable
master-program constraint. Use the master program to sequence work; do not treat it as a worker's
implementation instruction.

## Dependency Contract

**Depends on:** U9

### Consumes

- U2 event schema, with stability demonstrated during U9
- U9 release candidate and lifecycle fixtures
- Local-only deployment constraint

### Produces

- Required Alloy/Loki/Grafana Compose services
- Provisioned operational dashboards
- Retention and local-binding policy
- Observability failure-isolation evidence
- Final v1 artifacts and publication record

### Downstream Consumers

- Mandem operational use and future Learn/report feedback

## Architecture Constraint

Authors must place all source code added for this unit in Mandem's Nucleus-derived clean
architecture. The detailed plan must identify module ownership, layer placement, public API
boundaries, composition roots, and deterministic architecture checks for each behavior implemented
by the unit.

## Decisions Required Before Promotion

- Log/metric derivation boundary
- Dashboard information hierarchy
- Retention/disk defaults
- Final release promotion checklist

## Required Child ExecPlan Content

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
