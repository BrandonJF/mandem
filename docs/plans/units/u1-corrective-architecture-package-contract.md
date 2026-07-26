---
title: "U1C: Correct the architecture checker and package contract"
plan_kind: mandem-child-execplan
program_unit: U1C
parent: ../2026-07-21-001-feat-mandem-plan.md
work_item: 5717221b-f9e6-4c8f-abca-77a1ad3811bf
depends_on:
  - U1 merged at 88b9533ab840c9d357a1d09d2341709e2cbdd986
promotion: planned
execution_authorized: false
date: 2026-07-25
---

# U1C: Correct the Architecture Checker and Package Contract

This child ExecPlan is a living document governed by the repository-root `PLANS.md`. Read that
file in full before executing this plan. Keep `Progress`, `Surprises & Discoveries`, `Decision
Log`, and `Outcomes & Retrospective` current. This revision does not authorize implementation.
Implementation may begin only after a clean-room reviewer approves this exact revision, the
operator approves the same revision, and `execution_authorized` changes to `true` without changing
the instructions below.

## Purpose / Big Picture

Mandem currently passes its local checks while six declared U1 guarantees can be bypassed. This
correction makes those guarantees observable. A contributor will be able to pack Mandem from a
clean checkout, install that archive into an empty consumer directory, and invoke both installed
executables. The architecture checker will also reject each known bypass with a stable rule ID,
repository-relative path, and concise message.

After completion, `bun run check`, `bun run build`, direct executable probes, and the clean
archive/install contract test will pass. Deliberately malformed fixtures will fail before the
implementation changes and pass only after the checker detects the intended violation.

## Progress

- [x] (2026-07-25 14:20Z) Read the durable Git-native issue and reproduced its implementation
  context from the merged repository state.
- [x] (2026-07-25 14:20Z) Authored this non-executable corrective child ExecPlan.
- [ ] Create failing tests for every package and architecture bypass in this plan.
- [ ] Implement the smallest changes that make the new tests pass.
- [ ] Run the complete verification contract and record the evidence in this document.
- [ ] Obtain clean-room review and exact operator approval before changing execution authority.
- [ ] Dispatch an implementation worker only after `execution_authorized: true` is recorded.

## Surprises & Discoveries

- Observation: The current checker passes a module root barrel that re-exports its own
  infrastructure through `@/modules/<module>/infrastructure`.
  Evidence: `ARCH-INFRASTRUCTURE-ROOT-EXPORT` currently compares only relative import specifiers.

- Observation: `package.json` declares compiled executable paths while `.gitignore` excludes
  `dist/` and no package lifecycle command creates it during packing.
  Evidence: issue `5717221b-f9e6-4c8f-abca-77a1ad3811bf` records that `bun pm pack --dry-run` from
  a clean archive omitted both declared bins.

- Observation: The current source scan begins only at `src/` although the rule catalog describes
  authored TypeScript source without that limitation.
  Evidence: `src/modules/architecture-standard/domain/rules.ts` filters files with
  `path.startsWith("src/")` before checking `ARCH-FILEOVERVIEW` and
  `ARCH-NO-EXPLICIT-ANY`.

## Decision Log

- Decision: Make U1C a separate corrective child rather than reopen completed U1.
  Rationale: The U1 merge is durable history. The issue identifies newly validated gaps, and a
  separate plan preserves the exact review and approval record for the correction.
  Date/Author: 2026-07-25 / Codex

- Decision: Add one explicit authored-source policy to the architecture-standard domain.
  Rationale: A documented claim about authored TypeScript needs a single testable definition.
  Scripts, tests, root TypeScript configuration, and future source roots cannot rely on incidental
  `src/` traversal.
  Date/Author: 2026-07-25 / Codex

- Decision: Use package lifecycle metadata plus an archive-to-consumer installation test.
  Rationale: Building in the repository proves only local files. Packing and installing the
  tarball proves that the published package contains the declared executables and that consumers can
  invoke them.
  Date/Author: 2026-07-25 / Codex

- Decision: U1A and U2 remain blocked until U1C merges and post-merge verification passes.
  Rationale: U1A extends the same architecture kernel and U2 depends on a corrected package and
  repository gate baseline.
  Date/Author: 2026-07-25 / Codex

## Outcomes & Retrospective

Planning outcome: this plan describes the six validated corrections and their test-first proof.
No production code has changed, no review has approved this revision, and implementation remains
unauthorized. The implementation outcome, merge SHA, archive evidence, and downstream
revalidation result must be added here by the executor and orchestrator.

