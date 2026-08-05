# U2A Clean-Room Review, Round 7

## Reviewed Targets

I verified `docs/plans/issues/u2-protocol-lifecycle-sqlite.md` at commit `028c1af6d52e641244e6e4808002d676077d4a72` with SHA-256 `30d47780c6fdb9cf2f76efc2d74b7488b08b4a1f8b62b1d65e2fb480ff5f8bba`.

I verified `PLANS.md` at commit `028c1af6d52e641244e6e4808002d676077d4a72` with SHA-256 `379d104b449be58f46c74b226d16b5dfebd09a96f5c91a00328c697585232140`.

## Verdict

The ExecPlan is not yet executor-safe for a novice autonomous executor.

## Blocking Findings

- `CR-001` — P1. The plan requires canonical bytes and stable SHA-256 digests, but it does not define a complete canonical JSON encoding. `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:797-820` requires canonical UTF-8 JSON and byte equality, while `:809-812` requires a raw tokenizer. It does not prescribe string escape spelling, Unicode escape case and use, or a numeric grammar. `PullRequestTargetV1.number` is also not typed or bounded in `:382-386`, and the general field rules at `:430-437` do not supply one. Two conforming implementations can therefore serialize the same validated string or pull-request number differently, producing different accepted bytes and event-chain digests. Define the full string and number serialization and validation algorithm, including the `number` type and range, then add fixed cross-case fixtures for each ambiguity.

- `CR-002` — P1. The approval validator excludes the denial transition that the lifecycle requires. The lifecycle table requires `record-plan-decision` to accept an exact denied approval record and store it in `NeedsYou` at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:964`. However, `validatePlanApprovalV1` requires `decision: approved` and `APPROVED` at `:1170-1174`, and no separate denial validator or mode is specified. A novice cannot implement the denial row without weakening that stated validator or inventing a second validation path. Specify a closed validation interface that validates both a matching denial for `record-plan-decision` and an approved record for `queue-approved-plan`, with the exact error results and tests for both paths.

- `CR-003` — P1. Gate freshness has no time rule. `GateDecisionV1` contains only `decided_at` as a time field at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:405-406`; the reducer receives an observed time at `:871-881`; and `:1181-1184` says freshness compares decision time. Neither the gate requirement nor the gate decision declares an expiry, maximum age, or other comparison that determines when a passed gate becomes stale. The plan nevertheless requires stale-gate tests at `:1393-1395` and requires Learn and merge to reject stale gates at `:1098-1100`. An implementation would need to invent an age limit or treat time as irrelevant, which changes whether it accepts work. Add a closed freshness rule for every required gate, including its time bound or validity anchor, the exact comparison with observed time, and stale boundary fixtures.

- `CR-004` — P1. The milestones require focused suites to pass before the lifecycle implementation that their prescribed tests require. Milestone 1 says no execution reducer is required and requires `protocol.test.ts` to pass at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:1281-1287`, but the required protocol test must call the raw lifecycle wrapper at `:1340-1347`; `domain/lifecycle.ts` is not created until Milestone 3 at `:1330-1334`. Milestone 2 likewise requires all standalone policy tests to pass without calling `lifecycle.ts` at `:1289-1298`, while `leases.test.ts` must assert lifecycle states, revisions, digests, and replay at `:1364-1380`. The worker must either violate the milestone boundary or omit required passing tests. Move the wrapper and event-fold/replay cases to Milestone 3, or explicitly create the minimal lifecycle boundary earlier and revise the milestone acceptance criteria to match.

## Residual Low-Risk Concerns

None.

## Verification Notes

I read the complete bound `PLANS.md` and ExecPlan, then inspected the repository's package scripts, architecture rules, runtime module, and existing approval contract. I used the bound plan, governing-contract, and canonical-prompt bytes; their SHA-256 values matched the dispatch.

MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED
