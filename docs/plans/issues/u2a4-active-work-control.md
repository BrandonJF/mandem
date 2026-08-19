---
title: "Control active work and handoffs - Plan"
type: feat
date: 2026-08-18
artifact_contract: ce-unified-plan/v1
artifact_readiness: draft
product_contract_source: mandem-epic
execution: code
plan_kind: mandem-issue-execplan
issue_key: U2A4
parent: u2-protocol-lifecycle-sqlite.md
epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253
issue_id: 9d35f34e-7967-42fa-870a-f8ddfb7af43b
depends_on_issue_ids:
  - 9a3035d2-8cb3-4479-8121-cff1ab32fd6e
promotion: scaffolded
execution_authorized: false
---

# Control active work and handoffs

This ExecPlan is a living document governed by `PLANS.md`. This scaffold is not ready for review or implementation.

## Purpose / Big Picture

U2A4 applies one `WorkAuthorizationV1` to active work. It owns workspace observations, work and integration leases, fencing, heartbeats, takeover, release, handoffs, review repair, pause, cancellation, and reconciliation. It emits complete local events and state that U2A5 can compose without deriving a lease or transfer fact.

## Progress

- [x] (2026-08-18) Created U2A4 from the split U2A active-work contract.
- [ ] Complete the five pre-review proofs and exact implementation instructions.
- [ ] Start only after U2A3 is merged, then obtain clean review and exact approval.

## Decision Log

- Decision: Require one reviewed work authorization as the only planning input.
  Rationale: Active-work code must not parse approval records or inspect clean-room evidence.
  Date/Author: 2026-08-18 / Codex

## Scope and Public Handoff

Create `src/modules/execution/domain/work-control-policy.ts` and its adjacent test. Own lease and fencing values, workspace trust validation, handoff values, interruption and reconciliation effects, local state transitions, and `ReviewedWorkV1`. Exclude review provenance, approval parsing, failed-review history, persistence, and the final cross-domain reducer.

## Five Pre-Review Proofs

| Proof | Required evidence | Status |
| --- | --- | --- |
| `closed-contract` | Compiled catalog for work commands, events, states, errors, actions, lease targets, and handoff effects | Incomplete |
| `provenance` | Named trusted producer and immutable binding for time, workspace, repository, reviewed head, and repair evidence | Incomplete |
| `state-and-replay` | Exhaustive work transition and fold matrix, including intermediate revoke/acquire states and stale-owner replay | Incomplete |
| `milestone` | Focused tests use only merged U2A1–U2A3 exports and files created by U2A4 | Incomplete |
| `scope` | Exclusion ledger proves no review validation, approval parsing, failed-review policy, or storage enters U2A4 | Incomplete |

## Validation and Acceptance

Tests must cover expiry before and at the boundary, owner/session/token mismatches, heartbeat, takeover, release, handoff, repair transfer, pause with and without a lease, cancellation, reconciliation, workspace mismatch, trusted-time provenance, and event-only replay with permanent fencing. The final branch must pass `bun run check`.

## Outcomes & Retrospective

No review, approval, implementation, or runtime evidence exists. U2A5 remains blocked.

Split scaffold note (2026-08-18): Created U2A4 as the sole owner of active-work control.
