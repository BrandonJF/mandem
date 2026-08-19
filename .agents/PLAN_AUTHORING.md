# Plan authoring principles

Read this file completely before writing or revising an ExecPlan. Read `PLANS.md` separately and
follow its complete contract. This file records recurring reasoning errors that ordinary formatting
and documentation checks do not catch.

`PLANS.md` is immutable. Never edit it. Record additional planning guidance in this file or another
repository-owned operating document.

## Plan the behavior as a complete system

Trace every promised behavior from the action that starts it through validation, state change,
durable evidence, recovery, visible result, and test. For every value, name who creates it, who may
change it, where it is recorded, how replay restores it, and which consumer uses it. A value without
a producer or consumer is an unresolved design decision.

Review the complete system after a structural change. Do not repair only the latest finding and
assume nearby paths remain valid. Check every command, event, state transition, stored value,
adapter input, fold operation, and milestone that uses the changed concept.

## Keep one exact contract at each boundary

Give every protocol field one type, grammar, nullability rule, cardinality, and trust classification.
Do not describe the same shape differently in prose, tables, examples, and machine-readable
catalogs. When a contract is large enough to behave like a type system, represent its closed parts
in compilable data and test parity with the prose that remains.

Distinguish caller claims from authenticated observations. Commands contain only values the caller
is allowed to choose. Trusted time, identity, repository state, approval, provider evidence, and
workspace observations enter through named validated inputs. Events record the trusted inputs used
to make the decision so replay does not need to trust the original caller or contact an external
system again.

## Test boundary values before ordinary examples

Define and reconcile the initial state, first transition, zero and empty values, maximum values,
expiry equality, stale revisions, terminal states, and retry behavior. Initial constructors and
derived-state functions must return the same result for the same state. A positive issued value may
need a separate zero-capable counter type.

For each rejection, specify the first failing guard, error, emitted events, unchanged or changed
state, evidence, and next action. For each accepted transition, specify the complete event value and
prove that folding emitted events produces the returned snapshot byte for byte.

## Order work by real dependencies

Each milestone must create every type, policy, fixture, and helper its tests import. A milestone is
complete only when its focused command can pass using files created by that milestone or earlier
ones. Do not schedule integration fixtures before their policies or require later adapters to prove
an earlier pure-domain boundary.

Keep implementation scope aligned with responsibility. Pure policy defines decisions; adapters
authenticate external facts; storage persists and restores accepted facts; orchestration invokes
the pieces. Do not move a required producer, consumer, or recovery rule out of scope without naming
the issue that owns it and the exact interface between them.

## Define how the change reaches its consumer

A committed artifact is not operational merely because it exists on a branch. Name the branch or
pull request that will deliver it to the default branch, who or what must merge it, and how to verify
the default branch contains and uses it. If the change must remain on a long-lived branch, identify
the exact worktrees or processes that read that branch and who will keep the artifact current.

Do not mark guidance, policy, automation, configuration, or generated output complete while its
intended consumer still reads an older revision. Treat merge, deployment, installation, migration,
or registration as part of the behavior path, not as an assumed follow-up.

## Use review to verify, not to design one finding at a time

Before independent review, run a whole-plan consistency pass across producer, validator, event,
fold, recovery, consumer, and test paths. Group repeated findings by their common cause and repair
the governing model. Do not tailor a clean-room prompt to previous findings or ask a reviewer to
confirm claimed repairs. The same plan-agnostic prompt and output criteria apply to every review.

When a reviewer finds a contradiction, update every representation and affected test instruction
together. Preserve the exact review artifact. A repaired plan is a new immutable target and has no
clean verdict until an independent reviewer judges those exact bytes.

## Complete five pre-review proofs

Complete these proofs as executable evidence before independent review:

- The `closed-contract` proof inventories every public type, variant, grammar, cardinality, and
  nullability rule, then checks parity across prose, machine-readable schemas, examples, and tests.
  If the plan behaves like a type system, compile its closed contracts before review.
  A catalog entry or fixture name is not executable evidence. Boundary fixtures must contain the
  literal input, expected output or error, exact boundary neighbor, and any fixed digest or byte
  oracle that the implementation will assert. The proof must execute those values or validate
  their complete machine-readable form before review.
- The `provenance` proof names the producer, authentication method, immutable binding, and consumer
  for every externally supplied or trusted value. Caller-controlled data cannot become trusted
  evidence merely because a command or event stores it.
- The `state-and-replay` proof gives exhaustive state effects for every command and event, including
  which fields are replaced, retained, or cleared. It proves fold equality and recovery after
  deletion, retry, and restart.
- The `milestone` proof draws the dependency order and verifies that every test imports only files
  created in the same or an earlier milestone. Run each focused command at its milestone boundary.
  It also starts from a clean-checkout prerequisite sequence: name the pinned runtime, install from
  the committed lockfile without changing it, state the success signal, and give recovery for an
  interrupted or failed installation.
- The `scope` proof lists independently verifiable behaviors and contracts. Split behaviors that
  can ship behind a stable interface. A plan combining a wire protocol, lifecycle state machine,
  trust or evidence policy, and persistence is presumptively too broad unless it proves why those
  responsibilities cannot be delivered separately.

Do not dispatch a reviewer until all five proofs have executable evidence rather than readiness
claims. If failures in several proof classes remain after three reviews, stop local repairs and
change the design boundary or split the issue.

## Learn from every blocking review finding

After a `CHANGES_REQUIRED` verdict, classify each blocker by the planning error that produced it,
not by the plan-specific type, field, or file where the reviewer found it. Examples of a failure
class include an undeclared producer, inconsistent representations, caller-controlled trusted
input, an untested boundary, a milestone dependency inversion, or an artifact with no delivery
path.

For each failure class, check this file and its enforcement tests before revising the plan. If the
applicable principle is missing or did not state the requirement strongly enough, add or strengthen
the applicable principle and add an enforcement mechanism such as a focused policy test, executable
planning contract, readiness assertion, or deterministic check. If the principle already covers
the failure, record why the planning agent did not apply it. Strengthen enforcement when the same
class recurs; repeating the prose alone is not a repair.

Keep general guidance at the level of behavior, trust, data flow, sequencing, and verification.
Do not copy plan-specific details into this file. When a finding depends only on one plan's chosen
behavior and provides no reusable planning lesson, record the evidence and explain why no general
change applies.

## Stay at the principle and behavior level

Be exact about public behavior, trust boundaries, state transitions, interfaces, file ownership,
commands, and observable acceptance. Avoid prescribing incidental internal structure that does not
affect correctness or repository architecture. Conversely, do not replace a required decision with
phrases such as “handle appropriately,” “validate as needed,” or “follow existing patterns.”

A novice executor should not need prior conversation, earlier reviews, or unstated judgment to
finish the work. If two reasonable implementations could produce different accepted bytes, state,
authorization results, recovery behavior, delivery state, or user-visible outcomes, the plan still
contains a decision that the author must make.

For every promised public function, write the complete exported signature, generic constraints,
success and failure shape, and error-translation rule. For parsers and validators, define the
validation sequence and map every violation family to one stable error result. A list of function
names or error codes does not close the interface.
For serializers that accept `unknown`, define the complete accepted in-memory object model and the
stable result for cycles, sparse arrays, unsupported values, non-plain objects, symbol keys, and
output beyond parser limits. Structural unions and envelopes need a fixture matrix for wrong roots,
every missing field, every unknown or cross-variant field, invalid discriminants, and nested shape
failures; success-path examples do not cover these public failures.
Assign every fixture to the public function that can observe and decide its result. A generic codec
fixture cannot require a schema, policy, trust, or lifecycle error owned by a later decoder. Add a
machine check that rejects error codes outside each fixture catalog's ownership boundary.
