# U2 plan-review root cause

The thirteen U2A review rounds were not thirteen independent quality checks. They were an iterative
design loop caused by missing author-side proof obligations and a review policy that allowed the
same oversized issue to continue after repeated structural failures.

## Evidence

The 26 preserved U2 and U2A review artifacts contain 62 blocking findings: 26 against the original
U2 plan and 36 against U2A. Classification by the planning error that produced each finding gives:

| Failure class | Findings |
| --- | ---: |
| Closed-contract completeness or consistency | 21 |
| Provenance, immutable binding, or trusted producer | 19 |
| State transition or replay completeness | 15 |
| Milestone or execution feasibility | 4 |
| Scope, process, or living-state drift | 3 |

The distribution is the pattern: 55 of 62 findings concern three parts of one incomplete governing
model—contract closure, trust provenance, and state/replay behavior. Later reviews exposed another
edge of that model after the latest local contradiction was repaired.

## Causal chain

1. The U2A split retained several independently testable responsibilities: wire contracts,
   lifecycle and lease state, review and approval evidence, gates, process findings, and persistence.
2. The plan described much of that protocol and type system in prose rather than executable closed
   contracts and exhaustive transition tables.
3. Author-side readiness checks tested internal document consistency but did not require proof of
   contract closure, provenance, replay completeness, milestone feasibility, or appropriate scope.
4. Repairs followed the newest findings instead of rebuilding and checking the whole governing
   model, so each review discovered the next contradiction.
5. The workflow offered an unlimited practical escape hatch: repeated requests for one more review.
   Review therefore became the mechanism for finishing the design.

## System changes

`.agents/PLAN_AUTHORING.md` now requires five executable pre-review proofs covering the recurring
failure classes. `.agents/OPERATING.md` now requires a deterministic choice check after review
failures and limits a retained issue to one explicit `permit-one-more` exception. The policy allows
only `split` or `redesign` after that exception fails. The choice policy is implemented in the
architecture-standard domain and exposed through `bun run plan-review:choices`.

These controls deliberately do not change `PLANS.md`, which remains immutable.

## Consequence for U2A

U2A has exhausted its one-more-review exception. It must now be split or redesigned before another
clean-room review. A useful split would separate canonical wire contracts, lifecycle and lease
state, review and approval evidence, process policy, and final integration behind explicit stable
interfaces. That issue-graph change requires its own recorded structural choice; it is not part of
this process-control repair.
