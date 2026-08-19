---
title: "Define the canonical runtime protocol foundation - Plan"
type: feat
date: 2026-08-18
artifact_contract: ce-unified-plan/v1
artifact_readiness: draft
product_contract_source: mandem-epic
execution: code
plan_kind: mandem-issue-execplan
issue_key: U2A1
parent: u2-protocol-lifecycle-sqlite.md
epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253
issue_id: 3bffe969-4131-40bf-9192-3e00a845910e
depends_on_issue_ids:
  - 6a6a8bab-853f-4658-9bc0-38e2386b642d
  - 745eda80-1e74-4866-bc95-2f2983b31025
  - da645bd0-9899-40b3-9f23-3b48d65362a4
promotion: scaffolded
execution_authorized: false
---

# Define the canonical runtime protocol foundation

This ExecPlan is a living document governed by `PLANS.md`. This scaffold is not ready for review or implementation.

## Purpose / Big Picture

U2A1 gives every later work-control issue one exact byte format and one set of validated primitive values. It owns canonical JSON, bounded scalar aliases, artifact references, trusted-attestation primitives, idempotency identity, and domain-separated digests. It does not define lifecycle commands, events, snapshots, review policy, leases, or storage.

## Progress

- [x] (2026-08-18) Created U2A1 from the split U2A protocol contract.
- [ ] Complete the five pre-review proofs and exact implementation instructions.
- [ ] Obtain a clean review and exact approval before implementation.

## Surprises & Discoveries

- Observation: Later policy contracts cannot remain closed if each defines its own string, number, path, digest, or canonical-byte rules.
  Evidence: U2A review rounds 8 through 12 repeatedly found schema and grammar contradictions.

## Decision Log

- Decision: Own only representation and identity primitives in U2A1.
  Rationale: Later issues can import one stable runtime barrel without importing lifecycle behavior.
  Date/Author: 2026-08-18 / Codex

## Scope and Public Handoff

Create `src/modules/runtime/domain/canonical-json-v1.ts` and `src/modules/runtime/domain/protocol-primitives-v1.ts`, with adjacent tests. Modify `src/modules/runtime/domain/types.ts`, the runtime barrels, and `src/modules/runtime/README.md`. Export canonical parsing and serialization, scalar validators, artifact and trust primitives, generic command identity, and digest helpers. Exclude every lifecycle command/event catalog and every policy-specific trusted value.

## Five Pre-Review Proofs

| Proof | Required evidence | Status |
| --- | --- | --- |
| `closed-contract` | One compiled primitive registry with accepted and rejected boundary fixtures and prose parity | Incomplete |
| `provenance` | Producer and consumer table for artifact and trusted-attestation fields; no caller-created trusted value | Incomplete |
| `state-and-replay` | Not applicable to lifecycle state; prove canonical byte and digest round-trip identity | Incomplete |
| `milestone` | Focused tests import only existing runtime code and files created by U2A1 | Incomplete |
| `scope` | Exclusion ledger rejects lifecycle, review, lease, process, and persistence types | Incomplete |

## Validation and Acceptance

Focused tests must reject duplicate keys, unknown keys, noncanonical bytes, unsafe numbers, invalid UTF-8 and NFC, malformed aliases, over-limit input, alternate digest encoding, and caller-supplied trusted attestations. Accepted fixtures must round-trip byte-for-byte. The final branch must pass `bun run check`.

## Outcomes & Retrospective

No review, approval, implementation, or runtime evidence exists. U2A2 remains blocked.

Split scaffold note (2026-08-18): Created U2A1 as the sole owner of shared protocol representation and identity primitives.
