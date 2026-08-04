# Reviewed Targets

- Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md` at `2c30eebddadc96a49f32084900a73c8cf8d26ea6`; SHA-256 verified as `35301eae0faf93cd5d7903ef51cb29a7f5e1092e11179121f93a537d9c1834af`.
- Governing contract: `PLANS.md` at `2c30eebddadc96a49f32084900a73c8cf8d26ea6`; SHA-256 verified as `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0`.
- Review prompt: `docs/plans/reviews/2026-08-04-u2-clean-room-round-4-prompt.md`.
- Review lens: complete `PLANS.md` conformance, executor safety, adversarial counterexamples, and closure of the authoritative round-three findings.

# PLANS.md Conformance

The plan satisfies the content-only ExecPlan format, purpose and observable-outcome requirements, living sections, repository orientation, defined core terms, dependency snapshot, ordered milestones, repository-root Bun commands, red/green observations, validation gates, recovery guidance, and revision-note requirement. Its SQLite instructions are repository-local; the optional external links do not carry implementation decisions. The plan correctly schedules implementation evidence instead of claiming that the scheduled work already exists.

The plan does not meet the non-negotiable self-containment and novice-execution requirements. A novice cannot implement the mandatory independent review checks from the declared ports and values, and cannot resume safe automation after the newly required release command. Both gaps affect durable lifecycle behavior rather than incidental adapter choices.

# Prior-Finding Closure

- Round 1 protocol-interface finding: CLOSED. The plan now defines closed catalogs, command variants, nested values, events, results, errors, receipts, ports, canonical bytes, and public exports at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:395-588`.
- Round 1 milestone-executability finding: CLOSED. Milestones 1-5 identify files, named tests or exports, exact repository-root commands, and expected red/green observations at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:733-837`.
- Round 1 embedded SQLite-contract finding: CLOSED. The plan specifies Bun connection options, transaction boundaries, WAL handling, backup validation, migration, restoration, and failure handling at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:630-657`.
- Round 2 process-finding identity and authority finding: CLOSED. Creation identity, duplicate behavior, phase and role rules, disposition rows, persistence uniqueness, and tests are specified at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:381-393`, `435-506`, and `623-625`.
- U2-R3-001: CLOSED. `ReviewerRiskPolicyV1`, review, gate, handoff, and complete policy state flow through snapshots, projections, reducer input, replay, parsers, fixtures, and root barrels at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:498-508`, `564-588`, and `799-801`.
- U2-R3-002: CLOSED. Protocol v1 now defines heartbeat, takeover, and release commands and events, a complete `LeaseSnapshotV1`, lifecycle rows, lease reconstruction, and focused tests at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:363-365`, `445-451`, `463-466`, `566`, `623-625`, and `766-767`.
- U2-R3-003: CLOSED. Disposition and supersession events include a reducer-derived effect with prior and resulting state, intent-change decision, exact invalidated evidence, and checkpoint behavior; local and intent-changing replay tests are prescribed at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:528-536` and `799-801`.

# Verdict

CHANGES_REQUIRED — P0: 0, P1: 2, P2: 0.

# Findings

## U2-R4-001 — P1: Review acceptance has no evidence port or derivation rule for mandatory independent-review checks

Evidence: R12a and R12c require Mandem to reject terminal-only output, a reviewer write outside the manifest path, authors or revisers acting as reviewers, inherited authoring context, and unmet alternative-provider-or-model rules at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:80-82`. The acceptance row repeats those checks at lines 359 and 385, and AE12-AE13 require their rejection at lines 142-143. However, `ReviewerProvenanceV1` represents `received_authoring_context` and `wrote_only_manifest_output` as caller-supplied booleans, labels the complete author-and-reviser set only as `authors`, and has no evidence for either assertion at lines 498-500. The only declared read port is `PlanContentPort.readExact`; the complete public-port catalog has no port that reads a review manifest, reviewer output, session provenance, or the committed write set at lines 575-586. Milestone 3 likewise schedules no review-evidence fake, validator, or rejection fixture at lines 786-801.

Failure scenario: a phase agent submits `accept-plan-review` with a digest for an existing file and sets `wrote_only_manifest_output: true` and `received_authoring_context: false`, even though the reviewer changed another file or authored the plan. The reducer can compare claimed UUIDs, but no specified trusted input can establish the write set, distinguish revisers from authors, or prove that the claimed session context and risk availability evidence governed the review. Two executors can either trust those envelope fields or invent incompatible repository and session checks. One will accept a verdict that R12a, R12c, AE12, and AE13 require it to reject.

Smallest repair: define a public, application-owned review-evidence port and complete immutable evidence values. The port must read the bound manifest and reviewer-output bytes at their commits, enumerate the reviewer commit's repository write set, and provide the orchestrator-recorded author, reviser, reviewer, context, provider, model, and risk-availability facts. The acceptance use case must derive, rather than accept, manifest-path, write-set, non-author, no-inherited-context, and alternative-model results from that evidence. Store the validated evidence digests and explicit author and reviser identities in `ReviewDecisionV1`; add fake-port fixtures for terminal-only output, extra writes, author and reviser self-review, inherited context, required-and-used, unavailable-permitted, and stale availability evidence.

## U2-R4-002 — P1: Releasing a takeover lease strands the issue in `Working` or `Merging`

Evidence: `takeover-work-lease` is available from `Working` or `Merging`, creates a replacement lease, and leaves lifecycle state unchanged at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:364`. `release-work-lease` is available from the same states, revokes the active lease, and also leaves state unchanged at line 365. The plan states that release leaves no active lease at lines 389-390. The only ordinary fresh work-lease acquisition row starts from `Queued` at line 362; a work handoff and exact merge instead require an active lease at lines 366 and 372. No row moves a released `Working` or `Merging` issue to `Queued`, requires the operator summary and reconciliation that the epic requires after takeover, or creates a replacement worker lease.

Failure scenario: an operator takes over a worker, completes the intervention, and releases the lease. The resulting projection remains `Working` with no active lease. The former owner is fenced, a new worker cannot use `acquire-work-lease` because its source state is not `Queued`, and the only remaining work, handoff, or merge commands require the absent lease. If the takeover occurred in `Merging`, the same gap leaves the non-cancellable external-transaction phase without a specified recovery route. An executor must invent a state transition or bypass the catalog, so replay and downstream clients cannot agree on the next permitted action.

Smallest repair: add one explicit post-release path for each permitted release state. It must record the operator summary and reconciliation evidence required by the epic, move safe `Working` recovery to `Queued` before a fresh worker lease can be acquired, and constrain `Merging` recovery to the existing Git/provider reconciliation outcomes. Define the event payload, resulting lease and next actions, checkpoint rule, error mapping, replay projection update, and allowed/rejected takeover-release-reacquire fixtures.

# Verification Notes

I inspected the exact plan and `PLANS.md` bytes from the bound commit, verified both supplied SHA-256 values, read the epic, U1, U1C, U1A, and WI1 dependency outputs, the relevant runtime and architecture-standard contracts, package commands, the U3-U7 dependency plans, and every prior U2 reviewer output. All five dependency and baseline commits named by the plan are ancestors of the reviewed commit. I did not use the working tree as evidence for the reviewed plan.
