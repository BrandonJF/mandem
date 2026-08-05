## Reviewed Targets

- Review manifest: `71464c3c0fc9a764793462ee2cf66317a853f180`
- Reviewed plan and governing contract commit: `d177fb06ae69762c0ee7857b5b8b0700fe40dc91`
- `docs/plans/issues/u2-protocol-lifecycle-sqlite.md` SHA-256 verified: `0bb1f0505f1507c5c1a08c277381d68e0ccb87456e8ae86be22efd5543860605`
- `PLANS.md` SHA-256 verified: `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0`

## PLANS.md Conformance

Not every applicable requirement passes.

The plan passes the living-section, outcome, repository-context, milestone, recovery, dependency, and broad validation requirements. The single-fenced-block rule is non-applicable because this Markdown file itself contains the ExecPlan. Prototype and parallel-implementation guidance is non-applicable because the plan schedules neither.

It fails self-containment and novice-execution requirements because it leaves protocol schemas, public interfaces, concrete edits, focused commands, and required driver behavior for the worker to determine or obtain externally.

## Verdict

`CHANGES_REQUIRED` — 4 P1, 0 P2.

## Findings

### P1 — Protocol v1 has no implementable serialized schemas or public interface contract

Evidence: the plan says only that “initial primitives cover” a list of command areas at [u2-protocol-lifecycle-sqlite.md:191](docs/plans/issues/u2-protocol-lifecycle-sqlite.md:191), gives transition-level prerequisites rather than payload schemas at [u2-protocol-lifecycle-sqlite.md:351](docs/plans/issues/u2-protocol-lifecycle-sqlite.md:351), and requires only a minimum distinguishable error catalog at [u2-protocol-lifecycle-sqlite.md:437](docs/plans/issues/u2-protocol-lifecycle-sqlite.md:437). Milestone 1 lists files but no exported types, function signatures, or per-variant fields at [u2-protocol-lifecycle-sqlite.md:481](docs/plans/issues/u2-protocol-lifecycle-sqlite.md:481).

Failure scenario: two workers can create incompatible “canonical” command, event, receipt, error, port, and result shapes while each satisfies the prose. Downstream U3–U7 then receive no stable public contract.

Smallest repair: add a Protocol v1 appendix defining every command, event, result, error, checkpoint, and port as prescriptive TypeScript/JSON schemas, including required fields, discriminators, canonical byte rules, stable codes, and root-barrel export signatures.

### P1 — The plan omits the command that creates and deduplicates a process finding

Evidence: R12b requires creation of a stable process finding from a review finding, correction, interruption, or delay at [u2-protocol-lifecycle-sqlite.md:81](docs/plans/issues/u2-protocol-lifecycle-sqlite.md:81). The primitive list includes routed-item disposition but not finding creation at [u2-protocol-lifecycle-sqlite.md:191](docs/plans/issues/u2-protocol-lifecycle-sqlite.md:191). The transition catalog has no Plan-phase command that records a review finding as a process finding; it moves `PlanReview` to `NeedsPlanning` through `reject-plan-review` at [u2-protocol-lifecycle-sqlite.md:354](docs/plans/issues/u2-protocol-lifecycle-sqlite.md:354).

Failure scenario: a duplicated clean-room finding can be rejected without a stable finding identity, origin, deduplication key, or durable event. The phase then cannot prove the required disposition or reconstruct the feedback loop without conversation history.

Smallest repair: define a state-preserving `record-process-finding` command and event, including actor permission, phase, typed origin, deterministic identity/deduplication rule, bounded evidence, and tests for duplicated Plan-, Work-, Review-, and Learn-phase reports.

### P1 — Milestones do not provide concrete novice-executable edits or focused commands

Evidence: `PLANS.md` requires exact file locations, commands, working directory, and expected observations at [PLANS.md:45](PLANS.md:45) and [PLANS.md:124](PLANS.md:124). U2 provides file inventories and broad approaches, for example at [u2-protocol-lifecycle-sqlite.md:498](docs/plans/issues/u2-protocol-lifecycle-sqlite.md:498), but no functions to edit or create. Its verification contract names focused suites rather than runnable commands at [u2-protocol-lifecycle-sqlite.md:576](docs/plans/issues/u2-protocol-lifecycle-sqlite.md:576).

Failure scenario: a novice must decide test filenames, Vitest invocations, port boundaries, and production entry points. They cannot establish the required red-first proof or independently verify each milestone.

Smallest repair: add a concrete-steps subsection to each milestone with ordered file edits, named exports and test names, exact repository-root Bun commands, and concise expected red and green observations.

### P1 — The plan makes external documentation a required implementation dependency

Evidence: `PLANS.md` prohibits directing an executor to external documentation and requires needed knowledge in the plan at [PLANS.md:27](PLANS.md:27). U2 identifies Bun documentation as a pattern to follow at [u2-protocol-lifecycle-sqlite.md:544](docs/plans/issues/u2-protocol-lifecycle-sqlite.md:544) and calls Bun and SQLite pages its “Primary external references” at [u2-protocol-lifecycle-sqlite.md:701](docs/plans/issues/u2-protocol-lifecycle-sqlite.md:701).

Failure scenario: the migration and SQLite implementation depends on undocumented details of `Database.serialize()`, connection behavior, and WAL handling that a fresh worker must rediscover from changing external material.

Smallest repair: replace those references with repository-local instructions that state the exact Bun API use, transaction boundaries, backup byte-validation procedure, WAL assumptions, and failure handling. Keep links only as optional background material.

## Verification Notes

The four dependency commits and the stated baseline commit are present and ancestors of the reviewed commit. I inspected the bound plan, `PLANS.md`, the epic requirements and acceptance examples, U2’s referenced approval and architecture contracts, and the affected U4–U10 issue contracts from `d177fb06ae69762c0ee7857b5b8b0700fe40dc91`.
