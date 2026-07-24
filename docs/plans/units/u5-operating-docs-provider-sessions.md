---
title: "U5: Operating docs and bounded Claude/Codex sessions"
plan_kind: mandem-child-execplan
program_unit: U5
parent: ../2026-07-21-001-feat-mandem-plan.md
promotion: scaffolded
execution_authorized: false
---

# U5: Operating docs and bounded Claude/Codex sessions

> This is a dependency scaffold, not an executable plan. It must be expanded, clean-room reviewed, and operator approved before implementation dispatch.

## Purpose

Expand this scaffold by incorporating every applicable master-program constraint into one
self-contained U5 child ExecPlan; the master remains sequencing context, not worker authority.

## Dependency Contract

**Depends on:** U3, U4

### Consumes

- U4 canonical CLI and plan/work-item primitives
- U3 resident host process execution
- Approved child ExecPlan containing the applicable master-program contracts

### Produces

- Composable operating-doc compiler
- Deterministic AGENTS.md and CLAUDE.md adapters
- Claude and Codex capability adapters
- Typed phase-session launch and handoff contracts
- Provider conformance and prompt-provenance evidence

### Downstream Consumers

- U6 worker/reviewer/Learn sessions
- U7 agent-surface parity
- U8 SBP generated instructions
- U9 live provider matrix

## Architecture Constraint

All source introduced by this unit must follow Mandem's own Nucleus-derived clean architecture. The detailed plan must identify module ownership, layer placement, public API boundaries, composition roots, and deterministic architecture checks for every behavior-bearing slice.

## Decisions Required Before Promotion

- Prompt composition metadata and budgets
- Provider capability/fallback matrix
- Remote-control exposure
- Session interruption and accepted-handoff semantics

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
