## Reviewed Targets

- Review manifest: `docs/plans/reviews/2026-08-04-u2a-clean-room-round-4-prompt.md`.
- Reviewed ExecPlan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md` at
  `d80749aff3820ac53dbbf10b1aa191c75cb5eab3`; SHA-256 verified from Git object bytes as
  `860b47c83a47de93b788f4dd87aa27473cb1a6563f07ad7ed4206c46eb807e65`.
- Governing contract: `PLANS.md` at the same commit; SHA-256 verified from Git object bytes as
  `009eb0f26084005cdee79b555239f758de806ac1f1e15bcc731523b98826a6d3`.
- I read the complete bound operating and governing contracts, the parent epic, U2B boundary,
  issue graph, cited dependency plans, required runtime and architecture-standard surfaces, the
  approval contract, the complete bound prompt, and all prior U2 and U2A reviewer outputs.

## PLANS.md Conformance

The content-only ExecPlan convention applies. The plan has the required living sections, explains
the observable pure-policy outcome, names the repository files and commands, records a
post-third-failure whole-plan audit and keep-scope decision, gives recovery guidance, and keeps
SQLite, durable storage, checkpoint I/O, provider adapters, and other runtime I/O outside U2A.

The plan does not yet meet the self-contained, complete-value, novice-executable, or deterministic
replay requirements. The retained issue has sixteen failed reviews, but the plan does not provide an
implementable stable lineage proof for another review. It also leaves a command rejection's required
recovery actions to implementation judgment and accepts untrusted workspace facts as if they were
validated external observations. Each omission changes public results or durable event values.

## Prior-Finding Closure

- `U2A-CR3-001` — `CLOSED`. `LeaseTargetV1` distinguishes the with-active-lease and
  without-active-lease branches. Pause and cancellation now emit
  `LifecycleInterruptionEffectV1`; resume emits the separate lease-free
  `LifecycleResumeEffectV1`. The effects preserve or record the complete token map, workspace,
  evidence, and nullable revoked lease, and the required tests cover each listed source state.
- `U2A-CR3-002` — `CLOSED`. `ReconciliationEffectV1` records a nullable complete revoked lease,
  trusted observed time, and the resulting complete token map. Event folding has one stated effect
  application, and the prescribed tests cover no lease plus work and integration leases and reject
  the stale owner after replay.
- `U2A-CR3-003` — `CLOSED`. The trusted attestation now contains a sorted,
  independently verified participant inventory with at least one author and exactly one reviewer.
  The validator derives all manifest participant claims from that inventory and rejects omissions,
  substitutions, collisions, and manifest-only claims. The required fixtures exercise those cases.
- `U2A-CR3-004` — `CLOSED`. `Progress`, `Outcomes & Retrospective`, and the round-three replanning
  note consistently record failure sixteen, the whole-plan audit, the retained reduced scope, and
  the next repair-and-review action.

## Verdict

`CHANGES_REQUIRED` — P1: 3, P2: 0.

## Findings

### U2A-CR4-001 — P1: The retained review-limit policy cannot prove that this revised plan remains in the operator-authorized split lineage

Exact evidence: the plan preserves the former thirteen failures and the three U2A failures on the
same issue UUID at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:104-107` and
`:949-955`. At count five or greater, both submission and dispatch require the latest fifth choice
to target the submitted plan at `:967-979`. A later plan may use a split choice only when its issue
ID is in that lineage and its readiness artifact declares the original `scope_digest` at `:513-520`.
That digest itself includes the readiness-artifact digest. The current Behavior Readiness Check at
`:981-1002` has no declared lineage or scope-digest value, no canonical readiness-artifact shape,
and no producer that can make the required declaration. A changed readiness artifact cannot also
have the digest used to form the prior scope digest without an additional, unspecified rule.

Failure scenario: after repairing this round-four finding, the retained issue submits a new plan
commit while its count remains sixteen. One implementation bypasses the fifth-review boundary
because the issue UUID matches U2A; another blocks it because the new readiness artifact cannot
prove the old scope digest; a third invents a self-referential digest rule. Those implementations
accept different review dispatches and cannot fold one common review history.