## Context and Orientation

Mandem is one Bun package. `package.json` declares the `mandem` and `mandem-server` commands at
`dist/mandem` and `dist/mandem-server`. `src/cli/main.ts` and `src/server/main.ts` are the bounded
entrypoints. `bun run build` currently compiles both, but the package manifest does not arrange for
that build before packaging or limit the archive deliberately.

The `architecture-standard` module owns Mandem's deterministic static checks.
`src/modules/architecture-standard/domain/rules.ts` contains pure rule evaluation.
`src/modules/architecture-standard/application/use-cases/analyze-repository.ts` invokes it through
a repository-tree port. `src/modules/architecture-standard/infrastructure/repositories/file-system-tree.ts`
reads repository files. `scripts/check-architecture.ts` is the thin command-line wrapper.
`scripts/check-architecture.test.ts` tests the evaluator and wrapper. These layers must remain in
place: policy belongs in the domain, file traversal in infrastructure, and process output in the
script.

An authored TypeScript file is a human-maintained `.ts` or `.tsx` file that the explicit policy
includes. For this correction, the policy includes `src/**/*.ts`, `src/**/*.tsx`, `scripts/**/*.ts`,
`scripts/**/*.tsx`, `tests/**/*.ts`, `tests/**/*.tsx`, and root `*.config.ts` and `*.config.tsx`.
It excludes files under complete path segments `.git`, `node_modules`, `dist`, `coverage`,
`generated`, `vendor`, or `vendored`; paths below `tests/fixtures/`; and declaration files ending
`.d.ts`. A source-looking file outside the includes is an `ARCH-UNSCOPED-TYPESCRIPT` violation so
future source roots cannot evade review silently. This policy is also the correction U1A consumes;
U1A may extend it only through its own reviewed plan.

An I/O import or API accesses the filesystem, a process, a network, a database, or an external
vendor service. It is allowed only in a module's `infrastructure/` directory, its exact
`api/composition.ts`, or the two thin entrypoints. The correction must detect both imported I/O
packages and direct global API access. It must not attempt to classify arbitrary third-party
packages as I/O; the manifest must explicitly include the vendor clients and APIs the rule claims
to cover, beginning with `@octokit/rest`, the Node built-ins already listed by U1, `Bun.connect`,
`process.stdin`, and `process.stdout.write`.

## Scope and Boundaries

U1C corrects only these validated findings from work item `5717221b-f9e6-4c8f-abca-77a1ad3811bf`:

1. A packed Mandem archive omits declared executable files.
2. Alias infrastructure re-exports evade `ARCH-INFRASTRUCTURE-ROOT-EXPORT`.
3. A domain import of a vendor I/O client evades dependency and I/O checks.
4. `Bun.connect`, `process.stdin`, and `process.stdout.write` evade I/O placement.
5. Fileoverview and explicit-`any` checks omit authored scripts, tests, and root TypeScript
   configuration.
6. The malformed-fixture matrix compares rule count rather than the exact stable rule set.

Do not add documentation navigation, Git hooks, provider hooks, a server, Docker files, SQLite,
runtime lifecycle behavior, or consumer installation. U1A owns documentation and hook work. U2
and later units remain blocked. Do not change stable meanings of existing `ARCH-*` IDs. Add only
the narrowly necessary `ARCH-UNSCOPED-TYPESCRIPT` ID and document it in the architecture standard.

## Exact Architecture Rule Matrix

The implementation must retain this exact v1 catalog. The table is normative for the malformed
fixture matrix: every row needs a fixture that asserts the listed ID, path, and message fragment.
The test must first assert exact set equality between these IDs and `architectureRules.map(rule =>
rule.id)`; it must not use length comparison or subset matching as a replacement.

