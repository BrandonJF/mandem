# Stream delivery, issue #55

Brandon authorized the same lean delivery as #51: one short plan, local tests and
repository-quality reporter, one independent review through the communicator,
no hosted CI, paid calls or temporary filesystems. Base: main `ce71dc5`.

## Delivery

- [x] Add typed stops, stream/owner metadata, staffing claims and persistent idle observations.
- [x] Check each stream against asynchronous Herdr activity. Route needs once through
  atomic SQLite message/route writes; reuse existing acknowledgements and advisory wakes.
- [x] Expose JSON CLI commands and prove stop/check/inbox/ack across processes and restart.
- [ ] Run affected tests and local repository quality, publish one PR and request review.
- [ ] After Mandem merges, integrate the RoughPatch watchdog and launch/stop instructions
  in its own worktree/PR. Keep #55 open through intended-workflow adoption.

## Decisions

Use the existing coordination module and SQLite database, with additive tables.
Session registration accepts stream and owner role metadata, and starts an assignment.
`done` carries no open need; `blocked` and `decision-needed` require a one-line need
and waiting owner. Caller-supplied stop IDs make retries idempotent. Old needs remain
until their routed owner acknowledges; a new assignment invalidates old done markers.
User waits route to the unique communicator role; coordinator waits to orchestrator;
`session:NAME` waits to that session; external waits to the stream's owner role.
Missing/ambiguous owners remain diagnostics. No direct user prompt or automatic retry.

`mandem streams` polls and routes; the consumer must poll at least once a minute.
Idle age starts at the first observed idle/done state, persists across restart and
resets when working. A persisted work-episode counter invalidates old stop markers
when observed activity resumes, without discarding open needs. Unknown/missing agents and activity failures remain diagnostics;
claims require a matching live working session. One working session hides no other.
Routing uses one transaction for its deduplication key and durable mailbox message.
Only a newly inserted message triggers the existing advisory wake. A failed wake
keeps the message and diagnostic, with no blind retry.

## Readiness

The communicator owns the consumer and escalation policy. Detection uses the JSON
report, watchdog log, durable mailbox/acknowledgements and service wake diagnostics.
Mandem alone is partial until RoughPatch calls it. Follow TwelveApart/skills#24.

## Progress

Initial PR #56 at `db5a836` passed95 Vitest and17 Bun tests plus local repository
quality. An additional staffing-identity regression passed at `b27b0e3`, which also
passed the local reporter. Independent review found two further episode/retry bugs
and requested stronger boundary types and test placement.

The repair marks every recorded stop as an episode boundary: working observed
afterwards invalidates it, even without a preceding idle observation. Identical
retries compare caller content and assignment first and return the original record.
Both reported sequences failed before repair and now pass.

Stops, waiting owners, roles, activity and findings use explicit unions. Application
ports accept typed values; HTTP, registry, Herdr, SQLite and client adapters parse
unknown values. Stop/delivery storage uses version1, requires stored generation and
rejects unsupported/corrupt records. Parsing replaces casts and non-null assertions.
Tests separate pure domain/application policy, SQLite contracts and five stream
end-to-end journeys. Verified125 affected Vitest tests and18 Bun tests, all static
checks and build locally. Next: publish the repair, run exact-head repository quality
and request fix-delta review.
