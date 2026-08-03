---
title: "U4: Issues, ExecPlans, queue, gates, primitive CLI, and projections"
plan_kind: mandem-issue-execplan
issue_key: U4
parent: ../2026-07-21-001-feat-mandem-plan.md
epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253
issue_id: 11538b56-bd63-42c2-8242-87ac7a76d35d
depends_on_issue_ids:
  - cb67d131-975c-4d97-9a6f-4934be991ac6
  - d946e066-84d5-4651-b3b4-30a18e80008c
promotion: scaffolded
execution_authorized: false
---

# U4: Issues, ExecPlans, queue, gates, primitive CLI, and projections

> This is a dependency scaffold, not an executable plan. Before implementation dispatch, the
> plan author must expand it, obtain a clean-room review, and obtain operator approval.

## Purpose

Expand this scaffold into a self-contained U4 issue ExecPlan that incorporates every applicable
epic constraint. Use the epic ExecPlan to sequence work; do not treat it as a worker's
implementation instruction.

## Dependency Contract

**Depends on:** U2, U3

### Consumes

- U2 lifecycle, approval, event, and lease contracts
- U3 resident host capability path
- git-native-issue v1.3.3 external executable

### Produces

- Git-native issue adapter
- issue ExecPlan validation and promotion workflow
- Services for queue and dependency management and clean-room review
- Process-finding capture, deduplication, scope classification, contract links, and phase-completion checks
- Approvals bound to hashes and typed gates
- Minimal AXI CLI and TOON envelopes
- GitHub projection and workflow for Mandem reports

### Downstream Consumers

- U5 skills and bounded sessions
- U6 autonomous execution
- U7 complete CLI/TUI
- U8 SBP migration aliases

## Architecture Constraint

Authors must place all source code added for this issue in Mandem's Nucleus-derived clean
architecture. The detailed plan must identify module ownership, layer placement, public API
boundaries, composition roots, and deterministic architecture checks for each behavior implemented
by the issue.

## Decisions Required Before Promotion

- Canonical issue/plan mapping
- Plan promotion and invalidation rules
- Review-manifest binding, complete `PLANS.md` conformance evidence, and dual-input verdict freshness
- Reviewer-output path capability, exact-byte preservation, write-set validation, and derived-synthesis provenance
- Queue mutation and dependency failure behavior
- GitHub conflict/import policy
- Report publication boundary
- Process-finding identity, evidence, disposition validation, and product-contract propagation

## Required issue ExecPlan Content

Before setting `promotion` to `planned`, the plan author must produce a nearly self-contained
ExecPlan that includes:

- goal capsule and traced epic requirements;
- current repository state and the patterns the plan author inspected;
- concrete technical decisions and rejected alternatives;
- repo-relative files and module/layer ownership;
- test-first scenarios with expected red and green evidence;
- failure, restart, idempotency, and rollback behavior where applicable;
- exact consumed artifact versions and produced handoff artifacts;
- verification contract and definition of done;
- test scenarios proving operator corrections and other process discrepancies create one stable
  finding, require a terminal disposition, and link every required issue, epic, operating-contract,
  or enforcement repair;
- test scenarios proving review dispatch binds exact plan and `PLANS.md` commits and digests,
  requires complete governing-contract conformance before supplemental lenses, and invalidates the
  verdict when either input changes;
- test scenarios proving terminal-only results and out-of-path writes are rejected, exact reviewer
  bytes are committed unchanged, and derived synthesis records source path, digest, and
  transformation without replacing the original;
- Progress, Surprises, Decision Log, and Outcomes sections that the team maintains throughout the
  work.

## Promotion Checklist

- [ ] Expanded using the current repository and complete epic ExecPlan
- [ ] Dependency outputs exist or all provisional assumptions are explicit
- [ ] The plan names module boundaries that conform to the architecture standard
- [ ] Test scenarios cover success, edge, failure, and integration paths as applicable
- [ ] Process findings cannot be lost, duplicated, or left unresolved at phase completion; a
  product-contract gap updates the epic and affected issue contracts or creates linked enforcement
  work
- [ ] A clean-room reviewer approved the current revision
- [ ] The plan author addressed review findings, and reviewers re-reviewed the revision
- [ ] Operator approved the exact reviewed revision
- [ ] Set `execution_authorized` to `true` only after the operator approves the exact reviewed
  revision

## Dependency Revalidation

When a dependency completes or its producer changes a consumed artifact, the plan author must
compare the output with this plan's assumptions. If it materially differs, the plan author must set
`promotion` to `planned` and obtain a refreshed review before execution.
