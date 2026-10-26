# Refill free delivery streams from recorded events

This living plan follows `PLANS.md`. GitHub issue #58 and communicator request
478 assign this second slice under the same lean delivery process as the first
handler: affected checks, the local exact-head reporter and one independent PR
review. The native issue is `0033696e-ad49-42de-aa9e-008637f6a2c7`. The engineer
never merges or activates a shared service.

## Purpose / Big Picture

When an engineer records done or blocked, Mandem should select the next complete
startable issue and call the consumer launcher without a coordinator turn. The
consumer supplies fresh issue facts and existing owner bindings; Mandem validates
registered assignments and derives release from its existing typed stop records.
The consumer never needs project-board permission or an LLM judgment.

## Progress

- [x] (2026-10-25) The engineer read issue #58, RoughPatch #521 including its later
  no-board/no-separate-approval decisions, current runtime, native issues and
  repository instructions; created isolated branch `feat/slot-refill-58` at e5afdf0.
- [x] (2026-10-25) The engineer wrote failing policy, durable-store and runtime/command tests.
- [x] (2026-10-25) The engineer implemented parsed snapshots, deterministic selection,
  SQLite reservations, configured effects and the automatic done/blocked callback.
- [x] (2026-10-25) The engineer ran affected checks, published PR #60 and
  recorded repository-quality success for implementation head 546026f.
- [ ] Finish the documentation-head reporter and independent review handoff.
- [ ] The communicator integrates the PR; the RoughPatch engineer wires its
  consumer in a separate PR and the communicator records live activation/smoke.

## Contract and Decisions

The trusted startup configuration selects one repository, versioned engineer
template and fixed consumer command. No configuration means no refill effects.
The command receives version 1 actions: observe (return a snapshot), launch
(return a fresh session and optional pane ID), or report (confirm `{ok:true}`).
Consumers retain immediate freshness, consent, canonical-launch and spending
guards. Mandem never selects an executable or model from event input.

A snapshot names its repository and UTC observedAt. Each issue records ref
(repository/positive number), stable revision, state, kind, numeric priority,
nonnegative estimate, outcome, scope, acceptance, blocked/userDecision/openPull
booleans and openDependencies. Revision identifies the actual scheduling facts,
including dependency state, never the observation time. Missing/malformed issue
rows produce diagnostics and do not suppress valid rows. Owners record session,
assignment, ref, kind, priority and live state (working/idle/blocked/done/unknown). The consumer supplies all scoped owners;
Mandem retains previous bindings and its own launches until an authoritative stop
or assignment replacement releases them. Owner ambiguity holds dispatch rather
than guessing free capacity.

Mandem verifies owner session/assignment against its registry. It derives release
only from a current generation's done/blocked stop and stop boundary; user input
cannot assert release. A later working observation invalidates that release via
the existing generation mechanism. Decision-needed does not release a stream.
The handler counts both live owners and outstanding reservations, deduplicates
its own registered launches, and rejects uncertain launch replay.

Startable means open, complete required fields, no blocked/user-decision fact,
no open PR and no open dependency. No separate approval marker or board Status
participates. Rank by priority then repository/issue number. Prefer product until
two product streams run, keep at most two platform and four total streams. Red
main requires a dedicated active P0 owner for its exact repair issue; otherwise
select that startable P0 repair first or report the staffing need. Reserved launches
do not prove live staffing. Fresh confirmed launches count until the next
observation; later observations require a working owner. Omitted owners retain
capacity but lose their live staffing evidence. Unknown main
holds starts. Full capacity never authorizes checkpointing or killing another
agent. Repair PR designation remains the next separate slice.

One task ID binds repository, issue identity and stable revision. Repeated events
cannot launch that same revision twice, even after release. Changed dependency
or issue facts may produce a new revision, but an active owner still blocks a
duplicate issue. SQLite reserves before effects under one immediate transaction.
Confirmed launch and engineer registry metadata commit together. Uncertain
launches remain visible and never replay. Stable notice identities deduplicate
malformed-row and empty/product-queue reports, including after restart.

