# Review dispatch (issue #58)

The user authorized the first deterministic handler slice under the same lean
exception as #51/#55. Keep this one living plan, use affected tests and the local
repository-quality reporter, and send one independent review through the
communicator. Never use hosted Mandem CI, paid calls or temporary filesystems.

## Contract and decisions

- Consume trusted, parsed PR observations from the consumer: repository/number,
  head, base ref/SHA, effective stable patch ID and immutable patch artifact,
  author session, eligibility, active reviewer heads and observed merge-ref parents.
- Keep decisions pure. SQLite records current observations, exact-patch review
  runs and follow-up effects before the consumer executes anything. Launch/readiness/
  findings adapters remain repository-neutral, explicitly configured and disabled
  by default. Consumer adapters retain their authorization and live/shadow gates.
- Launch at most one full reviewer per PR head. Repeated events and concurrent
  connections share the same reservation. Record the returned fresh session in
  the existing session registry. Never confuse the author and reviewer identity.
- The communicator approved a same-head refinement: reuse coverage only when
  stable patch IDs match. A changed effective patch gets one delta reviewer, bound
  to the prior review/patch and a consumer-produced immutable delta artifact.
  Wait for any existing review before choosing its delta baseline. A new head
  gets a new full review. Existing consumer review records can seed coverage;
  an externally running reviewer holds new dispatch rather than duplicating it.
- CLEAN schedules the consumer readiness action. FIX-NOW schedules findings to
  the recorded author session. Preserve the review artifact and digest. Stale
  results remain recorded but cannot grant readiness to another patch/context.
- Before readiness, require the observed merge ref to contain the current base
  and head as parents. Persist waiting-for-merge-ref; a later changed observation
  releases it. No timer or retry loop runs inside the handler.
- Reserve effects transactionally before execution. Uncertain launch or
  publication stays visible as a durable diagnostic; never blindly replay it.
  Consumer commands must revalidate current PR identity immediately before effects.
- Parse unknown input and versioned persisted shapes at HTTP/store boundaries.
  Use discriminated unions, application ports and strict TypeScript without casts
  or non-null assertions in the new path.

## Delivery

- [x] Read #58 and current runtime; create persistent feat/review-dispatch-58 from
  Mandem main 674e99e. Native issue 0139fb9a-e136-4e94-8ed8-11efd0d1251d.
- [x] Pause for the #598 live round trip, verify owner receipts and resume. The
  communicator accepted #598; JSON observation follow-up belongs to RoughPatch #605.
- [x] Write failing pure decision, SQLite contract and few end-to-end regressions.
- [x] Implement the handler, durable store, typed consumer effect boundary and
  runtime entrypoint; prove full review, same-patch reuse, delta, merge-ref wait,
  findings routing, concurrent/restart deduplication and uncertain effects.
- [ ] Run affected checks, publish a small PR, run exact-head local reporter and
  send the head to the communicator for independent review. Never merge it.
- [ ] After Mandem integration, wire RoughPatch in a separate PR. Keep #58 open
  through intended workflow adoption; later slot/repair/board slices remain outside
  this first handler.

## Current result

Implemented the parsed domain policy, SQLite reservations/session registration,
consumer effect ports and opt-in command/HTTP/CLI adapters. Domain/store/runtime
checks passed: 140 coordination Vitest tests, 27 Bun tests, repository static
checks and both binary builds. PR publication and exact-head local reporting are next. Merge-ref waiting
survives reopening SQLite. Early reviewer results wait for launcher confirmation.
Equivalent observations preserve effect identity regardless of object key order.
No live runtime or provider configuration changed. The communicator owns integration
and adoption.
