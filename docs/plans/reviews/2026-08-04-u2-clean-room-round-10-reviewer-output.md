# Reviewed Targets

- Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md` at `f832920825b24377bdc69d78d3815548c747c573`, SHA-256 `8b500f0eb48a1829ed3096bdf0410f78013ea65f44b26e7f8e4504a1d4a78eaf`.
- Governing contract: `PLANS.md` at `f832920825b24377bdc69d78d3815548c747c573`, SHA-256 `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0`.
- Epic: `docs/plans/2026-07-21-001-feat-mandem-plan.md` at the reviewed commit.
- Review lens: complete `PLANS.md` conformance, executor safety, adversarial counterexamples, and closure of the authoritative round-nine findings.

# PLANS.md Conformance

The plan satisfies the content-only ExecPlan format rule, purpose and observable-outcome requirements, repository orientation, defined core terms, dependency snapshot, ordered milestones, repository-root Bun commands, red/green observations, validation gates, recovery guidance, living sections, and bottom revision-note requirement. It embeds the required Bun and SQLite behavior rather than requiring external documentation. It correctly schedules implementation evidence rather than claiming that implementation has occurred.

The plan does not satisfy the self-contained and novice-execution requirements for portable checkpoints. The declared checkpoint value and port cannot carry the immutable checkpoint payload that the writer must write, and the new review-dispatch flow does not derive one exact receipt destination. A worker must invent both values to implement the required receipt checkpoint and its recovery behavior.

The single-fenced-block rule does not apply because this Markdown file contains the ExecPlan. Prototype and parallel-implementation guidance does not apply because the plan schedules neither.

# Prior-Finding Closure

- Rounds one through eight: `CLOSED`. The plan retains the repaired protocol schemas, process-finding policy, executable milestones, SQLite contract, reducer state, lease behavior, replayable disposition effects, trusted review-evidence boundary, review-decision replay value, review prompt and verdict parsing, dispatch binding, and receipt-byte validation.
- `U2-R9-001`, manifest and provider-receipt causal order: `CLOSED`. The manifest now holds only pre-dispatch intent. `dispatch-plan-review` occurs after the manifest checkpoint, observes before launching, records the post-launch receipt, and blocks acceptance until receipt-checkpoint completion.
- `U2-R9-002`, ambiguous reviewer-output commit selection: `CLOSED`. `accept-plan-review` accepts one untrusted `reviewer_commit`; the evidence adapter reads only that commit, requires descent from the manifest and receipt commits, validates its sole write, and derives output facts and verdict from that commit's bytes.

# Verdict

`CHANGES_REQUIRED` — P0: 0, P1: 1, P2: 0.

# Findings

## U2-R10-001 — P1: The portable-checkpoint contract cannot write or bind the exact provider receipt

Exact evidence: R17 requires a pending checkpoint to be uniquely bound to its originating event, to preserve an immutable payload digest, and to support observe-before-retry completion at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:90`. The SQLite contract separately requires the outbox to contain one immutable checkpoint identity and payload at line 659. In contrast, `PendingCheckpointV1` contains only `checkpoint_id`, `originating_event_id`, `payload_digest`, and `destination` at line 586, and `PortableCheckpointPort.writeIfAbsent` receives only that incomplete value at line 606. It has no payload bytes or closed structured payload from which an adapter can create the checkpoint. `CheckpointDestinationV1` names only `issue-ref` or `exec-plan` plus unconstrained `identity` and `path` at line 500. The new dispatch flow then says that its transaction uses the deterministic destination "the round's receipt path" and that replay later records the exact target's path, commit, digest, provider, and external ID at line 523, but it defines neither that path nor a deterministic mapping from the accepted manifest and dispatch ID to it.

Failure scenario: a provider accepts the governed prompt and returns its receipt, then the process stops after the SQLite transaction. On recovery, the writer can observe a destination only after an implementation chooses an unreviewed receipt path. Even if it chooses one, `writeIfAbsent` has only the receipt digest, not the canonical receipt bytes, so it cannot create the missing Git artifact or prove that an existing artifact contains the required bytes. One implementation can use an issue-ref checkpoint, another can edit the ExecPlan, and another can create an arbitrary review file. Their receipts can share the same event and digest while producing different portable evidence. The later Git adapter cannot consistently prove the exact receipt commit required for reviewer-commit ancestry.

Smallest repair: define a closed `PortableCheckpointPayloadV1` with canonical bytes or a bounded structured value, and include it in `PendingCheckpointV1` or add one exact payload-read port that `writeIfAbsent` must use. Define a deterministic destination function for every checkpoint type. For `dispatch-plan-review`, derive a repository-relative receipt-artifact path and Git target from the accepted manifest path and `dispatch_id`; state the exact bytes to write, how the checkpoint writer returns the resulting commit and artifact digest, and how replay stores that target in `ValidatedReviewDispatchV1`. Extend the port-contract and disposable-Git tests to cover a lost dispatch response, a stop before the receipt write, an existing matching receipt, and a conflicting receipt at the one derived destination.

# Verification Notes

I verified both bound SHA-256 values from `git show f832920825b24377bdc69d78d3815548c747c573:<path>`. I read the complete bound `PLANS.md`, the exact U2 ExecPlan, the epic's U2 and clean-room-review contracts, every prior authoritative U2 reviewer output, the cited U1, U1C, U1A, and WI1 dependency commits, the architecture and approval contracts, the package commands, and the reviewed repository module surfaces. Each dependency and baseline commit named by the plan is an ancestor of the reviewed commit.

I did not require implementation evidence scheduled for Milestones 1-5. I used Git object bytes rather than working-tree content for the reviewed plan and contract.

MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED
