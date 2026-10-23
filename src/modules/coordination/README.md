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
