# Reviewed Targets

- Review prompt: `docs/plans/reviews/2026-08-04-u2-clean-room-round-5-prompt.md` at `ab576b705cb382f68b8e6c80350aae279f148152`, SHA-256 `9270f00ac54c0c3633f50ab1b1a90293cc9592919d7cb3db226e23f87466b123`.
- Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md` at `f17752b086ebcf59c5ba895cf3404488387433a0`, SHA-256 `85ba4163effd34c503ff69223378d454073c27e3f66b717a625079d45e3129b1`.
- Governing contract: `PLANS.md` at `f17752b086ebcf59c5ba895cf3404488387433a0`, SHA-256 `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0`.
- Epic: `docs/plans/2026-07-21-001-feat-mandem-plan.md` at the reviewed commit.
- Review lens: complete `PLANS.md` conformance, executor safety, adversarial counterexamples, and closure of every authoritative prior U2 finding.

# PLANS.md Conformance

The plan passes the content-only Markdown format rule, purpose and observable-outcome requirements, repository orientation, core-term definitions, dependency snapshot, ordered milestones, repository-root Bun commands, red/green observations, validation gates, recovery guidance, and bottom revision-note requirement. Its Bun and SQLite instructions are repository-local, and the external links carry provenance rather than required implementation decisions. The plan correctly schedules implementation evidence instead of claiming that the implementation exists.

The plan does not pass the non-negotiable self-containment, novice-execution, deterministic replay, and current living-document requirements. The new review-evidence contract cannot derive all claimed facts from its declared port values, and its exact event schema cannot retain the validated review decision that replay requires. The merge repair transition also leaves lease behavior for the resulting `Working` state undefined. Finally, `Outcomes & Retrospective` describes a review state that predates all five review rounds.

The single-fenced-block rule does not apply because the Markdown file itself contains the ExecPlan. Prototype and parallel-implementation guidance does not apply because the plan schedules neither.

# Prior-Finding Closure

- Round 1, protocol schemas and public interfaces: **OPEN again** for the review-evidence additions. The original command, result, error, event, checkpoint, and port catalogs are present, but findings `U2-R5-001` and `U2-R5-002` identify incomplete new trusted-evidence and event contracts.
- Round 1, process-finding creation and deduplication: **CLOSED**. The command, deterministic identity, uniqueness rule, duplicate result, authorization, persistence, and replay tests remain specified.
- Round 1, novice-executable milestones: **CLOSED**. Milestones 1-5 retain named files and exports, exact commands, and expected red and green observations.
- Round 1, external Bun and SQLite dependency: **CLOSED**. The plan embeds the required API, transaction, WAL, backup, migration, restoration, and failure instructions.
- Round 2 `U2-R2-001`, complete Protocol v1 schemas and policy outcomes: **OPEN again**. The newly added review-evidence values and the merge-repair lease outcome still require executor judgment; see `U2-R5-001` through `U2-R5-003`.
- Round 2 `U2-R2-002`, process-finding identity and per-phase authority: **CLOSED**.
- Round 3 `U2-R3-001`, complete reducer policy state: **OPEN again** for accepted-review replay. The reducer receives validated review evidence, but the prescribed event bytes cannot store it; see `U2-R5-002`.
- Round 3 `U2-R3-002`, heartbeat, takeover, release, and complete lease values: **CLOSED** for those requested primitives. `U2-R5-003` is a separate ambiguity in the existing `return-for-repair` transition.
- Round 3 `U2-R3-003`, replayable process-finding disposition effects: **CLOSED**.
- Round 4 `U2-R4-001`, trusted independent-review evidence: **OPEN**. The port and adapter are now named, but their values, validator inputs, risk comparison, and event serialization do not establish or retain all required facts. Findings `U2-R5-001` and `U2-R5-002` give the remaining repairs.
- Round 4 `U2-R4-002`, safe work-lease release: **CLOSED**. `release-work-lease` now requires summary, reconciliation, and workspace evidence, moves `Working` to `Queued`, checkpoints the result, permits fresh dispatch after checkpoint verification, and rejects `Merging` with exactly `record-exact-merge`, `return-for-repair`, and `reconcile-sources` as next actions.

# Verdict

`CHANGES_REQUIRED` — P0: 0, P1: 3, P2: 1.

# Findings

## U2-R5-001 — P1: The review-evidence port does not expose enough trusted data to perform its required validation

Evidence: `accept-plan-review` accepts a caller-selected `ReviewEvidenceTargetV1` at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:459`. `ReviewManifestTargetV1` contains only path, commit, digest, and output path, while `ReviewEvidenceBundleV1` contains target records rather than manifest or output bytes and contains no parsed plan target, governing-contract target, complete-prompt identity, reviewer role, or challenge lenses at lines 493-505. The stale `ReviewerProvenanceV1` has challenge lenses but no revisers and is no longer a command field at lines 486 and 501. `ReviewEvidencePort.loadBoundEvidence` accepts only the caller's evidence target, and `validateReviewEvidence(bundle, currentPlan, currentContract)` receives neither the submitted manifest target nor bytes or a read port, even though the prose says it rereads and hashes the manifest and output at lines 588-593. `LifecyclePolicyStateV1` also has no pending submitted-manifest value against which acceptance can compare the caller-selected evidence. The high-risk comparison checks the reviewer against authors but not revisers at line 512.

Failure scenario: a phase agent supplies an alternate committed evidence artifact that names favorable author, context, provider, and risk facts or refers to a different manifest from the one submitted for review. The Git adapter can prove that the selected bytes and commit exist, but the prescribed bundle and validator cannot prove that this was the submitted manifest, that it bound the current plan and `PLANS.md`, that its prompt and role were the governed ones, or that the recorded context and availability facts came from trusted session evidence. An executor must either trust structured assertions from that artifact, perform undeclared Git or session I/O in the validator, or invent additional fields. A high-risk reviewer can also use the same provider and model as a reviser because the stated rule compares only authors.

Smallest repair: retain the submitted manifest target in the `PlanReview` projection and make the evidence port derive evidence for that exact target rather than accept an unconstrained alternative. Either return the exact manifest/output bytes and parsed trusted session attestations to the pure validator, or make the adapter return a validated value and state every check it performs. Define values for the bound plan, governing contract, prompt, reviewer role, challenge lenses, separate authors and revisers, inherited-context result, provider/model selection, availability evidence, exact output bytes, and sole write set. Compare high-risk provider/model choice with both authors and revisers. Remove the unused caller-asserted provenance type. Add rejection fixtures for a substituted evidence artifact, mismatched submitted manifest, changed prompt or role, missing challenge lens, reviser/provider reuse, and unattested context or availability claims.

## U2-R5-002 — P1: Accepted-review events cannot preserve validated evidence for deterministic replay

Evidence: `ReviewDecisionV1` requires the complete `ValidatedReviewEvidenceV1` at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:503-505`, and the reducer receives that server-validated value at lines 574-577. However, every lifecycle event payload must contain exactly `{ kind, from_state, to_state, command_payload, lease_change }`, may add no fields, and reuses the accepted caller command at line 530. The `accept-plan-review` command contains only `review_evidence: ReviewEvidenceTargetV1`, not the validated bundle, at line 459. The plan says replay never reevaluates historical freshness or risk policy at line 577, while line 593 separately requires `executeCommand` to store the validated value in the event. The exact event union makes that requirement impossible.

Failure scenario: after `accept-plan-review`, the lifecycle projection stores authors, revisers, reviewer, risk policy, source artifacts, write digest, and bundle digest. If projection tables are deleted, replay sees only the caller's evidence target in `plan-review-accepted`. It cannot reconstruct byte-equivalent `ReviewDecisionV1.evidence` without rereading Git and reapplying current validation, which replay forbids. Dropping those fields produces a different projection checksum; rereading external state makes replay depend on facts that may have changed.

Smallest repair: define a server-derived `plan-review-accepted` event payload that includes the complete validated `ReviewDecisionV1` or `ValidatedReviewEvidenceV1`, while keeping that value absent from caller-supplied command bytes. Update the closed event union, parser, serializer, event-size limits, SQLite fixtures, and replay reducer. Add a projection-deletion test that accepts a review, removes or changes the external evidence after acceptance, and still rebuilds the exact stored review decision from event bytes alone.

## U2-R5-003 — P1: `return-for-repair` does not define the work lease required by its resulting state

Evidence: the transition moves `Merging` to `Working` and says only that the integration lease is released at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:371`. Its command payload names a repair worker, repair session, and expiry at line 471, but the deterministic lease-creation rules list acquisition, Learn integration, review repair, and takeover without stating that `return-for-repair` creates a work lease at line 389. The only ordinary work-lease acquisition starts from `Queued` at line 362, while a subsequent work handoff from `Working` requires an active work lease at line 366. The generic event schema has one `lease_change` value but does not state whether it represents only the revoked integration lease or a newly created work lease at line 530.

Failure scenario: the integration owner detects an unmerged stale head and runs `return-for-repair`. A literal implementation releases the integration lease and enters `Working` with no active lease. `acquire-work-lease` then fails because the issue is not `Queued`, and the repair worker cannot mutate or hand off because it has no current fencing token. Another executor may infer an atomic replacement work lease from the otherwise unused repair-worker fields, producing different event and replay bytes.

Smallest repair: choose one exact outcome. Either atomically revoke the integration lease and create the named work lease, including its resource, fencing token, event representation, projection update, checkpoint, and replay rule, or move to `Queued` and dispatch through `acquire-work-lease` while removing the unused repair-worker fields. Add allowed and rejected tests for takeover in `Merging`, `return-for-repair`, the first repair mutation, handoff, stale integration-owner fencing, restart replay, and the one permitted next action.

## U2-R5-004 — P2: `Outcomes & Retrospective` reports an obsolete review state and next action

Evidence: `Progress` records repairs through round four and says the next task is another clean-room review at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:897-902`. In contrast, `Outcomes & Retrospective` says review evidence does not exist and directs the next agent to commit and push the plan, open the planning PR, and commit the first review prompt at line 986. The planning PR and four authoritative reviewer outputs already exist at the reviewed commit. `PLANS.md` requires every living section to stay current and permits a fresh contributor to resume from the ExecPlan alone.

Failure scenario: a fresh planning agent follows `Outcomes & Retrospective` and attempts to repeat the initial PR and first-round setup instead of processing the current round-five verdict. The plan then supplies two incompatible next actions and cannot serve as its own restart record.

Smallest repair: update `Outcomes & Retrospective` to record the completed review rounds, current unresolved findings, lack of approval and implementation evidence, and the exact next permitted repair-and-review action. Keep implementation outcomes explicitly pending.

# Verification Notes

I verified the bound plan and `PLANS.md` digests from Git object bytes. The U1, U1C, U1A, WI1, and stated baseline commits are ancestors of the reviewed commit. I read the complete bound `PLANS.md`, exact 1,024-line U2 plan, complete epic ExecPlan, every prior authoritative U2 reviewer output, the round-five prompt, architecture standard, runtime and architecture-standard public surfaces, approval and projection contracts, package commands, and U3-U7 dependency scaffolds.

I did not require implementation evidence scheduled for Milestones 1-5. I made no repository, issue, pull-request, or Git mutation other than creating this manifest-authorized reviewer output.

CHANGES_REQUIRED — P0: 0, P1: 3, P2: 1.