| Rule ID | Fixture path | Required message fragment |
| --- | --- | --- |
| `ARCH-MODULE-NAME` | `src/modules/Bad_Name` | `lowercase kebab-case` |
| `ARCH-MODULE-DOMAIN` | `src/modules/Bad_Name` | `contain domain` |
| `ARCH-MODULE-APPLICATION` | `src/modules/Bad_Name` | `contain application` |
| `ARCH-MODULE-INFRASTRUCTURE` | `src/modules/Bad_Name` | `contain infrastructure` |
| `ARCH-MODULE-API` | `src/modules/Bad_Name` | `contain api` |
| `ARCH-MODULE-README` | `src/modules/Bad_Name` | `README.md` |
| `ARCH-MODULE-ROOT-BARREL` | `src/modules/no-barrel` | `index.ts` |
| `ARCH-DOMAIN-TYPES` | `src/modules/Bad_Name` | `domain/types.ts` |
| `ARCH-API-COMPOSITION` | `src/modules/Bad_Name` | `api/composition.ts` |
| `ARCH-MODULE-TESTS` | `src/modules/Bad_Name` | `contain tests` |
| `ARCH-MODULE-TEST-FAKES` | `src/modules/Bad_Name` | `tests/fakes` |
| `ARCH-DOMAIN-DEPENDENCY` | `src/modules/broken/domain/entity.ts` | `outer layer` |
| `ARCH-APPLICATION-DEPENDENCY` | `src/modules/broken/application/zod.ts` | `only domain or application` |
| `ARCH-CROSS-MODULE-DEEP-IMPORT` | `src/modules/broken/application/deep.ts` | `module barrels` |
| `ARCH-INFRASTRUCTURE-ROOT-EXPORT` | `src/modules/broken/index.ts` | `do not export infrastructure` |
| `ARCH-IO-PLACEMENT` | `src/modules/broken/domain/io.ts` | `limited to infrastructure` |
| `ARCH-FILEOVERVIEW` | `scripts/missing-overview.ts` | `@fileoverview` |
| `ARCH-NO-EXPLICIT-ANY` | `tests/has-any.test.ts` | `explicit any` |
| `ARCH-UNSCOPED-TYPESCRIPT` | `tools/unscoped.ts` | `not covered by authored-source policy` |
| `ARCH-DOMAIN-ENTITY-PLACEMENT` | `src/modules/broken/domain/entity.ts` | `types.ts` |
| `ARCH-COMPONENT-SIZE` | `src/modules/broken/api/Widget.tsx` | `150` |
| `ARCH-HOOK-SIZE` | `src/modules/broken/application/useThing.ts` | `200` |
| `ARCH-COMPONENT-STATE` | `src/modules/broken/api/Widget.tsx` | `fewer than five` |

The `ARCH-IO-PLACEMENT` fixture must contain separate cases for `@octokit/rest`, `Bun.connect`,
`process.stdin`, and `process.stdout.write`. The alias root-barrel fixture must use
`export * from "@/modules/broken/infrastructure"`; a relative equivalent alone is insufficient.
The authored-scope fixtures must separately prove an omitted fileoverview in `scripts/`, explicit
`any` in `tests/`, and a root config file. Each must fail with the existing stable ID.

## Plan of Work

### Milestone 1: Write red evidence for every bypass

Before changing production code, extend `scripts/check-architecture.test.ts` and
`tests/contract/package-entrypoints.test.ts`. Keep the existing conformant fixtures. Add focused
malformed fixtures for the alias root export, `@octokit/rest` in a domain file, all three direct
I/O forms, and authored files outside `src/`. Add the exact-ID matrix assertion described above.
Run the focused tests and record that each new assertion fails for its intended missing detection,
not due to an unrelated parse or fixture failure.

Add a package contract test that creates a disposable directory, obtains a tarball from a clean
tracked source snapshot, installs that tarball with Bun in a separate empty consumer directory,
and invokes `node_modules/.bin/mandem --version`, `node_modules/.bin/mandem --help`,
`node_modules/.bin/mandem-server --version`, and `node_modules/.bin/mandem-server --help`. The
test must inspect the tarball contents before installation and assert that both `package/dist/mandem`
and `package/dist/mandem-server` are present and executable. It must not accept a local `dist/`
directory as evidence.

### Milestone 2: Correct the package lifecycle and archive boundary

In `package.json`, add a lifecycle command that runs `bun run build` before `bun pm pack`, and add
an explicit `files` allowlist that includes the compiled `dist/` executables plus the package files
needed by a consumer. Keep `dist/` ignored by Git; it is generated output, not source. Do not run
the build as an import-time side effect or commit generated executables.

Update the package contract test to create its clean source input from `git archive HEAD`, not the
current working tree. In that archive directory run `bun install --frozen-lockfile`, then
`bun pm pack` and capture the emitted tarball path. Install the tarball into a second temporary
directory with Bun. Use argument arrays for process calls and remove temporary directories in a
`finally` block. If Bun requires a local install option for a tarball on the current pinned version,
record the exact supported invocation in the test and plan living sections; do not substitute npm,
pnpm, yarn, or a globally installed Mandem binary.

