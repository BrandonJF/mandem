---
title: "U2: Protocol, lifecycle kernel, and SQLite event model"
plan_kind: mandem-child-execplan
program_unit: U2
parent: ../2026-07-21-001-feat-mandem-plan.md
promotion: scaffolded
execution_authorized: false
---

# U2: Protocol, lifecycle kernel, and SQLite event model

> This is a dependency scaffold, not an executable plan. It must be expanded, clean-room reviewed, and operator approved before implementation dispatch.

## Purpose

Expand this scaffold by incorporating every applicable master-program constraint into one
self-contained U2 child ExecPlan; the master remains sequencing context, not worker authority.

## Dependency Contract

**Depends on:** U1

### Consumes

- U1 architecture standard and module skeleton
- U1 repository gates
- Master lifecycle, authority, approval, and checkpoint decisions

### Produces

- Versioned command, result, error, and event envelopes
- Executable lifecycle transition table
- Lease, idempotency, approval, and gate-freshness contracts
- Append-only SQLite ledger and rebuildable projection ports/adapters
- Portable checkpoint schema

### Downstream Consumers

- U3 transport/server/reconciliation
- U4 work-item and gate behavior
- U6 autonomous iteration loop
- U7 CLI/TOON parity
- U10 telemetry schema

## Architecture Constraint

All source introduced by this unit must follow Mandem's own Nucleus-derived clean architecture. The detailed plan must identify module ownership, layer placement, public API boundaries, composition roots, and deterministic architecture checks for every behavior-bearing slice.

## Decisions Required Before Promotion

- Domain vocabulary and schema versioning
- Transaction and replay boundaries
- Approval-sensitive versus living-plan content representation
- Terminal disposition invariants

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

U1 dependency revalidation completed on 2026-07-24 against merge
`88b9533ab840c9d357a1d09d2341709e2cbdd986`. The repository now provides Bun `1.3.14`, the
canonical `bun run check` gate, public `architecture-standard` and `runtime` barrels, the
versioned 22-rule catalog, deterministic filesystem analysis, two bounded entrypoints, and a
completed Claude/Codex capability baseline. U2 must extend the existing `runtime` module, preserve
those public barrels, keep SQLite behind infrastructure ports, and avoid weakening any U1 rule or
gate. No material mismatch invalidated the scaffold, but it is not self-contained enough for
implementation.

## Progress

- [x] (2026-07-24) Revalidated consumed inputs against merged U1 commit
  `88b9533ab840c9d357a1d09d2341709e2cbdd986`.
- [ ] Expand this scaffold into a self-contained U2 ExecPlan governed by `PLANS.md`.
- [ ] Run clean-room review and repair at the exact planned revision.
- [ ] Obtain exact-revision operator approval before authorization.

## Surprises & Discoveries

- Observation: U1 completed the provider capability matrix rather than leaving it as a U2
  promotion blocker.
  Evidence: `docs/operations/provider-capability-baseline.md` records working-directory,
  full-access, structured completion, interruption, read-only review, and fresh-session recovery.

## Decision Log

- Decision: Extend U1's existing `runtime` module and public barrels in U2.
  Rationale: U1's merged package and architecture contract are dependency ground truth; a parallel
  lifecycle root would fragment the public surface and violate the handoff.
  Date/Author: 2026-07-24 / Mandem program orchestrator

## Outcomes & Retrospective

Dependency revalidation found no incompatible U1 output. U2 is dependency-ready for detailed
planning, but remains `promotion: scaffolded` and `execution_authorized: false`.

Revision note (2026-07-24): Revalidated U2 against U1's actual merged artifacts and recorded the
concrete interfaces, gates, provider evidence, and module-extension constraint. This update does
not authorize U2 implementation.