Smallest repair: define one closed, immutable split-lineage declaration with a non-self-referential
scope digest, its exact committed artifact target, and the rule that links each later plan's current
readiness check to that declaration. Make the fifth-choice event store that declaration, make
submission and dispatch compare it without recomputing a mutable readiness digest, and add a
fixture that starts with the recorded split and failure sixteen, changes the plan/readiness bytes,
then permits only the declared U2A lineage while rejecting another issue and another scope.

### U2A-CR4-002 — P1: The lifecycle contract does not prescribe the `next_actions` returned for most rejected commands

Exact evidence: R5 and R6 require the exhaustive transition catalog to determine the typed
rejection and permitted recovery actions at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:164-167`.
`ProtocolErrorV1` includes required `next_actions` at `:288-295`, and `NextActionV1` is a closed
catalog at `:694-697`. The lifecycle table at `:771-802` has no error or next-action column. The
general guard text lists possible error families at `:767-769` and says failed predicates return a
next action stated elsewhere at `:832-846`, but it does not map invalid source state, attribution
mismatch, forbidden role or scope, stale snapshot, missing review evidence, failed review-limit
guard, or most lease-target mismatches to any member of `NextActionV1`. Only isolated cases specify
an action, such as expired lease at `:838-839` and merge mismatch at `:549-555`.

Failure scenario: an operator pauses `Working` with a lease target for a prior owner, or a reviewer
submits a valid verdict after the retained fifth-review boundary. Both commands reject, but one
worker can return `reacquire-lease` or `ask-operator` while another returns `retry-command` or
`return-to-planning`. The same command and snapshot then have different `ProtocolErrorV1` bytes and
different client-visible recovery behavior despite the plan's deterministic-result promise.

Smallest repair: add a prescriptive rejection matrix for every ordered guard in every lifecycle row.
For each guard, state the stable `ErrorCodeV1`, `retryable` value, evidence selection, and exact
sorted `NextActionV1` list. Cross-reference the matrix from the parser and reducer tests, including
both lease-target variants and the retained third/fifth-review boundaries.

### U2A-CR4-003 — P1: Workspace facts enter the pure reducer without the trusted validated input that the plan says external observations require

Exact evidence: the plan says external observations enter pure policy as application-validated
immutable inputs at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:93-95`. It requires
`WorkspaceTargetV1` in acquisition, release, review-repair, Learn, pause, resume, and cancellation
payloads at `:316-333`, but defines that value only as caller-supplied identifiers, branch, head,
and digest at `:394`. `LifecycleEvaluationInputV1` at `:746-756` accepts trusted time, dependency,
review, and approval evidence, but no validated workspace observation. The plan nevertheless calls
a workspace ready when it has the approved branch, head, and nonzero path digest at `:832-840`,
without defining the source or comparison that establishes any of those facts. In a lease-free
pause or cancellation there is also no active lease in the snapshot from which to preserve or verify
the supplied workspace (`:560-584`, `:795-797`).

Failure scenario: a syntactically valid `cancel-work` command from `NeedsPlanning` supplies a
workspace ID and branch/head for another repository. The reducer has no trusted input with which to
reject it, so it can record that workspace in the cancellation event. Another implementation can
add an undeclared Git lookup or trust the client field. The resulting event stream and later
worktree action differ, even though U2A promises that it neither performs I/O nor accepts
caller-asserted external facts.

Smallest repair: define a closed `ValidatedWorkspaceObservationV1` that an application adapter
supplies only for commands that name a workspace. Include its exact artifact/provenance fields and
the rule that it must equal the payload target and, where applicable, the approved branch and head.
Add it to `LifecycleEvaluationInputV1`, reject absent, stale, mismatched, or foreign observations
with the explicit error/action matrix, and add pure fixtures for each no-lease and lease-bearing
pause/cancellation branch plus acquisition and repair transfer. The reducer remains pure because it
only compares the supplied validated value.

## Verification Notes

I used `git show d80749aff3820ac53dbbf10b1aa191c75cb5eab3:<path>` to inspect the bound plan,
contract, dependency, source, and review bytes, and verified both manifest SHA-256 values from those
object bytes. I did not use working-tree content as evidence for the reviewed plan, require
scheduled implementation evidence, modify any other repository file, mutate a git-native issue,
commit, push, or contact an external provider.

MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED
