---
title: "U1C: Correct the architecture checker and package contract"
plan_kind: mandem-child-execplan
program_unit: U1C
parent: ../2026-07-21-001-feat-mandem-plan.md
work_item: 5717221b-f9e6-4c8f-abca-77a1ad3811bf
depends_on:
  - U1 merged at 88b9533ab840c9d357a1d09d2341709e2cbdd986
promotion: clean-room-approved
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
- [x] (2026-07-25 21:15Z) Clean-room review approved plan commit
  `bbddf1949cd8a3d7d78551bb00129e871a094c63` with SHA-256
  `24b1455c458afb9b913bfbc9a12ff38e573530b3da453e278ded6283420c6a7c`; see
  `docs/plans/reviews/2026-07-25-u1c-clean-room.md`.
- [ ] Obtain operator approval of the exact clean-room-approved revision.
- [ ] Set `execution_authorized: true` without changing implementation instructions, then dispatch
  one isolated implementation worker.
- [ ] Create failing tests for every package and architecture bypass in this plan.
- [ ] Implement the smallest changes that make the new tests pass.
- [ ] Commit the candidate implementation, then run the archive/install proof against that commit.
- [ ] Run the complete verification contract and record the evidence in this document.

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

- Observation: A broader authored-source scan must not make production architecture rules apply to
  Mandem's test harness and checker scripts.
  Evidence: those files use filesystem and process APIs to run tests and render command-line output;
  their required enforcement is fileoverview and explicit-`any`, not production I/O placement.

- Observation: A green package proof needs a committed candidate because `git archive` cannot
  include uncommitted edits.
  Evidence: packing an archive of the pre-fix SHA should fail for omitted bins; packing a later
  candidate SHA can prove the lifecycle-generated archive without reading the worktree.

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

- Decision: Apply dependency and I/O rules only to production files under `src/`, while applying
  fileoverview and explicit-`any` rules to every included authored root.
  Rationale: The first group describes Mandem production architecture. Tests and checker scripts
  legitimately import and use processes to exercise that architecture, but every authored file
  still needs a useful overview and must avoid explicit `any`.
  Date/Author: 2026-07-25 / Codex after fresh clean-room findings

- Decision: Traverse every non-excluded TypeScript candidate before classifying it as included,
  excluded, or unscoped.
  Rationale: Traversing only selected roots repeats the original silent pass. Classification after
  traversal makes a new root visible as `ARCH-UNSCOPED-TYPESCRIPT` while preserving explicit
  fixture and declaration exclusions.
  Date/Author: 2026-07-25 / Codex after fresh clean-room findings

- Decision: Set `package.json` to `"prepack": "bun run build"` and
  `"files": ["dist", "README.md", "LICENSE"]`.
  Rationale: Bun 1.3.14 runs the `prepack` lifecycle script for `bun pm pack`. The explicit
  allowlist includes generated executables and the consumer-facing documents while Bun includes
  `package.json` in the package manifest.
  Date/Author: 2026-07-25 / Codex after fresh clean-room findings

- Decision: Promote U1C to `clean-room-approved` without authorizing implementation.
  Rationale: The durable review approves the exact implementation instructions at commit
  `bbddf1949cd8a3d7d78551bb00129e871a094c63`. This follow-up changes only promotion metadata and
  living records. The operator must still approve the current revision before authorization.
  Date/Author: 2026-07-25 / Codex

## Outcomes & Retrospective

Planning outcome: this plan describes the six validated corrections and their test-first proof.
After fresh clean-room findings, it now separates production architecture rules from
authored-source rules and binds the package proof to a committed candidate. The red package test
uses a pre-fix SHA; the first green package proof uses a candidate SHA after commit. No production
code has changed, no review has approved this revision, and implementation remains unauthorized. The
implementation outcome, merge SHA, archive evidence, and downstream revalidation result must be
added here by the executor and orchestrator. The clean-room review is recorded at
`docs/plans/reviews/2026-07-25-u1c-clean-room.md`. It does not authorize implementation.

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

The file-system adapter must recursively collect every `.ts` and `.tsx` candidate in the repository
before rule evaluation. It skips only paths with a complete segment `.git`, `node_modules`, `dist`,
`coverage`, `generated`, `vendor`, or `vendored`. The policy then classifies each collected path.
An excluded candidate is a declaration file ending `.d.ts` or any file below `tests/fixtures/` and
produces no authored-source finding. An included candidate is `src/**/*.ts`, `src/**/*.tsx`,
`scripts/**/*.ts`, `scripts/**/*.tsx`, `tests/**/*.ts`, `tests/**/*.tsx`, or a root
`*.config.ts`/`*.config.tsx` file. All other collected candidates are unscoped and produce
`ARCH-UNSCOPED-TYPESCRIPT`. The real filesystem and CLI integration test must create
`tools/unscoped.ts` in a disposable repository and prove `bun scripts/check-architecture.ts <root>`
reports that path and rule. It must also prove that an excluded fixture and declaration file remain
absent from the report. This policy is also the correction U1A consumes; U1A may extend it only
through its own reviewed plan.

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

| Rule ID | Applies to | Fixture path | Required message fragment |
| --- | --- | --- | --- |
| `ARCH-MODULE-NAME` | module directories under `src/modules/` | `src/modules/Bad_Name` | `lowercase kebab-case` |
| `ARCH-MODULE-DOMAIN` | module directories under `src/modules/` | `src/modules/Bad_Name` | `contain domain` |
| `ARCH-MODULE-APPLICATION` | module directories under `src/modules/` | `src/modules/Bad_Name` | `contain application` |
| `ARCH-MODULE-INFRASTRUCTURE` | module directories under `src/modules/` | `src/modules/Bad_Name` | `contain infrastructure` |
| `ARCH-MODULE-API` | module directories under `src/modules/` | `src/modules/Bad_Name` | `contain api` |
| `ARCH-MODULE-README` | module directories under `src/modules/` | `src/modules/Bad_Name` | `README.md` |
| `ARCH-MODULE-ROOT-BARREL` | module directories under `src/modules/` | `src/modules/no-barrel` | `index.ts` |
| `ARCH-DOMAIN-TYPES` | module directories under `src/modules/` | `src/modules/Bad_Name` | `domain/types.ts` |
| `ARCH-API-COMPOSITION` | module directories under `src/modules/` | `src/modules/Bad_Name` | `api/composition.ts` |
| `ARCH-MODULE-TESTS` | module directories under `src/modules/` | `src/modules/Bad_Name` | `contain tests` |
| `ARCH-MODULE-TEST-FAKES` | module directories under `src/modules/` | `src/modules/Bad_Name` | `tests/fakes` |
| `ARCH-DOMAIN-DEPENDENCY` | production `src/modules/*/domain/**/*.ts(x)` | `src/modules/broken/domain/entity.ts` | `outer layer` |
| `ARCH-APPLICATION-DEPENDENCY` | production `src/modules/*/application/**/*.ts(x)` | `src/modules/broken/application/zod.ts` | `only domain or application` |
| `ARCH-CROSS-MODULE-DEEP-IMPORT` | production `src/modules/**/*.ts(x)` | `src/modules/broken/application/deep.ts` | `module barrels` |
| `ARCH-INFRASTRUCTURE-ROOT-EXPORT` | production module root `src/modules/*/index.ts(x)` | `src/modules/broken/index.ts` | `do not export infrastructure` |
| `ARCH-IO-PLACEMENT` | production `src/**/*.ts(x)`, subject to allowed locations | `src/modules/broken/domain/io.ts` | `limited to infrastructure` |
| `ARCH-FILEOVERVIEW` | every included authored candidate | `root-policy.config.ts` | `@fileoverview` |
| `ARCH-NO-EXPLICIT-ANY` | every included authored candidate | `tests/has-any.test.ts` | `explicit any` |
| `ARCH-UNSCOPED-TYPESCRIPT` | every collected non-excluded candidate outside the include set | `tools/unscoped.ts` | `not covered by authored-source policy` |
| `ARCH-DOMAIN-ENTITY-PLACEMENT` | production `src/modules/*/domain/**/*.ts(x)` | `src/modules/broken/domain/entity.ts` | `types.ts` |
| `ARCH-COMPONENT-SIZE` | production non-barrel `src/modules/**/*.tsx` | `src/modules/broken/api/Widget.tsx` | `150` |
| `ARCH-HOOK-SIZE` | production non-barrel `src/modules/**/*hook*.ts` and `src/modules/**/*use*.ts` | `src/modules/broken/application/useThing.ts` | `200` |
| `ARCH-COMPONENT-STATE` | production `src/modules/**/*.tsx` | `src/modules/broken/api/Widget.tsx` | `fewer than five` |

The `ARCH-IO-PLACEMENT` fixture must contain separate production-source cases for `@octokit/rest`,
`Bun.connect`, `process.stdin`, and `process.stdout.write`. It must also include conformant
`scripts/check-architecture.ts` and `scripts/check-architecture.test.ts` style fixtures that use
process and filesystem APIs without producing dependency or I/O findings. For every new direct API
token, add negative cases in a line comment, block comment, ordinary string, and template-literal
text. Those four forms must produce no I/O finding. An expression that invokes `Bun.connect(...)`
inside a template literal is executable code and must produce the finding.

The alias root-barrel fixture must use `export * from "@/modules/broken/infrastructure"`; a relative
equivalent alone is insufficient. The authored-scope fixtures must separately prove an omitted
fileoverview in `scripts/`, explicit `any` in `tests/`, and missing fileoverview in the root
`root-policy.config.ts` file. Each must fail with the existing stable ID. A real filesystem/CLI
test must prove the root config path and `tools/unscoped.ts` are discovered rather than merely
passed directly to `evaluateArchitecture`.

## Plan of Work

### Milestone 1: Write red evidence for every bypass

After this exact plan revision is approved and authorized, extend
`scripts/check-architecture.test.ts` and `tests/contract/package-entrypoints.test.ts` before
changing production code. Keep the existing conformant fixtures. Add focused malformed fixtures
for the alias root export, `@octokit/rest` in a domain file, all three direct I/O forms, the root
config file, and authored files outside `src/`. Add the exact-ID matrix assertion described above.
Run the focused tests and record that each new assertion fails for its intended missing detection,
not due to an unrelated parse or fixture failure.

For direct I/O APIs, add four negative fixtures for each of `Bun.connect`, `process.stdin`, and
`process.stdout.write`: one line comment, one block comment, one ordinary string, and one template
literal whose text contains the token. Add a positive fixture where a template expression evaluates
the same API. The evaluator may remove comments and literal text before matching, but it must retain
template expressions. Add conformant script and test fixtures that use allowed process or
filesystem APIs. They prove the production-only applicability boundary and must not emit
`ARCH-DOMAIN-DEPENDENCY`, `ARCH-APPLICATION-DEPENDENCY`, or `ARCH-IO-PLACEMENT`.

Before editing production files, capture the committed pre-fix SHA in `PRE_FIX_COMMIT`. Add a
package contract test that creates a disposable directory, obtains a tarball from that clean
tracked snapshot, installs that tarball with Bun in a separate empty consumer directory, and
invokes `node_modules/.bin/mandem --version`, `node_modules/.bin/mandem --help`,
`node_modules/.bin/mandem-server --version`, and `node_modules/.bin/mandem-server --help`. The
test must inspect the tarball contents before installation and assert that both `package/dist/mandem`
and `package/dist/mandem-server` are present and executable. It must not accept a local `dist/`
directory as evidence. The test reads `MANDEM_ARCHIVE_COMMIT`; Step 1 supplies the pre-fix SHA.
The expected red failure is the missing archive entries, not a missing environment variable, test
fixture, or local build artifact.

### Milestone 2: Correct the package lifecycle and archive boundary

In `package.json`, add exactly this lifecycle entry:

    "prepack": "bun run build"

Bun 1.3.14 runs `prepack` when `bun pm pack` creates a tarball. Add exactly this allowlist entry:

    "files": ["dist", "README.md", "LICENSE"]

Keep `dist/` ignored by Git; it is generated output, not source. Do not run the build as an
import-time side effect or commit generated executables. The package contract test must parse the
archive's `package/package.json` and assert all of these exact values: the two `bin` values remain
`dist/mandem` and `dist/mandem-server`; `scripts.prepack` equals `bun run build`; and `files` equals
`["dist", "README.md", "LICENSE"]`. It must assert that `package/dist/mandem` and
`package/dist/mandem-server` exist and are executable after `bun pm pack` runs the lifecycle.

Implement the smallest package metadata changes that make the red package test green. Then commit
the candidate source, tests, and package metadata before taking the archive. The package contract
test must require a full candidate SHA through `MANDEM_ARCHIVE_COMMIT`; it fails if the value is
missing or is not a commit in the current repository. It then creates its clean source input from
`git archive <SHA>`, never from `HEAD` by implication or from the current working tree. In the archive directory run
`bun install --frozen-lockfile`, then `bun pm pack` and capture the emitted tarball path. Install
the tarball into a second temporary directory with Bun. Use argument arrays for process calls and
remove temporary directories in a `finally` block. If the archive/install proof fails, repair the
candidate test-first, amend or create a replacement candidate commit, and rerun the entire archive
proof against the new SHA. Do not merge a commit that has not passed this proof. If Bun requires a
local install option for a tarball on the current pinned version, record the exact supported
invocation in the test and plan living sections; do not substitute npm, pnpm, yarn, or a globally
installed Mandem binary.

### Milestone 3: Correct rule evaluation through an explicit policy

Create `src/modules/architecture-standard/domain/repository-policy.ts` with the authored-source
include and exclusion rules stated in Context and Orientation. Export its typed policy through the
domain barrel and, only if consumers need it, through the module's existing public barrel. Keep
path normalization POSIX and repository-relative. Do not put policy lists in the filesystem adapter
or command-line script.

Update `rules.ts` so it classifies all supplied TypeScript candidates before applying rules. Apply
module shape, dependency, root-barrel, I/O, entity, component-size, hook-size, and component-state
rules only to production `src/` paths identified in the matrix. Apply fileoverview and explicit-any
rules to every included authored root. Emit `ARCH-UNSCOPED-TYPESCRIPT` for every collected,
non-excluded candidate outside that include set. Do not emit architecture dependency or I/O findings
for scripts, tests, or root configuration files. Continue excluding declarations and disposable
test fixtures.

Update `FileSystemTree` so it recursively returns every non-excluded TypeScript candidate from the
repository, including `tools/unscoped.ts`, plus the existing Markdown and fixture files required by
module-shape checks. Add a filesystem integration test that writes a disposable repository with
`tools/unscoped.ts`, `root-policy.config.ts`, an excluded `tests/fixtures/example.ts`, and an
excluded declaration file. Invoke the actual `scripts/check-architecture.ts` command against that
repository and assert its exit status, stdout paths, and rule/message fragments. This test proves
real traversal and CLI rendering, rather than only domain evaluation. Preserve stable sorting by
rule ID, path, then message.

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
`Surprises & Discoveries`. After the green implementation, commit the candidate, record its SHA,
and run the archive/install test from `git archive <candidate-SHA>`. After that proof passes, run
the full commands below from the repository root. Any repair creates or amends a new candidate and
requires the focused tests, archive/install proof, and full verification again.

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

1. After clean-room approval, exact operator approval, and the metadata-only authorization change,
   capture the pre-fix commit and establish red evidence before production changes.

       PRE_FIX_COMMIT="$(git rev-parse HEAD)"
       MANDEM_ARCHIVE_COMMIT="$PRE_FIX_COMMIT" bunx vitest run scripts/check-architecture.test.ts tests/contract/package-entrypoints.test.ts

   Expected before implementation: the newly added alias, vendor I/O, direct API, authored-scope,
   exact-set, root config, and real traversal assertions fail. The archive/install assertion runs
   against `PRE_FIX_COMMIT` and fails because the tarball omits the declared `dist` executables.
   It must not fail for a missing manifest value or an uncommitted artifact.

2. After the smallest implementation changes, run architecture-only green checks. The package
   proof remains pending until the candidate commit exists.

       bun run architecture:check
       bunx vitest run scripts/check-architecture.test.ts

   Expected: the real repository has no architecture findings and the architecture tests pass. Do
   not run the green package archive/install proof in this step.

3. Commit the green candidate and run package proof against that exact SHA.

       git add package.json scripts/check-architecture.test.ts tests/contract/package-entrypoints.test.ts src docs
       git commit -m "fix: close U1 architecture package gaps"
       git rev-parse HEAD
       MANDEM_ARCHIVE_COMMIT=<candidate-SHA> bunx vitest run tests/contract/package-entrypoints.test.ts

   Expected: the test reads the displayed candidate SHA from `MANDEM_ARCHIVE_COMMIT`, confirms the
   exact archive manifest, runs `git archive <SHA>`, and proves the lifecycle-built tarball contents
   and empty-consumer installation. If it fails, repair test-first, amend or create a new candidate,
   then rerun this step before continuing.

4. Run the complete repository verification.

       bun run check
       bun run build
       ./dist/mandem --version
       ./dist/mandem --help
       ./dist/mandem-server --version
       ./dist/mandem-server --help

   Expected: `bun run check` exits zero, build creates both executables, both version commands
   print `mandem 0.1.0` and `mandem-server 0.1.0`, and both help commands mention `--version`.

