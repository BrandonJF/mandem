# Reviewed Targets

- Review manifest: `docs/plans/reviews/2026-08-04-u2-clean-room-round-2-prompt.md`.
- Reviewed commit: `c054c91fd18bf799876247cacd3dbeebb85688e2`.
- Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md`, SHA-256 `dd7f6d8034d83a23134f7bbda77b1d75c21c428fff7cd7a5f84e7b468ce716fa`.
- Governing contract: `PLANS.md`, SHA-256 `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0`.

# PLANS.md Conformance

The plan passes the content-only Markdown format rule, living sections, stated purpose and observable outcome, repository orientation, dependency snapshot, milestone sequence, validation gates, idempotence and recovery guidance, and bottom revision note requirements. The embedded Bun and SQLite contract gives a novice enough repository-local instruction to implement the database work without consulting external documentation.

The plan does not yet meet the self-containment, defined-terms, prescriptive-interface, and independently verifiable milestone requirements for protocol and process-finding behavior. It names several closed catalogs and port values without defining them, and it leaves process-finding identity, deduplication, and authorization outside the complete lifecycle catalog. Those omissions force a worker to choose durable wire and policy behavior.

# Round-1 Closure

1. **OPEN — Protocol v1 implementability.** The revision adds envelope shells, canonical-byte rules, receipt and checkpoint records, port signatures, and root-barrel intent at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:385-513`. It still leaves required catalog members, nested payload shapes, port values, transition errors, and initial-event causation semantics unspecified. Finding `U2-R2-001` gives the remaining repair.
2. **OPEN — State-preserving process-finding creation and deduplication.** The revision adds command and event names at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:449-478`, but it does not prescribe who may invoke them in each lifecycle phase or how `finding_id` and `deduplication_digest` are derived and enforced. Finding `U2-R2-002` gives the remaining repair.
3. **CLOSED — Novice-executable milestones.** Each milestone now names ordered files, tests or exports, exact repository-root Bun commands, and red/green observations at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:622-721`.
4. **CLOSED — Bun and SQLite execution contract.** The plan now embeds connection options, pragmas and read-back checks, immediate transaction boundaries, WAL constraints, backup-byte validation, migration order, restoration order, and failure behavior at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:554-581`. The external links are provenance only at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:864-866`.

# Findings

## U2-R2-001 — P1: Protocol v1 still leaves durable schemas and policy outcomes to the worker

Evidence: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:424` says eight protocol types are closed unions generated from checked catalogs, but the plan never gives the members or names the catalog files. The command table at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:426-452` supplies field names but no nested shapes for values such as `plan`, `approval`, `workspace`, `provider_evidence`, `review_manifest`, or `validation_evidence`. `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:454` defines only a few broad conventions, while the public port signatures at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:498-510` use undefined values including `IssueLedgerSnapshotV1`, `CommandReceiptV1`, `AtomicCommandCommitV1`, `VerifiedProjectionReplacementV1`, `CheckpointDestinationV1`, `ObservedCheckpointV1`, `PendingCheckpointV1`, and `TrustedPrincipalV1`. The plan requires every transition declaration to state stable errors and permitted next actions at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:339-347`, but the catalog at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:355-377` does not provide them, and the error catalog remains a non-exhaustive minimum at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:583-587`. Finally, a root command permits `causation_id: null` at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:402`, while every event requires a UUID causation ID at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:465`; the plan gives no derivation rule.

Failure scenario: two workers can choose different members for an authority scope or next action, serialize the same command family with incompatible nested evidence objects, or choose different causation IDs for the first event. Each implementation can pass its own fixtures while producing receipts, events, and public ports that downstream U3-U7 cannot exchange or replay consistently. A worker can also choose a generic rejection code for a missing guard because the transition catalog has no mandated code or recovery action.

Smallest contract repair: add a single prescriptive Protocol v1 catalog to the plan. Define every closed-union member, every command and event payload as a complete nested TypeScript shape, every currently undefined public port value, and the exact error code and next-action mapping for every transition guard. Define the root-event causation rule and cross-reference each shape to the parser, serializer, reducer, and public root-barrel export that Milestone 1 or 3 must add. Update the focused fixture inventory so it enumerates those complete catalogs.

## U2-R2-002 — P1: Process-finding creation has no deterministic identity, deduplication, or per-phase authority contract

Evidence: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:81` requires a stable identity, typed origin, bounded evidence, and a blocking disposition for every process finding. The command table at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:450` merely accepts client-provided `finding_id` and `deduplication_digest`; it does not define either value's canonical inputs, derivation, uniqueness constraint, or conflict behavior. The state-preserving event at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:476` repeats those supplied values. The lifecycle catalog claims to cover protocol v1 at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:353-377`, but it contains neither state-preserving process-finding command and therefore specifies no role, authority scope, allowed source phases, lease requirement, error, or next action for either. The routed-item projection at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:549` requires a stable identity but specifies no uniqueness rule. Milestone 2 asks for idempotency in every phase at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:656-661`, without defining the Plan, Work, Review, and Learn commands or their permitted principals.

Failure scenario: a reviewer and an operator report the same missing planning PR with different random finding UUIDs, or one client submits the same evidence with a changed digest. The reducer must invent whether to create one finding, create two blockers, or reject the second command. A worker can also decide that an active worker lease is required in one phase while another permits an unauthenticated client to create a finding. Replay then reconstructs a durable result that depends on an implementation choice rather than the reviewed contract.

Smallest contract repair: add `record-process-finding`, `dispose-process-finding`, and `supersede-process-finding-disposition` as state-preserving rows in the lifecycle catalog. For each row, prescribe the permitted trusted role and scope, permitted source phases, lease rule, event, error, and next action. Define finding identity as a specified canonical digest or a server-created UUID bound to a specified deduplication tuple; add a database uniqueness constraint and exact duplicate and conflicting-duplicate results. Define the five `ProcessFindingOriginV1` members and the canonical, bounded inputs to the tuple. Add Plan, Work, Review, and Learn fixtures that prove same-tuple deduplication, conflicting evidence handling, authorization rejection, disposition blocking, and restart replay.

# Verification Notes

I inspected the exact committed plan and governing `PLANS.md`, verified both supplied SHA-256 values, read the authoritative round-one reviewer output, and checked the cited epic, merged dependency contracts, architecture standard, approval contract, package scripts, and current module layout at the reviewed commit. I did not use the working tree as review evidence.

# Verdict

`CHANGES_REQUIRED` — 2 P1, 0 P2.