## Context and Orientation

The existing `coordination` module owns typed stops, sessions, SQLite storage,
consumer review effects, HTTP/CLI and server composition. New slot domain files
will own types/parsing/selection; application ports and dispatcher will perform
read/transition/effect operations; infrastructure will own SQLite and the fixed
command adapter. The composition root will connect typed done/blocked stops to
one fresh consumer observation. `POST /slots/check` will also handle issue or
dependency events; `GET /slots` will expose durable state. Neither endpoint starts
a timer. Both server binaries will accept `--slot-config`; the CLI will expose
`slot check` and `slots`.

## Milestones and Concrete Steps

First run `bun install --frozen-lockfile` in this checkout with persistent TMPDIR.
Write failing `slot-policy.test.ts` cases for product refill, narrow malformed-row
handling, empty queue deduplication, P0 staffing and repeat events. Implement the
pure types/parser/reducer with no I/O. Then run that focused Vitest file.

Next implement the SQLite store and dispatcher and run focused Bun tests proving
concurrent reservations, owner release from real stored stops, atomic session
registration, restart and uncertain-effect retention. Wire configured commands,
HTTP/CLI and the stop callback with fake effects and Herdr disabled. Exercise the
real runtime endpoint/stop journey and a separate CLI/config-command journey.

Finally run affected coordination tests, repository static checks and both binary
builds. Publish an ordinary Mandem PR over SSH, run the existing local reporter
for its exact head, and send the head to roughpatch-communicator for the single
independent review. Keep the issue open through consumer adoption.

## Validation and Acceptance

Fake consumers must prove one next complete product issue starts after a real
current done/blocked stop; malformed rows report their missing facts while valid
work starts; empty startable queues report once; concurrent events/restarts never
double-start a revision; stale source or stop evidence cannot free a slot; full
capacity, platform allocation, unknown main and unstaffed P0 hold ordinary work.
Tests must never call live Herdr or a provider. Passing fixture checks do not prove
live activation. The communicator owns the deployed revision and live smoke.

## Idempotence and Recovery

Repeat observations safely; task and notice reservations share durable state.
Never delete or replay incomplete/uncertain reservations. Inspect actual consumer
sessions/receipts before an operator recovery decision. Stop recording commits
before refill; source failures retain the stop and appear in server health.
No code in this slice retires a peer or merges a PR.

## Surprises & Discoveries

RoughPatch #521's later user decisions supersede its original board and approval
marker proposal. Issue facts and labels supply the queue; a complete filed issue
needs no separate approval marker. The first native #58 issue covers review only,
so this separate native issue tracks the next independently deliverable slice.

The engineer caught reserved-as-live P0 staffing and older SQLite observations
replacing newer owner facts. Failing regressions now cover both boundaries.
The first static run caught misplaced file headers; the engineer restored the
required first-line fileoverview and the next check:core passed.

## Decision Log

The engineer will extend the existing coordination module and command-adapter
boundary rather than add another scheduler. A stable issue revision prevents an
unchanged blocked/done issue from immediately hiring another engineer; dependency
changes can explicitly make a new revision startable. Date/actor: 2026-10-25,
review-dispatch-676.

## Outcomes & Retrospective

The engineer implemented the configured default-off handler and verified 11 pure
slot-policy tests, 9 durable-store/dispatcher tests and 4 runtime/CLI tests.
The broader coordination runs passed 148 Vitest tests and 40 Bun tests before the
last staffing regressions; the engineer reran the affected files after those
changes. Repository check:core and both compiled binary builds passed. The exact-head local reporter passed installation, full checks, builds, packaging
and issue validation for implementation head 546026f and published success on
PR #60. This documentation checkpoint requires the reporter for its new head;
independent PR review remains the communicator’s next step. No live
activation or provider call occurred.

Revision note: The engineer created this plan for the coordinator's explicit
second-slice assignment and preserved the user's recorded no-board decisions.