5. Repeat the clean package proof after the complete suite.

       MANDEM_ARCHIVE_COMMIT=<candidate-SHA> bunx vitest run tests/contract/package-entrypoints.test.ts

   Expected: a tarball made from the recorded `git archive <candidate-SHA>` contains both declared executable paths; an
   empty consumer directory installs that tarball with Bun; each installed command produces the
   same version and help evidence. The test must use no globally installed Mandem executable.

6. Before merge and after merge, repeat the exact verification against the tested commit and record
   the commit SHA, tarball evidence, test count, and Bun version in this plan's living sections.

## Validation and Acceptance

Acceptance requires all of the following observable results.

- A fixture containing `export * from "@/modules/broken/infrastructure"` at
  `src/modules/broken/index.ts` produces `ARCH-INFRASTRUCTURE-ROOT-EXPORT` at that path.
- A domain fixture importing `@octokit/rest` produces both domain-dependency and I/O-placement
  findings at the domain file.
- Fixtures that call `Bun.connect`, access `process.stdin`, or call `process.stdout.write` outside
  allowed locations each produce `ARCH-IO-PLACEMENT`; the same operations in allowed locations do
  not produce that finding. Each new API token in comments, ordinary strings, and template text
  produces no finding; a template expression that invokes it produces the finding.
- A missing leading fileoverview in `scripts/`, explicit `any` in `tests/`, and missing
  fileoverview in root `root-policy.config.ts` receive their existing stable violations. Real
  filesystem/CLI traversal reports the root config path. An unlisted authored TypeScript path
  `tools/unscoped.ts` receives
  `ARCH-UNSCOPED-TYPESCRIPT`. Fixture and declaration exclusions do not produce findings.
- A conformant checker script and test harness fixture may use their required process or filesystem
  APIs without dependency or I/O findings.
- On the real repository, `bun run architecture:check` reports no dependency or I/O finding for
  `scripts/check-architecture.ts` or `scripts/check-architecture.test.ts`.
- The full rule matrix has exact ID set equality and validates every row's ID, path, and message
  fragment.
- A tarball from `git archive <candidate-SHA>` contains both bin files, installs into an empty directory with
  Bun, and exposes both installed commands with correct version and help output. Its internal
  `package.json` has the exact `bin`, `prepack`, and `files` values stated in Milestone 2.
- `bun run check`, `bun run build`, and the four direct binary probes pass on the exact PR head and
  again after merge.

## Idempotence and Recovery

The test commands are repeatable. They may recreate `dist/` and temporary archive/consumer
directories; these remain ignored or are removed in test cleanup. Never delete source files or
use `git reset --hard` to recover.

If a package test fails, keep the failing tarball long enough to inspect its file list and record
the evidence, then remove only the explicit temporary directory created by that test. Repair the
source and test with a new red test where needed, amend or replace the candidate commit, and rerun
the archive/install proof against its new SHA before any merge review. If a Bun pack or local
tarball installation invocation differs from this plan's expected command, update the test, this
plan's Concrete Steps, and the Decision Log with the supported Bun 1.3.14 command.
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
    Clean-room review: docs/plans/reviews/2026-07-25-u1c-clean-room.md
    Reviewed commit: bbddf1949cd8a3d7d78551bb00129e871a094c63
    Reviewed plan SHA-256: 24b1455c458afb9b913bfbc9a12ff38e573530b3da453e278ded6283420c6a7c

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
recursively return every non-excluded TypeScript candidate before policy classification, plus files
needed for module shape checks, with repository-relative POSIX paths.
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

2026-07-25: Repaired the clean-room findings. The plan now gives every architecture rule an exact
applicability boundary, requires repository-wide candidate traversal and real CLI proof, adds the
root config fixture, defines direct-I/O false-positive coverage, and binds archive evidence to a
committed candidate SHA. Review, operator approval, and authorization now precede implementation
steps.

2026-07-25: Repaired the package-proof sequence. Step 1 runs the red archive test against the
pre-fix committed SHA, Step 2 keeps package proof pending while architecture checks turn green, and
Step 3 runs the first green archive/install proof after a candidate commit. The plan now specifies
the exact Bun 1.3.14 `prepack` lifecycle entry, allowlist, and archive manifest assertions.

2026-07-25: Recorded clean-room approval of commit
`bbddf1949cd8a3d7d78551bb00129e871a094c63` in
`docs/plans/reviews/2026-07-25-u1c-clean-room.md`. This update changes promotion and living
records only. `execution_authorized` remains `false`.
