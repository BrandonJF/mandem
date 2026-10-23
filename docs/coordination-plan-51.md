# Coordination service, issue #51

Brandon authorized RoughPatch lean delivery on 2026-10-23: one short living plan,
local affected tests, proportionate review, no sequential U-slice gates or clean-room
plan review. This records that exception without changing Mandem's general contract.

## Delivery

- [x] PR 1 code: preserve Strategy Builder Pro's message, session and merge-lock ports and
  store tests; add durable SQLite adapters and restart/contention tests.
- [x] PR 2 code: preserve the message/session/lock routes and client interfaces; compose a
  loopback service, Herdr pane launch/kill/wake adapter and minimal CLI. Prove
  send, receive, ack and reply through separate CLI processes and SQLite restart.
- [ ] Review once, repair findings, run affected tests, typecheck, lint, architecture
  check and build locally. Push through SSH and open PRs through gh. Never merge.
- [ ] After Mandem evidence, change RoughPatch's inbox in its own worktree and PR,
  following that repository's AGENTS.md. Keep #51 open until that integration runs.

Use Bun's SQLite support, WAL and atomic statements; no database server or new runtime
dependencies. Keep Strategy Builder Pro read-only. Defer ID allocation, GitHub queue,
provider launch and watchdog automation. Commands must fail visibly on delivery errors.
Herdr wakes are advisory: persist first, retain the message if the wake fails.

## Progress and decisions

- Read GitHub #51 and TwelveApart/skills#24; created native issue c05fc1a.
- Source ports already separate messages, sessions and locks. Preserve that boundary.
- PR #45 and the abandoned runtime worktree are unrelated and remain untouched.
- Existing PR CI uses GitHub-hosted runners. Replace it with manual self-hosted
  execution before opening these PRs. No workflow runs are dispatched here.
- Store verification: 27 imported tests and two SQLite tests pass; typecheck and lint
  pass. SQLite tests reopen a real file and contend through separate connections.
- Upstream's message port documented optional timestamps but required them in its
  type. Made the timestamp optional to match existing behavior and imported tests.
- PR 1: [#52](https://github.com/BrandonJF/mandem/pull/52), commit `3a6a811`.
  GitHub reports no workflow runs or checks for its branch.
- Runtime verification: 87 route/store/queue/adapter tests passed, plus the separate
  CLI journey, HTTP failure and failed-wake checks. The service retained receipts
  after restart. Build, lint, typecheck, architecture and documentation checks passed.
- Herdr labels provide pane discovery after restart; the compatibility `window`
  field does not create tabs. Wakes use registered pane IDs or owned session labels.
- Requests for a failed send/ack/register now reject HTTP errors instead of silently
  claiming success, repairing a source-client behavior that would hide inbox failures.
- Independent review found #52 clean at `3a6a811`. Review of #53 at `6c19455`
  reproduced a send timeout when synchronous Herdr wakes blocked the event loop.
  The repair schedules wakes after the response and uses asynchronous child processes
  for both wake and label discovery. A four-second fake-Herdr test reproduces the
  original failure and checks send receipts and concurrent health/inbox/lock requests.
- Optional Herdr session enrichment now logs an error and returns the stored records
  when pane discovery fails. A focused regression test covers the review's backlog item.
- RoughPatch consumer issue [#533](https://github.com/BrandonJF/roughpatch/issues/533)
  uses persistent worktree `~/.herdr/worktrees/job-match-workbench/mandem-inbox-533`.
  RoughPatch CI remains unchanged: its hosted lightweight PR checks are permitted;
  only Mandem uses the no-hosted-CI exception. Live peers retain their current inbox
  until the operator coordinates adoption at a stopped boundary.

## Readiness

Integration: RoughPatch's inbox must invoke Mandem; publishing the CLI alone is partial.
Owner: RoughPatch orchestrator, with review and merge by Brandon or his delegate.
Detection: service/CLI errors and wake failures reach the communicator; the inbox
consumer must report delivery failures and retain retryable work. Check health and
expected inbox activity during each orchestration cycle. Record verified commands and
PR links here before handoff. No issue closure until those conditions hold.
