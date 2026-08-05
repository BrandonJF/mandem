# Reviewed Targets

- Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md` at
  `af034d892bac36f8b2571cee51951222a0f17c7a`; SHA-256 verified from Git object bytes as
  `be7a694339bcb4d164fac2035206d1c82a0fad9eaadfaac73fe1e6d87758172d`.
- Governing contract: `PLANS.md` at the same commit; SHA-256 verified from Git object bytes as
  `009eb0f26084005cdee79b555239f758de806ac1f1e15bcc731523b98826a6d3`.
- I inspected the bound prompt, the complete governing contract and operating contract, the parent
  epic, U2B boundary, issue graph, relevant runtime and architecture-standard surfaces, the approval
  contract, and all thirteen former U2 reviewer outputs at the bound commit.

# PLANS.md Conformance

The file-only ExecPlan format exception applies. The plan has the required living sections, a
user-visible purpose, explicit pure-domain boundaries, named files, repository-root commands,
deterministic-test intent, recovery guidance, and a revision note. It does not meet the
self-contained, complete-value, readiness, or restart-recovery requirements. A novice must invent
four policy contracts that determine authorization, review dispatch limits, merge verification, and
wire compatibility.

# Prior-Failure Common-Cause Closure

The U2A/U2B split appropriately removes SQLite, checkpoint, migration, and provider-adapter work
from U2A. The plan also carries forward several repairs from the thirteen former reviews, including
the review-output marker, attested review evidence, gate-ingestion event, and complete projection
replacement values.

The common cause behind the former reviews remains open: a value is declared as complete before its
producer, event record, restoration path, or consumer contract is complete. Findings
`U2A-CR1-001` through `U2A-CR1-004` show that problem in the failed-review counter, authority scope,
merge record, and public protocol schema.

# Verdict

`CHANGES_REQUIRED` — 4 P1, 0 P2.

# Findings

## U2A-CR1-001 — P1: The retained U2 issue resets a failed-review count that the governing contract requires it to preserve

Exact evidence: the former U2 plan at commit `e3b8ec185eac9280213ce8f7f59d75012b39251b` and the
reviewed U2A plan both use issue ID `cb67d131-975c-4d97-9a6f-4934be991ac6`. The reviewed plan then
states that U2A initializes `changes_required_count` to zero and that the thirteen former verdicts
do not consume its allowance at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:657-659`.
`PLANS.md:31-35` instead requires every `CHANGES_REQUIRED` verdict for an issue ExecPlan to count
and says that rewriting does not reset the count. The current issue graph also maps U2A, rather than
a new issue, to that same ID.

Failure scenario: after thirteen rejected reviews, a phase agent submits the retained issue as U2A
and receives the zero-through-two review path. It can dispatch a reviewer without recording the
operator's fifth-review choice for this revised target, defeating the third- and fifth-review
controls that prompted the split.

Smallest repair: either retain the thirteen-count history on U2A and record the operator's `split`
choice against this exact U2A plan target before another dispatch, or create a genuinely new U2A
issue with a new issue ID and leave the existing U2 issue and its count closed or superseded. Do not
reset the counter on the existing issue ID. Add fixtures for the retained-ID split and new-ID split
paths.

## U2A-CR1-002 — P1: Two required merge transitions require an authority scope that protocol v1 rejects

Exact evidence: `AuthorityScopeV1` is declared exhaustive at
`docs/plans/issues/u2-protocol-lifecycle-sqlite.md:207-212`, but it does not include `integrate`.
The transition catalog requires `integrate` for both `return-for-repair` and `record-exact-merge` at
lines 537-538. The protocol also says unlisted fields are rejected at lines 252-262 and requires a
principal's scopes to match before policy evaluation at lines 484-492.

Failure scenario: a control-plane principal submits an exact merge. It cannot contain the required
`integrate` scope because the closed parser rejects it, and it cannot satisfy the transition without
that scope. A worker must either bypass the claimed closed scope catalog or invent another scope,
producing incompatible authorization behavior.

Smallest repair: add `integrate` to the exact `AuthorityScopeV1` catalog, define its permitted
roles and command matrix, and add accepted and rejected authorization fixtures for both merge rows.

## U2A-CR1-003 — P1: Event folding drops the exact merge and verification facts that later rows must compare

Exact evidence: `record-exact-merge` requires `approved_head`, `merge_sha`, and evidence, while
both verification commands require `merge_sha` at
`docs/plans/issues/u2-protocol-lifecycle-sqlite.md:281-283`. The transition table requires an exact
merge before either verification result at lines 538-540. Yet the event mapping assigns all exact
merge and verification events only `ArtifactReferenceV1[]` at lines 421-425, and
`LifecycleSnapshotV1` has no merge or verification field at lines 366-385. Event replay is required
to rebuild state solely by folding events at lines 428-439.

Failure scenario: after a restart, the snapshot is in `Verifying` but retains neither the merge SHA
nor its approved head. The reducer cannot reject a verification command for a different merge SHA,
and an event-only rebuild cannot explain which merge the verification closed. Implementations must
either trust the later command, reread Git, or add undeclared snapshot state.

Smallest repair: define a complete immutable merge record containing the approved head, merge SHA,
and evidence. Store it in the exact-merge event and snapshot, retain the verification outcome and
failure code in their events or a named verification record, and require both verification rows to
compare their merge SHA to that stored record. Add event-only replay tests for a matching and
mismatched verification after projection deletion.

## U2A-CR1-004 — P1: The claimed complete closed schema leaves core wire values and parser results undefined

Exact evidence: the plan calls its field rules and named interfaces the complete JSON schema and
forbids the implementer from inferring another shape at
`docs/plans/issues/u2-protocol-lifecycle-sqlite.md:338-360`. However,
`ArtifactReferenceV1` names `kind`, `provider`, and `external_id` without defining their catalogs or
validation at lines 199-204. `HandoffDecisionV1` names an undefined `kind`, `outcome_code`,
`decision_codes`, and `blocker_codes` at lines 320-323. `ParseResultV1` is required as the parser
return value at lines 467-475 but has no variants or fields. The same omission applies to the
`reason_code` and `resolution_code` payload values at lines 273-289; a 64-byte maximum is not an
allowed-value or behavior contract.

Failure scenario: two workers choose different artifact kinds, handoff outcomes, parser success and
failure envelopes, or release reasons while each satisfies the stated byte limits. Their commands,
events, and errors cannot round-trip through the same protocol parser, and U2B cannot store one
meaning without selecting an unreviewed schema.

Smallest repair: define every omitted value as a closed literal union or an exact grammar with its
allowed values, validation, and transition mapping. Define `ParseResultV1<T>` completely, including
its success and failure variants and stable error relationship. Add round-trip, unknown-value, and
permitted-transition fixtures for each new catalog before claiming the protocol schema is complete.

# Verification Notes

I used `git show <commit>:<path>` for both bound digests and for the reviewed evidence. I did not
use working-tree content as evidence for the plan, require scheduled implementation results, edit
another repository file, mutate an issue, create a commit, or contact a provider.

MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED
