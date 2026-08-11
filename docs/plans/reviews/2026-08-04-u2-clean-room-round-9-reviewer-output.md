# Reviewed Targets

- Review prompt: `docs/plans/reviews/2026-08-04-u2-clean-room-round-9-prompt.md`.
- Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md` at `6f10f84f4a8ff7b066a8a80ab41cf7c34fe777b4`; SHA-256 `b0bac84b1afe6c115141738bad418075bfbfd01f17e155b1c973452b9f6903ad` verified from Git object bytes.
- Governing contract: `PLANS.md` at `6f10f84f4a8ff7b066a8a80ab41cf7c34fe777b4`; SHA-256 `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0` verified from Git object bytes.
- Epic: `docs/plans/2026-07-21-001-feat-mandem-plan.md` at the reviewed commit.
- Review lens: complete `PLANS.md` conformance, executor safety, adversarial counterexamples, and closure of every authoritative prior U2 finding.

# PLANS.md Conformance

The plan passes the content-only ExecPlan format rule, purpose and observable-outcome requirements, repository orientation, defined core terms, dependency snapshot, ordered milestones, repository-root Bun commands, red/green observations, validation gates, recovery guidance, living sections, and bottom revision-note requirement. Its SQLite instructions are repository-local, and it schedules implementation evidence instead of claiming that evidence exists. The single-fenced-block rule does not apply because this Markdown file contains the ExecPlan. Prototype and parallel-implementation guidance does not apply because the plan schedules neither.

The plan does not meet the non-negotiable self-containment and novice-execution requirements for the review workflow. The pre-dispatch manifest requires an immutable provider receipt that can exist only after dispatch, and the evidence port has no exact target from which to select the reviewer output commit. Both gaps force an executor to invent workflow order or Git discovery behavior that determines whether Mandem accepts a review.

# Prior-Finding Closure

- Rounds one through six: `CLOSED`, except that the exact-evidence closure from rounds four and five does not cover selection of the reviewer output commit. `U2-R9-002` records that remaining gap. The repaired protocol catalogs, process-finding behavior, executable milestones, SQLite contract, reducer state, lease behavior, replayable disposition effects, trusted evidence validation, reviewer-authored verdict parser, accepted-review replay value, merge-repair lease, and current living sections remain present.
- `U2-R7-001`, manifest-bound dispatch record: `CLOSED` as to eliminating dispatch-record search and fallback. The manifest embeds one dispatch record and names one receipt target. `U2-R9-001` identifies the separate causal-order contradiction created by requiring that post-dispatch receipt in the manifest before dispatch may begin.
- `U2-R8-001`, manifest-bound provider-receipt bytes: `CLOSED`. `ReviewEvidenceBundleV1` carries `provider_receipt_target`, exact `provider_receipt_bytes`, and `parsed_provider_receipt`. The plan defines a closed canonical receipt, independently hashes its bytes, compares its target and every parsed field with the embedded dispatch record and reviewer identity, includes the bytes in the bundle digest and limits, and requires absent, changed, substituted, and decoy receipt tests against the actual artifact.

# Verdict

`CHANGES_REQUIRED` — P0: 0, P1: 2, P2: 0.

# Findings

## U2-R9-001 — P1: The committed manifest depends on a receipt that cannot exist until after the prohibited dispatch

Exact evidence: the `submit-plan-review` row requires a committed review manifest before entering `PlanReview` at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:357`, and Milestone 2 requires plan and `PLANS.md` comparison “before dispatch” at line 801. This matches the epic rule that review dispatch follows the committed manifest. However, `BoundReviewManifestV1` embeds `ReviewDispatchRecordV1`, whose `provider_receipt` is an immutable artifact reference with path, commit, and digest at lines 426-433 and 503-505. `ProviderDispatchReceiptV1` states that dispatch already occurred through `dispatched_at`, and the plan says the prompt is the exact body “delivered to the reviewer” and must match the receipt at lines 517-519. A committed target and digest for that receipt therefore cannot be known until the provider has dispatched the prompt, but the lifecycle does not permit dispatch until the manifest containing that target is committed and accepted.

Failure scenario: a phase agent prepares round ten. If it obeys `submit-plan-review`, it cannot populate the manifest's receipt commit and digest because no dispatch has occurred. If it dispatches first to obtain the receipt, review begins before the required manifest is committed and before Mandem verifies the plan, governing contract, branch, and PR target. If it predicts or fabricates receipt bytes before launch, the receipt no longer proves that the provider delivered the governed prompt. No implementation can satisfy all three requirements from the prescribed values and transition order.

Smallest repair: define an executable two-stage dispatch protocol. Commit and accept a pre-dispatch manifest that binds the prompt, reviewer role and session, lenses, output path, and a deterministic dispatch identity. Only then permit a separate dispatch command to launch the reviewer and commit a provider-generated receipt target and exact bytes. Store that exact receipt target in lifecycle state, require `accept-plan-review` to load only it, and reject any receipt whose dispatch identity, prompt digest, reviewer session, provider, model, or dispatch time differs. Add a disposable-Git test that proves no provider launch occurs before manifest acceptance and that a receipt created before or for another launch cannot satisfy acceptance.

## U2-R9-002 — P1: `ReviewEvidencePort` cannot deterministically locate the reviewer output commit

Exact evidence: `ReviewManifestTargetV1` binds only the manifest path, manifest commit, manifest digest, and future `output_path` at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:493`; it does not identify the output commit or digest. The `accept-plan-review` payload contains only `review_session_id` at line 459. `ReviewEvidencePort.loadBoundEvidence` receives only the stored manifest target at line 603, yet its result contains independently selectable `output_commit` and `reviewer_commit` fields at line 506. The prose then says the Git adapter “reads the manifest-declared output bytes and reviewer commit” and computes the parent-to-commit write set at line 610, but it gives no ref, commit, ancestry boundary, handoff artifact, or selection rule from which the adapter can derive those commits. The no-search rule at line 610 applies only to dispatch records and receipts.

Failure scenario: the planning branch contains two descendant commits that each write the declared output path and end in `MANDEM_REVIEW_VERDICT: CLEAN`; one belongs to the dispatched reviewer and one is a later decoy or stale round. Given only the manifest commit and path, one adapter can choose the first descendant, another the branch head, and another the latest sole-write commit. Each can return internally consistent output bytes, digest, and write set. Mandem then accepts different reviewer evidence from the same Git history, and `reviewer_session_id` cannot resolve the ambiguity because Git commits do not carry that protocol session identity.

Smallest repair: add one untrusted output locator to review completion, such as an exact reviewer commit plus output path, or commit a provider-generated completion target bound to the dispatch identity. Require the adapter to read bytes and the parent diff only from that exact commit, require the commit to descend from the accepted manifest and receipt commits on the planning branch, require `output_commit` and `reviewer_commit` to equal the selected commit, and derive path, digest, verdict, and sole-write status independently. Add disposable-Git tests for two plausible output commits, a stale-round output, a non-descendant commit, and a caller-supplied target whose claimed digest or reviewer session disagrees with the committed bytes and dispatch evidence.

# Verification Notes

I read the complete bound `PLANS.md`, the exact reviewed plan, the round-nine prompt, the complete epic ExecPlan, every prior U2 reviewer output, the cited U1, U1C, U1A, and WI1 dependency contracts and their current repository outputs, the architecture and approval contracts, runtime public surfaces, package commands, and the exact-retry projection pattern. The U1, U1C, U1A, WI1, and stated baseline commits are ancestors of the reviewed commit. I verified both bound digests from `git show <commit>:<path>` and did not use working-tree content as evidence for the reviewed plan.

I did not require implementation evidence scheduled for Milestones 1-5. I made no repository, issue, pull-request, or Git mutation other than creating this manifest-authorized reviewer output.

CHANGES_REQUIRED — P0: 0, P1: 2, P2: 0.

MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED
