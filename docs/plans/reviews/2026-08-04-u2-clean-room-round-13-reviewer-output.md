# Reviewed Targets

- Review prompt: `docs/plans/reviews/2026-08-04-u2-clean-room-round-13-prompt.md`.
- Reviewed plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md` at `e3b8ec185eac9280213ce8f7f59d75012b39251b`; SHA-256 `b4939425b0311d79c62ce2fc7b4e2cb660aee0ea1d1ab19c52c0e99bed240765` verified from Git object bytes.
- Governing contract: `PLANS.md` at `e3b8ec185eac9280213ce8f7f59d75012b39251b`; SHA-256 `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0` verified from Git object bytes.
- Epic, cited U1, U1C, U1A, and WI1 inputs, required architecture and approval contracts, repository module surfaces, package commands, and all twelve prior authoritative U2 reviewer outputs were read at the reviewed commit.

# PLANS.md Conformance

The plan uses the content-only ExecPlan format, states an observable outcome, defines the relevant repository terms and context, identifies dependency commits, gives ordered milestones, names repository-root Bun commands with red and green observations, specifies recovery behavior, maintains the required living sections, and ends with revision notes. Its Bun and SQLite instructions are embedded in the plan. It correctly schedules implementation evidence instead of claiming implementation has occurred.

The plan does not yet meet the self-contained, novice-execution, and demonstrable-validation requirements for complete event-only projection rebuild. Its replacement port carries only lifecycle projection bytes and four digests, not the reconstructed lease, gate, routed-item, or checkpoint values that the port must replace. It also has no command or event that can introduce a `GateDecisionV1` into the event stream. A novice must invent both the projection replacement payload and the durable source for a gate row.

The single-fenced-block rule does not apply because this Markdown file contains the ExecPlan. Prototype and parallel-implementation guidance do not apply because the plan schedules neither.

# Prior-Finding Closure

- Rounds one through eleven: `CLOSED`. The plan retains the repaired protocol schemas, process-finding policy, executable milestones, repository-local SQLite contract, policy and lease state, trusted review-evidence boundary, review-decision replay value, prompt and verdict parsing, dispatch order, exact reviewer-commit selection, checkpoint payload and destination, and verified checkpoint target in the immutable event.
- `U2-R12-001`, complete projection rebuild for both checkpoint destinations: `CLOSED`. Milestone 3 scenario 13 and its concrete proof now require both destination tests to capture canonical lifecycle, lease, gate, routed-item, and checkpoint bytes; delete all five disposable projection sets; make `PortableCheckpointPort` fail on replay reads; rebuild only from events; compare every reconstructed value before replacement; and accept review through the rebuilt receipt target for the receipt case at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:851-853`.

# Verdict

`CHANGES_REQUIRED` — P0: 0, P1: 2, P2: 0.

# Findings

## U2-R13-001 — P1: The projection-replacement port cannot replace four rebuilt projection sets

Exact evidence: The plan requires replay to atomically replace lifecycle, lease, gate, routed-item, and checkpoint projections at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:846` and to compare every captured projection value before replacement for both checkpoint destinations at lines 851-853. The storage contract separately defines complete values for all five projection sets at lines 670-673. However, `VerifiedProjectionReplacementV1` contains `lifecycle: IssueProjectionV1` and only `leases_digest`, `gates_digest`, `routed_items_digest`, and `checkpoints_digest`; `EventStorePort.replaceProjections` receives only that value at lines 602-613. `IssueProjectionV1` contains one active lease and unresolved finding IDs, not the complete lease, gate, routed-item, or checkpoint rows.

Failure scenario: the receipt test captures all five projection sets, deletes every row, and replays the event stream without consulting `PortableCheckpointPort`. The application can calculate four aggregate digests, but its only replacement call cannot supply the reconstructed lease rows, gate rows, routed-item rows, or checkpoint rows. The SQLite adapter must either leave those sets empty, reread a source that replay must not use, or invent an undeclared side channel. Each choice violates the required byte-for-byte replacement proof.

Smallest repair: define closed, canonically ordered rebuilt values for every disposable projection set, including their row identities and exact serialized bytes or complete typed row values. Add them to `VerifiedProjectionReplacementV1`, or replace that type with one complete `RebuiltProjectionsV1` value, and require `replaceProjections` to replace all five sets from it in one transaction after validating the event anchor and each collection digest. Define the reducers that produce those values and update the port fake, SQLite adapter, parser and serializer fixtures, and both checkpoint-destination tests to prove that the port receives and writes each captured value.

## U2-R13-002 — P1: Gate decisions have no durable event path for event-only replay

Exact evidence: R9 requires gate decisions with definition, inputs, target, outcome, and evidence, and the SQLite contract requires a complete current gate projection at `docs/plans/issues/u2-protocol-lifecycle-sqlite.md:75`, `521-523`, and `672`. The required checkpoint tests must populate and reconstruct that projection at lines 851-853. Yet the closed command and event catalogs at lines 456-457 contain no gate-decision or gate-invalidation operation, and the complete command-payload table at lines 461-491 has no `GateDecisionV1` field. `LifecyclePolicyStateV1.gates` is a read-model field at line 523, but no declared event payload can create or update it.

Failure scenario: a fresh ledger reaches a transition whose guard requires a current gate. No valid U2 command appends the required gate decision. If an implementation directly inserts the gate projection so the checkpoint test can populate it, deletion and event-only replay cannot recover that row. If it instead infers the gate from a later command's artifact references, it has invented an unreviewed schema and freshness rule. The reconstructed ledger either loses the gate, accepts a transition against an arbitrary value, or cannot reproduce the captured bytes.

Smallest repair: define one durable U2 gate-ingestion path before implementation. It may be an authorized command and event carrying the complete `GateDecisionV1`, or a server-derived event fed by one explicitly typed application port. Specify its actor and scope, idempotency, freshness and invalidation rules, event payload, reducers, projection update, and tests. If gate decisions are intentionally deferred to U4, remove the U2 gate projection, freshness guards, and required gate-rebuild assertions consistently from U2 and every dependent contract instead of leaving an undeclared persistence path.

# Verification Notes

I verified the two bound SHA-256 values with `git show <commit>:<path>`, not working-tree content. The dependency and baseline commits named in the plan are ancestors of `e3b8ec185eac9280213ce8f7f59d75012b39251b`. I inspected the exact plan and governing contract, the epic, all cited dependency outputs, required architecture and approval surfaces, current module and package surfaces, this prompt, and every prior authoritative U2 reviewer output. I did not require implementation evidence scheduled for Milestones 1-5.

MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED
