---
title: "Compose the complete workflow reducer - Plan"
type: feat
date: 2026-08-18
artifact_contract: ce-unified-plan/v1
artifact_readiness: draft
product_contract_source: mandem-epic
execution: code
plan_kind: mandem-issue-execplan
issue_key: U2A5
parent: u2-protocol-lifecycle-sqlite.md
epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253
issue_id: 4706b2e2-42bb-4536-84a2-03940d798dc0
depends_on_issue_ids:
  - 9d35f34e-7967-42fa-870a-f8ddfb7af43b
promotion: scaffolded
execution_authorized: false
---

# Compose the complete workflow reducer

This ExecPlan is a living document governed by `PLANS.md`. This scaffold is not ready for review or implementation.

## Purpose / Big Picture

U2A5 composes the four reviewed subissue contracts into one deterministic workflow API. It owns the complete command, event, result, and snapshot union; cross-domain lifecycle routing; Learn, merge, verification, and recovery glue; global event folding; and the exact public handoff U2B stores and replays. It may not add a new primitive grammar, trusted input kind, review rule, approval rule, or lease rule.

## Progress

- [x] (2026-08-18) Created U2A5 from the split U2A composition and storage-handoff contract.
- [ ] Complete the five pre-review proofs and exact implementation instructions.
- [ ] Start only after U2A4 is merged, then obtain clean review and exact approval.

## Decision Log

- Decision: Make U2A5 composition-only.
  Rationale: A final reducer can prove cross-contract routing and replay without reopening the reviewed subissue contracts.
  Date/Author: 2026-08-18 / Codex

## Scope and Public Handoff

Create `src/modules/execution/domain/workflow-reducer.ts`, its adjacent test, and `src/modules/execution/domain/reducer-determinism.test.ts`. Complete the runtime and execution barrels plus `docs/architecture/control-protocol.md` and its indexes. Consume only public U2A1–U2A4 exports. Own complete lifecycle routing, canonical command/event/result/snapshot values, next actions, global event folding, and the U2B storage input. Exclude persistence, SQLite, external adapters, provider launch, server transport, and new subissue-policy decisions.

## Five Pre-Review Proofs

| Proof | Required evidence | Status |
| --- | --- | --- |
| `closed-contract` | Compiled global command/event/snapshot catalog assembled only from reviewed subissue exports | Incomplete |
| `provenance` | Whole-system producer and consumer matrix for every command input, trusted fact, event field, snapshot field, and U2B output | Incomplete |
| `state-and-replay` | Exhaustive global routing/fold matrix and event-only rebuild from initial state to every terminal or interruption state | Incomplete |
| `milestone` | Integration tests import only merged subissue barrels and U2A5 files; documentation follows passing composition | Incomplete |
| `scope` | Exclusion ledger and tests reject any new subissue-policy rule or persistence behavior | Incomplete |

## Validation and Acceptance

Tests must cover one accepted and every invalid source-state case for each command, ordered guards, complete errors and actions, every intermediate event snapshot, raw-byte and typed evaluator parity, identical decisions for identical input, event-only replay, and public barrel reachability. U2B must type its storage input without defining another lifecycle fact. The final branch must pass `bun run check`.

## Outcomes & Retrospective

No review, approval, implementation, or runtime evidence exists. U2B remains blocked until U2A5 and U2A coordination complete.

Split scaffold note (2026-08-18): Created U2A5 as the sole owner of workflow composition and the U2B handoff.
