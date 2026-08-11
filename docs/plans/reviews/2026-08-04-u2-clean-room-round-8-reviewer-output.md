# Reviewed Targets

- Review prompt: `docs/plans/reviews/2026-08-04-u2-clean-room-round-8-prompt.md`.
- Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md` at `582b5538cb84f79af61d60bd5abd8af4e9065309`; SHA-256 `f1ca35b4486a8dc8c3c8fc3a3b0f36385a3c39383c3147f5113f8186c7b44381` verified from Git object bytes.
- Governing contract: `PLANS.md` at `582b5538cb84f79af61d60bd5abd8af4e9065309`; SHA-256 `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0` verified from Git object bytes.
- Epic: `docs/plans/2026-07-21-001-feat-mandem-plan.md` at the reviewed commit.
- Review lens: complete `PLANS.md` conformance, executor safety, adversarial counterexamples, and closure of every authoritative prior U2 finding.

# PLANS.md Conformance

The plan passes the content-only ExecPlan format rule, purpose and observable-outcome requirements, repository orientation, defined core terms, dependency snapshot, ordered milestones, repository-root Bun commands, red/green observations, validation gates, recovery guidance, living sections, and revision-note requirement. The SQLite instructions are repository-local, and the plan schedules implementation evidence rather than claiming it exists.

The plan does not yet meet the self-contained and novice-execution requirements for accepting a review. The declared review-evidence bundle omits the provider-receipt bytes that the adapter reads and the validator must verify. A novice therefore cannot implement the required absent, changed, substituted, and decoy-receipt checks from the prescribed interfaces.

The single-fenced-block rule does not apply because this Markdown file itself contains the ExecPlan. Prototype and parallel-implementation guidance does not apply because the plan schedules neither.

# Prior-Finding Closure

- Rounds 1 through 5: `CLOSED`. The current plan retains the repaired protocol catalogs, process-finding policy, executable milestones, SQLite contract, reducer state, lease and disposition behavior, trusted review-evidence boundary, replayable accepted-review event, merge-repair lease, and current living sections.
- `U2-R6-001`, complete sanitized prompt: `CLOSED`. `BoundReviewManifestV1` stores the bounded canonical prompt and digest. The plan requires the adapter and validator to compare its bytes and its reviewer-session binding.
- `U2-R6-002`, reviewer-authored verdict derivation: `CLOSED`. `parseReviewOutputVerdict` derives the closed verdict solely from canonical reviewer-output bytes and rejects absent, repeated, malformed, non-final, and non-clean markers.
- `U2-R7-001`, manifest-bound dispatch record: `OPEN`. The manifest now embeds one dispatch record and forbids record discovery or fallback. However, the declared `ReviewEvidenceBundleV1` cannot carry the provider-receipt bytes required to verify the bound receipt, so the acceptance path remains underspecified. Finding `U2-R8-001` gives the smallest repair.

# Verdict

`CHANGES_REQUIRED` — P0: 0, P1: 1, P2: 0.

# Findings

## U2-R8-001 — P1: Review-evidence validation cannot verify the manifest-bound provider receipt

Exact evidence: `ReviewDispatchRecordV1.provider_receipt` and `SessionAttestationV1.evidence` are only `ArtifactReferenceV1` values at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:502-505`. The plan says the Git-backed adapter reads the exact provider receipt and returns the bytes it reads at line 607, but `ReviewEvidenceBundleV1` contains `manifest_bytes` and `output_bytes` only; it has no provider-receipt bytes, parsed receipt, or receipt target separate from the generic reference. The validator is then required to compare the receipt and bind its digest into the validated bundle at line 607. It can compare only manifest-declared references, not the committed receipt bytes or a receipt schema. The bundle-size rule also still accounts for only two byte arrays at line 620. Milestone 3 requires absent, changed, substituted, and decoy-receipt tests at lines 825 and 828 without defining the input those tests must alter.

Failure scenario: a manifest names a provider-receipt reference with a digest that also appears in the reviewer attestation, while the referenced committed file is absent, changed, or is a decoy unrelated to the dispatch. The adapter may read a file, but the prescribed bundle cannot return its bytes to `validateReviewEvidence`. The validator can accept matching claimed digests without parsing or hashing the receipt. Different implementations must invent whether the adapter throws, trusts the reference, or adds an undeclared receipt value, so a review can be accepted without proving that its recorded prompt reached the declared reviewer session.

Smallest repair: define a closed `ProviderDispatchReceiptV1` that includes the dispatch ID, reviewer session ID, exact prompt digest, provider and model identity, and immutable receipt target. Require `ReviewEvidenceBundleV1` to carry that receipt's exact committed bytes and parsed value. Require `validateReviewEvidence` to parse and hash those bytes, compare their path, commit, digest, dispatch ID, session, and prompt digest with the embedded dispatch record and reviewer attestation, and include the receipt bytes or their independently recomputed digest in the canonical bundle digest and size limit. Add the four required disposable-Git cases by changing the actual receipt artifact, not only a manifest reference.

# Verification Notes

I read the complete bound `PLANS.md`, the exact reviewed plan, this prompt, the complete epic ExecPlan, the U1, U1C, U1A, and WI1 dependency contracts, the architecture and approval contracts, the current runtime and architecture-standard public surfaces, package commands, and every prior U2 reviewer output. The U1, U1C, U1A, WI1, and stated baseline commits named by the plan are ancestors of the reviewed commit. I verified the reviewed plan and governing-contract digests from `git show <commit>:<path>` and did not use working-tree files as plan evidence.

I did not require implementation evidence scheduled for Milestones 1-5.

MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED
