# Reviewed Targets

- Review prompt: `docs/plans/reviews/2026-08-04-u2-clean-room-round-11-prompt.md`.
- Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md` at `e1c3e607de4d2e3ffdee7bfba0d8543bbaedd2ba`; SHA-256 `d24ad203b8fc6b41aa278e0af7ace94ab8efb2a5b7eef5b5826cae21214d1a47` verified from Git object bytes.
- Governing contract: `PLANS.md` at `e1c3e607de4d2e3ffdee7bfba0d8543bbaedd2ba`; SHA-256 `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0` verified from Git object bytes.
- Epic: `docs/plans/2026-07-21-001-feat-mandem-plan.md` at the reviewed commit.
- Review lens: complete `PLANS.md` conformance, executor safety, adversarial counterexamples, and closure of every authoritative prior U2 finding, with specific revalidation of the round-ten checkpoint repair.

# PLANS.md Conformance

The plan satisfies the content-only ExecPlan format rule, purpose and observable-outcome requirements, repository orientation, defined core terms, dependency snapshot, ordered independently verifiable milestones, repository-root Bun commands, red/green observations, validation gates, recovery guidance, living sections, and bottom revision-note requirement. The Bun and SQLite instructions remain repository-local. The plan correctly schedules implementation evidence rather than claiming that the implementation exists.

The plan does not satisfy the non-negotiable self-containment, novice-execution, and deterministic-replay requirements for completed portable checkpoints. It requires replay to restore the committed provider-receipt target, but the exact append-ledger event and reducer input cannot carry that target. A novice must invent another durable read or widen a closed protocol value to implement the stated behavior.

The single-fenced-block rule does not apply because this Markdown file contains the ExecPlan. Prototype and parallel-implementation guidance does not apply because the plan schedules neither.

# Prior-Finding Closure

- Rounds one through nine: `CLOSED`. The current plan retains the repaired protocol catalogs, process-finding policy, executable milestones, SQLite contract, reducer state, lease and disposition behavior, trusted review-evidence boundary, accepted-review replay value, prompt and verdict validation, dispatch and receipt binding, two-stage dispatch order, and exact reviewer-commit selection.
- `U2-R10-001`, exact portable-checkpoint payload and deterministic destination: `OPEN`. The revision now gives each pending checkpoint closed bounded bytes and a digest, derives one destination in pure policy, supplies exact bytes to the writer, returns exact read-back bytes and the committed target, fixes the UUID-derived receipt path, extracts issue-ref records by originating event ID, compares completion bytes and digest, and adds both destination kinds to the port-contract scenarios. Finding `U2-R11-001` identifies the remaining loss of the returned target at the append-ledger boundary, which prevents the required replay behavior.

# Verdict

`CHANGES_REQUIRED` — P0: 0, P1: 1, P2: 0.

# Findings

## U2-R11-001 — P1: Checkpoint verification drops the committed target before append-ledger replay

Exact evidence: `PortableCheckpointPort.observe` and `writeIfAbsent` return `ObservedCheckpointV1.target`, and the plan explicitly requires replay to copy that verified target into `ValidatedReviewDispatchV1.receipt_target` at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:395-397`. That target is required and non-null before review acceptance at lines 516 and 531. However, the exact `portable-checkpoint-verified` event contains only checkpoint ID, originating event ID, payload digest, destination, and read-back digest at line 561. It contains no `ArtifactReferenceV1` target. `LifecyclePolicyInputV1` also has no trusted checkpoint-evidence value, and line 605 requires both server-derived inputs to be null for `complete-checkpoint`. Replay is required to apply recorded event payloads, while the public replay port can read events and replace projections but has no port for recovering a verified target from another durable record at lines 605 and 607-614. The storage prose says a checkpoint record stores the target at line 586, but the plan also requires event-ledger replay to rebuild checkpoint and lifecycle projections at lines 601 and 845. Those contracts cannot all be implemented from the declared values.

Failure scenario: dispatch commits a provider receipt checkpoint, the writer creates the exact receipt artifact, and `complete-checkpoint` verifies it. After projection tables are deleted, replay sees `plan-review-dispatched` with `receipt_target: null` and a later `portable-checkpoint-verified` event that has no committed target. Replay cannot reconstruct the original non-null path, commit, digest, provider, and external ID. It must either leave `receipt_target` null, fail the projection checksum, reread mutable external state, or consult an undeclared non-event source. The first result blocks `accept-plan-review`; the other choices violate the prescribed replay and public-port contracts.

Smallest repair: define a closed server-derived checkpoint-verification evidence value containing the independently validated read-back digest and exact committed `ArtifactReferenceV1` target. Let the application supply it only for `complete-checkpoint`, include it in the immutable `portable-checkpoint-verified` event, and have replay restore both checkpoint state and `ValidatedReviewDispatchV1.receipt_target` from that event. Update the parser, serializer, limits, event digest, reducer input, SQLite fixtures, and projection reducer. Add a test for each destination kind that completes the checkpoint, deletes every disposable projection, rebuilds from events without calling the checkpoint port, and proves byte-identical verified target and checkpoint state; for the receipt case, also prove that review acceptance reads the exact rebuilt target.

# Verification Notes

I read the complete bound `PLANS.md`, exact reviewed plan, round-eleven prompt, complete epic ExecPlan, U1, U1C, U1A, and WI1 dependency contracts, current architecture and approval surfaces, runtime public surface, package commands, downstream U3-U7 dependency contracts, the exact-retry projection pattern, and every prior U2 reviewer output. The U1, U1C, U1A, WI1, and stated baseline commits are ancestors of the reviewed commit. I used Git object bytes for the reviewed plan and contract and verified both bound digests.

I did not require implementation evidence scheduled for Milestones 1-5. I made no repository, issue, pull-request, or Git mutation other than creating this manifest-authorized reviewer output.

MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED
