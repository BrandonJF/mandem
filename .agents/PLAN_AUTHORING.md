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

## Use review to verify, not to design one finding at a time

Before independent review, run a whole-plan consistency pass across producer, validator, event,
fold, recovery, consumer, and test paths. Group repeated findings by their common cause and repair
the governing model. Do not tailor a clean-room prompt to previous findings or ask a reviewer to
confirm claimed repairs. The same plan-agnostic prompt and output criteria apply to every review.

When a reviewer finds a contradiction, update every representation and affected test instruction
together. Preserve the exact review artifact. A repaired plan is a new immutable target and has no
clean verdict until an independent reviewer judges those exact bytes.

## Stay at the principle and behavior level

Be exact about public behavior, trust boundaries, state transitions, interfaces, file ownership,
commands, and observable acceptance. Avoid prescribing incidental internal structure that does not
affect correctness or repository architecture. Conversely, do not replace a required decision with
phrases such as “handle appropriately,” “validate as needed,” or “follow existing patterns.”

A novice executor should not need prior conversation, earlier reviews, or unstated judgment to
finish the work. If two reasonable implementations could produce different accepted bytes, state,
authorization results, recovery behavior, or user-visible outcomes, the plan still contains a
decision that the author must make.
