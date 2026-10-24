# Coordination

This module ports Strategy Builder Pro's topic message bus, session registry and TTL
merge lock into Mandem. SQLite stores require Bun 1.3.14 and no database server.
The initial ports and their 27 tests come from its `scripts/agents/coord-service/`
at commit `3b50cb6bf1ff3ac1fba4c19b284efa39876cd3dc`;
Strategy Builder Pro retains its unchanged copy until consumers migrate.

Application ports preserve the existing method and message shapes. Infrastructure
provides SQLite persistence. The API composes adapters for the CLI and local service.

Delivery and operational readiness are tracked in
[issue #51's living plan](../../../docs/coordination-plan-51.md).

## Run

Build with `bun run build`. Run `./dist/mandem serve` in a persistent terminal.
The service binds only to `127.0.0.1:8991`. It stores data in
`$XDG_STATE_HOME/mandem/coordination.sqlite`, defaulting to
`~/.local/state/mandem/coordination.sqlite`. Override with `--db PATH` or
`MANDEM_COORD_DB`. Override the listener with `--port`; clients use `MANDEM_COORD_URL`
or `COORD_SERVICE_PORT`. All clients for one consumer must use the same service.
Stop with SIGINT/SIGTERM; restart with the same database path. Back up the SQLite
database while stopped, including any remaining `-wal` file.

```sh
./dist/mandem session register --session engineer --role engineer
./dist/mandem msg send --topic session:engineer --sender orchestrator --type handoff --subject '#51' --data '{"body":"Implement coordination"}'
./dist/mandem msg inbox --topic session:engineer
./dist/mandem msg ack --id 1 --session engineer
./dist/mandem msg send --topic session:orchestrator --sender engineer --type reply --subject '#51' --data '{"body":"Coordination works"}'
./dist/mandem msg inbox --topic session:orchestrator
```

Use the actual returned message ID for acknowledgements. `--since ID` reads messages
strictly after that ID. Acknowledgements are per logical session; reading a topic
returns acknowledged messages too. Messages and receipts survive service restart.
The initial slice retains messages indefinitely; the owner must monitor disk space.

## Herdr

Start the service inside a Herdr pane to enable pane launch, kill and delivery wakes.
The adapter uses the inherited workspace and parent pane IDs. It splits without
changing focus, labels owned panes `mandem:SESSION`, and rediscovers those labels
after restart. The existing `window` request field remains accepted for compatibility;
all panes stay in the service's inherited workspace and parent tab in this slice.
`fresh: true` replaces an existing owned pane. Only owned labels can be killed.

For an existing agent pane, register with `--pane HERDR_PANE_ID`. A message on
`session:SESSION` wakes that registered pane, or an owned pane with that session label,
through `herdr agent prompt`. Other topics are available through polling and SSE.
No pane is required for durable delivery. The adapter runs the supplied shell command;
Mandem does not select or call a model provider. Adapter tests use a fake Herdr.

## Operation and verification

The RoughPatch orchestrator owns startup, maintenance and eventual retirement. During
each orchestration cycle, run `./dist/mandem health`, inspect inbox activity and free
disk space, and compare `wakeFailures` with the preceding cycle. HTTP or CLI failures,
an increased wake-failure count, or missing expected inbox activity require an error
report through `herdr agent prompt roughpatch-communicator "<observed failure>"`.
The owner decides whether to retry delivery or restart the service. A failed wake
keeps the message in SQLite; poll and acknowledge it after resolving the failure.

`bun run test:coordination` runs ported behavior tests, fake-Herdr tests, SQLite tests
and the separate-process CLI journey, including restart and failed delivery checks.
SQLite and socket tests run under Bun, while the existing tests run under Vitest.
No provider or database server is used. No hosted CI is used; repository quality
checks are manual and self-hosted. No self-hosted workflow is dispatched by this work.

Public HTTP routes retain the source shapes: `/messages`, `/messages/:id/ack`,
`/messages/stream`, `/topics`, `/sessions/register`, `/sessions`, `/merge-lock`,
`/merge-lock/acquire`, `/merge-lock/release`, `/panes`, `/panes/launch`, `/panes/kill`
and `/health`. The root module exports the existing messaging, session and lock
client functions. GitHub queue and atomic-ID routes are deferred.


## Stream stops and owner routing

Issue #55 adds typed stops and deterministic stream checks. Register one unique
`communicator` and `orchestrator` role with their existing Herdr pane IDs. Register
engineers with the live Herdr agent name as their session ID (or the owned
`mandem:SESSION` label), `--stream` and the accountable `--owner-role` (default `orchestrator`).
Every registration with a stream starts a new assignment. Continue using one shared
service URL and database. Example commands use fixture identities:

```sh
mandem session register --session comm --role communicator --pane w1:p2
mandem session register --session orch --role orchestrator --pane w1:p3
mandem session register --session engineer --role engineer --pane w1:p4 --stream issue:55 --owner-role orchestrator
mandem stream claim --stream issue:55 --session engineer
mandem session stop --id engineer-55-approval --session engineer --kind decision-needed --waiting-on user --need 'Approve the dependency'
mandem streams --idle-minutes 3
mandem msg inbox --topic session:comm
mandem msg ack --id RETURNED_MESSAGE_ID --session comm
mandem stream release --stream issue:55
```

A stop uses `done`, `blocked` or `decision-needed`. Use `done` with no need or
waiting owner. Other kinds require a single-line need and `--waiting-on`:
`user` routes to the unique communicator role, `coordinator` to orchestrator,
`session:NAME` to that registered session, and `external` to the stream's owner role.
Mandem never prompts the user directly. Stop IDs are globally unique caller keys;
repeat the same ID/content to recover an uncertain response, and use a new ID for
a later stop. A true retry returns the original record even after work resumes;
it does not renew the old marker. Conflicting reuse fails. Two simultaneous needs require two records.

`mandem streams` returns JSON and performs a check and once-only routing. Its
`stalled` array reports idle/done sessions without a current stop past the threshold;
`needs` lists stops pending their routed owner's acknowledgement; `claims` reports
staffing mismatches, including another named agent occupying the bound pane; `diagnostics` exposes missing/ambiguous owners, unavailable
Herdr and unrecognized/missing activity. One working agent hides no other stream.
The first observed idle/done state starts the timer; SQLite retains it across restart.
A recorded stop marks an episode boundary. Any subsequent working observation,
including the first observation, resets the timer and invalidates earlier markers. A new assignment also invalidates old markers. Open needs
remain until their original routed owner acknowledges, even if the engineer resumes.
A stalled finding remains visible until a typed stop or resumed work explains it.
Reading is not acknowledgement, and another session's ack does not clear the need.

The consumer must run the command at least once a minute, log the report, and report
command failures or diagnostics to the communicator immediately. Stop recording alone
persists the need; the next check routes it. The check does not create a timer process.
Mailbox insertion and the deduplication key share one SQLite transaction, so concurrent
polls/restarts do not duplicate owner messages. Only the first insert attempts the
existing advisory Herdr wake; failures retain the mailbox message and increment health
wake diagnostics. The operator checks outstanding needs and decides recovery; Mandem
never retries a prompt blindly. A crash after commit can precede the advisory wake;
the durable pending need remains in subsequent reports for recovery.

The communicator owns stream policy, role registration and watchdog diagnostics.
This runtime is partial until the separate RoughPatch watchdog/launch PR consumes it.
Do not switch live peers here. No hosted CI, provider calls or new database server
support this slice. All state shares the existing SQLite backup and disk monitoring.
Stop and delivery persistence uses version 1 with a required stored generation.
Readers parse the complete shape and fail visibly on unsupported versions or corrupt
records. Unknown Herdr states remain explicit values with their original state name.
Report findings distinguish `source: stop` from `source: idle` and `delivery: unresolved`
from `delivery: routed`; routed owner, message ID and acknowledgement always appear
together. Domain tests cover values and unions, application tests cover policy through
typed ports, SQLite contracts cover persistence, and five stream journeys cover wiring.

New HTTP commands: `POST /sessions/stop`, `/streams/check` and `/streams/claim`.

## Review dispatch

Issue #58 adds review decisions over consumer observations. Review effects are
**disabled by default**. This slice is partial until a separate RoughPatch PR
supplies and adopts its adapters. It does not change the running service or launch
a provider. The communicator owns template selection, adoption and recovery.

An operator can pass `serve --review-config /persistent/review-consumer.json` to
both server binaries. The trusted file is loaded at startup:

```json
{
  "version": 1,
  "templates": {
    "full": { "name": "independent-review", "revision": "v1" },
    "delta": { "name": "reconciliation-review", "revision": "v1" }
  },
  "command": ["bun", "/persistent/consumer/review-effects.ts"]
}
```

The command receives one JSON document on stdin, `{ "version": 1, "action": ... }`.
A `launch` action carries a task: immutable PR head/base, effective patch artifact
and SHA-256, template name/revision, and full or delta mode. A delta includes the
prior review result and a separate immutable reconciliation artifact. The consumer
must launch a fresh independent session and return JSON
`{ "session": "reviewer-name", "paneId": "w1:p2" }`; paneId is optional. Mandem
records that session with role `reviewer` atomically with the confirmed run. It
rejects author/reviewer equality and reuse of another task's registered session.
A reviewer can submit its result before the launcher returns: Mandem retains it
but waits for confirmation of the matching session before scheduling follow-up.

A `readiness` action carries the task, current target, CLEAN result and effect ID.
A `findings` action also carries the FIX-NOW findings and current author recipient.
Both commands return `{ "ok": true }` only after completing their action. Commands
must recheck live authorization, eligibility and exact current PR facts immediately
before effects, preserve consumer live/shadow policy, verify artifact bytes against
their digests and retain their own action receipts. The configured executable never
comes from an HTTP request. Output is bounded to 64 KiB; the command deadline is
90 seconds. Publication IDs bind the PR head, effective patch ID, target base
name/SHA and operation. Eligibility changes retain the same reservation and receipt
ID. A timeout, failed command or invalid response becomes a durable uncertainty
diagnostic, including after held/eligible observations or restart. Mandem never launches or publishes it again automatically.

Send versioned events with `mandem review event --data JSON` or
`POST /reviews/events`. Each document contains `version: 1`, `ref` (repository and
positive PR number), and one event:

- `observe` carries `observation`: the target fields above, authorSession,
  eligibility (`eligible` or `held` with reason), activeReviewHeads, mergeRef
  (`null` or SHA and parent SHAs), and delta (`null` or fromPatchId and artifact).
  The consumer computes the stable patch ID from `git diff BASE...HEAD` piped to
  `git patch-id --stable`; it retains the patch and supplies current GitHub facts.
- `result` carries runId, the recorded reviewer session, and result. A result has
  verdict `CLEAN` or `FIX-NOW`, an artifact reference and SHA-256, and findings only
  for FIX-NOW. Repeated identical results are safe; conflicting results fail.
- `adopt` imports an existing completed task, session and result before observation.
  Consumer observations must list externally running review heads to hold duplicate
  launches. Imported delta coverage requires its recorded baseline first.

A new head receives a fresh full review. Reopen/retarget with the same head reuses
coverage only for an equal effective stable patch ID. A different patch requires
one delta reviewer, after its baseline completes; it never triggers another full
review for that head. CLEAN waits until the observed GitHub merge ref names the
current base and head as parents. SQLite retains `waiting-for-merge-ref` across
restart. The consumer sends a later observation when that ref changes; Mandem
runs no polling or retry loop. FIX-NOW routes findings to the author session.

Inspect `mandem reviews`, optionally with `--repository OWNER/REPO --number N`, or
`GET /reviews`. The consumer must inspect results after every submitted event and
report diagnostics, stranded reservations, missing delta artifacts or unexpected
waiting states to the communicator immediately. A crash after reservation can
precede its effect; reservations intentionally remain pending. For uncertain launch,
inspect the actual reviewer and adopt its verified result. For uncertain readiness
or findings, inspect consumer receipts and report the result to the communicator;
this slice provides no automatic replay or reset command. Unreadable stored versions
fail visibly. Review state shares the existing SQLite backup and disk monitoring.

Pure policy tests cover head/patch coverage and merge-ref decisions; SQLite contracts
cover concurrent reservations and session registration; application and separate
CLI/command journeys cover waits, findings and uncertain outcomes. All fixtures run
locally with no provider calls. Slot filling, repair designation and board projection
remain later slices of #58.
