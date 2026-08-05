# Reviewed Targets

I reviewed `docs/plans/issues/u2-protocol-lifecycle-sqlite.md` at commit `d35bd9555f009e0e4ba522dc2ef821a781adeded` with SHA-256 `ba709bb37b3940aa3f180d4664a72370759a4a5d0c168f85b308c78f3827ea4c`.

I reviewed `PLANS.md` at commit `d35bd9555f009e0e4ba522dc2ef821a781adeded` with SHA-256 `379d104b449be58f46c74b226d16b5dfebd09a96f5c91a00328c697585232140`.

# Verdict

The ExecPlan is not yet executor-safe for a novice autonomous executor.

# Blocking Findings

## CR-001 — P1: The normative prose schema conflicts with the checked planning contract for workspace branches

Repository evidence: the bound plan says the planning contract is the machine authority for command payload fields and their recursive wire types, and that a mismatch blocks review. `docs/plans/contracts/u2a-protocol-contract.ts` defines `WorkspaceTargetV1.branch` as `BranchNameV1`, whose rule is `ascii:git-check-ref-format:1..255`. The plan's normative interfaces at the `WorkspaceTargetV1` declarations instead use `branch: string`, and the later prose explicitly repeats that `WorkspaceTargetV1` is `{ workspace_id: Uuid; branch: string; head: GitSha; path_digest: Sha256 }` while calling the payload table and field rules the complete JSON schema.

Failure scenario: an implementer can either accept an unconstrained Unicode string, following the claimed complete prose schema, or require a checked Git-ref branch, following the planning contract. That choice changes accepted command bytes, event bytes, snapshots, and replay behavior.

Smallest required repair: make every normative `WorkspaceTargetV1` declaration use `BranchNameV1`, define that alias and its exact validation rule in the plan's public-protocol prose, and remove the conflicting `string` declarations. Keep the checked contract and prose byte-for-byte aligned for this field.

## CR-002 — P1: The command schema accepts trusted evidence that the plan says clients cannot provide

Repository evidence: `ResumeQueuedCommandV1` includes `approval: ApprovalEvidenceV1`, and `ResumeWorkCommandV1` includes `approval: ApprovalEvidenceV1` and `gates: readonly GateDecisionV1[]`; the checked command catalog contains the same fields. `ApprovalEvidenceV1` includes `TrustedAdapterAttestationV1`. Elsewhere the plan says that callers cannot submit trusted types through command JSON, that protocol clients submit locators rather than trusted values, and that only matching review or approval commands may receive their nullable trusted evaluation input. The lifecycle evaluation input exposes `approval_evidence` separately, but the plan does not state how it binds to these two command payloads or whether it replaces them.

Failure scenario: a parser that follows the command schema must accept client-provided approval provenance and gate values, while a parser that follows the trust-boundary rules must reject them. The executor cannot determine whether `resume-queued` and `resume-work` are authorized by authenticated adapter output or by an untrusted command claim.

Smallest required repair: remove `ApprovalEvidenceV1` and `GateDecisionV1` from command JSON for these commands and define matching, command-specific application-validated inputs in `LifecycleEvaluationInputV1`, including their required presence, provenance, byte-equality or derivation rules, and event construction. Alternatively, define a safe locator-only command form and the exact adapter validation that resolves it. Update the catalog, interfaces, guard ordering, trusted-input presence rule, and tests together.

## CR-003 — P1: The initial snapshot has two incompatible required next-action values

Repository evidence: the plan requires `createInitialLifecycleSnapshotV1(projectId, issueId)` to return `NeedsPlanning` with failed-review count zero and `[return-to-planning]` as its only next action. Its exhaustive `deriveNextActionsV1(snapshot)` table requires a `NeedsPlanning` snapshot whose review limit permits submission to return `[submit-plan-review]`. A zero count permits submission under the failed-review policy.

Failure scenario: an initial snapshot cannot satisfy both exact requirements. Different implementations will serialize different initial snapshots, so event replay and byte-identical reducer tests diverge before the first command.

Smallest required repair: select one initial next-action array and make `createInitialLifecycleSnapshotV1`, `deriveNextActionsV1`, the failed-review policy, readiness trace, and initial-snapshot fixtures use it consistently.

## CR-004 — P1: Heartbeat expiry can use either client time or trusted control-plane time

Repository evidence: `RecordLeaseHeartbeatCommandV1` requires a command-supplied `observed_at`. The lifecycle table accepts a heartbeat when its timestamp is before expiry. The lease rules say expiry is evaluated against control-plane-attested `observed_time.observed_at`, and the reducer input separately receives that trusted value. The plan does not require the payload timestamp to equal the trusted time, state which value becomes `last_heartbeat_at`, or define a rejection when they differ.

Failure scenario: a client can supply a timestamp before expiry while the trusted observed time is at or after expiry. One implementation may accept and record the client time; another may reject based on trusted time. The result changes lease fencing and replayed lease state.

Smallest required repair: remove the command timestamp and derive the heartbeat time from `ObservedTimeV1`, or require exact equality and specify the first failing guard, error, event value, and fixtures for mismatch, before-expiry, exact-expiry, and after-expiry cases.

# Residual Low-Risk Concerns

None.

# Verification Notes

I read the bound `AGENTS.md`, `.agents/OPERATING.md`, `PLANS.md`, ExecPlan, and clean-room prompt. I verified the three bound SHA-256 values from the immutable commit with `git show`; they match the dispatch manifest. I inspected the bound planning contract, its focused Vitest test, the architecture standard, the existing approval contract, and package scripts. The planning-contract test passed with one file and ten tests. I used the bound bytes for the review and did not read prior review outputs.

MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED
