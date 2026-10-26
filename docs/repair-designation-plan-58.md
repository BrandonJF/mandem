# Designate the exact P0 repair while main is red

This living ExecPlan follows `PLANS.md` under GitHub #58's explicit lean delivery
exception: affected tests, the exact-head local reporter and one independent PR
review through roughpatch-communicator. The coordinator assigned this third slice
in inbox message 478. Native issue c3df4c8 tracks implementation. The engineer
never merges, changes a shared service or calls a provider.

## Purpose / Big Picture

Mandem should designate the oldest ready PR linked to the open P0 issue without
an orchestrator choosing it. The consumer supplies current exact-main, P0 and PR
facts. Mandem makes a pure choice, reserves its effect in SQLite and calls the
consumer's guarded policy writer. RoughPatch adopts that contract separately.

## Progress

- [x] (2026-10-25) The engineer read #58, RoughPatch #676 and the existing exact
  failing-main repair guard; created feat/repair-designation-58 and native issue.
- [x] (2026-10-25) The engineer wrote failing pure choice, persistence/concurrency
  and HTTP/CLI tests, then made all 14 focused tests pass.
- [x] (2026-10-25) The engineer implemented default-off observation, reducer,
  SQLite store, command effects and HTTP/CLI.
- [x] (2026-10-25) check:core, 157 coordination Vitest tests, 49 coordination Bun
  tests and both compiled binary builds passed.
- [ ] Publish one PR, record its exact-head local quality result and hand off.
- [ ] The communicator reviews/integrates; RoughPatch supplies its consumer and
  the operator records activation/live smoke before either parent issue closes.

## Contract and Decisions

Trusted startup config version 1 names a repository and fixed command array.
Without it, repair effects stay off. The shared bounded JSON command transport
sends observe or apply actions. No request selects executables or supplies live
facts. The consumer returns repository, UTC observedAt, main state/head, one
recorded P0 issue (ref, open/closed, priority) or null, and PR rows. Each PR records
ref/head, createdAt, open, draft, ready, base and linked issue refs. Readiness must
come from the consumer's canonical exact-head source-review/lightweight-check
policy; Mandem never grants readiness or broadens merge authorization.

For red main and an open priority-0 issue, choose the oldest open non-draft ready
same-repository PR targeting main and linked to that issue. Break equal creation
times by PR number. Bind the target to repository, exact failing main head, issue,
PR number and exact PR head. Green/unknown main, closed/missing/non-P0 issue or no
candidate produces a null target, which asks the consumer to clear designation.
Reject malformed or duplicate PR rows rather than select through ambiguous facts.
Reject source snapshots older than five minutes, future snapshots and wrong repos.
Ignore observations older than the durable observation before mutating state.

SQLite reserves each target transition before effects. Only one effect per
repository can run. An observation can replace the desired target while an older
effect runs, but the reducer waits for that effect to finish before reserving the
latest correction. Repeated identical facts never republish. A completed target
can change away and back through new effects. Uncertain effects retain their
reservation and hold later writes; an operator must inspect actual policy state
before recovery. Shutdown drains outstanding calls. GET /repairs exposes state;
POST /repairs/check and `repair check` consume fresh facts; `repairs` reads state.
No timer or new merge writer belongs to this slice.

An apply action includes a unique durable ID, source observation and nullable
target. Immediately before its atomic policy write, the consumer must recheck
current main/issue/PR/head and readiness against that action, reject changed
facts, preserve unrelated policy, and persist a receipt. It must clear obsolete
authority before considering any candidate. The existing merge helper still
checks current main and PR/head before each merge; designation never authorizes
an ordinary merge while main is red. Consumer guards preserve spending/consent.

## Context and Orientation

The existing coordination module owns configured review and slot dispatch,
SQLite, HTTP and CLI composition. Extend it with repair domain types, strict
parsers and a pure reducer; application ports/dispatcher; SQLite and command
adapters. Reuse its fixed consumer-command transport. The prepared branch
includes slot PR #60 so both handlers share that transport; publish after the
communicator integrates that dependency, or clearly retain the stack boundary.

## Milestones and Concrete Steps

Install frozen dependencies with persistent TMPDIR. Add failing policy tests for
oldest-ready linkage, exact heads, green/unknown clearing, head changes, repeat
observations, in-flight updates and uncertain effects. Implement the pure policy
and parsers. Add Bun SQLite/dispatcher tests for concurrent connections, restart,
stale observations and no-replay. Wire configuration, HTTP/CLI and test both the
actual local HTTP endpoint and separate fixed-command CLI with Herdr disabled.
Run affected coordination tests, check:core and both binary builds. Commit only
owned files, push over SSH, open one PR, run `bun run ci:local -- PR HEAD` and send
the exact head to the communicator for the single independent review.

## Validation and Acceptance

Tests must demonstrate the exact failing-main/PR/head tuple, oldest ready PR
selection, deterministic ties, invalid candidate rejection, current P0 linkage,
clearing after readiness/head/main/issue changes, concurrency, durable once-only
writes and uncertain-effect retention. Fixtures never call live Herdr/providers.
RoughPatch wiring and operator smoke remain separate required acceptance; local
fixtures never claim activation.

## Idempotence and Recovery

Repeat observations safely. Never delete or replay a reserved/uncertain effect.
Inspect durable repairs and consumer receipts before an operator recovery. Stop
new effects by omitting --repair-config; preserve existing policy and SQLite.
No handler kills peers, clears inbox messages or merges PRs.

## Surprises & Discoveries

The existing RoughPatch guard already binds repair authority to exact main and
PR/head. This slice automates designation, not the broader scoped-red proposal
in RoughPatch #535. Slot PR #60 remains the transport dependency. The first
check:core caught the missing local README link for this plan; the engineer added
the link and the next run passed. The engineer creates new test scratch only in
the persistent private state directory; the sandbox rejected an earlier command
that did not make that boundary explicit.

## Decision Log

The engineer chose one nullable exact target and serialized durable effects
rather than another merge queue. A fresh snapshot supplies one explicit P0 issue;
Mandem never guesses which incident owns a red. Actor/date: review-dispatch-676,
2026-10-25.

## Outcomes & Retrospective

The handler now chooses the exact oldest-ready linked P0 repair and clears
obsolete authority through serialized durable effects. All 14 focused tests,
157 affected Vitest tests, 49 affected Bun tests, static checks and both builds
passed. Publication, exact-head local quality and independent review follow.
The communicator owns dependency integration, deployment and live verification.
