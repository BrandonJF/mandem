# Reviewed Targets

- Review prompt: `docs/plans/reviews/2026-08-04-u2-clean-room-round-3-prompt.md`, committed at `adb9bc278ad904bbe2946ca1929e9f2d165d0c4a`, SHA-256 `7b75f1c58904ae8e6e629bdc5728bcf9b4b0fb47ff1cc8c73bf910c2a3d44d67`.
- Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md` at `5c18fffddbdf180702cd58ec284090aa1c8700b0`, verified SHA-256 `6dad78b76409f477e4eda818f9dcf12185a8a471245a0b55dd6629d3b6298c44`.
- Governing contract: `PLANS.md` at `5c18fffddbdf180702cd58ec284090aa1c8700b0`, verified SHA-256 `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0`.
- Review lens: complete `PLANS.md` conformance, executor safety, adversarial counterexamples, and closure of prior findings.

# PLANS.md Conformance

The plan passes the content-only Markdown format rule, purpose and observable-outcome requirements, novice repository orientation, defined core terms, dependency snapshot, living sections, milestone ordering, exact Bun commands, red/green observations, validation gates, recovery guidance, and bottom revision-note requirement. The Bun and SQLite instructions are repository-local and prescribe the connection, transaction, backup, migration, restoration, and failure behavior needed for implementation. The plan correctly schedules implementation evidence instead of claiming that evidence already exists.

The plan does not pass the non-negotiable self-containment and novice-execution requirements. It promises exhaustive gate, review-provenance, lease, and process-finding policy, but the serialized values and public policy inputs do not carry enough information to implement or replay that policy. It also contradicts its own primitive-command scope by omitting heartbeat, takeover, and release behavior from the closed command and event catalogs. These omissions affect durable wire values and state reconstruction, so an executor cannot resolve them as incidental implementation details.

Milestones remain independently runnable at the command level, but Milestone 2 is not independently implementable against the prescribed interfaces until the findings below define its reducer input, complete lease behavior, and replayable process-finding effects.

# Prior-Finding Closure

- Round 1, novice-executable milestone finding: `CLOSED`. Milestones 1-5 name ordered files, test names or exports, repository-root commands, and expected red and green observations at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:709-808`.
- Round 1, external Bun and SQLite dependency finding: `CLOSED`. The plan embeds exact driver, WAL, transaction, backup, migration, restoration, and failure instructions at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:603-632`; external links are optional provenance at line 703.
- Round 2 `U2-R2-001`, complete Protocol v1 schemas and policy outcomes: `OPEN`. The revision closes the listed scalar catalogs, nested command values, causation rule, error order, and several port values, but it still omits required guard state, a reducer signature, complete lease values, and promised command families. Findings `U2-R3-001` and `U2-R3-002` identify the remaining gaps.
- Round 2 `U2-R2-002`, deterministic process-finding lifecycle: `OPEN`. The revision closes creation identity, uniqueness, duplicate behavior, changed-evidence behavior, creation roles, and Plan/Work/Review/Learn fixture intent. The disposition events still lose the conditional lifecycle transition and evidence invalidation required for deterministic restart replay. Finding `U2-R3-003` identifies the remaining gap.

# Findings

## U2-R3-001 — P1: The public state and reducer contract cannot evaluate required gate and review guards

Evidence: R5 and R9 require exhaustive gate freshness and a gate decision containing its definition, input digests, target revision, outcome, and evidence at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:72-76`. R12c and KTD17 require the reviewer risk rule, provider/model availability decision, and recorded limitation at lines 82 and 211. The exact `ReviewerProvenanceV1` at line 489 has no risk-policy, availability, or limitation value. More broadly, `IssueLedgerSnapshotV1` and `IssueProjectionV1` at lines 543-547 carry state, lease, checkpoint, and unresolved finding IDs, but no current plan, accepted review, approval, gate decisions, handoff, or reviewer-policy state. The plan names the reducer export at line 562 and `evaluateLifecycleCommand` at line 751 without defining its input or result signature. It defines no `GateDecisionV1` or equivalent closed value anywhere in the serialized interface.

Failure scenario: in `Learning`, a client submits `accept-learn` after a gate input changes. `EventStorePort.loadIssue` cannot return the prior gate definition, input digests, target revision, or outcome, and the command payload carries only artifact-reference arrays. One executor must invent an unreviewed read port or hidden reducer context; another can treat the submitted references as fresh. The same gap lets `accept-plan-review` accept or reject the same reviewer provenance based on an implementation-specific risk-policy lookup. Both implementations can satisfy the named test prose while producing different durable outcomes.

Smallest repair: define the complete immutable policy input used by `evaluateLifecycleCommand`, including closed plan, review, approval, gate-decision, handoff, and reviewer-risk values. Give the reducer an exact input and output signature. Carry the needed current values through `IssueLedgerSnapshotV1`, `IssueProjectionV1`, `AtomicCommandCommitV1`, and replay replacement values, or define another exact public read port and explain why it is authoritative. Add parser, serializer, root-export, and fixture entries for each value, including alternative-provider required, available, unavailable-permitted, and stale-gate cases.

## U2-R3-002 — P1: The closed lease protocol omits required fields and promised heartbeat, takeover, and release commands

Evidence: R10 requires every lease to have a resource and acquisition time and requires stale-owner fencing after takeover at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:77`. KTD1 says the initial primitive catalog covers lease acquisition, release, revocation, heartbeat facts, and takeover at line 194. The exact `CommandKindV1` and `EventKindV1` catalogs at lines 444-445 contain none of `heartbeat`, `takeover`, `release`, or a general revocation command/event. The acquisition payload at line 456 supplies no lease ID, resource, acquisition time, or fencing token. The transition event's `lease_change` at line 509 and `LeaseSnapshotV1` at line 544 omit resource and acquisition time; `lease_change.reason_code` also has no declared type or closed catalog. The epic requires durable heartbeats and explicit takeover/release behavior at `docs/plans/2026-07-21-001-feat-mandem-plan.md:252`, `docs/plans/2026-07-21-001-feat-mandem-plan.md:648`, and `docs/plans/2026-07-21-001-feat-mandem-plan.md:662`.

Failure scenario: an operator takes over an active worker and later releases control. Protocol v1 has no command that represents either action, no event that records the operator-control interval, and no lease resource or acquisition timestamp from which replay can reconstruct what was fenced. A later U7 client must add wire values to deliver the epic's takeover and release commands, which would either break protocol v1 or create an incompatible side channel. Separately, a server cannot distinguish an active long-running worker from a stalled one through the promised heartbeat facts.

Smallest repair: add exact protocol-v1 commands, payloads, transition or state-preserving rows, events, roles, scopes, lease rules, errors, next actions, receipts, and fixtures for heartbeat, takeover, and release. Define one complete lease value with lease ID, protected resource, owner, session, acquisition time, expiry, fencing token, revocation time, and a closed lease-change reason. Use that value consistently in events, snapshots, projections, handoffs, SQLite records, and replay. If any primitive is intentionally deferred, remove it from U2's requirements and KTD1 and revise every downstream contract that currently depends on protocol-v1 parity.

## U2-R3-003 — P1: Process-finding disposition events cannot replay an intent-changing transition

Evidence: R12b requires a disposition that changes approved intent to move the issue to `NeedsPlanning` and invalidate dependent review, approval, and gate evidence at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:81`. The disposition and supersession rows at lines 379-380 conditionally change state and conditionally create a portable checkpoint. Their exact event payloads at lines 514-515 carry only finding ID, disposition, repair artifacts, reason code, and the prior disposition event ID for supersession. They carry no prior state, resulting state, intent-change decision, or invalidated evidence identities. Unlike ordinary transition events at line 509, these payloads do not embed `from_state` and `to_state`. The plan also does not define a deterministic mapping from disposition, reason code, and repair artifacts to the phrase "changed approved intent."

Failure scenario: a `product-contract-gap` disposition is recorded while an issue is `Working`. One executor judges that linked epic changes alter approved intent and projects `NeedsPlanning`; another judges that the repair only adds enforcement and leaves the issue `Working`. Both append the same canonical `process-finding-disposition-recorded` bytes. After projection deletion, replay cannot recover which state was committed or which review, approval, and gate values were invalidated, so the rebuilt projection can differ from the original accepted result and ledger anchor.

Smallest repair: define a closed, deterministic disposition effect that states whether approved intent changed, the exact prior and resulting lifecycle states, and the review, approval, and gate evidence invalidated. Include that effect in disposition and supersession events and in the canonical finding-policy reducer input/output. Define the exact authority scope for disposition and supersession. Add allowed and rejected fixtures for both local and intent-changing branches in Plan, Work, Review, and Learn, plus restart replay that proves the original state, invalidations, checkpoint requirement, and rebuilt state are byte-equivalent.

# Verification Notes

I read the complete bound `PLANS.md`, the exact 975-line U2 plan, the round-1 and round-2 authoritative reviewer outputs, the round-3 prompt, the epic contract, the cited architecture and approval contracts, the current runtime public surface, package scripts, projection retry patterns, and the U3-U7 dependency surfaces. All five dependency and baseline commits named by the U2 plan are ancestors of the reviewed commit. I verified the two bound SHA-256 values from `git show <commit>:<path>` rather than from working-tree files.

I did not require implementation evidence that the plan schedules for Milestones 1-5. I made no repository, issue, pull-request, or Git mutation other than creating this manifest-authorized reviewer output.

# Verdict

CHANGES_REQUIRED — P0: 0, P1: 3, P2: 0.