### Milestone 3: Correct rule evaluation through an explicit policy

Create `src/modules/architecture-standard/domain/repository-policy.ts` with the authored-source
include and exclusion rules stated in Context and Orientation. Export its typed policy through the
domain barrel and, only if consumers need it, through the module's existing public barrel. Keep
path normalization POSIX and repository-relative. Do not put policy lists in the filesystem adapter
or command-line script.

Update `rules.ts` so it evaluates all supplied authored TypeScript files selected by the policy,
rather than filtering only `src/`. It must produce `ARCH-UNSCOPED-TYPESCRIPT` for a human-authored
TypeScript-looking path outside the policy. Continue excluding declarations and disposable test
fixtures. Ensure `FileSystemTree` supplies candidate TypeScript files from the policy's roots so a
real `bun run architecture:check` observes scripts, tests, and root config files. Preserve stable
sorting by rule ID, path, then message.

Normalize every root-barrel export specifier before the infrastructure check. Treat both relative
and `@/modules/<same-module>/infrastructure` forms, including descendants, as infrastructure
exports. Keep valid exports from domain, application, and API unchanged.

Extend the explicit I/O manifest and direct-API matcher. Domain code that imports
`@octokit/rest` must emit both `ARCH-DOMAIN-DEPENDENCY` and `ARCH-IO-PLACEMENT`; application code
must retain its existing dependency result and add I/O placement when applicable. Detect
`Bun.connect`, `process.stdin`, and `process.stdout.write` outside the allowed locations without
matching strings or comments. Continue to allow those APIs in infrastructure, exact composition
files, and the two entrypoints. Use the existing comment/string stripping approach or improve it
with focused tests if it would otherwise create false positives.

Update `docs/architecture/architecture-standard-v1.md` so its published rule catalog, authored
source definition, I/O boundary, and package evidence agree with code. Update the completed U1
plan only in its living sections and bottom revision note: point to U1C, state that post-merge
verification found the gaps, and do not claim corrected completion until U1C has merged.

### Milestone 4: Verify, review, land, and revalidate dependencies

Run the focused red tests before the production edit and preserve their output in U1C's
`Surprises & Discoveries`. After the green implementation, run the full commands below from the
repository root. Run the archive/install test from a clean `git archive HEAD` input after all
source edits are committed to the worker branch, so it proves the candidate commit rather than
untracked files.

The implementation worker commits only U1C-scoped source, test, package, and U1 documentation
changes to an isolated branch, pushes it, and opens a pull request. The worker does not merge.
An independent reviewer checks the diff and repeats the full verification from the PR head. The
worker repairs actionable findings test-first, obtains a final clean review, records a short Learn
artifact if the silent-pass pattern offers reusable guidance, and refreshes exact-head evidence.
The program orchestrator merges only the reviewed exact head, then reruns post-merge verification
on `main`, closes issue `5717221b-f9e6-4c8f-abca-77a1ad3811bf`, and updates U1C's living sections.

Only after the correction has merged and post-merge verification passes may the orchestrator
revalidate U1A against the actual policy, package lifecycle, rule catalog, and tests. U1A remains
`execution_authorized: false`; it still requires a clean-room review and exact operator approval
of its then-current revision. U2 through U10 remain blocked.

## Concrete Steps

Run every command from the repository root with Bun 1.3.14.

1. Establish red evidence before production changes.

       bunx vitest run scripts/check-architecture.test.ts tests/contract/package-entrypoints.test.ts

   Expected before implementation: the newly added alias, vendor I/O, direct API, authored-scope,
   exact-set, and archive/install assertions fail. Existing tests must still pass.

2. After the smallest implementation changes, run the targeted checks.

       bun run architecture:check
       bunx vitest run scripts/check-architecture.test.ts tests/contract/package-entrypoints.test.ts

   Expected: the real repository has no architecture findings and every targeted test passes.

3. Run the complete repository verification.

       bun run check
       bun run build
       ./dist/mandem --version
       ./dist/mandem --help
       ./dist/mandem-server --version
       ./dist/mandem-server --help

   Expected: `bun run check` exits zero, build creates both executables, both version commands
   print `mandem 0.1.0` and `mandem-server 0.1.0`, and both help commands mention `--version`.

