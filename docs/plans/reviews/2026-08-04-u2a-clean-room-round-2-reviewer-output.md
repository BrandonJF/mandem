# Reviewed Targets

- Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md` at `85018c7a0532e1a64c4dac208c37cfb46f800cd3`; SHA-256 verified from Git object bytes as `f02e7414ac5b974752740e0fca29f35b9aa4f21270ff6bdda57a1ac1f1731025`.
- Governing contract: `PLANS.md` at the same commit; SHA-256 verified from Git object bytes as `009eb0f26084005cdee79b555239f758de806ac1f1e15bcc731523b98826a6d3`.
- I inspected the bound prompt, the complete operating and governing contracts, parent epic, U2B scaffold, issue graph, runtime and architecture-standard public surfaces, approval contract, all thirteen former U2 reviewer outputs, and the U2A round-1 prompt and reviewer output.

# PLANS.md Conformance

The file-only ExecPlan exception applies. The plan states a user-visible outcome, maintains the required living sections, identifies files and milestones, gives repository-root commands and validation gates, keeps SQLite, checkpoints, Git, provider adapters, and runtime I/O outside U2A, and ends with revision notes. It schedules implementation evidence instead of claiming that evidence exists.

The plan does not meet the non-negotiable self-contained, novice-execution, complete-interface, or deterministic-replay requirements. Its exhaustive authorization matrix contradicts two transition rows. Several review-evidence fields have no closed types or validation rules. The event digest has no update formula, and three multi-event lease transfers provide two incompatible sources for the same lease state. A worker must choose behavior that changes acceptance, event bytes, or replay.

# Prior-Finding Closure

- `U2A-CR1-001` — **CLOSED.** The retained issue keeps the thirteen former verdicts, records U2A round 1 as failure fourteen, carries the operator-selected split lineage, and requires U2B to supply imported history as complete review-verdict and scope-response events rather than a seed count. The dedicated fixture covers the retained and new-issue cases.
- `U2A-CR1-002` — **CLOSED.** `integrate` is in the closed scope catalog and the matrix permits it only to the control plane. Both `return-for-repair` and `record-exact-merge` require that pair, with authorization fixtures required.
- `U2A-CR1-003` — **CLOSED.** Exact merge and verification records contain the approved head, merge SHA, evidence, and failure code. They appear in events and snapshots, require matching verification SHA, and have an event-only replay fixture.
- `U2A-CR1-004` — **OPEN.** The repair closes the artifact, handoff, reason, resolution, failure, and parse-result values named in round 1. The plan still calls the review protocol complete while leaving review-attestation and risk-policy shapes undefined. Finding `U2A-CR2-002` identifies the remaining required repair.

# Verdict

`CHANGES_REQUIRED` — 4 P1, 0 P2.

# Findings

## U2A-CR2-001 — P1: The exhaustive role/scope matrix rejects two control-plane transition rows

Exact evidence: The matrix says a control-plane principal may hold `dispatch-plan-review`, `dispatch-work`, `heartbeat-lease`, `takeover-lease`, `release-lease`, `record-learn`, `integrate`, `verify-merge`, `reconcile-sources`, `record-gate-decision`, `record-process-finding`, and `dispose-process-finding`, and rejects every other role/scope pair at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:240-249`. The lifecycle table nevertheless permits control plane with `decide-plan` for `queue-approved-plan` at line 614 and control plane with `review-work` for `record-review-findings` at line 620. Neither pair is in the exhaustive matrix.

Failure scenario: a control-plane principal queues an exact approved plan or records review findings. If its requested scopes satisfy the matrix, it lacks the table-required scope and fails the transition. If it includes the required scope, the matrix requires `ACTOR_ROLE_FORBIDDEN` before the transition. Two implementations can resolve the conflict differently, so their accepted commands and event streams differ.

Smallest repair: choose the intended authority for each row. Either add exactly `decide-plan` and `review-work` to the control-plane matrix, or remove control plane from the corresponding rows and require a role that already holds the scope. Add success and rejection fixtures for both commands, then make the promised exhaustive role/command and role/scope test use that single catalog.

## U2A-CR2-002 — P1: Review binding still has undefined wire fields and no complete validator interface

Exact evidence: `ReviewManifestV1` names `author_attestations`, `reviser_attestations`, `reviewer_attestation`, and `risk_policy`; `ValidatedReviewEvidenceV1` names `authors`, `revisers`, `challenge_lenses`, `risk_policy`, and `attestation_digests`; and `ReviewEvidenceAttestationV1` names `write_set`, `provider_session`, and `source_digests` at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:334-347`. The later field rules define only `ReviewWriteV1` and `ReviewSessionIdentityV1` among those values, at lines 371-386. They do not assign types, collection bounds, sort or uniqueness rules, closed risk-policy values, or parser/validator relationships for the remaining fields. The plan specifies the inputs to `evaluateLifecycleCommand` at lines 566-591 but gives no signature for the exported `validateReviewEvidenceV1` that must consume the exact manifest and output bytes described at lines 685-698.

Failure scenario: one worker represents author and reviser attestations as session identities while another uses artifact references; one accepts an empty risk policy while another requires an availability record. Both can form a TypeScript value that fits the field sketches, but they compute different canonical manifest and evidence bytes. A later trusted adapter and U2B cannot parse, validate, store, or replay one common review decision.

Smallest repair: define every field in the three review values as an exact readonly TypeScript shape, including closed risk-policy and availability/limitation values, bounded canonical collections, and the relationship between manifest claims, trusted attestations, and derived validated evidence. Give `validateReviewEvidenceV1` an exact input and result signature that includes the bounded raw manifest and output bytes plus the typed attestation. Add parser, serializer, unknown-value, ordering, author/reviser collision, inherited-context, and high-risk unavailable-alternative fixtures for those exact shapes.

## U2A-CR2-003 — P1: Event replay has no prescribed events-digest update algorithm

Exact evidence: The initial snapshot uses “the digest of an empty canonical event array” at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:506-510`. Each event carries `prior_events_digest` at lines 472-475, and `applyLifecycleEventV1` verifies that prior value before it “updates the rolling event digest” at lines 510-518. The plan defines canonical JSON and `canonicalDigestV1`, but it never defines whether the next digest hashes the full canonical event array, the prior digest plus canonical event bytes, another chain construction, or which event envelope fields participate.

Failure scenario: two U2B instances fold the same ordered events. One hashes the canonical array accumulated through the current event; another hashes the prior digest concatenated with the canonical event. Both match the initial digest and every event's supplied prior anchor, yet emit different next snapshots and reject different `expected_events_digest` values. Compare-and-append cannot provide the one conflict boundary that U2B requires.

Smallest repair: specify one exact digest equation, including the canonical byte sequence, domain separation if any, initial value, and per-event update order. Require event constructors and `applyLifecycleEventV1` to use that equation. Add fixed byte fixtures for the empty stream, one event, a multi-event transfer, a tampered prior digest, and equivalent U2B replay.

## U2A-CR2-004 — P1: Multi-event lease transfers do not state which event applies the lease effect

Exact evidence: `LeaseHandoffEffectV1` contains both `revoked_lease` and `acquired_lease` at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:430-432`. The exhaustive event mapping assigns that complete effect to `review-findings-recorded`, `learn-accepted`, and `work-returned-for-repair` at lines 492-504. The command-to-event mapping also emits separate lease events for the same transitions: review findings emits `review-findings-recorded` then `work-lease-acquired-for-repair`; Learn emits `learn-accepted` then `integration-lease-acquired`; and return-for-repair emits `lease-revoked`, `work-returned-for-repair`, then `work-lease-acquired-for-repair` at lines 639-651. `applyLifecycleEventV1` must apply each event's complete value at lines 510-516, but the plan does not say whether the handoff effect changes the active lease or merely records a summary.

Failure scenario: after a clean review, one reducer applies the `acquired_lease` in `learn-accepted` and sees the following `integration-lease-acquired` as a duplicate. Another ignores the same field until the lease event. Their intermediate revisions, active leases, and event-digest anchors differ, so they cannot replay the same three-event batch or fence an old owner consistently.

Smallest repair: choose one event model for each transfer. Either put lease mutation only in the explicit revoke/acquire events and replace the handoff-event value with an exact handoff-only value, or retain the complete effect in one handoff event and remove the redundant lease events. Define each emitted event's `from_state`, `to_state`, active-lease update, revision, and digest order. Add replay fixtures for review repair, Learn integration, and merge repair that prove every intermediate snapshot and stale-owner rejection.

# Verification Notes

I used `git show 85018c7a0532e1a64c4dac208c37cfb46f800cd3:<path>` for the reviewed plan, governing contract, epic, review artifacts, dependency plan, and repository surfaces. I verified both bound SHA-256 values from those object bytes and did not use working-tree content as plan evidence. I did not require implementation evidence scheduled by the plan. I made no repository, issue, pull-request, or Git mutation other than this manifest-authorized reviewer output.

MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED
