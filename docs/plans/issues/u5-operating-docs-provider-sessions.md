---
title: "U5: Operating docs and bounded Claude/Codex sessions"
plan_kind: mandem-issue-execplan
issue_key: U5
parent: ../2026-07-21-001-feat-mandem-plan.md
epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253
issue_id: cf239716-00e2-46ae-82e7-84ac8f31baaf
depends_on_issue_ids:
  - 11538b56-bd63-42c2-8242-87ac7a76d35d
  - d946e066-84d5-4651-b3b4-30a18e80008c
promotion: scaffolded
execution_authorized: false
---

# U5: Operating docs and bounded Claude/Codex sessions

> This is a dependency scaffold, not an executable plan. Before implementation dispatch, the
> plan author must expand it, obtain a clean-room review, and obtain operator approval.

## Purpose

Expand this scaffold into a self-contained U5 issue ExecPlan that incorporates every applicable
epic constraint. Use the epic ExecPlan to sequence work; do not treat it as a worker's
implementation instruction.

## Dependency Contract

**Depends on:** U3, U4

### Consumes

- U4 canonical CLI and plan/issue primitives
- U3 resident host process execution
- Approved issue ExecPlan containing the applicable epic contracts

### Produces

- Composable operating-doc compiler
- Deterministic AGENTS.md and CLAUDE.md adapters
- Claude and Codex capability adapters
- Typed contracts for launching and handing off phase sessions
- Evidence of provider conformance and prompt provenance
- Provider-neutral operating guidance that requires process-finding capture and scoped disposition before phase handoff

### Downstream Consumers

- U6 worker/reviewer/Learn sessions
- U7 agent-surface parity
- U8 SBP generated instructions
- U9 live provider matrix

## Architecture Constraint

Authors must place all source code added for this issue in Mandem's Nucleus-derived clean
architecture. The detailed plan must identify module ownership, layer placement, public API
boundaries, composition roots, and deterministic architecture checks for each behavior implemented
by the issue.

## Decisions Required Before Promotion

- Prompt composition metadata and budgets
- Provider capability/fallback matrix
- Remote-control exposure
- Session interruption and accepted-handoff semantics
- Process-finding instructions, structured handoff fields, and protection against provider-specific omission
- Clean-room reviewer role compilation from the current bound `PLANS.md` rather than copied or provider-specific checklist text
- Let each provider write only the manifest's output file and return its exact digest without relying on terminal text
- Fresh reviewer sessions without the author conversation, prompts that require counterexamples, and records of which provider and model ran

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
- test scenarios proving Claude and Codex receive the same process-feedback rule and cannot submit
  a phase handoff that omits an observed unresolved process finding;
- Progress, Surprises, Decision Log, and Outcomes sections that the team maintains throughout the
  work.

## Promotion Checklist

- [ ] Expanded using the current repository and complete epic ExecPlan
- [ ] Dependency outputs exist or all provisional assumptions are explicit
- [ ] The plan names module boundaries that conform to the architecture standard
- [ ] Test scenarios cover success, edge, failure, and integration paths as applicable
- [ ] Compiled prompts and typed handoffs preserve stable process findings and dispositions across
  fresh provider sessions without requiring transcript access
- [ ] Reviewer sessions can write only the manifest-bound output file and return its digest; the
  complete review never depends on terminal text or text copied by the orchestrator
- [ ] Reviewer prompts omit the authoring conversation, require active challenge and counterexamples,
  and name every author, reviser, reviewer, provider, and model involved
- [ ] A clean-room reviewer approved the current revision
- [ ] The plan author addressed review findings, and reviewers re-reviewed the revision
- [ ] Operator approved the exact reviewed revision
- [ ] Set `execution_authorized` to `true` only after the operator approves the exact reviewed
  revision

## Dependency Revalidation

When a dependency completes or its producer changes a consumed artifact, the plan author must
compare the output with this plan's assumptions. If it materially differs, the plan author must set
`promotion` to `planned` and obtain a refreshed review before execution.
