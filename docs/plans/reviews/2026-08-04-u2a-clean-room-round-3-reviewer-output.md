# Reviewed Targets

- Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md` at
  `e5a629ce57d11902403b4fc421bf34b4576b6032`; SHA-256 verified from Git object bytes as
  `5b008b924eb3eab7fbef90f174e1e9f2df271d0c9ff1761d617cd3d4c59adedc`.
- Governing contract: `PLANS.md` at the same commit; SHA-256 verified from Git object bytes as
  `009eb0f26084005cdee79b555239f758de806ac1f1e15bcc731523b98826a6d3`.
- I read the bound round-3 prompt, `.agents/OPERATING.md`, the complete `PLANS.md`, the parent
  epic, U2B boundary, issue graph, runtime and architecture-standard surfaces, all thirteen prior
  U2 reviewer outputs, and both prior U2A reviewer outputs.

# PLANS.md Conformance

The content-only ExecPlan convention applies. The plan has the required living sections, explains
the user-visible pure-policy outcome, names files and repository-root Bun commands, supplies an
author-side readiness check, and keeps SQLite, durable storage, checkpoint I/O, provider adapters,
and other runtime I/O out of U2A.

The plan does not meet the self-contained, novice-executable, complete-value, or deterministic
event-replay requirements. Its pause, resume, cancellation, and reconciliation rows cannot record
the prescribed complete effects, and its review validator cannot establish the authorship facts
that the independent-review rule requires. A worker must add wire values or choose state-changing
event behavior that the plan declares closed.

# Prior-Finding Closure

- `U2A-CR2-001` — `CLOSED`. The exhaustive control-plane matrix now includes `decide-plan` and
  `review-work`, matching `queue-approved-plan` and `record-review-findings`.
- `U2A-CR2-002` — `CLOSED`. The plan now defines the review participant, risk-policy, trusted
  attestation, validated-evidence, validator-input, and validator-result shapes. Finding
  `U2A-CR3-003` identifies a separate missing producer-to-validator provenance binding.
- `U2A-CR2-003` — `CLOSED`. The initial digest, domain separator, prior-digest bytes, uint64 big-
  endian length, canonical event bytes, and intermediate-event order are prescribed.
- `U2A-CR2-004` — `CLOSED`. The review-repair, Learn-integration, and merge-repair sequences now
  assign lease mutation to explicit lease events and prescribe their intermediate states.

# Verdict

`CHANGES_REQUIRED` — P1: 3, P2: 1.

# Findings

## U2A-CR3-001 — P1: Pause, resume, and cancellation rows cannot produce their declared complete event values

Exact evidence: the closed payload table gives `pause-work` and `cancel-work` a non-null
`lease_id` and `fencing_token`, but no `handoff`, at
`docs/plans/issues/u2-protocol-lifecycle-sqlite.md:321-323`. The table nevertheless permits pause
from `Queued`, `Reviewing`, and `Learning`, and cancellation from `NeedsPlanning`,
`NeedsApproval`, `Queued`, `Reviewing`, and `Learning`, where the normal lifecycle has no active
lease, at lines 736-738. The plan permits null only where it explicitly says so, and these payload
fields are not nullable at lines 374-381. It requires pause, resume, and cancellation events to use
`LeaseHandoffEffectV1`, whose required `handoff` is a `HandoffDecisionV1`, at lines 523-524 and
588-591. No pause, resume, or cancellation handoff kind/outcome pairing exists in the closed
`HandoffKindV1` and `HandoffOutcomeCodeV1` catalog at lines 488-500. The event rules therefore
require an unavailable complete value; they also cannot carry the no-active-lease branch without
inventing a lease identifier and token.

Failure scenario: an operator pauses a correctly queued issue. There is no active lease, but the
closed command requires a lease ID and token. Even if an implementation invents those values, it
cannot construct the required handoff effect because no valid handoff pairing represents pausing.
Another implementation can omit the lease effect or reuse an implementation handoff. Those choices
produce incompatible canonical events and rebuilt snapshots.

Smallest repair: define distinct closed pause, resume, and cancellation effect values, rather than
using `LeaseHandoffEffectV1`. Each value must state the workspace result, whether a lease existed,
the complete revoked lease when one existed, the resulting fencing history, and all required
evidence. Make the corresponding command fields conditional through exact discriminated variants,
including the no-active-lease branch. Add each effect to the event union and snapshot folding rules,
then add success and replay fixtures for every listed source state, with and without an active lease.

## U2A-CR3-002 — P1: Reconciliation conflicts cannot replay the mandatory unsafe-lease revocation

Exact evidence: the `record-reconciliation-conflict` row moves any nonterminal state to `NeedsYou`
and requires it to revoke an unsafe lease at
`docs/plans/issues/u2-protocol-lifecycle-sqlite.md:739`. Its closed command payload contains only
`conflict_code` and `evidence` at line 324, and the exhaustive event mapping gives reconciliation
only `{ conflict_code: ErrorCodeV1; evidence: ArtifactReferenceV1[] }` at lines 593-597. The plan
otherwise requires an event to carry the complete lease value it changes at lines 565-583, and the
lease-fencing rule requires the token history to retain revocation so the old owner stays fenced at
lines 795-802.

Failure scenario: a worker holds a valid work lease when the control plane records an authority-
sensitive reconciliation conflict. The committed event contains neither the revoked lease nor a
fencing effect. On event-only reconstruction, an implementation can retain the lease, clear it
without a recorded revocation, or synthesize a revocation timestamp and reason. The resulting
snapshot and stale-owner behavior differ even though the event bytes are identical.

Smallest repair: replace the reconciliation event value with a closed reconciliation effect that
contains the conflict evidence and an explicit nullable revoked-lease effect. Define the no-active-
lease branch, the required revocation reason and timestamp, token-map update, and fold behavior.
Add deterministic event-only replay fixtures for conflicts in a lease-free state and while holding
both work and integration leases, including stale-owner rejection after reconstruction.

## U2A-CR3-003 — P1: The validator cannot prove the author and reviser facts used to reject self-review

Exact evidence: `author_attestations` and `reviser_attestations` have only separate upper bounds;
the plan gives neither collection a required member at
`docs/plans/issues/u2-protocol-lifecycle-sqlite.md:402-409`. Each participant attestation contains
only a generic `ArtifactReferenceV1`, not the signed or parsed fact that associates its subject,
role, and context with its artifact, at lines 387-390. The complete
`ReviewValidationInputV1` supplies only manifest bytes, dispatch, output bytes, one
`ReviewEvidenceAttestationV1`, and gates at lines 822-834. That trusted attestation exposes a
generic set of source digests and the reviewer session, but no verified author or reviser identities,
roles, contexts, or mapping to their artifacts at lines 449-458. The validator nevertheless claims
to reject self-attestation and caller-supplied context claims at lines 809-817.

Failure scenario: the session that authored a plan submits a manifest with empty author and reviser
collections, labels itself a fresh reviewer, and supplies an artifact reference whose digest appears
in `source_digests`. The declared validator input has no independently observed author/reviser fact
against which to compare that omission. An implementation can accept the clean output based only on
the manifest's claims, while another rejects empty collections or adds an undeclared provenance
lookup.

Smallest repair: require one or more author attestations and define a closed, independently
validated participant-provenance value for every author, reviser, and reviewer. Add those verified
values, including their artifact-to-participant mapping and context source, to the trusted
attestation or validator input. Require the validator to derive the manifest participant arrays from
them, reject omissions and mismatches, and test empty authors, omitted revisers, self-review by
omission, and substituted participant artifacts.

## U2A-CR3-004 — P2: The living sections name the wrong failed-review work

Exact evidence: `Progress` records U2A round 1 as failure fourteen and round 2 as failure fifteen
at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:55-58`, but the next incomplete item says to
repair four round-1 findings at lines 59-60. `Outcomes & Retrospective` then describes only round 1
while assigning it the lifetime count of fifteen at lines 106-112. The plan's round-2 repair note
shows that the author already treated the later findings as the current work at lines 1129-1133.

Failure scenario: a fresh planner follows the incomplete Progress item and repairs the already
closed round-1 findings instead of the four round-2 findings. The plan gives incompatible restart
instructions and does not meet the requirement that living sections state the current next action.

Smallest repair: update `Progress` and `Outcomes & Retrospective` with the four round-2 findings,
their current repair status, the preserved lifetime count of fifteen, and the next permitted
repair-and-review action.

# Verification Notes

I verified the plan and `PLANS.md` SHA-256 values from `git show
e5a629ce57d11902403b4fc421bf34b4576b6032:<path>`. I used the bound commit rather than working-tree
plan bytes. I did not require implementation evidence scheduled by the plan, change another file,
mutate an issue, contact a provider, commit, or push.

MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED
