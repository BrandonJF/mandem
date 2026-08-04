# Reviewed Targets

- Review prompt: `docs/plans/reviews/2026-08-04-u2-clean-room-round-12-prompt.md`.
- Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md` at `8346d06443aecf557bb72e1f686a8b3982dcd3ef`; SHA-256 `81374b4bdad5ecd35b53082aba239317d7e69b3a49fef5a39e220ce8abd2a713` verified from Git object bytes.
- Governing contract: `PLANS.md` at `8346d06443aecf557bb72e1f686a8b3982dcd3ef`; SHA-256 `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0` verified from Git object bytes.
- Epic: `docs/plans/2026-07-21-001-feat-mandem-plan.md` at the reviewed commit.
- Review lens: complete `PLANS.md` conformance, executor safety, adversarial counterexamples, and closure of the authoritative round-eleven finding.

# PLANS.md Conformance

The plan uses the content-only ExecPlan format, states an observable outcome, provides repository orientation and defined terms, identifies its dependency snapshot, supplies ordered milestones, names repository-root Bun commands and red/green observations, defines recovery behavior, maintains the required living sections, and includes revision notes. Its Bun and SQLite instructions are embedded in the plan, so implementation does not depend on external documentation. It correctly schedules implementation evidence rather than claiming that implementation has occurred.

The plan does not yet fully satisfy the required comprehensive, demonstrable validation for the repaired portable-checkpoint replay path. The targeted round-eleven test deletes only lifecycle and checkpoint projections, not every disposable projection, so it cannot prove the requested complete projection rebuild for either destination kind.

The single-fenced-block rule does not apply because this Markdown file contains the ExecPlan. Prototype and parallel-implementation guidance does not apply because the plan schedules neither.

# Prior-Finding Closure

- Rounds one through ten: `CLOSED`. The plan retains the repaired protocol schemas, process-finding policy, executable milestones, repository-local SQLite contract, reducer state, lease and disposition replay, trusted review-evidence boundary, review decision replay value, prompt and verdict validation, causal dispatch order, deterministic reviewer-commit selection, and exact checkpoint payload and destination contracts.
- `U2-R11-001`, checkpoint verification drops the committed target before append-ledger replay: `CLOSED`. `ValidatedCheckpointEvidenceV1` includes the non-null committed target; `portable-checkpoint-verified` stores that value; `completeCheckpoint` supplies it only as server-derived input; and replay restores both the checkpoint target and a dispatch receipt target from the event without calling `PortableCheckpointPort` at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:397`, `561`, and `594-606`.

# Verdict

`CHANGES_REQUIRED` — P0: 0, P1: 1, P2: 0.

# Findings

## U2-R12-001 — P1: The round-eleven replay test does not delete and compare every disposable projection

Exact evidence: The bound prompt requires both checkpoint destination kinds to delete and rebuild every projection byte-identically. Milestone 3 scenario 13 instead requires the executor to “delete every checkpoint and lifecycle projection” before replay at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:851`. Although scenario 8 has a general projection-rebuild test at line 846, it does not bind that complete deletion and byte comparison to a completed `repo-artifact` receipt checkpoint and a completed `issue-ref` checkpoint.

Failure scenario: A checkpoint completion occurs after a stream that also has lease, gate, or routed-item projection rows. The focused checkpoint test can pass after deleting only lifecycle and checkpoint rows while a replay implementation leaves stale bytes in another disposable projection or fails to reconstruct its staging representation. The test would still show the verified target and receipt target, but it would not prove the event-only rebuild required for the full projection set or detect a partial replacement.

Smallest repair: Expand scenario 13 and its named application/replay tests for each destination kind. Capture canonical pre-deletion bytes for lifecycle, lease, gate, routed-item, and checkpoint projections; delete every one; configure `PortableCheckpointPort` to fail if called; replay only the event stream; and require byte-identical reconstructed values before replacement. For the receipt case, then call review acceptance and prove that it reads the rebuilt non-null receipt target.

# Verification Notes

I read the complete bound `PLANS.md`, the exact reviewed plan, the round-twelve prompt, the complete epic ExecPlan, every prior authoritative U2 reviewer output, the cited U1, U1C, U1A, and WI1 dependency contracts, the approval and architecture-standard module surfaces, and the current runtime surface and package commands. The dependency commits and stated baseline commit are ancestors of the reviewed commit. I verified both bound SHA-256 values from `git show <commit>:<path>` and used Git object bytes rather than working-tree files as plan evidence.

I did not require implementation evidence scheduled for Milestones 1-5. I made no repository, issue, pull-request, or Git mutation other than creating this manifest-authorized reviewer output.

MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED
