---
title: "Coordinate the split Mandem work-control contracts - Plan"
type: feat
date: 2026-08-18
artifact_contract: ce-unified-plan/v1
artifact_readiness: draft
product_contract_source: mandem-epic
execution: knowledge-work
plan_kind: mandem-issue-execplan
issue_key: U2A
parent: ../2026-07-21-001-feat-mandem-plan.md
epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253
issue_id: cb67d131-975c-4d97-9a6f-4934be991ac6
depends_on_issue_ids:
  - 6a6a8bab-853f-4658-9bc0-38e2386b642d
  - 745eda80-1e74-4866-bc95-2f2983b31025
  - da645bd0-9899-40b3-9f23-3b48d65362a4
promotion: planned
execution_authorized: false
---

# Coordinate the split Mandem work-control contracts

This document records the U2A coordination boundary. It is not an implementation prompt. Each subissue has its own ExecPlan, clean-room review, exact approval, branch, tests, and pull request.

## Purpose / Big Picture

U2A previously combined canonical wire encoding, review provenance, plan authorization, active-work control, and complete workflow replay. Twenty-six failed review verdicts showed that this boundary was too broad to verify as one plan. The operator chose `split` on 2026-08-18 after the repository limited the retained issue to structural choices.

U2A now coordinates five independently reviewable contracts. The retained issue closes only after all five subissues are merged and U2A5 proves that U2B can consume the complete event and snapshot values.

## Progress

- [x] (2026-08-18 23:25Z) Merged the planning-system repair that limits retained issues to one post-threshold review exception.
- [x] (2026-08-18 23:27Z) Recorded the operator's `split` choice after 26 failed verdicts and one consumed exception.
- [x] (2026-08-18 23:41Z) Created five native subissues with distinct contract ownership.
- [ ] Apply and verify the native issue graph for the five U2A subissues.
- [ ] Expand, review, approve, implement, and merge U2A1 through U2A5 in dependency order.
- [ ] Close U2A after U2A5 publishes the complete U2B handoff.

## Surprises & Discoveries

- Observation: 55 of 62 preserved blockers concerned closed contracts, trusted provenance, or state and replay behavior.
  Evidence: `docs/operations/2026-08-18-u2-plan-review-root-cause.md`.
- Observation: The combined plan defined 30 command kinds and seven independently verifiable behaviors.
  Evidence: `docs/plans/contracts/u2a-protocol-contract.ts` and the former plan at commit `1dc6f582030d31f17571761ce7f2a340a0774b06`.

## Decision Log

- Decision: Split U2A into five subissues by contract ownership. (session-settled: user-directed — chosen over another review or another combined redesign: the retained issue exhausted its review exception and repeated failures crossed several independent contracts.)
  Rationale: Each subissue can prove one closed interface before another subissue depends on it.
  Date/Author: 2026-08-18 / Operator and Codex
- Decision: Keep the retained U2A issue as coordination-only work.
  Rationale: A new implementation issue receives a new review history only when it owns genuinely distinct behavior. Reusing the retained issue would obscure its 26 failed verdicts.
  Date/Author: 2026-08-18 / Codex

## Child Contract Graph

1. U2A1 defines canonical bytes, scalar aliases, artifact references, trusted-attestation primitives, and request identity.
2. U2A2 depends on U2A1 and validates independent clean-room review evidence.
3. U2A3 depends on U2A2 and governs plan admission, approval, gates, process findings, and failed-review limits.
4. U2A4 depends on U2A3 and controls leases, fencing, workspaces, handoffs, repair transfer, interruption, and reconciliation.
5. U2A5 depends on U2A4 and composes the prior contracts into the complete workflow reducer and U2B handoff.

U2B depends on completed U2A coordination. Downstream issues continue to depend on U2A or U2B as already declared; no downstream issue may consume a subissue contract before U2A5 proves the public composition.

## Validation and Acceptance

The split is complete when the checked-in graph and all native issue refs agree, GitHub shows U2A1 through U2A5 under U2A, U2A1 is the only active subissue, and every later subissue is blocked by its immediate predecessor. `bun run issue-graph:check` and `bun run check` must pass. `PLANS.md` must have no diff.

## Outcomes & Retrospective

The combined implementation plan is retired. Its latest exact bytes remain at commit `1dc6f582030d31f17571761ce7f2a340a0774b06`, and all review artifacts remain in `docs/plans/reviews/`. No subissue plan has a clean verdict or implementation authorization.

Split revision note (2026-08-18): Replaced the combined U2A implementation target with five contract-owned subissues after the operator selected `split`. Preserved the complete prior plan and review lineage in Git.
