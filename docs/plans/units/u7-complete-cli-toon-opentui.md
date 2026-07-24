---
title: "U7: Complete AXI CLI, TOON output, OpenTUI, and worker witnessability"
plan_kind: mandem-child-execplan
program_unit: U7
parent: ../2026-07-21-001-feat-mandem-plan.md
promotion: scaffolded
execution_authorized: false
---

# U7: Complete AXI CLI, TOON output, OpenTUI, and worker witnessability

> This is a dependency scaffold, not an executable plan. It must be expanded, clean-room reviewed, and operator approved before implementation dispatch.

## Purpose

Expand this scaffold by incorporating every applicable master-program constraint into one
self-contained U7 child ExecPlan; the master remains sequencing context, not worker authority.

## Dependency Contract

**Depends on:** U2, U3, U4, U5, U6

### Consumes

- U4 primitive CLI/TOON contract
- U3 push event transport
- U5 phase-session actions
- U6 worker/takeover lifecycle

### Produces

- Complete canonical command surface
- Concise human and schema-versioned TOON renderers
- Tmux-native OpenTUI control surface
- Keyboard and narrow-terminal accessibility
- CLI/TUI/skill/provider action-parity evidence

### Downstream Consumers

- U8 installed SBP operator surface
- U9 complete operator acceptance flow
- U10 operational dashboard navigation context

## Architecture Constraint

All source introduced by this unit must follow Mandem's own Nucleus-derived clean architecture. The detailed plan must identify module ownership, layer placement, public API boundaries, composition roots, and deterministic architecture checks for every behavior-bearing slice.

## Decisions Required Before Promotion

- Command taxonomy and progressive disclosure
- Home-view attention hierarchy
- Pane/window focus lifecycle
- Terminal testing strategy

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