4. Run the clean package proof, either through the contract test or its maintained helper.

       bunx vitest run tests/contract/package-entrypoints.test.ts

   Expected: a tarball made from `git archive HEAD` contains both declared executable paths; an
   empty consumer directory installs that tarball with Bun; each installed command produces the
   same version and help evidence. The test must use no globally installed Mandem executable.

5. Before merge and after merge, repeat the exact verification against the tested commit and record
   the commit SHA, tarball evidence, test count, and Bun version in this plan's living sections.

## Validation and Acceptance

Acceptance requires all of the following observable results.

- A fixture containing `export * from "@/modules/broken/infrastructure"` at
  `src/modules/broken/index.ts` produces `ARCH-INFRASTRUCTURE-ROOT-EXPORT` at that path.
- A domain fixture importing `@octokit/rest` produces both domain-dependency and I/O-placement
  findings at the domain file.
- Fixtures that call `Bun.connect`, access `process.stdin`, or call `process.stdout.write` outside
  allowed locations each produce `ARCH-IO-PLACEMENT`; the same operations in allowed locations do
  not produce that finding.
- A missing leading fileoverview in `scripts/`, explicit `any` in `tests/`, and a root config file
  receive their existing stable violations. An unlisted authored TypeScript path receives
  `ARCH-UNSCOPED-TYPESCRIPT`. Fixture and declaration exclusions do not produce findings.
- The full rule matrix has exact ID set equality and validates every row's ID, path, and message
  fragment.
- A tarball from `git archive HEAD` contains both bin files, installs into an empty directory with
  Bun, and exposes both installed commands with correct version and help output.
- `bun run check`, `bun run build`, and the four direct binary probes pass on the exact PR head and
  again after merge.

## Idempotence and Recovery

The test commands are repeatable. They may recreate `dist/` and temporary archive/consumer
directories; these remain ignored or are removed in test cleanup. Never delete source files or
use `git reset --hard` to recover.

If a package test fails, keep the failing tarball long enough to inspect its file list and record
the evidence, then remove only the explicit temporary directory created by that test. If a Bun
pack or local tarball installation invocation differs from this plan's expected command, update
the test, this plan's Concrete Steps, and the Decision Log with the supported Bun 1.3.14 command.
If a policy change causes unexpected findings in the real repository, add fileoverviews or move
only genuinely authored files into the declared policy; do not add broad exclusions merely to make
the check green.

If the plan changes after clean-room review, reset `promotion` to `planned`, obtain a new review of
the exact content, and obtain new operator approval. If U1A changes while U1C is active, do not
merge an assumption about that change into U1C; finish U1C, then revalidate U1A from the merged
state.

## Artifacts and Notes

The executor must add concise evidence here as work proceeds. The initial durable evidence is:

    Work item: 5717221b-f9e6-4c8f-abca-77a1ad3811bf
    State: open
    Required correction: architecture/package silent-pass paths
    Current package bins: dist/mandem and dist/mandem-server
    Current failure: a clean package archive omits both bins

The final evidence must include the PR URL, tested commit SHA, merge SHA, exact test count,
`bun --version`, tarball file-list proof, installed-binary transcript, independent review result,
and post-merge verification result.

## Interfaces and Dependencies

`architectureRules` remains a readonly list of `ArchitectureRule` values with stable `id`,
`severity`, and `description` fields. `evaluateArchitecture(files)` continues to accept normalized
`RepositoryFile` values and return sorted `RuleViolation` values. The new policy may expose typed
helpers such as `isAuthoredTypeScriptPath(path: string): boolean` and
`isExcludedAuthoredPath(path: string): boolean`; it must not expose filesystem or process APIs.

`FileSystemTree.read(root)` remains the infrastructure implementation of `RepositoryTree`. It must
return all policy candidate files needed for real checks, with repository-relative POSIX paths.
`scripts/check-architecture.ts` remains the only command-line wrapper and retains exit status 0 for
no findings, 1 for findings, and 2 for unexpected configuration, traversal, or parse failures.

The package interface remains:

    mandem --version        -> mandem 0.1.0
    mandem --help           -> help text containing --version
    mandem-server --version -> mandem-server 0.1.0
    mandem-server --help    -> help text containing --version

The package lifecycle must create these compiled files before packing and include them in the
tarball. It must not publish source-only bin references or rely on a pre-existing local `dist/`.

## Revision Note

2026-07-25: Created U1C from the durable corrective issue after post-merge verification found six
reproducible silent-pass paths. The plan leaves implementation unauthorized and keeps U1A and U2
blocked until the correction merges and passes post-merge verification.
