# Reviewed Targets

I verified `docs/plans/issues/u2-protocol-lifecycle-sqlite.md` at commit `d8f4b45c5ad3fbe1b18764877ad16443d3c307bd` with SHA-256 `c8830ed2ab9ce1995a8a7bce40a7b3704b6bed397cc2fb110444f93d6bb30bd7`.

I verified `PLANS.md` at commit `d8f4b45c5ad3fbe1b18764877ad16443d3c307bd` with SHA-256 `379d104b449be58f46c74b226d16b5dfebd09a96f5c91a00328c697585232140`.

# Verdict

The ExecPlan is not yet executor-safe for a novice autonomous executor.

# Blocking Findings

## CR-001

Priority: P1

Exact repository evidence: The plan requires validated aliases `Uuid`, `Sha256`, `GitSha`, `UtcTimestamp`, and `RepoPath` at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:232-235`. It later requires the parser to reject noncanonical values of all five at lines 758-763, but specifies no grammar or canonical form for any of them. The bound `src/modules/runtime/domain/types.ts` defines only `RuntimeIdentity`, so the repository supplies no existing validator to adopt.

Failure scenario: Two implementations can both satisfy the named tests while accepting different UUID versions, Git object lengths, timestamp precision and offsets, or path normalization and traversal forms. They then produce different canonical bytes, digest chains, and artifact bindings for the same logical request.

Smallest required repair: Define the exact accepted syntax, byte limits, normalization, and rejection rules for each alias, including the permitted UUID and Git SHA forms, UTC timestamp representation, and repository-path segment rules. Add fixed valid and invalid fixtures for each definition to `protocol.test.ts`.

## CR-002

Priority: P1

Exact repository evidence: `evaluateLifecycleCommand` is declared the sole reducer entry point and accepts a validated `CommandEnvelopeV1` at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:790-816`. The ordered lifecycle guards nevertheless begin with raw protocol and limit failures at lines 830-850, including malformed bytes, duplicate fields, and unsupported versions. Those raw bytes are not an input to the function.

Failure scenario: A novice cannot implement the stated guard order or return the matrix's parser failures from this typed reducer. Moving parsing into an unspecified caller changes which API owns `ProtocolErrorV1`, the available command identities, and the test boundary.

Smallest required repair: Specify a raw-input lifecycle entry point and its result contract, or state that the runtime parsers exclusively own the first three rejection rows and define the composition path and tests that connect their errors to lifecycle results. Keep the typed reducer's guard list consistent with that choice.

## CR-003

Priority: P1

Exact repository evidence: `LifecycleSnapshotV1` exposes `next_actions`, and successful `CommandResultV1` exposes both a `completed` or `accepted` status and `next_actions` at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:292-306` and 654-674. The plan defines only the initial snapshot's action at lines 717-727, then says event folding “derives next actions.” The transition table defines state and event effects but does not map successful commands or event variants to a status, complete next-action array, or every snapshot field to clear or retain. The plan requires event replay to equal the returned snapshot at lines 721-729 and 1151-1155.

Failure scenario: After a failed review followed by a new submission, an executor must guess whether the old dispatch, accepted review, approval, gates, and next actions remain or clear, and whether the successful result is `accepted` or `completed`. Different choices all fit the listed event value types but produce different replayed snapshots and U2B storage values.

Smallest required repair: Add an exhaustive reducer table for every event variant that names each snapshot field it replaces, clears, or retains, the derived next-action array, and the successful result status. Require fixture snapshots after each event in every multi-event batch as well as after each single-event transition.

# Residual Low-Risk Concerns

None.

# Verification Notes

I used the bound bytes for the ExecPlan, `PLANS.md`, and the review prompt. I inspected the bound runtime module, architecture standard, package scripts, module documentation, and approval contract to test the plan's stated repository assumptions.

MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED
