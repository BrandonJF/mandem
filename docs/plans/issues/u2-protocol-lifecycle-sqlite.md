---
title: "Define Mandem work-control rules - Plan"
type: feat
date: 2026-08-04
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: mandem-epic
execution: code
plan_kind: mandem-issue-execplan
issue_key: U2A
parent: ../2026-07-21-001-feat-mandem-plan.md
epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253
issue_id: cb67d131-975c-4d97-9a6f-4934be991ac6
depends_on_issue_ids:
  - 6a6a8bab-853f-4658-9bc0-38e2386b642d
  - 745eda80-1e74-4866-bc95-2f2983b31025
  - da645bd0-9899-40b3-9f23-3b48d65362a4
promotion: planned
execution_authorized: false
---

# Define Mandem work-control rules

This ExecPlan is a living document governed by `PLANS.md`. Keep `Progress`, `Surprises &
Discoveries`, `Decision Log`, and `Outcomes & Retrospective` current as planning and work proceed.

This issue was split from the former combined U2 plan after thirteen failed clean-room reviews.
Those reviews remain design evidence in `docs/plans/reviews/`; none approves this plan. This plan
must receive a new clean-room review and exact operator approval before implementation.

## Purpose / Big Picture

U2A gives every Mandem client and agent one deterministic definition of what work may change. After
implementation, a caller can submit a bounded request together with the current immutable work
snapshot and receive either a closed event batch plus the complete next snapshot, or one typed
rejection with the permitted recovery actions. The same inputs always produce the same result.

The rules cover request validation, lifecycle order, one active mutation lease, exact clean-room
review evidence, exact operator approval, gates, process findings, and failed-review limits. Pure
tests demonstrate every allowed transition and important rejection without SQLite, GitHub, Docker,
provider processes, or a running server.

U2A does not store values or run restart reconstruction, perform Git or provider I/O, launch an agent, or expose the
final CLI. U2B stores and reconstructs the public U2A values. U3 runs the server. U4 and later issues
supply real checkpoint, issue, provider, worktree, pull-request, and user-interface adapters.

## Progress

- [x] (2026-08-04) Preserved thirteen failed reviews of the former combined U2 plan in Git.
- [x] (2026-08-04) Added shared third- and fifth-failure limits and returned U2 to planning.
- [x] (2026-08-04) Split work-control rules into U2A and durable recovery into U2B.
- [x] (2026-08-04) Applied and verified the native U2A/U2B issue graph.
- [x] (2026-08-04) Completed all seven behavior-readiness traces and exact execution instructions.
- [x] (2026-08-04) Completed an author-side whole-plan and stored-value/consumer audit.
- [x] (2026-08-04) Preserved U2A clean-room round 1, which returned four P1 findings and raised the
  retained issue's lifetime failed-review count from thirteen to fourteen.
- [x] (2026-08-04) Preserved U2A clean-room round 2, which closed three round-1 findings, returned
  four P1 findings, and raised the retained issue's lifetime failed-review count to fifteen.
- [x] (2026-08-04) Preserved U2A clean-room round 3, which closed every round-2 finding, returned
  three P1 and one P2 finding, raised the lifetime count to sixteen, and stopped review dispatch.
- [x] (2026-08-04) Returned U2A to planning and reviewed the whole plan's producer, event, fold, and
  consumer paths. Kept the reduced U2A scope because all remaining gaps belong to the same reducer.
- [x] (2026-08-04) Preserved U2A clean-room round 4, which closed every round-3 finding, returned
  three P1 findings, and raised the retained issue's lifetime failed-review count to seventeen.
- [x] (2026-08-04) Invalidated the tailored round-5 prompt before verdict after operator correction;
  it does not increment the failed-review count. Adopted the plan-agnostic canonical prompt.
- [ ] Repair stable lineage, exhaustive rejection results, and trusted workspace observations;
  repeat readiness; then bind a fresh clean-room review and obtain a clean verdict.
- [ ] Obtain exact operator approval before implementation.

## Surprises & Discoveries

- Observation: The former plan mixed the meaning of work changes with SQLite, Git checkpoints,
  replay, migration, and provider adapters.
  Evidence: Thirteen reviewer outputs from
  `docs/plans/reviews/2026-08-03-u2-clean-room-round-1-reviewer-output.md` through
  `docs/plans/reviews/2026-08-04-u2-clean-room-round-13-reviewer-output.md` found connected omissions.
- Observation: The existing `architecture-standard` module already owns the only approval record
  parser and selector.
  Evidence: `src/modules/architecture-standard/domain/approval-contract.ts` exports
  `ApprovalRecord`, `ExecutePlanTarget`, `parseApproval`, and `selectApproval`.
- Observation: A complete pre-apply audit is necessary when a guarded writer reports only the first
  mismatch.
  Evidence: Process finding `39099bed-08e5-4c80-a9de-d1fd4308e226` records the U2 graph repair.
- Observation: Tailoring each clean-room prompt to prior findings biases an otherwise independent
  plan-quality review.
  Evidence: Process finding `afb5ca4f-512f-4570-8866-55203106fa95` records the operator correction,
  the interrupted U2A round-5 dispatch, and the canonical prompt repair.

## Decision Log

- Decision: Keep U2A pure and move every storage, replay, checkpoint-write, migration, backup, Git,
  and provider adapter to U2B or a later issue.
  Rationale: U2A must prove the meaning and complete shape of every fact before another module stores
  or transports it.
  Date/Author: 2026-08-04 / Codex
- Decision: Reuse `Mandem-Approval: v1` through the public `architecture-standard` barrel.
  Rationale: A second parser or approval format could authorize a target that existing guarded
  commands reject.
  Date/Author: 2026-08-04 / Codex
- Decision: Model external observations as application-validated immutable inputs to pure rules.
  Rationale: Domain code cannot verify Git ancestry, repository write sets, provider delivery, or
  authentication. It can validate complete trusted values without performing I/O.
  Date/Author: 2026-08-04 / Codex
- Decision: Keep U2A in progress during replanning and keep U2B planned and blocked by U2A.
  Rationale: U2A has no unmet planning dependency; U2B cannot finish planning until U2A publishes
  reviewed and approved public values.
  Date/Author: 2026-08-04 / Codex
- Decision: Record WI1 as complete in the managed issue graph.
  Rationale: WI1 implemented the issue-graph workflow and its native issue is closed.
  Date/Author: 2026-08-04 / Codex
- Decision: Preserve all seventeen failed verdicts on retained issue UUID `cb67d131` while carrying
  forward the operator-selected U2A/U2B split response.
  Rationale: A scope split permits the reduced lineage to be reviewed; it does not create a new
  issue identity or reset the lifetime counter.
  Date/Author: 2026-08-04 / Codex
- Decision: Keep the reduced U2A scope after its third failed review instead of splitting again.
  Rationale: Pause/cancel, reconciliation fencing, and trusted review provenance are required inputs
  to the same closed lifecycle reducer. Moving one elsewhere would leave U2A unable to define a
  complete event or trust boundary and would not reduce implementation scope safely.
  Date/Author: 2026-08-04 / Codex
- Decision: Use one canonical plan-agnostic clean-room prompt for every future review.
  Rationale: The reviewer must judge the whole plan as a context-free novice executor, not confirm
  that the author closed a supplied list of findings.
  Date/Author: 2026-08-04 / Codex

## Outcomes & Retrospective

Planning now separates work-control meaning from durable recovery. The plan specifies all public
values that U2B must store, all lifecycle rows, exact review and approval bindings, lease fencing,
gates, process findings, failed-review limits, and deterministic tests. U2A rounds 1–4 are
preserved as failed verdicts, all round-3 findings are closed, and the lifetime count is seventeen.
The author is repairing the round-4 findings. No review, approval,
or implementation exists for the repaired revision yet.

## Context and Orientation

Mandem is one strict TypeScript package running on Bun 1.3.14. `src/modules/runtime/` is the existing
module for shared runtime values. U2A extends it with the public protocol. U2A creates
`src/modules/execution/` for work-control policy. `execution` may import only the public
`@/modules/runtime` and `@/modules/architecture-standard` barrels. `runtime` must not import
`execution`.

Every module follows `docs/architecture/architecture-standard-v1.md`: `domain`, `application`,
`infrastructure`, `api`, and `tests/fakes` directories; `README.md`; root and layer barrels; pure
domain code; I/O only in infrastructure or `api/composition.ts`; useful `@fileoverview` comments;
no explicit `any`; and no cross-module deep import. U2A keeps its application and infrastructure
surfaces empty because this issue defines pure values and rules only.

A validated request is a `CommandEnvelopeV1` whose closed schema, canonical bytes, size limits, and
requested attribution have passed protocol parsing. A trusted principal is a separate value derived
by later transport code. A lifecycle snapshot is the complete immutable current work state. A
reducer receives those values plus explicit event IDs and returns a decision. It never reads a
clock, creates a UUID, or reads Git, a database, the filesystem, a provider, or ambient process
state.

## Product Contract

### Actors

- The operator supplies exact approval or denial and controls consequential overrides.
- A client submits protocol requests and consumes stable results and errors.
- A phase agent, worker, or reviewer acts only within its role, session, scopes, and lease.
- The control plane supplies authenticated principals and validated external evidence.
- U2B later stores commands, events, results, and snapshots without adding lifecycle decisions.

### Requirements

- R1. Every command, result, error, and event uses protocol version 1 and closed canonical shapes.
- R2. Every state-changing command carries project-wide request identity, attribution, correlation,
  causation, and an idempotency key whose kind and canonical payload digest U2B can store.
- R3. Protocol parsing rejects unknown versions or fields, malformed identifiers, noncanonical
  bytes, excessive size or nesting, unsafe numeric values, and missing context.
- R4. Requested attribution never authenticates a caller. The supplied trusted principal must
  match actor, role, session, and required scopes before policy evaluation.
- R5. One exhaustive transition catalog determines allowed source state, role, scope, evidence,
  lease rule, resulting events, next snapshot, typed rejection, and permitted next actions.
- R6. Every invalid order, stale or missing artifact, authority failure, stale snapshot, lease
  failure, or unresolved finding rejects without events or snapshot changes.
- R7. One active mutation lease controls a resource. Expiry, takeover, release, handoff, pause,
  cancellation, or repair transfer fences the older owner and session permanently.
- R8. Clean-room review binds exact plan and `PLANS.md` targets, complete prompt, reviewer identity,
  challenge lenses, attestations, risk policy, provider receipt, sole output path, reviewer commit,
  sole write, output bytes, and verdict.
- R9. Operator approval reuses the existing `Mandem-Approval: v1` parser and must exactly match the
  accepted review's issue, plan commit, and plan digest. Denial and stale targets fail closed.
- R10. Gates and process findings use complete versioned values. Unresolved findings block phase
  completion; contract-gap dispositions invalidate governed evidence and return to planning.
- R11. Every `CHANGES_REQUIRED` verdict increments one lifetime counter. The third requires a
  whole-plan readiness and scope response; the fifth requires an operator choice; rewrites never
  reset the count; invalid or unavailable reviews never increment it.
- R12. U2A exports complete events and snapshots so U2B can persist and replay them without deriving
  work-control meaning from command names or external state.

### Acceptance Examples

- AE1. A well-formed request and matching snapshot return the same event batch and next snapshot on
  repeated pure evaluation.
- AE2. Every command in the wrong state returns `INVALID_TRANSITION`, no events, and no state change.
- AE3. A former owner submitting after expiry, takeover, handoff, pause, cancellation, release, or
  repair transfer receives a lease error and cannot mutate.
- AE4. A review from terminal output, another path, an author session, inherited author context, an
  extra write, a stale target, or a non-clean final marker cannot enter `NeedsApproval`.
- AE5. An exact approved `execute-plan` record matching the accepted review enters `Queued`; absent,
  denied, malformed, wrong-issue, wrong-action, wrong-commit, or wrong-digest approval cannot.
- AE6. Failed reviews one and two permit another valid dispatch; the third requires readiness and a
  scope response; the fifth requires `split`, `redesign`, or one consumed `permit-one-more` choice.
- AE7. U2B can store and replay every event and snapshot field without inventing an event, phase,
  lease, review, approval, gate, finding, failure-limit, or next-action rule.

## Scope Boundaries

Included now: bounded runtime protocol values and canonical parsing; lifecycle snapshots and event
values; exhaustive transition policy; leases and fencing; review, approval, and gate freshness;
process-finding disposition; failed-review limits; pure reducers; public barrels; deterministic
tests; and architecture documentation.

Deferred to U2B: exact retry lookup, atomic receipts, event storage, sequence allocation, replay,
projection replacement, checkpoint outbox and completion, SQLite, migration, backup, and restart
reconstruction. Deferred to U3 and later: server and socket transport, Git and GitHub adapters,
provider launch, worktrees, pull requests, merge, CLI/TUI rendering, and live orchestration.

Outside U2A: performing external writes, parsing credentials, storing prompts or transcripts,
approving a plan, implementing living-record approval exemptions, or treating working-tree bytes as
approved content.

## Public Protocol and Policy Values

Implementation must use these exact public names and closed catalogs. A protocol-version change is
required to rename a field, add a union member, or make a required field optional.

`src/modules/runtime/domain/types.ts` owns every wire and snapshot type so `runtime` never imports
`execution`. It defines validated aliases `Uuid`, `Sha256`, `GitSha`, `UtcTimestamp`, and `RepoPath`;
`ActorRoleV1`; `AuthorityScopeV1`; `ActorAttributionV1`; `TrustedPrincipalV1`; and
`ArtifactReferenceV1`. Human prose lives in a referenced artifact, never in a protocol value.

    type ActorRoleV1 = "operator" | "phase-agent" | "worker" | "reviewer" | "control-plane";
    type AuthorityScopeV1 =
      | "submit-plan-review" | "dispatch-plan-review" | "decide-plan" | "dispatch-work"
      | "mutate-work" | "heartbeat-lease" | "takeover-lease" | "release-lease"
      | "review-work" | "record-learn" | "integrate" | "verify-merge" | "pause-work"
      | "cancel-work" | "reconcile-sources" | "record-gate-decision"
      | "record-process-finding" | "dispose-process-finding";
    interface ActorAttributionV1 { actor_id: Uuid; role: ActorRoleV1; session_id: Uuid;
      authority_scopes: AuthorityScopeV1[]; }
    interface TrustedPrincipalV1 extends ActorAttributionV1 { authenticated_at: UtcTimestamp;
      transport_identity_digest: Sha256; }
    type ArtifactKindV1 = "repo-file" | "review-manifest" | "review-dispatch-receipt"
      | "review-output" | "readiness-check" | "approval-record" | "gate-evidence"
      | "workspace" | "handoff" | "review-findings" | "learn-record" | "merge-record"
      | "verification-record" | "reconciliation-record" | "process-finding"
      | "process-repair" | "operator-decision";
    type ArtifactProviderV1 = "git" | "git-issue" | "github" | "codex" | "local";
    interface ArtifactReferenceV1 { kind: ArtifactKindV1; path: RepoPath | null;
      commit: GitSha | null; digest: Sha256; provider: ArtifactProviderV1 | null;
      external_id: string | null; }

Artifact references require `path` and `commit` together for `repo-file`, `review-manifest`,
`review-output`, `readiness-check`, `approval-record`, `learn-record`, and `process-repair`.
`provider` is required for dispatch receipts and external evidence and forbidden otherwise;
`external_id` is allowed only when `provider` is non-null. External IDs use 1–256 printable ASCII
bytes without leading/trailing whitespace. The closed decoder rejects every other combination.

The role/scope matrix is exhaustive. Operator may hold every scope. Phase agent may hold
`submit-plan-review`, `decide-plan`, `record-learn`, `reconcile-sources`,
`record-process-finding`, and `dispose-process-finding`. Worker may hold `mutate-work`,
`heartbeat-lease`, `release-lease`, and `record-process-finding`. Reviewer may hold `decide-plan`,
`review-work`, and `record-process-finding`. Control plane may hold `dispatch-plan-review`,
`dispatch-work`, `decide-plan`, `heartbeat-lease`, `takeover-lease`, `release-lease`, `review-work`,
`record-learn`, `integrate`, `verify-merge`, `reconcile-sources`, `record-gate-decision`, `record-process-finding`, and
`dispose-process-finding`. A principal containing a role/scope pair outside this matrix is
`ACTOR_ROLE_FORBIDDEN`. Both `return-for-repair` and `record-exact-merge` require the control-plane
role and `integrate`; no other role may use `integrate`.

`src/modules/runtime/domain/protocol.ts` defines:

    interface CommandEnvelopeV1 {
      protocol_version: 1;
      command_id: Uuid;
      idempotency_key: Uuid;
      project_id: Uuid;
      issue_id: Uuid;
      correlation_id: Uuid;
      causation_id: Uuid | null;
      expected_revision: Uuid | null;
      expected_events_digest: Sha256;
      occurred_at: UtcTimestamp;
      requested_actor: ActorAttributionV1;
      payload: CommandPayloadV1;
    }

    type CommandResultV1 =
      | { protocol_version: 1; status: "completed" | "accepted"; command_id: Uuid;
          correlation_id: Uuid; issue_id: Uuid; events: EventEnvelopeV1[];
          next_snapshot: LifecycleSnapshotV1;
          next_actions: NextActionV1[] }
      | { protocol_version: 1; status: "rejected"; command_id: Uuid | null;
          correlation_id: Uuid | null; issue_id: Uuid | null; error: ProtocolErrorV1 };

    interface ProtocolErrorV1 {
      code: ErrorCodeV1;
      retryable: boolean;
      issue_id: Uuid | null;
      correlation_id: Uuid | null;
      evidence: ArtifactReferenceV1[];
      next_actions: NextActionV1[];
    }

`CommandKindV1` and the `kind`-discriminated `CommandPayloadV1` contain exactly:
`submit-plan-review`, `record-plan-review-dispatch`, `record-plan-review-verdict`,
`record-plan-decision`, `queue-approved-plan`, `acquire-work-lease`, `record-lease-heartbeat`,
`takeover-work-lease`, `release-work-lease`, `submit-work-handoff`, `record-review-findings`,
`accept-review`, `invalidate-review`, `accept-learn`, `return-for-repair`, `record-exact-merge`,
`record-verification-success`, `record-verification-failure`, `resume-planning`, `resume-queued`,
`pause-work`, `resume-work`, `cancel-work`, `record-reconciliation-conflict`,
`record-review-scope-response`, `record-gate-decision`, `record-process-finding`, `dispose-process-finding`, and
`supersede-process-finding-disposition`.

The payload union uses these exact required fields. Any field not listed is rejected.

| Kind | Required fields after `kind` |
| --- | --- |
| `submit-plan-review` | `plan`, `governing_contract`, `planning_pull_request`, `review_manifest`, `readiness_artifact` |
| `record-plan-review-dispatch` | `dispatch_id` |
| `record-plan-review-verdict` | `reviewer_commit` |
| `record-plan-decision` | `approval_locator` |
| `queue-approved-plan` | `approval_locator` |
| `acquire-work-lease` | `owner_id`, `session_id`, `workspace`, `expires_at` |
| `record-lease-heartbeat` | `lease_id`, `fencing_token`, `observed_at` |
| `takeover-work-lease` | `prior_lease_id`, `new_owner_id`, `new_session_id`, `expires_at`, `operator_override`, `reason_code` |
| `release-work-lease` | `lease_id`, `fencing_token`, `reason_code`, `workspace`, `evidence` |
| `submit-work-handoff` | `lease_id`, `fencing_token`, `handoff` |
| `record-review-findings` | `reviewed_head`, `review_output`, `repair_owner_id`, `repair_session_id`, `repair_expires_at`, `workspace`, `handoff` |
| `accept-review` | `reviewed_head`, `review_output`, `handoff` |
| `invalidate-review` | `changed_artifacts` |
| `accept-learn` | `handoff`, `integration_owner_id`, `integration_session_id`, `integration_expires_at`, `workspace` |
| `return-for-repair` | `lease_id`, `fencing_token`, `evidence`, `repair_owner_id`, `repair_session_id`, `repair_expires_at`, `workspace`, `handoff` |
| `record-exact-merge` | `lease_id`, `fencing_token`, `approved_head`, `merge_sha`, `evidence` |
| `record-verification-success` | `merge_sha`, `evidence` |
| `record-verification-failure` | `merge_sha`, `failure_code`, `evidence` |
| `resume-planning` | `resolution_code`, `evidence` |
| `resume-queued` | `resolution_code`, `approval`, `evidence` |
| `pause-work` | `reason_code`, `workspace`, `lease_target`, `evidence` |
| `resume-work` | `workspace`, `approval`, `gates`, `evidence` |
| `cancel-work` | `reason_code`, `workspace`, `lease_target`, `evidence` |
| `record-reconciliation-conflict` | `conflict_code`, `evidence` |
| `record-review-scope-response` | `response` |
| `record-gate-decision` | `gate` |
| `record-process-finding` | `origin`, `affected_phase`, `evidence_code`, `evidence_artifacts` |
| `dispose-process-finding` | `finding_id`, `disposition`, `reason_code`, `repair_artifacts` |
| `supersede-process-finding-disposition` | `finding_id`, `prior_disposition_event_id`, `disposition`, `reason_code`, `repair_artifacts` |

Every payload contains only closed scalar fields or these named values:

- `PlanTargetV1 { path, commit, digest }` and
  `GoverningContractTargetV1 { path: "PLANS.md", commit, digest }`.
- `PullRequestTargetV1 { provider: "github", repository, number, head }`.
- `ReviewManifestV1 { plan, governing_contract, complete_prompt, complete_prompt_digest,
  reviewer_role, reviewer, challenge_lenses, output_path, author_attestations,
  reviser_attestations, reviewer_attestation, risk_policy, dispatch_id }`, using the exact review
  values below. `complete_prompt` is the immutable artifact reference that locates the exact
  committed prompt bytes.
- `ValidatedReviewDispatchV1 { dispatch_id, prompt_digest, reviewer, provider, model,
  dispatched_at, receipt }` where `receipt` is an artifact reference to exact validated bytes.
- `ValidatedReviewEvidenceV1 { manifest, dispatch, output, reviewer_commit, sole_write,
  reviewer, authors, revisers, challenge_lenses, risk_policy, attestation_digests, bundle_digest,
  required_gates, verdict }` with `required_gates` as sorted unique `{ gate_id, definition_digest }`
  values and `verdict: "clean" | "changes-required"`.
- `ReviewEvidenceAttestationV1 { configured_repository_digest, resolved_manifest_commit,
  resolved_reviewer_commit, reviewer_parent_commit, ancestry_proof_digest, write_set,
  provider_session, transport_identity_digest, source_digests }` uses the exact types below. It is
  constructed only by the later trusted evidence adapter, never parsed from a command.
- `ApprovalEvidenceV1 { record, source }`, where `record` is the public
  `architecture-standard` `ApprovalRecord` and `source` is its exact commit/digest reference.
- `ApprovalLocatorV1 { issue_id, commit }` is the only approval value accepted from a command.
- `GateDecisionV1 { gate_id, definition_digest, input_digests, target_revision, outcome,
  evidence, decided_at }` with sorted unique inputs and evidence.
- `HandoffDecisionV1 { kind, source_session_id, target_session_id, target_revision, outcome_code,
  decision_codes, blocker_codes, mutation_artifacts, evidence, next_transition }`. Codes are closed
  64-byte tokens and details are bounded artifact references. Free text, prompt bytes, transcripts,
  diffs, credentials, and provider output are invalid.
- `ProcessFindingV1 { finding_id, origin, affected_phase, evidence_code, evidence_artifacts,
  disposition, repair_artifacts, disposition_event_id, supersedes_event_id }`.
- `FailedReviewPolicyV1 { changes_required_count, third_review_response,
  fifth_review_choices, active_permit_choice_event_id, consumed_permit_choice_event_ids }`, where
  `third_review_response` is nullable, choice arrays are ordered event UUID/reference pairs, and
  active permit is nullable.
- `ReviewScopeResponseV1` is either `{ kind: "third-review-response"; plan: PlanTargetV1;
  lineage: ReviewScopeLineageV1; readiness_artifact: ReadinessDeclarationV1;
  scope_decision: "keep-scope" | "split" | "redesign"; evidence: readonly ArtifactReferenceV1[] }` or
  `{ kind: "fifth-review-choice"; plan: PlanTargetV1;
  lineage: ReviewScopeLineageV1; choice: "split" | "redesign" | "permit-one-more";
  evidence: readonly ArtifactReferenceV1[] }`. Third response requires phase-agent or operator;
  fifth choice requires operator. The `submit-plan-review` payload's `readiness_artifact` field is
  a `ReadinessDeclarationV1`.
- `LeaseSnapshotV1 { lease_id, resource, workspace, owner_id, session_id, acquired_at, expires_at,
  fencing_token, last_heartbeat_at, revoked_at, reason_code }`, where `resource` is `work` or
  `integration`, `last_heartbeat_at` is nullable, and `revoked_at` and `reason_code` are both null
  for an active lease or both non-null for the complete revoked lease.

These sketches expand to required readonly TypeScript fields without optional properties. Every
name ending `_id` is `Uuid` except finding IDs (`Sha256`); every `*_at` or `*_expires_at` is
`UtcTimestamp`; every commit/head/revision is `GitSha`; every digest is `Sha256`; every path is
`RepoPath`; every artifact, target, output, workspace, or source is its named closed interface;
every `evidence`, `gates`, `changed_artifacts`, `repair_artifacts`, and `*_artifacts` field is a
nonempty canonically sorted bounded array of its named value. Boolean fields are required booleans.
Nullable fields are only those explicitly shown with `null`: causation, initial revision, target
session, active lease, last heartbeat, revoked time/reason, current disposition and disposition links.
`WorkspaceTargetV1` is `{ workspace_id: Uuid; branch: string; head: GitSha;
path_digest: Sha256 }`. `ReviewOutputTargetV1` is `{ path: RepoPath; commit: GitSha;
digest: Sha256; verdict: "clean" | "changes-required" }`. `ReviewWriteV1` is
`{ path: RepoPath; digest: Sha256 }`. `ReviewSessionIdentityV1` is
`{ session_id: Uuid; provider: ArtifactProviderV1; model: string | null }`; a non-null model is
1–128 printable ASCII bytes. `ReviewParticipantAttestationV1` is `{ participant:
ReviewSessionIdentityV1; role: "author" | "reviser" | "reviewer"; context_source:
"originating" | "fresh-isolated"; attestation: ArtifactReferenceV1 }`. Author and reviser entries
require `originating`; the sole reviewer requires `fresh-isolated`; session IDs are unique across
all three collections. `ReviewChallengeLensV1` is exactly `plans-conformance`,
`novice-executability`, `security`, `data-integrity`, `adversarial-counterexample`,
`pure-domain-boundary`, or `deterministic-replay`.

`VerifiedReviewParticipantV1` is `{ participant: ReviewSessionIdentityV1; role: "author" |
"reviser" | "reviewer"; context_source: "originating" | "fresh-isolated";
attestation: ReviewWriteV1; subject_binding_digest: Sha256 }`. The later trusted Git/provider
adapter constructs each value only after parsing the participant artifact and verifying that its
provider session, role, context source, path, and digest match the subject. It computes
`participant_inventory_digest` over canonical JSON containing the configured repository, exact
plan commit/digest, every commit from the predecessor reviewed target through the reviewer parent,
and the complete sorted participant list. Omission changes the trusted inventory digest; manifest
claims cannot create or remove a participant.

`ReviewRiskPolicyV1` is exactly `{ risk: "standard"; alternative: "not-required" }`,
`{ risk: "high"; alternative: "used"; difference: "provider" | "model" | "both" }`, or
`{ risk: "high"; alternative: "unavailable"; limitation: ArtifactReferenceV1 }`. The used reviewer
is the manifest's primary reviewer and must differ from every author/reviser by the dimension named
in `difference`. The unavailable limitation must be a committed `operator-decision` artifact.
Standard risk rejects the high-risk-only fields; high risk rejects `not-required`.

In `ReviewManifestV1`, `reviewer_role` is 1–128 NFC UTF-8 bytes, `reviewer` equals the participant
inside `reviewer_attestation`, `challenge_lenses` is a sorted unique nonempty array of at most 8,
`author_attestations` and `reviser_attestations` are separately sorted by session ID with at most 16
each and at most 31 combined. Authors has at least one member, `reviewer_attestation.role` is
`reviewer`, and `output_path` equals the only permitted write. Revisers may be empty only when the trusted complete participant
inventory contains no reviser.
`ValidatedReviewEvidenceV1.authors` and `.revisers` are the exact sorted participant arrays derived
from those attestations; `.reviewer`, `.challenge_lenses`, and `.risk_policy` equal the manifest;
`.attestation_digests` is the sorted unique digest of every participant attestation plus the trusted
evidence attestation; and `.sole_write` equals the only `write_set` member and output target.
`required_gates` is sorted uniquely by `gate_id` with at most 64 entries. `bundle_digest` is
`canonicalDigestV1` of the closed object `{ manifest_digest, dispatch_digest, output_digest,
attestation_digests, required_gates, verdict }`, using the exact canonical digests/collections
already validated and no other fields.

`ReviewEvidenceAttestationV1.write_set` is a sorted unique readonly `ReviewWriteV1[]` of exactly one
member. `provider_session` is the exact primary `ReviewSessionIdentityV1`.
`source_digests` is a sorted unique readonly `Sha256[]` containing the manifest, prompt, dispatch
receipt, output, ancestry proof, participant attestations, and any risk-limitation sources, with at
most 32 members; it includes `participant_inventory_digest` and every verified participant's
subject-binding digest. `transport_identity_digest` and `configured_repository_digest` are nonzero
`Sha256` values. All review collections participate in the 32-session, 32-write, and 640-KiB review
validation limits; stricter exact-one rules still apply.

The trusted `verified_participants` array is sorted by role then session ID, contains at least one
author, exactly one reviewer, and zero or more revisers, and has at most 32 members. The validator
derives the manifest author/reviser/reviewer identities and attestation path/digests from this array
and requires exact equality; empty authors, omitted observed revisers, substituted artifacts,
duplicate sessions, or a reviewer found among authors/revisers is `ARTIFACT_STALE`.

The complete readonly shapes are:

    interface ReviewManifestV1 {
      readonly plan: PlanTargetV1;
      readonly governing_contract: GoverningContractTargetV1;
      readonly complete_prompt: ArtifactReferenceV1;
      readonly complete_prompt_digest: Sha256;
      readonly reviewer_role: string;
      readonly reviewer: ReviewSessionIdentityV1;
      readonly challenge_lenses: readonly ReviewChallengeLensV1[];
      readonly output_path: RepoPath;
      readonly author_attestations: readonly ReviewParticipantAttestationV1[];
      readonly reviser_attestations: readonly ReviewParticipantAttestationV1[];
      readonly reviewer_attestation: ReviewParticipantAttestationV1;
      readonly risk_policy: ReviewRiskPolicyV1;
      readonly dispatch_id: Uuid;
    }
    interface ValidatedReviewDispatchV1 {
      readonly dispatch_id: Uuid;
      readonly prompt_digest: Sha256;
      readonly reviewer: ReviewSessionIdentityV1;
      readonly provider: ArtifactProviderV1;
      readonly model: string | null;
      readonly dispatched_at: UtcTimestamp;
      readonly receipt: ArtifactReferenceV1;
    }
    interface ReviewEvidenceAttestationV1 {
      readonly configured_repository_digest: Sha256;
      readonly resolved_manifest_commit: GitSha;
      readonly resolved_reviewer_commit: GitSha;
      readonly reviewer_parent_commit: GitSha;
      readonly ancestry_proof_digest: Sha256;
      readonly write_set: readonly ReviewWriteV1[];
      readonly provider_session: ReviewSessionIdentityV1;
      readonly transport_identity_digest: Sha256;
      readonly source_digests: readonly Sha256[];
      readonly verified_participants: readonly VerifiedReviewParticipantV1[];
      readonly participant_inventory_digest: Sha256;
    }
    interface GateRequirementV1 { readonly gate_id: string; readonly definition_digest: Sha256; }
    interface ValidatedReviewEvidenceV1 {
      readonly manifest: ReviewManifestV1;
      readonly dispatch: ValidatedReviewDispatchV1;
      readonly output: ReviewOutputTargetV1;
      readonly reviewer_commit: GitSha;
      readonly sole_write: ReviewWriteV1;
      readonly reviewer: ReviewSessionIdentityV1;
      readonly authors: readonly ReviewSessionIdentityV1[];
      readonly revisers: readonly ReviewSessionIdentityV1[];
      readonly challenge_lenses: readonly ReviewChallengeLensV1[];
      readonly risk_policy: ReviewRiskPolicyV1;
      readonly attestation_digests: readonly Sha256[];
      readonly bundle_digest: Sha256;
      readonly required_gates: readonly GateRequirementV1[];
      readonly verdict: "clean" | "changes-required";
    }
`ObservedTimeV1` is `{ observed_at: UtcTimestamp; source_digest: Sha256 }`, constructed only by the
control plane's trusted clock adapter. `DependencyStatusV1` is `{ issue_id: Uuid;
state: "complete" | "incomplete"; evidence: ArtifactReferenceV1 }`.
`ValidatedWorkspaceObservationV1` is `{ workspace: WorkspaceTargetV1; repository_digest: Sha256;
observed_at: UtcTimestamp; source: ArtifactReferenceV1; validator_identity_digest: Sha256 }`. The
later workspace adapter constructs it only after resolving the configured repository, workspace
identity, branch, exact head, and canonical path-state digest. `source` is a committed `workspace`
artifact containing those observed fields. The reducer requires byte equality with the command's
workspace. Acquisition also requires branch/head equality with the approved plan target. A command
under an active lease requires the same workspace ID and branch as the lease; its observed head and
path digest may advance only when the command payload and trusted observation match. Lease-free
pause/cancellation requires configured-repository provenance but has no prior-lease comparison.
Foreign repository, absent observation, identity/branch mismatch, stale head, path-digest mismatch,
or source mismatch is `ARTIFACT_STALE` under the rejection matrix.
`ScopeBehaviorIdV1` is exactly `interpret-request`, `reject-invalid-order`,
`control-active-agent`, `bind-clean-review`, `bind-operator-approval`, `limit-failed-reviews`, or
`handoff-to-storage`. `ReviewScopeLineageV1` is `{ decision: "keep-scope" | "split" | "redesign";
retained_issue_id: Uuid; predecessor_plan: PlanTargetV1; successor_issue_ids: readonly Uuid[];
behavior_ids: readonly ScopeBehaviorIdV1[]; excluded_responsibilities: readonly string[];
lineage_id: Sha256; declaration_artifact: ArtifactReferenceV1 }`. Successor IDs and behavior IDs are
sorted and unique. Exclusion strings are sorted unique 1–128-byte closed responsibility tokens from
`sqlite`, `durable-storage`, `checkpoint-io`, `provider-adapters`, `server`, `git-io`, and `ui`.
`keep-scope` and `redesign` require exactly the retained issue ID, while `split` requires the
retained ID plus at least one distinct successor.

`lineage_id` is `canonicalDigestV1` of the closed object `{ protocol_version: 1, decision,
retained_issue_id, predecessor_plan, successor_issue_ids, behavior_ids,
excluded_responsibilities }`; it does not include itself, an artifact digest, a readiness digest,
or a later plan. `declaration_artifact` must be a committed `operator-decision` artifact whose exact
canonical bytes are that closed object plus the derived `lineage_id`. The fifth-choice event stores
this complete immutable declaration.

`ReadinessDeclarationV1` is `{ artifact: ArtifactReferenceV1; plan: PlanTargetV1; issue_id: Uuid;
lineage_id: Sha256; behavior_trace_digests: readonly { behavior_id: ScopeBehaviorIdV1;
trace_digest: Sha256 }[] }`. Traces are sorted, unique, and contain exactly the lineage's behavior
IDs. Its committed `readiness-check` artifact contains that closed value except `artifact`; the
artifact digest covers those bytes without self-reference. Each later plan/readiness revision may
change its own target and trace digests but must repeat the immutable lineage ID. Submission and
dispatch compare issue membership, the exact lineage ID, and the complete behavior-ID set; they do
not recompute lineage from mutable readiness bytes. Arbitrary evidence prose cannot establish
lineage.

The retained U2A planning lineage uses `lineage_id`
`723787f06b1e33896b70cbaabdfc9555dbbab306e4b9da09690b72a7218262a1`. Its predecessor is this
plan at `4e1785f4eefd1b75a49c3a4fe4ffbb63c59ffaab` / digest
`9eb769837bbc2c71ce4c6f39445eb63450b2a8c6c258b14bfd272823072c1598`; its sorted successors are
U2B `5abb076c-c5ba-41da-aeab-089664360dbb` and retained U2A
`cb67d131-975c-4d97-9a6f-4934be991ac6`; its behavior IDs are the seven values in the readiness
table; and it excludes all seven deferred responsibility tokens above. The exact canonical
declaration is the `git-issue` `operator-decision` artifact at commit
`5de15b514dc4acfb127b2a76291b2ccf1c741ed6`, digest
`adb31761bd72af5a6bad15780dc5c518aa118040558f7c5f74c63f63990d5957`, provider `git-issue`,
external ID `cb67d131-975c-4d97-9a6f-4934be991ac6`, and null path. Each review manifest binds its
current plan/readiness target to this stable lineage; later bytes never change the declaration.

`HandoffKindV1` is exactly `implementation`, `review-findings`, `review-clean`, `learn-complete`,
or `repair-return`. `HandoffOutcomeCodeV1` is exactly `ready-for-review`, `changes-required`,
`review-accepted`, `ready-to-merge`, or `returned-for-repair`; the allowed pairings are respectively
implementation/ready-for-review, review-findings/changes-required, review-clean/review-accepted,
learn-complete/ready-to-merge, and repair-return/returned-for-repair. `HandoffDecisionCodeV1` is
exactly `scope-complete`, `tests-passed`, `review-clean`, `learning-recorded`, `repair-required`, or
`operator-directed`; `HandoffBlockerCodeV1` is exactly `none`, `tests-failed`, `review-findings`,
`gate-failed`, `approval-stale`, or `reconciliation-required`. `decision_codes` is a sorted unique
nonempty array. `blocker_codes` is exactly `["none"]` for a successful outcome and excludes `none`
otherwise. `next_transition` is exactly the command enabled by the kind/outcome pair:
`record-review-findings` or `accept-review` after implementation, `return-for-repair` after review
findings, `accept-learn` after clean review, `record-exact-merge` after Learn, and
`submit-work-handoff` after repair.

`LeaseReasonCodeV1` is exactly `completed`, `operator-release`, `lease-expired`,
`operator-takeover`, `pause-requested`, `cancel-requested`, `review-findings`,
`merge-repair`, or `reconciliation-conflict`. Takeover accepts only `lease-expired` or
`operator-takeover`; release accepts `completed` or `operator-release`; pause accepts
`pause-requested`; cancellation accepts `cancel-requested`. Reducer-generated revocations use the
transition's matching reason. `ResolutionCodeV1` is exactly `intent-changed`,
`source-reconciled`, `runtime-blocker-cleared`, or `operator-directed`; `resume-planning` accepts
the first two and `resume-queued` accepts the last two. `VerificationFailureCodeV1` is exactly
`required-check-failed`, `merge-mismatch`, `post-merge-regression`, or `source-unavailable`.
`ProcessEvidenceCodeV1` and process-finding disposition reason codes use the grammar
`[a-z][a-z0-9]*(?:-[a-z0-9]+){0,7}` with 1–64 ASCII bytes; their semantics live in the required
referenced evidence, and the finding ID binds the exact token. No other `reason_code`,
`resolution_code`, `failure_code`, decision code, blocker code, kind, or outcome value is valid.

`ExactMergeRecordV1` is `{ approved_head: GitSha; merge_sha: GitSha;
evidence: readonly ArtifactReferenceV1[] }`. `VerificationOutcomeV1` is
`{ kind: "succeeded"; merge_sha: GitSha; evidence: readonly ArtifactReferenceV1[] }` or
`{ kind: "failed"; merge_sha: GitSha; failure_code: VerificationFailureCodeV1;
evidence: readonly ArtifactReferenceV1[] }`. Both verification commands must match
`snapshot.exact_merge.merge_sha`; mismatch returns `ARTIFACT_STALE`, emits no event, and offers
`reconcile-sources`.
`LeaseHandoffEffectV1` is `{ handoff: HandoffDecisionV1; revoked_lease: LeaseSnapshotV1 | null;
acquired_lease: LeaseSnapshotV1 | null }`. `FindingDispositionEffectV1` is
`{ finding: ProcessFindingV1; invalidation: InvalidationEffectV1 | null }`.

`LeaseTargetV1` is exactly `{ kind: "without-active-lease" }` or
`{ kind: "with-active-lease"; lease_id: Uuid; fencing_token: string }`. The reducer requires the
first variant when `snapshot.active_lease` is null and the second to match the complete current
lease; a mismatch is `LEASE_REQUIRED`, `LEASE_NON_OWNER`, or `LEASE_FENCED` under the existing guard
order. `LifecycleInterruptionEffectV1` is `{ reason_code: LeaseReasonCodeV1;
workspace: WorkspaceTargetV1; evidence: readonly ArtifactReferenceV1[];
revoked_lease: LeaseSnapshotV1 | null; resulting_last_fencing_token_by_resource:
Readonly<{ work: string; integration: string }> }`. Pause and cancellation construct it from the
validated `lease_target`, complete pre-transition lease, trusted observed time, exact reason, and
prior token map. When a lease exists, the effect's lease copies every prior field, sets
`revoked_at = observed_time.observed_at`, sets the transition's reason, and leaves the corresponding
token value unchanged; without a lease, `revoked_lease` is null and the complete token map is
byte-identical to the input.

`LifecycleResumeEffectV1` is `{ workspace: WorkspaceTargetV1; approval: ApprovalEvidenceV1;
gates: readonly GateDecisionV1[]; evidence: readonly ArtifactReferenceV1[];
resulting_active_lease: null; resulting_last_fencing_token_by_resource:
Readonly<{ work: string; integration: string }> }`. It preserves the complete token map and proves
that resume never recreates a lease. `ReconciliationEffectV1` is `{ conflict_code: ErrorCodeV1;
evidence: readonly ArtifactReferenceV1[]; revoked_lease: LeaseSnapshotV1 | null;
resulting_last_fencing_token_by_resource: Readonly<{ work: string; integration: string }> }`.
Reconciliation copies and revokes an active lease at trusted observed time with reason
`reconciliation-conflict`, or records null and the unchanged complete token map. These effects are
event values, not new snapshot fields; folding them clears or preserves `active_lease`, replaces the
complete token map with the recorded result, and derives state and next actions.

The command-payload table, these field rules, and the named interfaces are the complete JSON schema.
An implementation may split declarations across files but may not infer another field, optionality,
or collection shape.

`LifecycleStateV1` contains exactly `NeedsPlanning`, `PlanReview`, `NeedsApproval`, `Queued`,
`Working`, `Reviewing`, `Learning`, `Merging`, `Verifying`, `NeedsYou`, `Paused`, `Cancelled`, and
`Done`. The complete snapshot is:

    interface LifecycleSnapshotV1 {
      readonly protocol_version: 1;
      readonly project_id: Uuid;
      readonly issue_id: Uuid;
      readonly state: LifecycleStateV1;
      readonly revision: Uuid | null;
      readonly events_digest: Sha256;
      readonly plan: PlanTargetV1 | null;
      readonly governing_contract: GoverningContractTargetV1 | null;
      readonly submitted_review_manifest: ReviewManifestV1 | null;
      readonly review_dispatch: ValidatedReviewDispatchV1 | null;
      readonly accepted_review: ValidatedReviewEvidenceV1 | null;
      readonly approval: ApprovalEvidenceV1 | null;
      readonly gates: readonly GateDecisionV1[];
      readonly active_lease: LeaseSnapshotV1 | null;
      readonly last_fencing_token_by_resource: Readonly<{ work: string; integration: string }>;
      readonly handoff: HandoffDecisionV1 | null;
      readonly exact_merge: ExactMergeRecordV1 | null;
      readonly verification: VerificationOutcomeV1 | null;
      readonly process_findings: readonly ProcessFindingV1[];
      readonly failed_review_policy: FailedReviewPolicyV1;
      readonly next_actions: readonly NextActionV1[];
    }

U2B stores this complete value and rebuilds it only through U2A's event reducer. Gates sort by gate
ID and findings by finding ID; duplicate identities are invalid.

Only one mutation lease may be active for an issue. Its resource kind records work or integration;
the two-entry per-resource token map retains fencing history after the active lease clears.

`EventEnvelopeV1` contains protocol version, explicit event ID, project and issue IDs, correlation,
causation and command IDs, timestamp, actor, `prior_revision: Uuid | null`,
`prior_events_digest: Sha256`, and a closed `EventPayloadV1`. Each event payload has a
past-tense `kind`, `from_state`, `to_state`, the complete accepted facts, and the complete resulting
lease, review, approval, gate, finding, or failure-limit value it changes.
`EventKindV1` contains exactly `plan-review-submitted`, `plan-review-dispatch-recorded`,
`plan-review-changes-required`, `plan-review-accepted`, `plan-decision-denied`,
`approved-plan-queued`, `work-lease-acquired`, `lease-heartbeat-recorded`, `lease-revoked`,
`work-lease-acquired-for-repair`, `integration-lease-acquired`, `work-handoff-submitted`,
`review-findings-recorded`, `review-accepted`, `review-invalidated`, `learn-accepted`,
`work-returned-for-repair`, `exact-merge-recorded`, `verification-succeeded`,
`verification-failed`, `planning-resumed`, `queue-resumed`, `work-paused`, `work-resumed`,
`work-cancelled`, `reconciliation-conflict-recorded`,
`review-scope-response-recorded`, `gate-decision-recorded`, `process-finding-recorded`, `process-finding-disposition-recorded`, and
`process-finding-disposition-superseded`. Each discriminated event variant contains `from_state`,
`to_state`, and the complete value named by the event. Lease events carry the complete revoked or
acquired lease; review events carry the complete review or failure policy; invalidation events carry
the complete invalidation effect. A transition consumes one supplied event ID per emitted event,
with revoke before acquire for two-event transfers. U2B never infers a value from a command name.

The event union uses one required `value` field after `kind`, `from_state`, and `to_state`. Its type
is fixed by kind: plan-review-submitted uses `ReviewManifestV1`; dispatch uses
`ValidatedReviewDispatchV1`; changes-required uses `{ review: ValidatedReviewEvidenceV1;
policy: FailedReviewPolicyV1 }`; review accepted uses `ValidatedReviewEvidenceV1`; denial and queue
use `ApprovalEvidenceV1`; every lease acquire/revoke/heartbeat uses `LeaseSnapshotV1`; work handoff
uses `LeaseHandoffEffectV1`; pause and cancellation use `LifecycleInterruptionEffectV1`; resume uses
`LifecycleResumeEffectV1`; review findings, review accepted, Learn
accepted, and return for repair use `HandoffDecisionV1` and never mutate a lease; review invalidation and planning resume use
`InvalidationEffectV1 { review, approval, gates, resulting_state }`; exact merge and verification
events use `ExactMergeRecordV1` and `VerificationOutcomeV1`, respectively; review-scope response uses `ReviewScopeResponseV1`; gate uses
`GateDecisionV1`; finding creation uses `ProcessFindingV1`; finding disposition and supersession use
`FindingDispositionEffectV1`; reconciliation uses `ReconciliationEffectV1`. This mapping is exhaustive;
an event with another value type is `INVALID_ENVELOPE`.

`createInitialLifecycleSnapshotV1(projectId, issueId)` returns `NeedsPlanning`, null revision, the
`SHA256("mandem-events-v1\\0")` empty-stream digest defined below, null plan/review/approval/lease/handoff values, empty
exact-merge and verification values, empty gates/findings, zero token counters, failed-review count
zero with no responses, and
`return-to-planning` as its only next action. `applyLifecycleEventV1(snapshot, event)` is the only
event-fold function. It verifies identity, `from_state`, the prior revision/digest, then applies the
complete event value, performs every explicit clear/replace operation, sets revision to event ID,
updates the rolling event digest, and derives next actions. Invalidation events carry full lists of
review, approval and gate values to clear; an event never relies on the reducer command that created
it. Every command test must also prove that folding its emitted events from the input snapshot equals
the returned next snapshot. U2B rebuilds by folding ordered stored events from the initial snapshot.
Wrong prior revision or digest returns `STALE_SNAPSHOT` and the unchanged snapshot. Event
constructors always copy those two prior values from the reducer's current intermediate snapshot.

The event-stream digest is one prescribed SHA-256 chain. Let `D` be ASCII
`mandem-events-v1` followed by one zero byte. The empty digest is
`SHA256(D)`. For each event in order, serialize the complete validated `EventEnvelopeV1`, including
its `prior_revision` and `prior_events_digest`, to canonical bytes with the required trailing LF.
The next digest is `SHA256(D || hex_decode(prior_events_digest) || uint64be(byte_length) ||
event_bytes)`. `uint64be` is the unsigned eight-byte big-endian length of `event_bytes`; no hex,
separator, or platform text encoding participates. The event must name the snapshot's current
digest as its prior digest; then `applyLifecycleEventV1` verifies that anchor, applies the event,
and computes the next digest with this equation. Constructors use the intermediate digest before
building the next event in a batch. `canonicalDigestV1` remains the digest of one canonical value;
it is not the event-chain function. Export `initialEventsDigestV1` and
`advanceEventsDigestV1(priorDigest, canonicalEventBytes)` from the runtime barrel.

`ErrorCodeV1` contains exactly `INVALID_ENVELOPE`, `UNSUPPORTED_PROTOCOL_VERSION`,
`PROTOCOL_LIMIT_EXCEEDED`, `UNTRUSTED_PRINCIPAL`, `ACTOR_ATTRIBUTION_MISMATCH`,
`ACTOR_ROLE_FORBIDDEN`, `AUTHORITY_SCOPE_MISSING`, `INVALID_TRANSITION`, `ARTIFACT_MISSING`,
`ARTIFACT_STALE`, `APPROVAL_ABSENT`, `APPROVAL_DENIED`, `APPROVAL_STALE`, `GATE_ABSENT`,
`GATE_FAILED`, `GATE_STALE`, `LEASE_HELD`, `LEASE_REQUIRED`, `LEASE_EXPIRED`, `LEASE_NON_OWNER`,
`LEASE_FENCED`, `HANDOFF_INVALID`, `HANDOFF_LATE`, `PROCESS_FINDING_UNRESOLVED`,
`PROCESS_FINDING_UNKNOWN`, `PROCESS_FINDING_DISPOSITION_CONFLICT`, `REVIEW_REPLAN_REQUIRED`,
`REVIEW_OPERATOR_CHOICE_REQUIRED`, `STALE_SNAPSHOT`, and `RECONCILIATION_REQUIRED`.

`NextActionV1` contains exactly `refresh-plan-review`, `refresh-plan-approval`, `refresh-gate`,
`release-lease`, `reacquire-lease`, `dispose-process-finding`,
`record-exact-merge`, `return-for-repair`, `reconcile-sources`, `return-to-planning`,
`retry-command`, and `ask-operator`.

Canonical wire bytes are NFC UTF-8 JSON with object keys sorted lexically at every depth, arrays in
declared order, no insignificant whitespace, LF only, no byte-order mark, and exactly one trailing
LF. Parsers reject duplicate or unknown keys, unsafe JSON numbers, lone surrogates, non-NFC strings,
noncanonical UUIDs, hashes, timestamps, and repo paths. The envelope limit is 256 KiB and depth 8;
arrays allow at most 32 artifact references, 16 scopes, 16 event IDs, and 8 next actions; paths allow
1,024 UTF-8 bytes. Code tokens allow 64 ASCII bytes. Events and results are each limited to 512 KiB;
review output is 256 KiB; review validation input is 640 KiB with at most 32 writes and 32 session
attestations; a snapshot is 1 MiB with at most 64 gates, 64 findings, one active lease, two token
counters, and 32 handoff artifacts. Raw byte and collection-header limits are checked before hashing
or allocating nested values. A limit failure is
`PROTOCOL_LIMIT_EXCEEDED`, appends no event, and is retryable only with changed input.

`parseCanonicalJsonV1(bytes: Uint8Array)` uses a repository-owned recursive-descent tokenizer over
raw UTF-8 so duplicate keys, numeric tokens, byte order, and nesting remain observable. It returns
`ParseResultV1<unknown>` and never calls `JSON.parse` on untrusted bytes. Closed schema decoders then
validate each field; serializers accept validated values only.

`ParseResultV1<T>` is exactly `{ ok: true; value: T; canonical_bytes: Uint8Array;
digest: Sha256 }` or `{ ok: false; error: ProtocolErrorV1 }`. Success is returned only when the
input bytes already equal the canonical serialization of the fully validated value; it preserves
those exact bytes and their digest. Token, UTF-8, canonicalization, schema, and limit failures return
the stable `ProtocolErrorV1` named by the violated rule with nullable envelope identities when they
cannot be trusted. Decoders return the same generic result specialized to their public type.
Parsers never throw for untrusted input and never return a partial value.

The runtime module exports `parseCanonicalJsonV1`, `parseCommandEnvelopeV1`, `serializeCommandEnvelopeV1`,
`serializeCommandResultV1`, `parseEventEnvelopeV1`, `serializeEventEnvelopeV1`, and
`canonicalDigestV1`. Parsers return a discriminated `ParseResultV1`; they do not throw for untrusted
input.

## Lifecycle Guard Contract

`evaluateLifecycleCommand(input): LifecycleDecisionV1` in
`src/modules/execution/domain/lifecycle.ts` is the sole reducer entry point. Input contains the
complete snapshot, validated command, trusted principal, control-plane-attested `observed_at`, and
an explicit ordered list of event IDs plus nullable application-validated `review_dispatch`,
`review_evidence`, and `approval_evidence`. Only the matching review/approval command may receive
the corresponding non-null trusted input; all other combinations return `INVALID_ENVELOPE`. It first requires command `expected_revision` and
`expected_events_digest` to match the snapshot; mismatch returns `STALE_SNAPSHOT`. U2A returns those
same base anchors with its decision. U2B later owns the atomic compare-and-append that permits only
one decision from a base to commit. The reducer checks principal/attribution equality, role and scopes, source state,
evidence freshness, and lease guards in that order. The unresolved-finding guard applies
only to rows that complete or leave a phase. Finding record, disposition and supersession, gate
recording, and reconciliation remain available. A rejected
decision contains one error and the unchanged snapshot. An accepted decision contains the complete
events, complete next snapshot, and `completed` or `accepted` status. It performs no I/O.

    interface LifecycleEvaluationInputV1 {
      readonly snapshot: LifecycleSnapshotV1;
      readonly command: CommandEnvelopeV1;
      readonly principal: TrustedPrincipalV1;
      readonly observed_time: ObservedTimeV1;
      readonly event_ids: readonly Uuid[];
      readonly dependency_statuses: readonly DependencyStatusV1[];
      readonly review_dispatch: ValidatedReviewDispatchV1 | null;
      readonly review_evidence: ValidatedReviewEvidenceV1 | null;
      readonly approval_evidence: ApprovalEvidenceV1 | null;
      readonly workspace_observation: ValidatedWorkspaceObservationV1 | null;
    }

`event_ids` contains exactly the count declared by the command-to-event mapping and no duplicate.
Dependency statuses sort by issue UUID and are consumed only by work acquisition; other commands
require an empty list. Trusted evidence fields follow the same matching-command-only rule.
`workspace_observation` is non-null exactly for every command payload that contains `workspace` and
null for every other command. Absence or presence on the wrong command is `ARTIFACT_MISSING` or
`INVALID_ENVELOPE` before lifecycle guards.

`LifecycleDecisionV1` is exactly `{ accepted: true; events: EventEnvelopeV1[];
next_snapshot: LifecycleSnapshotV1; result: CommandResultV1 } | { accepted: false; events: [];
next_snapshot: LifecycleSnapshotV1; result: CommandResultV1 }`. On rejection, `next_snapshot` is
structurally equal to the input snapshot.

### Exhaustive rejection contract

Every command evaluates guards in this order and stops at the first failure: raw protocol and
limits; expected revision/events digest; trusted-input presence; principal identity; requested
attribution; role; scope; source state; review-limit policy; artifact/workspace/dependency
freshness; approval; gates; unresolved findings; lease; handoff; finding/disposition; and
command-specific reconciliation predicates. `retryable: true` means the same command kind may be
resubmitted with refreshed/corrected inputs; `false` means the caller must take the named different
action or obtain authority. `evidence` is the canonically sorted validated artifact references that
caused the failure, and is empty when parsing failed before an artifact was trustworthy or the
failed guard has no artifact. This is the sole exception to the general nonempty evidence-array
rule. An implementation never fabricates evidence.

The following matrix is exhaustive. Context alternatives in one row select the exact stated action;
there is no fallback or implementation discretion. Every action array has exactly one member.

| Ordered failing guard | Error / retryable | Evidence | `next_actions` |
| --- | --- | --- | --- |
| malformed bytes, unknown/duplicate field, noncanonical value | `INVALID_ENVELOPE` / true | empty | `[retry-command]` |
| protocol version other than 1 | `UNSUPPORTED_PROTOCOL_VERSION` / false | empty | `[return-to-planning]` |
| byte/depth/collection limit | `PROTOCOL_LIMIT_EXCEEDED` / true | empty | `[retry-command]` |
| expected revision, expected digest, event prior revision, or event prior digest mismatch | `STALE_SNAPSHOT` / true | empty | `[retry-command]` |
| required trusted evaluation input absent | `ARTIFACT_MISSING` / true | available locator artifacts | review -> `[refresh-plan-review]`; approval -> `[refresh-plan-approval]`; gate -> `[refresh-gate]`; workspace/dependency -> `[reconcile-sources]` |
| trusted input present for the wrong command | `INVALID_ENVELOPE` / true | that trusted input's source artifacts | `[retry-command]` |
| unauthenticated or invalid transport principal | `UNTRUSTED_PRINCIPAL` / false | empty | `[ask-operator]` |
| requested actor differs from trusted principal | `ACTOR_ATTRIBUTION_MISMATCH` / false | empty | `[ask-operator]` |
| role/command or role/scope pair absent from the exhaustive matrix | `ACTOR_ROLE_FORBIDDEN` / false | empty | `[ask-operator]` |
| allowed role lacks the row's required scope | `AUTHORITY_SCOPE_MISSING` / false | empty | `[ask-operator]` |
| command not listed for current lifecycle state, including terminal mutation | `INVALID_TRANSITION` / false | empty | `[return-to-planning]` |
| third-response/replan boundary reached | `REVIEW_REPLAN_REQUIRED` / false | readiness/scope artifacts | `[return-to-planning]` |
| fifth-choice or later-choice boundary lacks matching declaration/permit | `REVIEW_OPERATOR_CHOICE_REQUIRED` / false | current readiness/scope artifacts | `[ask-operator]` |
| required artifact/dependency/evidence absent | `ARTIFACT_MISSING` / true | available related artifacts | review -> `[refresh-plan-review]`; workspace/dependency/reconciliation -> `[reconcile-sources]`; other command evidence -> `[retry-command]` |
| plan, review, dispatch, output, attestation, lineage, readiness, or workspace artifact mismatched/stale/foreign | `ARTIFACT_STALE` / true | exact stale/mismatched artifacts | review/lineage/readiness -> `[refresh-plan-review]`; workspace -> `[reconcile-sources]`; other -> `[retry-command]` |
| approval locator/value absent | `APPROVAL_ABSENT` / true | available locator | `[refresh-plan-approval]` |
| exact denial | `APPROVAL_DENIED` / false | denial source | `[return-to-planning]` |
| approval issue/action/commit/digest no longer matches | `APPROVAL_STALE` / true | approval source and plan | `[refresh-plan-approval]` |
| required gate ID missing | `GATE_ABSENT` / true | accepted review/gate artifacts | `[refresh-gate]` |
| gate outcome failed | `GATE_FAILED` / false | failing gate evidence | `[return-for-repair]` |
| gate definition/input/target/time stale | `GATE_STALE` / true | stale gate evidence | `[refresh-gate]` |
| unresolved process finding blocks phase exit/completion | `PROCESS_FINDING_UNRESOLVED` / false | finding evidence | `[dispose-process-finding]` |
| lease required but absent, including wrong `without-active-lease` variant | `LEASE_REQUIRED` / true | workspace observation | `[reacquire-lease]` |
| another live lease prevents acquisition | `LEASE_HELD` / false | workspace-observation source when present, otherwise empty | `[release-lease]` |
| active lease expired | `LEASE_EXPIRED` / true | workspace-observation source when present, otherwise empty | `[reacquire-lease]` |
| lease owner/session mismatch | `LEASE_NON_OWNER` / false | workspace-observation source when present, otherwise empty | `[ask-operator]` |
| lease ID/token mismatch or stale prior owner, including wrong `with-active-lease` variant | `LEASE_FENCED` / true | workspace-observation source when present, otherwise empty | `[reacquire-lease]` |
| handoff schema/pairing/source/target invalid | `HANDOFF_INVALID` / true | handoff artifacts | `[return-for-repair]` |
| handoff target revision is older than current revision | `HANDOFF_LATE` / true | handoff and current-target artifacts | `[return-for-repair]` |
| finding ID does not exist | `PROCESS_FINDING_UNKNOWN` / true | supplied finding artifacts | `[retry-command]` |
| disposition conflicts with current event or supersession link | `PROCESS_FINDING_DISPOSITION_CONFLICT` / true | finding/disposition artifacts | `[retry-command]` |
| valid ledger contains an authority-sensitive contradiction | `RECONCILIATION_REQUIRED` / false | contradiction artifacts | `[reconcile-sources]` |

For each lifecycle-table row, the named evidence predicate selects the context alternative above.
The row adds no new error family. Parser tests cover the first three rows; the exhaustive
role/command/state fixture crosses every command with identity, role, scope, source-state, review
limit, evidence, approval, gate, finding, lease, and handoff failures in the stated order and asserts
the complete `ProtocolErrorV1`, including empty/nonempty evidence, retryability, and exact action.

Every row also rejects malformed trusted evidence with `ARTIFACT_STALE`, missing required evidence
with `ARTIFACT_MISSING`, and an unresolved finding
on a phase-completion row with `PROCESS_FINDING_UNRESOLVED`.

| From | Command | Required role and scope | Lease/evidence rule | To and event effect |
| --- | --- | --- | --- | --- |
| `NeedsPlanning` | `submit-plan-review` | phase-agent, `submit-plan-review` | Exact plan, `PLANS.md`, pushed branch/PR and complete manifest; review limits allow dispatch | `PlanReview`; store submitted manifest |
| `NeedsPlanning` | `record-review-scope-response` | phase-agent/operator for third response; operator only for fifth choice, `decide-plan` | Exact response kind required by current lifetime count | same; store response or choice |
| `PlanReview` | `record-plan-review-dispatch` | control-plane, `dispatch-plan-review` | Validated dispatch matches submitted manifest | same; store dispatch |
| `PlanReview` | `record-plan-review-verdict` changes required | reviewer, `decide-plan` | Validated evidence, exact round, `changes-required` | `NeedsPlanning`; increment lifetime counter and store response requirements |
| `PlanReview` | `record-plan-review-verdict` clean | reviewer, `decide-plan` | Clean validated evidence and all process findings disposed | `NeedsApproval`; store accepted review |
| `NeedsApproval` | `record-plan-decision` denied | operator, `decide-plan` | Exact denied approval record | `NeedsYou`; store denial |
| `NeedsApproval` | `queue-approved-plan` | operator or control-plane, `decide-plan` | Exact approved review-bound plan | `Queued`; store approval |
| `Queued` | `acquire-work-lease` | control-plane, `dispatch-work` | Dependencies/workspace ready; no active work lease | `Working`; acquire work lease |
| `Working` or `Merging` | `record-lease-heartbeat` | current owner, `heartbeat-lease` | Exact active session/token; timestamp before expiry | same; update heartbeat only |
| `Working` or `Merging` | `takeover-work-lease` | operator/control-plane, `takeover-lease` | Expired lease or explicit operator override | same; atomically revoke and replace lease |
| `Working` | `release-work-lease` | owner/operator/control-plane, `release-lease` | Exact token and reconciliation/workspace evidence | `Queued`; revoke lease |
| `Working` | `submit-work-handoff` | worker, `mutate-work` | Exact work lease and complete handoff | `Reviewing`; revoke lease and store handoff |
| `Reviewing` | `record-review-findings` | reviewer/control-plane, `review-work` | Exact reviewed head and successor worker | `Working`; create next work lease atomically |
| `Reviewing` | `accept-review` | reviewer, `review-work` | Clean review at exact head; findings disposed | `Learning`; store handoff |
| `Learning` | `invalidate-review` | phase-agent, `record-learn` | Learn changed reviewed content | `Reviewing`; invalidate review |
| `Learning` | `accept-learn` | control-plane, `record-learn` | Complete handoff, findings disposed, gates fresh | `Merging`; acquire integration lease |
| `Merging` | `return-for-repair` | control-plane, `integrate` | Exact integration lease and repair evidence | `Working`; revoke integration and acquire work lease |
| `Merging` | `record-exact-merge` | control-plane, `integrate` | Exact lease, approved head, review/Learn/gates fresh | `Verifying`; preserve merge evidence |
| `Verifying` | `record-verification-success` | control-plane, `verify-merge` | Exact merge and plan-defined evidence | `Done`; closure event |
| `Verifying` | `record-verification-failure` | control-plane, `verify-merge` | Exact merge and failure evidence | `NeedsYou`; incident event |
| `NeedsYou` | `resume-planning` | operator, `reconcile-sources` | Resolution changes approved intent | `NeedsPlanning`; invalidate review, approval, gates |
| `NeedsYou` | `resume-queued` | operator, `reconcile-sources` | Runtime blocker resolved; approval still exact | `Queued`; preserve approval |
| `Queued`, `Working`, `Reviewing`, `Learning` | `pause-work` | operator, `pause-work` | Exact with/without-lease target; preserve workspace/evidence; revoke active lease when present | `Paused`; store interruption effect and fence prior owner |
| `Paused` | `resume-work` | operator, `pause-work` | Workspace and approval/gates reconciled; no active lease | `Queued`; store resume effect and require fresh lease |
| `NeedsPlanning`, `NeedsApproval`, `Queued`, `Working`, `Reviewing`, `Learning` | `cancel-work` | operator, `cancel-work` | Exact with/without-lease target; preserve workspace/evidence; revoke active lease when present | `Cancelled`; store interruption effect; terminal |
| any nonterminal | `record-reconciliation-conflict` | control-plane, `reconcile-sources` | Valid ledger but authority-sensitive contradiction; revoke current lease from snapshot when present | `NeedsYou`; store reconciliation effect and fence unsafe owner |
| any nonterminal | `record-gate-decision` | control-plane, `record-gate-decision` | Complete unique sorted gate value | same; replace only same gate ID |
| any nonterminal | `record-process-finding` | operator/phase-agent/worker/reviewer/control-plane, `record-process-finding` | Exact origin/role matrix; ID derived from canonical tuple | same; append or deterministic duplicate result |
| any nonterminal | `dispose-process-finding` | operator/control-plane; phase-agent only for deviation or no-change, `dispose-process-finding` | Current unresolved finding and required repair artifacts | same, or `NeedsPlanning` for contract gap |
| any nonterminal | `supersede-process-finding-disposition` | operator/control-plane, `dispose-process-finding` | Exact prior disposition event and different valid disposition | same, or `NeedsPlanning` for contract gap |

The exact command-to-event mapping is: submit, dispatch, review changes, review clean, denial, queue,
heartbeat, handoff, implementation findings, implementation clean, review invalidation, Learn,
merge, verification success/failure, planning resume, queue resume, pause, resume, cancel,
reconciliation, review-scope response, gate, finding creation, disposition and supersession each emit the like-named single
event in `EventKindV1`. Acquisition emits `work-lease-acquired`. Takeover emits `lease-revoked` then
`work-lease-acquired` or `integration-lease-acquired` matching the prior resource. Release emits
`lease-revoked`. Review findings emit `review-findings-recorded` then
`work-lease-acquired-for-repair`. Learn emits `learn-accepted` then
`integration-lease-acquired`. Return for repair emits `lease-revoked`,
`work-returned-for-repair`, then `work-lease-acquired-for-repair`. Pause and cancel include the
complete revoked lease in their single event instead of emitting a separate revocation. Contract-gap
finding disposition events contain the complete invalidation effect: prior review and approval,
sorted gate IDs and values, and resulting `NeedsPlanning` state. No other multi-event batch exists.

The intermediate transition rules are exact. `review-findings-recorded` is
`Reviewing -> Reviewing` and stores only the handoff; `work-lease-acquired-for-repair` is
`Reviewing -> Working` and alone installs the replacement work lease. `learn-accepted` is
`Learning -> Learning` and stores only the handoff; `integration-lease-acquired` is
`Learning -> Merging` and alone installs the integration lease. For merge repair, `lease-revoked`
is `Merging -> Merging` and alone clears/fences the integration lease,
`work-returned-for-repair` is `Merging -> Merging` and stores only the handoff, and
`work-lease-acquired-for-repair` is `Merging -> Working` and alone installs the work lease. Each
event uses the prior revision and digest produced by the immediately preceding event. A
handoff-only event never reads or writes `active_lease` or token history; an explicit lease event is
the sole writer. Single-event work handoff applies its complete `LeaseHandoffEffectV1` once and has
no adjacent lease event. Pause, resume, cancellation, and reconciliation each apply their distinct
complete effect once and have no adjacent lease event.

Every table predicate is closed as follows. A complete manifest passes the exact review-binding
validator. A pushed branch/PR is a `PullRequestTargetV1` whose head equals the plan commit and whose
configured-repository digest appears in the trusted attestation. Dependencies ready means every
declared dependency has exactly one sorted `DependencyStatusV1` with state `complete`; a missing,
duplicate, or incomplete entry returns `ARTIFACT_MISSING` and `reconcile-sources`. Workspace ready
means the trusted `ValidatedWorkspaceObservationV1` matches the payload and configured repository;
acquisition also matches the approved branch/head, and an existing lease also matches workspace ID
and branch. Every lease
creation or transfer requires `expires_at > observed_time.observed_at`; otherwise it returns
`LEASE_EXPIRED` and `reacquire-lease`. A complete handoff contains every closed field, nonempty
evidence, a source session matching the active phase or lease, and a target revision matching the
named artifact. Reconciliation and verification evidence are nonempty artifact arrays with the
configured repository digest and exact target revision. Accepted review evidence stores the sorted
required gate IDs and definition digests read from the reviewed plan; Learn and merge require
exactly those current gates, all passed and fresh. All findings disposed means every snapshot
finding has a non-null current disposition event. Each failed predicate returns the stable error
named in the relevant policy subsection, the next action stated here, and no event.

`Done` and `Cancelled` reject ordinary mutations. `Merging` rejects release, pause, and cancellation;
the control plane must record the exact merge, return for repair, or reconcile a conflict.

## Exact Policy Rules

### Lease fencing

Acquisition uses the command ID as lease ID and the payload's required `expires_at`. The fencing token is the prior token for the resource
plus one, starting at `1`, represented as a positive unsigned 64-bit decimal string. Every worker or
integration mutation requires matching resource, owner, session, unexpired lease, and exact token.
A lease whose expiry is less than or equal to control-plane-attested `observed_at` remains active-but-expired until
takeover, operator release, pause, cancellation, or reconciliation revokes it. Ordinary acquisition
returns `LEASE_HELD`; a heartbeat at or after expiry returns `LEASE_EXPIRED`. A heartbeat never extends expiry. Takeover, handoff, release, pause, cancellation, review repair,
and merge repair record revocation and any replacement lease in one decision. The snapshot retains
the last token by resource so an old owner remains fenced after the active lease clears.
Takeover copies the prior lease's exact workspace into the replacement lease; review repair, Learn,
and merge repair use the exact workspace supplied in their command payload. Replay tests compare
each acquired lease workspace byte-for-byte with that declared source.

### Review binding

Raw manifest, receipt, output, approval, and attestation values are untrusted. Later U4/U5 adapters
resolve Git ancestry, parent write sets, provider delivery, configured repository identity, and
provider-issued session provenance. They produce one `ReviewEvidenceAttestationV1` containing those
closed facts and immutable source digests. `validateReviewEvidenceV1` is pure: it receives exact
manifest and output bytes plus that attestation and verifies internal consistency, every digest,
plan and `PLANS.md` targets, prompt digest, dispatch ID, reviewer/provider/model identity, role and
challenge lenses, distinct author/reviser/reviewer sessions, no authoring context, one declared
output path, exactly one attested write, and risk policy. It never reads Git or a provider.
It treats `verified_participants` and `participant_inventory_digest` as the sole authorship and
context provenance, derives the manifest participant claims from them, and rejects an omitted or
extra claim before testing session separation. Self-attestation and caller-provided context claims fail. High risk requires another provider or model when available; unavailable use requires
bound limitation evidence. Standard risk alone permits `not-required`.

Its complete interface is:

    interface ReviewValidationInputV1 {
      readonly manifest_bytes: Uint8Array;
      readonly dispatch: ValidatedReviewDispatchV1;
      readonly output_bytes: Uint8Array;
      readonly attestation: ReviewEvidenceAttestationV1;
      readonly required_gates: readonly { gate_id: string; definition_digest: Sha256 }[];
    }
    type ReviewValidationResultV1 =
      | { ok: true; value: ValidatedReviewEvidenceV1 }
      | { ok: false; error: ProtocolErrorV1 };
    function validateReviewEvidenceV1(
      input: ReviewValidationInputV1,
    ): ReviewValidationResultV1;

The function parses `manifest_bytes` through the closed `ReviewManifestV1` decoder, parses the
bounded Markdown output only through `parseReviewVerdictV1`, validates the typed trusted
attestation, derives every duplicated field in `ValidatedReviewEvidenceV1`, and returns
`ARTIFACT_STALE` for any mismatch. It never accepts caller-supplied validated evidence or a claimed
verdict. `serializeReviewManifestV1` and `parseReviewManifestV1` join the runtime barrel and use
`ParseResultV1<ReviewManifestV1>`; trusted `ReviewEvidenceAttestationV1` is constructed in-process
by the later adapter and has a validator but no public command decoder.

`parseReviewVerdictV1` accepts bounded NFC UTF-8 Markdown with LF endings and one trailing LF only.
The final nonblank line must be exactly `MANDEM_REVIEW_VERDICT: CLEAN` or
`MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED`, appearing once. Terminal text is never input. A caller
supplies only an exact reviewer commit/output locator; it cannot claim a verdict or validation
boolean.

### Approval and gate freshness

`validatePlanApprovalV1` accepts the existing parsed `ApprovalRecord`, its source reference and
configured-repository provenance supplied by a Git evidence adapter, issue
UUID, and accepted review. It requires `action: execute-plan`, `decision: approved`, response
`APPROVED`, matching issue UUID, and exact `plan_commit` and `plan_sha256`. Denial is a valid
`record-plan-decision` input but never queues work. Malformed, incomparable, or absent approval is
rejected before the reducer; changed plan bytes or commit return `APPROVAL_STALE`. Working-tree
content is irrelevant. U3 alone constructs `TrustedPrincipalV1` from authenticated local transport.
U4/U5 adapters construct review and approval provenance only after resolving immutable Git/provider
evidence. Protocol clients submit locators, never trusted values. An unrelated repository, rewritten
ref, issuer mismatch, or syntactically valid caller-supplied evidence fails closed.

Gate freshness compares gate ID, definition digest, sorted unique input digests, target revision,
outcome, evidence digests, and decision time. Recording one gate replaces only that ID. A guard
names the gates it consumes and returns absent, failed, or stale errors without modifying unrelated
gate values.

### Process findings and failed-review limits

`deriveProcessFindingIdV1` hashes canonical JSON of protocol version, project ID, issue ID, origin,
affected phase, evidence code, and canonically sorted evidence references. Clients never provide
the ID. Origins contain exactly `operator-correction`, `agent-error`, `review-finding`,
`interruption`, and `unexpected-delay`; dispositions contain exactly `execution-deviation`,
`issue-contract-gap`, `product-contract-gap`, `operating-contract-gap`, and
`no-reusable-change`. Operator may report operator correction; reviewer alone may report review
finding; a phase agent, worker, reviewer, or control plane may report its own session's agent error;
the active phase role or control plane may report interruption; control plane alone may report
unexpected delay from trusted time evidence. Every unspecified role/origin pair is forbidden.
Duplicate tuples append nothing,
while changed evidence creates a distinct finding. A disposition is current until a later event
explicitly supersedes its event ID.

`execution-deviation` and `no-reusable-change` keep state and governed evidence. The three contract
gap dispositions require the matching issue, epic, or operating-contract repair artifacts, move to
`NeedsPlanning`, and emit an effect containing the invalidated review, approval, and sorted gate IDs.

The retained native issue UUID means U2A preserves the former combined plan's thirteen failed
verdicts. U2A clean-room rounds 1–4 are lifetime failures fourteen through seventeen; the native issue records that count,
the earlier operator-selected `split` response, its repair evidence, and the U2A/U2B successor
scope. The split authorizes review of this reduced U2A issue but never resets its counter. A truly
new issue UUID begins at zero. A retained or imported issue is seeded by U2B with its complete
validated review-verdict and scope-response event history before a new command is evaluated; no
caller may provide a bare seed count.

`record-plan-review-verdict` increments the count only for fully validated `CHANGES_REQUIRED`
evidence. Counts one and two allow another review. At three, another submission
or dispatch requires a recorded `third-review-response`; `keep-scope`, `split`, or `redesign` is
allowed only with nonempty readiness and evidence artifacts. At
five, another submission or dispatch requires an operator choice of `split`, `redesign`, or
`permit-one-more`. Permit-one-more is consumed on the next dispatch and cannot authorize another;
a subsequent failure returns to the fifth-review boundary. Rewrites do not reset the count. Stale
manifests, unavailable reviewers, missing output, invalid evidence, and dispatch failures append no
failed-review event and do not increment it.

At counts zero through two, submission and dispatch are allowed and
`record-review-scope-response` returns `INVALID_TRANSITION`. At count three or four, submission and
dispatch are blocked until one third response exists and its plan target equals the submitted plan;
only the first third response is accepted. At count five or greater, submission and dispatch are
blocked until the latest fifth choice targets the submitted plan. Each new fifth choice is appended
to `fifth_review_choices`. `split` or `redesign` clears active permit and authorizes review only for
the reduced or redesigned issue lineage named by the choice evidence; later plan commits within
that recorded lineage preserve the choice and count. A command claiming another issue UUID or
scope returns `REVIEW_OPERATOR_CHOICE_REQUIRED`. `permit-one-more` records its own event ID as the active unconsumed
permission and authorizes exactly the next dispatch for the same plan; dispatch moves that ID to
`consumed_permit_choice_event_ids` and clears active permit. A sixth failed verdict preserves count
six and requires a later fifth-choice event targeting the next submitted plan. Event folding stores
the complete third response and ordered fifth-choice history, so a rewrite cannot reset them.

## Behavior Readiness Check

These seven rows are the current readiness declaration for U2A lineage
`723787f06b1e33896b70cbaabdfc9555dbbab306e4b9da09690b72a7218262a1`; their behavior names map
one-to-one to its seven `ScopeBehaviorIdV1` values. The next review manifest binds the exact plan
commit/digest containing these rows as its readiness artifact. Later edits change that artifact
digest and trace digests but not the lineage ID or behavior set.

| Behavior | Complete trace | Status |
| --- | --- | --- |
| Interpret one request | `CommandEnvelopeV1` -> closed parser/canonical digest -> reducer decision -> `CommandResultV1`; protocol tests cover every variant and limit | Ready |
| Reject invalid order | Lifecycle table -> ordered guard evaluation -> one `ProtocolErrorV1` and unchanged snapshot; lifecycle fixture tests every command/state boundary | Ready |
| Control one active agent | Lease/with-or-without target -> explicit transfer, interruption, or reconciliation effect -> snapshot token history -> stale-owner rejection; lease tests cover every transfer, lease-free branch, and expiry edge | Ready |
| Bind a clean-room review | Trusted complete participant inventory plus manifest/output/attestation bytes -> evidence validator -> derived participant/evidence value -> accepted-review event/snapshot; tests cover omission, substitution, self-review, and every stale input | Ready |
| Bind operator approval | Existing parsed approval -> exact issue/commit/digest comparison -> approval event/snapshot or typed rejection; freshness tests cover absence, denial, malformed and stale targets | Ready |
| Stop repeated failed reviews | Validated verdict -> lifetime counter event/snapshot -> third/fifth response guards; fixtures seed retained U2A at thirteen, apply rounds 1–4 as failures fourteen through seventeen, preserve the selected split lineage, and cover no reset and one-use permission | Ready |
| Hand complete values to U2B | Complete event payloads and resulting snapshot fields -> public runtime/execution barrels -> U2B storage input; origin/consumer audit and reducer parity tests cover every field | Ready |

Every stored value has a declared source: clients supply validated commands; transport supplies the
trusted principal; application adapters supply validated review, approval, and workspace observations; the caller
supplies event IDs and time in the command; and the reducer derives events, next snapshot, finding
IDs, lease tokens, invalidation effects, error codes, and next actions. Every output has a named
consumer: U2B stores events and snapshots; U3 executes the reducer; U4-U7 render or supply adapters.
No field requires an implementer to invent a producer or consumer. U2B owns checkpoint outbox and
completion entirely; U2A neither creates nor clears checkpoint state. U2B's import path is the sole
producer of a nonzero initial failed-review history and expresses every imported verdict and
operator response as the same public events that `applyLifecycleEventV1` folds; a bare counter is
invalid.

The final `src/modules/runtime/index.ts` exports all runtime aliases, closed catalogs, command,
event, result, error, snapshot and evidence types plus every parser, serializer and digest function
named above. The final `src/modules/execution/index.ts` exports `LifecycleDecisionV1`,
`evaluateLifecycleCommand`, `validateReviewEvidenceV1`, `parseReviewVerdictV1`,
`validatePlanApprovalV1`, `evaluateGateFreshnessV1`, lease validators,
`deriveProcessFindingIdV1`, finding disposition policy, and failed-review-limit policy. Neither root
barrel exports infrastructure. `src/modules/execution/api/composition.ts` exports no function in
U2A; it contains only its file overview so the required module boundary exists without pretending
to wire I/O.

## Plan of Work

### Milestone 1: Define and prove the runtime protocol

Create `src/modules/runtime/domain/protocol.ts` and its test first. Add exact aliases and shared
values to `types.ts`. Implement closed parsing, canonical serialization, limits, result/error/event
shapes, and digests. Export them through domain, API, and root barrels. The focused test must fail
because the protocol does not exist, then pass every variant and invalid-boundary fixture.

### Milestone 2: Create the execution module and exhaustive lifecycle reducer

Create the complete module skeleton and `domain/types.ts`. Add `lifecycle.ts` and a fixture inventory
with one minimal success for every table row, one invalid-source-state case for every command, exact
guard ordering, unchanged-snapshot rejection, and deterministic event/snapshot parity.

### Milestone 3: Add lease, review, approval, gate, finding, and review-limit policies

Implement each policy in its named pure domain file, starting with its failing test. Integrate each
policy into the lifecycle reducer only after its focused suite passes. Tests must use explicit
values, not Git, SQLite, provider, clock, or filesystem fakes.

### Milestone 4: Publish the module contract and prove architecture

Complete barrels and module documentation, add `Execution` to `src/modules/README.md`, create
`docs/architecture/control-protocol.md`, and index it from `docs/architecture/README.md`. Document
fact ownership, reducer inputs/outputs, lifecycle table, approval/review binding, and the U2B
storage boundary. Run focused tests and all repository gates.

## Exact Files and Tests

- Runtime: modify `src/modules/runtime/domain/types.ts`, `src/modules/runtime/domain/index.ts`,
  `src/modules/runtime/api/index.ts`, `src/modules/runtime/index.ts`, and
  `src/modules/runtime/README.md`; create `src/modules/runtime/domain/protocol.ts` and
  `src/modules/runtime/domain/protocol.test.ts`.
- Execution module shape: create `src/modules/execution/README.md`, `index.ts`, `domain/index.ts`,
  `domain/types.ts`, `application/index.ts`, `infrastructure/index.ts`, `api/composition.ts`,
  `api/index.ts`, and `tests/fakes/index.ts`.
- Execution policies and adjacent tests: create `domain/lifecycle.ts`, `lifecycle.test.ts`,
  `leases.ts`, `leases.test.ts`, `review-binding.ts`, `review-binding.test.ts`, `freshness.ts`,
  `freshness.test.ts`, `gates.ts`, `gates.test.ts`, `routed-items.ts`, `routed-items.test.ts`,
  `failed-review-limits.ts`, `failed-review-limits.test.ts`, and `reducer-determinism.test.ts`.
- Documentation: modify `src/modules/README.md` and `docs/architecture/README.md`; create
  `docs/architecture/control-protocol.md`.

Test scenarios are prescriptive:

- `protocol.test.ts`: round-trip every command/event/result member; reject unknown key/version,
  duplicate key, wrong UUID/hash/timestamp/path, unsafe number, non-NFC/LF bytes, first-over-limit
  value, and noncanonical order; assert stable error and next action. Cover every artifact kind and
  provider/nullability combination, every handoff kind/outcome/code pairing, every reason,
  resolution, and verification-failure code, both `ParseResultV1` variants, and unknown values for
  each closed catalog.
- Event digest fixtures assert the literal hex output for the empty domain, one fixed event, and
  each intermediate digest in a fixed multi-event transfer. Tampering with the prior digest fails,
  and U2B-style replay over the same canonical event bytes produces the identical final digest.
- `lifecycle.test.ts`: one success fixture per table row; every command in every invalid source
  state; stale-snapshot and unresolved-finding completion blocks; terminal-state rules; event
  inventory parity; accepted event reduction equals returned snapshot. Record an exact merge,
  delete the derived snapshot, replay solely from events, and prove approved head, merge SHA,
  evidence, verification outcome, and failure code are byte-identical. Accept matching verification
  and reject a different merge SHA without an event.
  For every rejected fixture, assert the first guard, exact code, retryable boolean, exact sorted
  evidence array, and exact one-member next-action array from the rejection matrix; permute two
  simultaneous failures to prove guard order.
- `leases.test.ts`: expiry without takeover, heartbeat at and after expiry, wrong owner, wrong
  session, wrong token, takeover, handoff, release twice, merging release, pause, cancellation,
  review repair, merge repair, first mutation by the replacement owner, and backdated or future
  client `occurred_at` values evaluated only against attested `observed_at`. For review repair,
  Learn integration, and merge repair, assert every intermediate state/revision/digest, prove
  handoff-only events leave lease/token bytes unchanged, prove the explicit lease event is the sole
  mutation, and reject the stale owner after revocation.
  For pause and cancellation, cover every listed source state with the required no-lease variant
  and every lease-bearing state with the matching lease variant; reject the opposite variant,
  replay the exact interruption effect, and compare workspace, evidence, revoked lease, and both
  token counters byte-for-byte. Resume proves null active lease and preserved counters. Reconcile a
  conflict in a lease-free state and with both work and integration leases, then replay and reject
  each stale owner.
  Every workspace-bearing case supplies a matching trusted observation, then independently rejects
  absence, wrong-command presence, foreign repository, wrong workspace ID/branch/head/path digest,
  stale source artifact, acquisition against an unapproved head, and lease transfer across another
  workspace.
- `review-binding.test.ts`: exact clean case; missing/terminal-only/nonfinal/repeated/malformed marker;
  changed plan, `PLANS.md`, prompt, receipt, output, attestation, or risk evidence; wrong reviewer;
  author/reviser collision; inherited context; stale round; non-descendant; decoy path; extra write;
  unavailable alternative without evidence; valid bounded unavailable case. Round-trip the exact
  manifest and every risk-policy variant; reject unknown risk/lens/context/provider values,
  unsorted/duplicate/oversized collections, field mismatches between manifest, attestation, and
  derived evidence, author/reviser/reviewer session collisions, inherited reviewer context, and a
  high-risk unavailable alternative without the committed limitation artifact.
  Require at least one independently verified author; derive all participant claims from the
  trusted complete inventory; cover zero revisers with a complete empty trusted set; and reject an
  empty author set, omitted observed reviser, self-review by omission, substituted subject/path or
  digest, incomplete inventory digest, and manifest-only participant claims.
- `freshness.test.ts`: exact approval; absent, denied, malformed, incomparable, wrong issue/action,
  wrong commit/digest, changed plan; exact gate, absent/failed/stale gate, unrelated gate preserved.
- `gates.test.ts`: sorted unique values, duplicate rejection, replace one gate, preserve others.
- `routed-items.test.ts`: role/origin matrix, stable dedupe, changed evidence identity, unresolved
  completion block, every disposition, required repair artifacts, supersession, invalidation effect.
- `failed-review-limits.test.ts`: counts one/two; third response; rewrite no reset; fifth choice;
  one-use permission; sixth failure; stale/unavailable/invalid evidence no increment. Seed the
  retained U2A issue from thirteen verdict events plus the recorded split response, apply U2A
  rounds 1–4 as failures fourteen through seventeen, and prove another plan commit in the same split lineage retains seventeen
  while another issue or scope digest remains blocked. Reject unsorted successors, a split without
  a distinct successor, and a readiness artifact whose scope digest differs. Also prove a genuinely
  new issue starts at zero.
  Use one fixed split declaration whose lineage ID is computed without readiness bytes; after
  failure seventeen, change both plan and readiness artifact digests while retaining that ID and
  behavior set, then allow U2A and reject another issue, another behavior set, a recomputed lineage,
  a self-referential declaration, and an artifact whose bytes do not match the declaration.
- `reducer-determinism.test.ts`: byte-identical decision for identical input, no ambient I/O, every
  snapshot/event field has a declared input or reducer derivation, and every public value is
  reachable through the correct root barrel without infrastructure exports. It also folds every
  emitted event from the initial snapshot, rejects an event at the wrong revision or digest, and
  proves two distinct decisions from one base carry the same expected anchors for U2B to compare.
- Authorization matrix: test every role/command and role/scope pair, including accepted
  control-plane `integrate` for both `return-for-repair` and `record-exact-merge` and rejection for
  every other role; unknown role or scope,
  requested-attribution/principal mismatch, client-supplied trusted evidence, unrelated repository,
  rewritten ref, issuer mismatch, and self-attestation. Every unspecified pair is denied.

## Concrete Steps

From the repository root, implement in milestone order. Before production code for each milestone,
add its named test and run the focused command to record the expected failure:

    bunx vitest run src/modules/runtime/domain src/modules/execution/domain

After the smallest implementation makes the focused suite pass, run:

    bun run architecture:check
    bun run typecheck
    bun run lint

After documentation and barrels are complete, run:

    bun run docs:audit
    bun run authored-files:check
    bun run vocabulary:check
    bun run issue-graph:check
    bun run check

The worker must record the first failing test, focused green result, and full check result in this
plan's living sections and in the native issue. The worker commits each verified milestone on an
isolated worktree, pushes the implementation branch, and opens a draft implementation PR before
implementation review. The worker does not merge.

## Validation and Acceptance

Acceptance requires all named focused tests, `bun run architecture:check`, and `bun run check` to
pass. A human can inspect `docs/architecture/control-protocol.md` and trace every lifecycle request
to its event, next snapshot, rejection family, and recovery action. Deleting U2B and all I/O from
the test environment must not affect the pure suite.

U2A is complete only when U2B can type its storage input from the public barrels and preserve every
event and snapshot value without adding a command, event field, lifecycle judgment, lease rule,
review or approval rule, gate rule, finding rule, failed-review rule, or next action.

## Idempotence and Recovery

Planning and pure test commands are safe to repeat. Identical reducer inputs must return identical
decisions. U2A defines the idempotency identity and canonical payload digest; U2B owns receipt lookup
and exact retry results, including duplicate-delivery metadata. U2A evaluates fresh commands only.
Any plan change after clean review requires a new manifest
and review. Any change after approval requires a new review and approval.

## Risks and Mitigations

- Risk: The reduced plan accidentally restores storage or adapter work. Mitigation: exact file list,
  no U2A infrastructure implementation, and tests that run without I/O.
- Risk: A complete-looking snapshot omits a fact U2B needs. Mitigation: every event carries complete
  changed values, the readiness audit maps every field to a producer and consumer, and U2B cannot
  invent lifecycle meaning.
- Risk: Review evidence becomes caller-asserted booleans. Mitigation: only complete
  `ValidatedReviewDispatchV1` and `ValidatedReviewEvidenceV1` values enter the reducer.
- Risk: The finite policy drifts. Mitigation: checked command/event catalogs and fixture parity make
  an added union member without transition and rejection coverage fail.
- Risk: Historical review churn resumes. Mitigation: lifetime counters, third/fifth boundaries, the
  author-side readiness audit, and a single whole-plan clean-room review attempt after this rewrite.

## Artifacts and Notes

The former combined plan is recoverable at commit
`2b53f63cc87df641cde998b59f92127729756f7d`. Its reviewer outputs are evidence, not approval.
Draft planning PR #37 preserves the planning and review timeline. The native graph apply for the U2
split passed at graph digest `1960d2f1cc0207a82d3a6114bc7e4b7a48b289dffa6413b44457a971f093461a`.

Whole-plan revision note (2026-08-04): Replaced the U2A scaffold with a complete pure work-control
contract. Specified public protocol and snapshot values, every lifecycle row, lease fencing, review
and approval binding, gates, process findings, failed-review limits, exact files, falsification
tests, U2B handoff values, and the author-side readiness audit. Kept storage and external adapters
out of U2A.

Review-repair note (2026-08-04): Preserved the retained issue's thirteen former failures plus U2A
round 1, recorded the selected split lineage without resetting the counter, made the closed
artifact/handoff/reason/result schemas explicit, documented the exhaustive role/scope matrix,
stored exact merge and verification facts in events and snapshots, and added replay, mismatch,
unknown-value, and historical-counter fixtures for every repaired boundary.

Round-2 repair note (2026-08-04): Preserved lifetime failure fifteen; aligned both control-plane
transition scopes with the exhaustive matrix; specified every review participant, risk,
attestation, manifest, validated-evidence, validator-input, and result field; defined the exact
domain-separated event-digest equation; and assigned lease mutation to one explicit event at every
intermediate step with fixed replay fixtures.

Round-3 replanning note (2026-08-04): Stopped review after U2A's third failed verdict and preserved
lifetime failure sixteen. The whole-plan audit kept the reduced scope and repaired its common cause:
pause/cancel now use discriminated lease targets and complete interruption effects; resume has a
distinct no-lease effect; reconciliation records nullable complete revocation and token history;
and trusted participant inventory independently produces every author, reviser, reviewer, context,
and attestation fact consumed by review validation. Updated all living sections and replay tests.

Round-4 repair note (2026-08-04): Preserved lifetime failure seventeen. Replaced the mutable,
self-referential scope digest with one immutable operator-decision lineage declaration and separate
per-plan readiness declaration; added the exhaustive ordered rejection/error/retry/evidence/action
matrix; and required a trusted configured-repository workspace observation for every
workspace-bearing command, with mismatch and no-lease fixtures.
