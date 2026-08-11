# Reviewed Targets

Reviewed `docs/plans/issues/u2-protocol-lifecycle-sqlite.md` at commit `54c8ddc183b8ba1d902f439fa50a44cb5ce34935` with SHA-256 `5a9657d52d358e2dbd9ffa6f5cd519eb117994b365e69d1665c5e4b096f019da`.

Reviewed `PLANS.md` at commit `54c8ddc183b8ba1d902f439fa50a44cb5ce34935` with SHA-256 `379d104b449be58f46c74b226d16b5dfebd09a96f5c91a00328c697585232140`.

# Verdict

The ExecPlan is not yet executor-safe for a novice autonomous executor.

# Blocking Findings

## CR-001 — P1: The process-finding command cannot supply the required origin value

Repository evidence: The normative `RecordProcessFindingCommandV1` declares `origin: ArtifactReferenceV1` in `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:417`. The resulting `ProcessFindingV1` declares `origin: ProcessFindingOriginV1` at `:497-500`, and the policy requires one of five origin tokens and authorizes it through an origin/role matrix at `:1429-1437`. The transition row also requires that matrix at `:1201`.

Failure scenario: A client submits `record-process-finding`. It can provide only an artifact object for `origin`, but the reducer must validate one of the five origin tokens and record that token in the event value. No command value can satisfy both declared types, so the executor must either reject every valid finding or invent a conversion that the closed schema forbids.

Smallest required repair: Declare `RecordProcessFindingCommandV1.origin` as `ProcessFindingOriginV1`, retain `evidence_artifacts` as the artifact source, and update the command schema, parser fixtures, and any related prose to use that single closed shape.

## CR-002 — P1: The array rules make required initial and invalidation snapshots invalid

Repository evidence: The general schema rule says every `gates` field is a nonempty sorted array in `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:519-526`. `LifecycleSnapshotV1.gates` is such a field at `:824-845`, but `createInitialLifecycleSnapshotV1` must produce empty gates at `:950-954`. `InvalidationEffectV1.gates` is also an array at `:504`, and the fold table requires contract-gap dispositions to clear gates from that effect at `:1291-1294`.

Failure scenario: A parser that applies the stated general rule rejects the required initial snapshot and any valid invalidation effect with no current gates. An executor must choose between violating the closed validation rules or violating the required initial and replay behavior.

Smallest required repair: State the exact cardinality rule for each gate collection. Permit an empty, sorted `LifecycleSnapshotV1.gates` and `InvalidationEffectV1.gates` collection where no gate exists, while retaining nonempty requirements only for fields that actually require a gate decision. Update the schema and fixtures accordingly.

## CR-003 — P1: Idempotency has no specified kind or payload-digest value for U2B

Repository evidence: R2 requires an idempotency key with a kind and canonical payload digest that U2B can store in `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:184-185`. The complete `CommandEnvelopeV1` exposes only `idempotency_key: Uuid` at `:312-325`; neither the command, event, result, nor snapshot has an idempotency kind or payload-digest field. The plan later says U2A defines the canonical payload digest at `:1702-1704`, but it gives no payload selection or digest equation.

Failure scenario: U2B must implement exact retry lookup from the U2A protocol. It cannot determine whether the digest covers the payload alone, the payload plus command kind, or a different canonical value, and no U2A value gives it the declared kind. Different implementations can accept the same idempotency UUID for different requests or persist incompatible retry records.

Smallest required repair: Add a closed idempotency value to the command protocol, define its kind and the exact canonical bytes and SHA-256 input that produce its payload digest, and state where U2B receives that complete value. Add fixed collision and same-key/different-payload fixtures.

# Residual Low-Risk Concerns

None.

# Verification Notes

I read the immutable dispatch, `AGENTS.md`, `.agents/OPERATING.md`, the complete bound `PLANS.md`, the complete bound ExecPlan, and the canonical clean-room prompt. I verified the dispatch-listed SHA-256 values for the ExecPlan, `PLANS.md`, and prompt against the bound working-tree bytes. I inspected the existing public approval contract in `src/modules/architecture-standard/domain/approval-contract.ts` and its public barrel to confirm that the planned approval composition has a current repository target.

MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED
