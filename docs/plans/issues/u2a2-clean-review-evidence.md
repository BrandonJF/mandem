---
title: "Validate independent clean-room review evidence - Plan"
type: feat
date: 2026-08-18
artifact_contract: ce-unified-plan/v1
artifact_readiness: draft
product_contract_source: mandem-epic
execution: code
plan_kind: mandem-issue-execplan
issue_key: U2A2
parent: u2-protocol-lifecycle-sqlite.md
epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253
issue_id: ee63c8fd-3489-46fe-afd2-b612ddc3ab5c
depends_on_issue_ids:
  - 3bffe969-4131-40bf-9192-3e00a845910e
promotion: scaffolded
execution_authorized: false
---

# Validate independent clean-room review evidence

This ExecPlan is a living document governed by `PLANS.md`. This scaffold is not ready for review or implementation.

## Purpose / Big Picture

U2A2 converts exact manifest, dispatch, participant, output, ancestry, write-set, and provider evidence into one validated review value. It proves that a clean verdict came from the required independent reviewer against exact bytes. It does not approve a plan or change workflow state.

## Progress

- [x] (2026-08-18) Created U2A2 from the split U2A review-evidence contract.
- [ ] Complete the five pre-review proofs and exact implementation instructions.
- [ ] Start only after U2A1 is merged, then obtain clean review and exact approval.

## Surprises & Discoveries

- Observation: Review evidence requires a trusted complete participant inventory; manifest claims cannot prove reviewer independence.
  Evidence: Preserved U2A findings on omitted revisers, self-review, sole-write proof, and provider receipt binding.

## Decision Log

- Decision: Make validated review evidence the only public output of U2A2.
  Rationale: U2A3 can authorize planning transitions without reinterpreting Git or provider facts.
  Date/Author: 2026-08-18 / Codex

## Scope and Public Handoff

Create `src/modules/execution/domain/review-evidence-policy.ts` and its adjacent test, plus the execution module skeleton and public type/barrel changes required for `ValidatedReviewEvidenceV1`. Consume U2A1 primitives and trusted adapter inputs. Exclude approval selection, gate freshness, failed-review counters, lifecycle state, leases, and storage.

## Five Pre-Review Proofs

| Proof | Required evidence | Status |
| --- | --- | --- |
| `closed-contract` | Compiled schemas for manifest, dispatch, participants, risk policy, output, attestation, and validated evidence | Incomplete |
| `provenance` | Named trusted producer and immutable source binding for every participant, write, ancestry, provider, and requirements fact | Incomplete |
| `state-and-replay` | Validator returns a complete immutable value or one typed error; it mutates no state | Incomplete |
| `milestone` | Focused validator tests depend only on merged U2A1 exports and U2A2 files | Incomplete |
| `scope` | Exclusion ledger proves no approval, gate, lifecycle, lease, or persistence decision enters U2A2 | Incomplete |

## Validation and Acceptance

Tests must cover exact clean evidence and reject stale targets, terminal-only output, wrong paths, extra writes, missing participants, self-review, inherited context, substituted attestations, wrong provider/model, invalid risk evidence, and changed execution requirements. The final branch must pass `bun run check`.

## Outcomes & Retrospective

No review, approval, implementation, or runtime evidence exists. U2A3 remains blocked.

Split scaffold note (2026-08-18): Created U2A2 as the sole owner of independent clean-room review validation.
