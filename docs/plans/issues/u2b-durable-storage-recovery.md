---
title: "Persist and recover Mandem work state - Plan"
type: feat
date: 2026-08-04
artifact_contract: ce-unified-plan/v1
artifact_readiness: draft
product_contract_source: mandem-epic
execution: code
plan_kind: mandem-issue-execplan
issue_key: U2B
parent: ../2026-07-21-001-feat-mandem-plan.md
epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253
issue_id: 5abb076c-c5ba-41da-aeab-089664360dbb
depends_on_issue_ids:
  - cb67d131-975c-4d97-9a6f-4934be991ac6
promotion: scaffolded
execution_authorized: false
---

# Persist and recover Mandem work state

This ExecPlan is a living document governed by `PLANS.md`. Keep `Progress`, `Surprises &
Discoveries`, `Decision Log`, and `Outcomes & Retrospective` current as planning and work proceed.

This is a non-executable planning scaffold. U2B planning starts only after U2A1 through U2A5 merge,
U2A5 publishes the complete storage handoff, and the U2A coordination issue closes.

## Purpose / Big Picture

U2B makes Mandem remember accepted work after a crash or restart. After U2B, retrying a request
cannot repeat its effect, an interrupted Git write can resume safely, and Mandem can rebuild the
current issue state after deleting its disposable summaries.

U2B does not decide whether work is allowed. U2A owns those rules. U2B stores the requests, results,
events, agent-control facts, reviews, approvals, gates, findings, and checkpoints that U2A defines.

## Operator-visible behaviors

1. A lost response followed by the same request returns the original result without repeating work.
2. A request reused with different content is rejected without changing stored work.
3. An interrupted required Git write resumes once or reports an exact conflict.
4. Deleting disposable summaries and restarting rebuilds the same current state and next action.
5. A failed database upgrade restores the prior usable database.

## Behavior Readiness Check

Before clean-room review, replace every `Blocked by U2A` or `Needs design` entry with `Ready` and
cite the exact section, public interface, storage operation, recovery rule, and test.

| Behavior | Required plan evidence | Status |
| --- | --- | --- |
| Return the original result | U2A request identity plus one atomic receipt, event, state, and result write | Blocked by U2A |
| Reject changed retry content | Stored request digest and no-change conflict path | Blocked by U2A |
| Resume a Git checkpoint | Exact bytes, deterministic destination, observe-before-write, and read-back proof | Needs design |
| Rebuild current state | Complete U2A events, ordered replay, disposable summaries, and immutable comparison value | Blocked by U2A |
| Recover a failed upgrade | Exclusive migration lock, verified backup, restore, and reopen proof | Needs design |
| Supply later runtime code | Complete event-store and checkpoint interfaces without lifecycle decisions | Blocked by U2A |

## Scope boundary

U2B owns the project-local SQLite database, duplicate-request receipts, ordered event storage,
disposable summaries, pending Git checkpoints, schema migrations, verified backups, and restart
reconstruction. It does not add new work phases, commands, review rules, approval rules, or agent
control decisions.

U3 consumes U2B to run a persistent server. U4 supplies the real git-native issue and GitHub
checkpoint adapters. Until U4 exists, U2B proves the checkpoint contract with deterministic fakes
and disposable Git repositories.

## Plan of Work

Planning must start from U2A's approved public values. It must define one atomic database operation
for a first request, one exact retry lookup, one pending checkpoint operation, one replay operation,
and one safe migration operation. Every stored column must come from a U2A value or a U2B storage
fact; the plan may not invent lifecycle meaning.

## Concrete Steps

This section remains incomplete. Before review, it must name the SQLite schema, files, public ports,
transaction order, migration order, failing tests, Bun commands, and expected passing results.
Implementation must use Bun's built-in SQLite support and real temporary database tests.

## Validation and Acceptance

Acceptance requires real temporary-file tests for duplicate delivery, changed retry content,
concurrent requests, interrupted checkpoints, event-only rebuild, database reopen, backup, failed
migration, and restore. The final implementation commit must pass `bun run check`.

## Idempotence and Recovery

Every write must be safe to retry after the process stops at any documented boundary. Tests must
preserve failed database and backup files until assertions finish. No recovery path may delete the
database or skip a malformed event to make startup succeed.

## Progress

- [x] (2026-08-04) Created U2B by splitting durable storage and restart recovery from U2A.
- [ ] Wait for U2A1 through U2A5 and the closed U2A coordination issue.
- [ ] Complete all six readiness rows and exact execution instructions.
- [ ] Obtain a clean review and exact operator approval before implementation.

## Surprises & Discoveries

- Observation: The former combined plan repeatedly changed storage instructions while reviewers
  found missing work-control facts.
  Evidence: The thirteen U2 reviewer outputs on PR #37.

## Decision Log

- Decision: Make U2B depend on the completed U2A subissue-contract sequence.
  Rationale: Storage can preserve and replay decisions, but it must not invent what requests or
  lifecycle changes mean.
  Date/Author: 2026-08-04 / Brandon and Codex

## Outcomes & Retrospective

U2B now has its own issue and non-executable planning scaffold. Planning is blocked by U2A's public
contracts. No review, approval, implementation, or runtime evidence exists.

## Artifacts and Notes

The former combined plan is recoverable from Git at commit
`2b53f63257744cf6ec67962a8bc92282787b1057`. Its reviewer findings are design evidence, not approval
of this new plan.

## Interfaces and Dependencies

U2B depends on completed U2A coordination and consumes only U2A5's public event, result, and snapshot
handoff. U2B will produce the event-store, checkpoint, replay, migration, and backup implementations
that U3 uses. Exact interfaces remain planning work.

Split-scope revision note (2026-08-04): Created U2B as the separate durable-storage and
restart-recovery issue from the former combined U2 plan. This scaffold remains unauthorized and is
not ready for clean-room review.
