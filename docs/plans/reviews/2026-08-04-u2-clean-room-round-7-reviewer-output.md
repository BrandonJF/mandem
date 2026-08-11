# Reviewed Targets

- Review prompt: `docs/plans/reviews/2026-08-04-u2-clean-room-round-7-prompt.md`.
- Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md` at `4caa87f4ed21bafac1c506b5463e97c9514a6028`; SHA-256 verified as `0f684ecaa9fa17617a71d35a86795926561e330b47c2d6669c7b5ef1f2ceaa4f` from Git object bytes.
- Governing contract: `PLANS.md` at `4caa87f4ed21bafac1c506b5463e97c9514a6028`; SHA-256 verified as `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0` from Git object bytes.
- Epic: `docs/plans/2026-07-21-001-feat-mandem-plan.md` at the reviewed commit.
- Review lens: complete `PLANS.md` conformance, executor safety, adversarial counterexamples, and closure of every authoritative prior U2 finding.

# PLANS.md Conformance

The plan passes the content-only ExecPlan format rule, purpose and observable-outcome requirements, repository orientation, defined core terms, dependency snapshot, ordered milestones, repository-root Bun commands, red/green observations, validation gates, recovery guidance, living sections, and bottom revision-note requirement. The SQLite instructions remain repository-local, and the plan schedules implementation evidence instead of claiming that evidence exists.

The plan does not meet the non-negotiable self-containment and novice-execution requirements for review dispatch validation. It requires comparison with a committed dispatch record but neither stores that record in the bound manifest nor identifies its exact path, commit, digest, or bytes. A novice must invent how the Git adapter locates and authenticates the record, and the validator cannot prove that the selected record is the one governed by the manifest.

The single-fenced-block rule does not apply because the Markdown file contains the ExecPlan. Prototype and parallel-implementation guidance does not apply because the plan schedules neither.

# Prior-Finding Closure

- Round-one through round-five findings: **CLOSED**. The plan retains the repaired protocol catalogs, process-finding behavior, executable milestones, embedded SQLite contract, reducer state, lease behavior, replayable disposition effects, trusted review-evidence boundary, safe release path, server-derived accepted-review event, merge-repair lease, and current living sections.
- `U2-R6-001`, complete sanitized prompt and dispatch comparison: **OPEN**. The prompt text, digest rule, byte comparison, and reviewer-session comparison are present, but the manifest does not contain or bind the exact dispatch record. Finding `U2-R7-001` gives the remaining repair.
- `U2-R6-002`, reviewer-authored verdict derivation: **CLOSED**. The plan defines one strict final marker, canonical byte validation, a closed parser result, rejection of missing, repeated, malformed, non-final, and non-clean results, and construction of `ReviewOutputTargetV1` only from parsed output bytes.

# Verdict

`CHANGES_REQUIRED` — P0: 0, P1: 1, P2: 0.

# Findings

## U2-R7-001 — P1: The manifest does not bind the dispatch record used to prove which prompt reached the reviewer

Exact evidence: `BoundReviewManifestV1` contains the plan, governing contract, prompt text and digest, role, lenses, output path, attestations, and risk policy, but it has no dispatch-record field or reference at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:503`. `ReviewDispatchRecordV1` is a separate value, and `ReviewEvidenceBundleV1` contains only its parsed form, without dispatch-record bytes or a path, commit, and digest target, at lines 504-505. The prose says that the Git adapter “reads the committed dispatch record” and compares its prompt and session at lines 516 and 607, but it never states how the adapter identifies that record or proves that its bytes are the record bound to the manifest. The bundle-limit table also still describes “the two byte arrays” at line 620 even though the revised bundle now handles manifest bytes, dispatch prompt bytes, and output bytes.

Failure scenario: the repository contains two committed dispatch records for one manifest. The record from the actual launch contains a shortened prompt, while another record contains the manifest prompt and names the expected reviewer session. Because the manifest identifies neither record and the evidence bundle carries no exact dispatch artifact bytes or target, an adapter can select the favorable record. Prompt-byte, reviewer-session, attestation, plan, contract, role, lens, and risk checks then pass even though they validate a record that did not govern the reviewer launch. Different executors can choose different discovery conventions and accept different evidence from the same Git history.

Smallest repair: embed the complete dispatch record in `BoundReviewManifestV1`, or add one immutable dispatch target with a prescribed path, commit, and digest and make the manifest bind that target. If the record remains separate, add its exact bytes and parsed value to `ReviewEvidenceBundleV1`; require the Git adapter to read only that bound artifact; and require `validateReviewEvidence` to verify its target, digest, canonical bytes, prompt equality, and reviewer session before acceptance. Define which commit supplies the dispatch write set, include the dispatch bytes in the canonical bundle digest and size accounting, and add disposable-Git rejection tests for an absent, substituted, changed, or ambiguously duplicated dispatch record.

# Verification Notes

I read the complete bound `PLANS.md`, exact 1,055-line U2 plan, complete epic ExecPlan, all six prior authoritative U2 reviewer outputs, and the round-seven prompt. I verified the reviewed hashes from `git show <commit>:<path>`. The U1, U1C, U1A, WI1, and stated baseline commits are ancestors of the reviewed commit. I inspected the merged runtime and architecture-standard module surfaces, the approval and projection contracts, package commands and pinned Bun types, the architecture standard, and the downstream U3-U7 dependency contracts.

I did not require implementation evidence scheduled for Milestones 1-5. I made no repository, issue, pull-request, or Git mutation other than creating this manifest-authorized reviewer output.

MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED
