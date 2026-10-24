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

Read #55 and the runtime; created native issue d7fd196. Eleven Bun stream journeys
pass, including concurrent checks through two SQLite connections and one wake,
restart/acknowledgement, invalid input, and old markers after resumed work. The
Herdr adapter resolves owned labels and scopes activity to its workspace. All
coordination tests pass. Static checks found one test-only const preference; fixed.
Missing owner wake bindings now increment health wake diagnostics while retaining
the durable message, with no repeat prompt on polling. No blocker. Next: local quality run and independent review.
