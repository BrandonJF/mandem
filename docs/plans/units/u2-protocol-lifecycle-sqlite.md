---
title: "U2: Protocol, lifecycle kernel, and SQLite event model"
plan_kind: mandem-child-execplan
program_unit: U2
parent: ../2026-07-21-001-feat-mandem-plan.md
promotion: scaffolded
execution_authorized: false
---

# U2: Protocol, lifecycle kernel, and SQLite event model

> This is a dependency scaffold, not an executable plan. Before implementation dispatch, the
> plan author must expand it, obtain a clean-room review, and obtain operator approval.

## Purpose

Expand this scaffold into a self-contained U2 child ExecPlan that incorporates every applicable
master-program constraint. Use the master program to sequence work; do not treat it as a worker's
implementation instruction.

## Dependency Contract

**Depends on:** corrected U1 and U1A

### Consumes

- U1 architecture standard and module skeleton
- U1 repository gates
- U1A documentation, authored-source, Git-hook, and canonical-check gates
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

Authors must place all source code added for this unit in Mandem's Nucleus-derived clean
architecture. The detailed plan must identify module ownership, layer placement, public API
boundaries, composition roots, and deterministic architecture checks for each behavior implemented
by the unit.

## Decisions Required Before Promotion

- Domain vocabulary and schema versioning
- Transaction and replay boundaries
- Approval-sensitive versus living-plan content representation
- Terminal disposition invariants

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

The Mandem program orchestrator completed the original U1 dependency revalidation on 2026-07-24
against merge
`88b9533ab840c9d357a1d09d2341709e2cbdd986`. The repository now provides Bun `1.3.14`, the
canonical `bun run check` gate, public `architecture-standard` and `runtime` barrels, the
versioned 22-rule catalog, deterministic filesystem analysis, two bounded entrypoints, and a
completed Claude/Codex capability baseline. U2 must extend the existing `runtime` module, preserve
those public barrels, keep SQLite behind infrastructure ports, and avoid weakening any U1 rule or
gate. Post-merge verification on 2026-07-25 found material package and architecture-gate gaps,
tracked by work item `5717221`, and the operator added the U1A documentation/authoring-quality
dependency tracked by `745eda8`. U2 dependency readiness is therefore invalidated until both
foundational work items merge and this scaffold is revalidated against their actual outputs.

## Progress

- [x] (2026-07-24) Revalidated consumed inputs against merged U1 commit
  `88b9533ab840c9d357a1d09d2341709e2cbdd986`.
- [x] (2026-07-25) Invalidated that dependency readiness after corrective U1 findings and the U1A
  quality-gate dependency were recorded.
- [ ] Expand this scaffold into a self-contained U2 ExecPlan that follows `PLANS.md`.
- [ ] Have a clean-room reviewer review the exact planned revision and address the findings.
- [ ] Obtain the operator's approval of that revision before setting `execution_authorized` to
  `true`.

## Surprises & Discoveries

- Observation: U1 completed the provider capability matrix. It is no longer a U2 promotion
  blocker.
  Evidence: `docs/operations/provider-capability-baseline.md` lists evidence for working-directory,
  full-access, structured completion, interruption, read-only review, and fresh-session recovery.

## Decision Log

- Decision: Extend U1's existing `runtime` module and public barrels in U2.
  Rationale: U1's merged package and architecture contract specify the interfaces U2 must use. A
  parallel lifecycle root would create a second public surface and conflict with the U1-to-U2
  handoff.
  Date/Author: 2026-07-24 / Mandem program orchestrator

## Outcomes & Retrospective

The original dependency revalidation found no incompatible U1 output, but the 2026-07-25 findings
and U1A requirement supersede that conclusion. U2 becomes dependency-ready for detailed planning
only after corrected U1 and U1A complete. It remains `promotion: scaffolded` and
`execution_authorized: false`.

Revision note (2026-07-24): The Mandem program orchestrator revalidated U2 against U1's actual
merged artifacts and recorded the concrete interfaces, gates, provider evidence, and
module-extension constraint. This update does not authorize U2 implementation.

Revision note (2026-07-25): Invalidated U2 dependency readiness after post-merge U1 verification
opened corrective work item `5717221` and documentation/authoring-quality work item `745eda8`.
