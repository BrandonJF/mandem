---
title: "Govern plan admission and authorization - Plan"
type: feat
date: 2026-08-18
artifact_contract: ce-unified-plan/v1
artifact_readiness: draft
product_contract_source: mandem-epic
execution: code
plan_kind: mandem-issue-execplan
issue_key: U2A3
parent: u2-protocol-lifecycle-sqlite.md
epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253
issue_id: 9a3035d2-8cb3-4479-8121-cff1ab32fd6e
depends_on_issue_ids:
  - ee63c8fd-3489-46fe-afd2-b612ddc3ab5c
promotion: scaffolded
execution_authorized: false
---

# Govern plan admission and authorization

This ExecPlan is a living document governed by `PLANS.md`. This scaffold is not ready for review or implementation.

## Purpose / Big Picture

U2A3 moves one issue from planning through independently validated review, exact approval, and queue admission. It owns approval binding, gate requirements, process findings, failed-review limits, and a bounded planning event fold. Its public output is one complete `WorkAuthorizationV1` that U2A4 can consume without revalidating planning history.

## Progress

- [x] (2026-08-18) Created U2A3 from the split U2A plan-governance contract.
- [ ] Complete the five pre-review proofs and exact implementation instructions.
- [ ] Start only after U2A2 is merged, then obtain clean review and exact approval.

## Decision Log

- Decision: Keep plan governance separate from active-work control.
  Rationale: Review and approval trust can be verified without carrying lease, handoff, merge, or verification state.
  Date/Author: 2026-08-18 / Codex

## Scope and Public Handoff

Create `src/modules/execution/domain/plan-governance-policy.ts` and its adjacent test. Reuse `Mandem-Approval: v1` through `@/modules/architecture-standard` and validated review evidence through the execution barrel. Own planning states, review-limit lineage, plan approval, gate requirements, process-finding disposition, complete planning events, and `WorkAuthorizationV1`. Exclude workspace leases, worker handoffs, merge, verification, global workflow composition, and persistence.

## Five Pre-Review Proofs

| Proof | Required evidence | Status |
| --- | --- | --- |
| `closed-contract` | One compiled catalog for planning commands, events, state, errors, actions, findings, gates, and authorization output | Incomplete |
| `provenance` | Producer, authentication, immutable binding, and consumer for review, approval, gate, dependency, and operator-choice facts | Incomplete |
| `state-and-replay` | Exhaustive planning transition and fold matrix with every field replaced, retained, or cleared | Incomplete |
| `milestone` | Focused tests use only merged U2A1/U2A2 exports and files created by U2A3 | Incomplete |
| `scope` | Exclusion ledger proves no lease, worker, merge, verification, or storage behavior enters U2A3 | Incomplete |

## Validation and Acceptance

Tests must cover every planning transition, wrong-state rejection, exact approval and denial, gate freshness, unresolved findings, every disposition, retained review history, third-review structural response, the single permit limit, and event-only replay to byte-identical authorization state. The final branch must pass `bun run check`.

## Outcomes & Retrospective

No review, approval, implementation, or runtime evidence exists. U2A4 remains blocked.

Split scaffold note (2026-08-18): Created U2A3 as the sole owner of plan admission and authorization.
