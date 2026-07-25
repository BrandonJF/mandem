---
title: "U1A: Documentation discoverability and continuous authoring quality gates"
plan_kind: mandem-child-execplan
program_unit: U1A
parent: ../2026-07-21-001-feat-mandem-plan.md
work_item: 745eda8
promotion: planned
execution_authorized: false
date: 2026-07-25
---

# U1A: Documentation Discoverability and Continuous Authoring Quality Gates

This ExecPlan is a living document governed by the repository-root `PLANS.md`. The sections
`Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must remain
current while work proceeds. This revision is planning authority only. No implementation may begin
until it passes clean-room review, receives exact operator approval, and changes
`execution_authorized` to `true`.

## Purpose / Big Picture

After this work, a human or agent can begin at Mandem's root `README.md` and follow a short chain of
folder indexes to every maintained document. A new document cannot pass the required repository
checks unnoticed in an unindexed folder, a TypeScript file cannot pass them without a useful
leading `@fileoverview`, and a write that
breaks TypeScript receives immediate feedback where the active agent supports write hooks. The same
rules remain enforceable without Claude Code, Codex, or any other agent: versioned Git hooks and
`bun run check` are the authoritative backstops.

The visible proof is intentionally simple. `bun run docs:check` prints a concise pass message for
the real repository and deterministic path-specific failures for malformed fixtures. Removing a
README link, adding an unindexed document, or adding an authored TypeScript file without
`@fileoverview` makes the canonical gate fail. A disposable Git repository proves that installed
hooks reject the same invalid changes. A provider hook test proves supported agent integrations call
the shared check runner rather than implementing a second policy.

## Scope

This unit creates Mandem's documentation navigation baseline, documentation conformance rules,
versioned Git hooks, and a provider-neutral post-write check command with verified provider
adapters. It also corrects the current architecture rule's authored-source scope so scripts and
other declared source roots cannot evade `ARCH-FILEOVERVIEW`.

This unit does not implement Mandem runtime workflow hooks, worker lifecycle orchestration, the TUI,
operating-document compilation, or consumer-repository hook installation. Those belong to U5-U8.
It does not require a README in every code subdirectory. Documentation directories require local
indexes; code modules continue to use one module-root README as defined by the architecture
standard. Generated output, vendored dependencies, Git internals, build output, disposable
fixtures, and hidden provider configuration are excluded through one explicit policy.

The U1 corrective work item `5717221` is a dependency because it changes the same architecture
kernel and package contract. Complete or rebase onto that correction before implementing U1A.
U2 must not be promoted until both `5717221` and U1A are complete.

## Context and Orientation

Mandem currently has a root README and module READMEs, but most documentation directories have no
local README. `docs/architecture/`, `docs/operations/`, `docs/plans/reviews/`,
`docs/solutions/best-practices/`, and `docs/sources/` contain maintained documents without local
indexes. The root README does not provide a complete navigation chain. The current architecture
kernel in `src/modules/architecture-standard/domain/rules.ts` scans TypeScript only below `src/`,
even though the normative `ARCH-FILEOVERVIEW` rule says it applies to authored TypeScript source.

The Pier Docs repository supplies two relevant behaviors. Its changed-file validator requires each
non-root Markdown file to have a local README, requires that README to link the file, and requires
parent READMEs to link child documentation directories all the way to the root. Its full audit also
reports broken local links and disconnected README directories. Mandem must independently implement
these behaviors in Bun and TypeScript so Bun remains its only project runtime.

Nucleus supplies three relevant behaviors. Its pre-commit hook examines staged TypeScript files for
`@fileoverview`; its Claude post-tool hook formats and typechecks a file after writes; and its
versioned pre-push script runs comprehensive verification for code changes with integration tests
around the hook. Mandem must strengthen this pattern: non-interactive enforcement may not degrade
to a warning, provider hooks may not own policy, hooks may not create commits, and every hook must
be testable in a disposable repository.

A “documentation directory” is an in-scope directory containing a maintained Markdown file or an
in-scope child documentation directory. An “index” is that directory's `README.md`. A “navigation
chain” means each child index is linked from its parent index until the root README is reached. A
“provider hook” is an optional Claude Code, Codex, or future-agent integration that invokes a shared
Mandem command after a file write. A “Git hook” is a repository-controlled program Git invokes
before commit or push. Provider hooks improve feedback speed; Git hooks and `bun run check` decide
whether work is conformant.

## Requirements Trace

- The operator requires Pier Docs-style recursive README discoverability: local READMEs, local file
  indexes, parent-to-child index links, and a full-repository audit.
- The operator requires Nucleus-style `@fileoverview` enforcement for every authored TypeScript
  file, not documentation that merely asks agents to remember it.
- The operator requires immediate type feedback after agent writes where the provider exposes a
  supported hook.
- Mandem's standing architecture requires Bun-only commands, clean module boundaries, no `any`,
  meaningful test-first development, concise output, and vendor-neutral core behavior.
- Master requirements R58-R64 require a prescriptive self-conforming architecture and deterministic
  analysis down to naming and file placement.
- Master KTD14 and repository `CLAUDE.md` require a reviewed, exactly approved child ExecPlan before
  implementation dispatch.
- Work item `745eda8` is the durable ledger entry for this unit. Work item `5717221` supplies the
  corrected U1 architecture/package baseline it consumes.

## Key Technical Decisions

### D1. One pure policy kernel serves audits, changed-file checks, and hooks

Extend the existing `architecture-standard` module rather than create a parallel script-only rule
engine. Domain code receives normalized repository paths and document contents and returns stable,
sorted violations. Application use cases select full-repository or changed-path scope. Filesystem
walking, Git changed-path discovery, and process execution remain infrastructure adapters. Thin
scripts render findings and select exit codes.

Documentation rules use stable `DOC-*` identifiers. Authored-source rules retain their existing
`ARCH-*` identities. At minimum the public catalog includes:

- `DOC-LOCAL-README`: an in-scope documentation directory has `README.md`;
- `DOC-LOCAL-INDEX`: each local maintained Markdown file is linked by its local README;
- `DOC-PARENT-INDEX`: each child documentation directory is linked from its parent README;
- `DOC-BROKEN-LOCAL-LINK`: a relative README link resolves to an existing in-repository target;
- `ARCH-FILEOVERVIEW`: each in-scope authored TypeScript or TSX file begins with a supported
  file-level `@fileoverview` comment.

Each violation contains a stable rule ID, repository-relative path, and concise remediation. Results
sort by rule ID, path, then message. A policy exception must be declared in the versioned policy and
covered by a test; scripts and hooks may not carry private exclusion lists.

### D2. Documentation scope is a versioned manifest, not a heuristic

Define `documentationPolicyV1` in
`src/modules/architecture-standard/domain/repository-policy.ts`. Its recursively indexed root is
`docs/`: every directory at or below `docs/` that contains Markdown or an indexed child directory
requires a local README, every non-README Markdown file must be linked from that README, and every
child directory README must be linked from its parent's README.

The manifest also declares three special indexes without requiring READMEs throughout their parent
paths. Root `README.md` must link `AGENTS.md`, `CLAUDE.md`, `PLANS.md`, `docs/README.md`,
`scripts/README.md`, `.githooks/README.md`, and `src/modules/README.md`. `scripts/README.md` must
link each Markdown file and child README below `scripts/`. `src/modules/README.md` must link every
immediate `src/modules/<name>/README.md`. That dynamic pattern makes every present and future
module-root README an explicit target of `src/modules/README.md`. Module-root READMEs remain the
only required code documentation below each module. A new maintained document outside the recursive
root or declared special indexes produces `DOC-UNSCOPED-DOCUMENT` rather than silently escaping
policy.

Exclude any path containing a complete segment `.git`, `.codex`, `.claude`, `.github`,
`node_modules`, `dist`, or `coverage`; exclude `tests/fixtures/` and a generated/vendor path only
when its complete segment is `generated`, `vendor`, or `vendored`. The checked-in
`docs/plans/reviews/` and `docs/solutions/` trees are maintained documentation and are not excluded.
Symbolic links are recorded but never traversed. A resolved local link outside the repository root
is a `DOC-BROKEN-LOCAL-LINK` finding.

Maintained document extensions below `docs/` are `.md`, `.yaml`, and `.yml`; every one must be
linked by the local README, while only Markdown files can serve as indexes. This includes
`docs/sources/doctrine-source-manifest.yaml`. The special root, scripts, hook, and module indexes
govern Markdown only.

Parse inline Markdown links `[label](target)` and reference links `[label][id]` whose
`[id]: target` definition is in the same README. Strip an optional `<...>` wrapper, query, and
fragment, decode valid percent escapes, and resolve the remaining target relative to the README
using POSIX separators. A link to either `child/` or `child/README.md` satisfies the child-index
rule. Matching is case-sensitive because Linux is the v1 target. Ignore images, HTML links,
autolinks, external `http:`, `https:`, `mailto:`, and same-page anchors. Backslashes, malformed
percent escapes, empty local targets, and local targets that do not exist fail as broken local
links. Removed documents and READMEs are evaluated against the staged or compared repository
snapshot, so stale links fail.

### D3. Human-maintained README indexes are checked, not silently rewritten

U1A creates the missing README hierarchy and concise indexes, but the checker does not rewrite
documentation during `check`, commit, or push. Authors decide titles and descriptions; deterministic
validation decides whether every file and child directory is reachable. This avoids generated
tables overwriting useful context and keeps hooks free of hidden mutations. A later explicit
`docs:sync` command may be planned if index maintenance becomes burdensome.

### D4. `@fileoverview` is enforced from one exact authored-source manifest

Define `authoredSourcePolicyV1` beside the documentation policy. Include `src/**/*.ts`,
`src/**/*.tsx`, `scripts/**/*.ts`, `scripts/**/*.tsx`, `tests/**/*.ts`, `tests/**/*.tsx`, and root
`*.config.ts`/`*.config.tsx`. This includes current CLI/server files, both modules, checker and hook
scripts, contract tests, `eslint.config.ts`, and `vitest.config.ts`. Exclude any complete segment
`.git`, `node_modules`, `dist`, `coverage`, `generated`, `vendor`, or `vendored`; exclude
`tests/fixtures/**` and files ending `.d.ts`. Any authored `.ts`/`.tsx` outside the include set
produces `ARCH-UNSCOPED-TYPESCRIPT` until the manifest is deliberately updated.

The first content after an optional `#!` line must be a JSDoc comment containing `@fileoverview` and
at least one non-placeholder word before `*/`. Case-insensitive placeholder-only values `todo`,
`tbd`, `description`, `file`, and `placeholder` fail. An occurrence later in the file, in an
ordinary comment, or in a string does not pass. Test code is authored code; only disposable fixture
and declaration files receive the explicit exceptions above.

The existing architecture checker and tests consume this manifest. The U1 corrective plan must land
first so U1A adds coverage to a corrected kernel rather than creating conflicting repairs.

### D5. Git hook inputs and classifications are normative

Store versioned Git entrypoints under `.githooks/` and substantive hook behavior under
`scripts/hooks/`. `bun run hooks:install` first reads any common-config `core.hooksPath` directly
from `<git-common-dir>/config`. If `extensions.worktreeConfig` is not `true`, it enables the
extension. Independently of whether the extension was already enabled, when a common hook path
exists it copies that value into every existing worktree that has no worktree-local override,
verifies each effective value, and only then removes the common key. It then runs
`git config --worktree core.hooksPath .githooks` in the selected worktree. Perform file and
worktree operations through argument arrays, not interpolated shell commands. If enumeration,
migration, or removal fails, exit `2` before replacing the selected worktree's value.
`bun run hooks:check` reads
`git config --worktree --get core.hooksPath` and reports whether the active worktree alone is
configured. Installation is idempotent and never modifies global Git configuration. Integration
tests create one common repository with two linked worktrees. With no pre-existing common value,
install in one and prove the sibling's effective hook path is unset. With a pre-existing common
value, prove the sibling retains that value worktree-locally while only the selected worktree moves
to `.githooks`, and prove the common key is absent afterward. Run that migration case once with the
extension initially disabled and once with it already enabled.

Pre-commit builds a virtual staged snapshot from `HEAD` plus the Git index: start from
`git ls-tree -r HEAD`, overlay added/copied/modified/renamed index blobs from `git show :<path>`,
and remove staged deletions. On an unborn branch, start from an empty tree. Evaluate every affected
documentation chain and every staged authored TypeScript file against that snapshot. Do not read
unstaged versions of staged paths. Reject findings without prompting.

Pre-push consumes Git's standard input lines:

    <local-ref> <local-sha> <remote-ref> <remote-sha>

The protected remote refs are exactly `refs/heads/main`, `refs/heads/staging`, and
`refs/heads/production`; every create, update, or deletion targeting them is rejected. Deleting an
unprotected remote ref requires no repository check. For an update, compare
`remote-sha...local-sha`. For a new branch whose remote SHA is all zeroes, compare the merge base
with `origin/main` when it exists; otherwise compare the empty Git tree with `local-sha`. When
standard input is empty, use `@{upstream}...HEAD`, then merge-base `origin/main...HEAD`, then
empty-tree-to-HEAD in that order. Aggregate paths across all updates. If any Git object or diff
cannot be resolved, run the full gate; never skip.

A change is documentation-only only when every changed path is `README.md`, `AGENTS.md`,
`CLAUDE.md`, `PLANS.md`, ends in `.md`, or begins `docs/`. Documentation-only invokes
`bun run docs:audit` and `bun run authored-files:check`. Any package, lockfile, source, test,
script, hook, provider configuration, workflow, or other path invokes `bun run check`. Hooks never
format, stage, commit, amend, push, or delete files.

Hook integration tests create temporary Git repositories and mock only external boundaries. They
exercise the actual checked-in entrypoints, paths with spaces, initial branches without upstreams,
renames, deletions, protected branches, failing checks, and successful checks.

### D6. Claude and Codex both receive thin, versioned post-write adapters

Create one bounded `bun run authoring:check -- <repo-relative-path>` command. For TypeScript writes,
it runs formatting/lint feedback for that path, the architecture policy, and a project typecheck.
For Markdown writes, it runs documentation conformance. Unsupported paths exit successfully with a
short skipped message. The command reports findings but never edits the file.

Claude Code `2.1.219` and Codex CLI `0.145.0` both support `PostToolUse`; U1A implements both.
Commands resolve the Git root before invoking the adapter so a provider launched from a nested
directory receives identical behavior. `.claude/settings.json` contains this complete project hook:

    {
      "hooks": {
        "PostToolUse": [
          {
            "matcher": "Write|Edit|MultiEdit",
            "hooks": [
              {
                "type": "command",
                "command": "bun \"$(git rev-parse --show-toplevel)/scripts/hooks/provider-post-write.ts\" claude",
                "timeout": 120
              }
            ]
          }
        ]
      }
    }

Claude event JSON arrives on standard input. Extract `tool_input.file_path` for Write/Edit and every
distinct `tool_input.edits[].file_path` for MultiEdit.

`.codex/hooks.json` contains this complete project hook:

    {
      "description": "Mandem authoring feedback.",
      "hooks": {
        "PostToolUse": [
          {
            "matcher": "Edit|Write|apply_patch",
            "hooks": [
              {
                "type": "command",
                "command": "bun \"$(git rev-parse --show-toplevel)/scripts/hooks/provider-post-write.ts\" codex",
                "timeout": 120,
                "statusMessage": "Checking Mandem authoring quality"
              }
            ]
          }
        ]
      }
    }

Codex reports the canonical tool name `apply_patch`; parse `*** Add File:`, `*** Update File:`,
`*** Delete File:`, and `*** Move to:` headers in `tool_input.command`. Codex requires
project-local hook trust; document `/hooks` as the normal trust path and use
`--dangerously-bypass-hook-trust` only inside a disposable automated probe.

Both adapters require `hook_event_name: PostToolUse`, resolve paths against event `cwd`, reject
paths outside the Git root, sort and deduplicate events, and invoke the shared check once per event.
An event records `write`, `delete`, `move-from`, or `move-to`. Claude's supported tools emit writes.
For Codex, Add and Update emit writes, Delete emits delete, and a Move emits both move-from for the
Update path and move-to for the destination. Delete and move events invoke the full relevant policy
defined below so stale indexes cannot escape a path-local check.
Zero valid paths or malformed JSON exits `2` with one concise error. Successful checks exit `0`
without output. A failed check exits `2` and writes at most 40 lines to standard error; both
providers return that as model-visible feedback after the write. Provider hook failure cannot undo
the write, which is why Git and `bun run check` remain authoritative.

Provider adapter tests feed recorded, secret-free Claude Write/Edit/MultiEdit and Codex apply-patch
events into the adapters and assert selected paths, exit behavior, bounded output, and no repository
mutation. Future providers add only an event-to-path adapter and call the shared command.

### D7. The canonical gate and documentation explain one workflow

Add focused package scripts for full documentation audit, changed documentation validation,
authored-file validation, hook installation/status, hook integration tests, and post-write
feedback. `bun run check` includes full documentation and authored-source checks before typecheck,
lint, and tests. README instructions lead with `bun run check`; detailed maintenance and recovery
live in `docs/development/`.

Add `.github/workflows/repository-quality.yml` as the required remote authority. On every pull
request and every push to `main` or `staging`, it checks out full history, installs Bun `1.3.14`,
runs `bun install --frozen-lockfile`, `bun run check`, `bun run build`, and `git issue fsck`. Its
stable job/check name is `repository-quality`. Configure an active GitHub ruleset targeting
`refs/heads/main` that requires a pull request and successful `repository-quality` before merge.
Add `.github/CODEOWNERS` assigning every gate-defining path to `@BrandonJF`: `/.github/CODEOWNERS`,
`/.github/workflows/repository-quality.yml`, `/package.json`, `/bun.lock`, `/.githooks/`,
`/scripts/check-*`, `/scripts/hooks/`, `/src/modules/architecture-standard/`, `/eslint.config.ts`,
`/tsconfig.json`, and `/vitest.config.ts`. The ruleset requires code-owner approval when an owned
path changes, dismisses stale approvals when new commits arrive, requires approval of the most
recent push, and does not grant agents bypass permission. Routine application implementation PRs
therefore remain autonomous, while a PR that changes the gate or its transitive implementation
requires the operator's independent approval of its current head. The threat boundary is accidental
bypass and autonomous agents, not a repository administrator deliberately disabling their own
controls. The implementation worker records the ruleset identifier and read-back output in this
plan. If its credential cannot administer rulesets, it records that exact external dependency under
`Needs you` and U1A remains incomplete; local hooks alone never satisfy acceptance.

## Normative Interfaces

The file and export names below are fixed for this unit. Changing one requires updating this plan
and repeating clean-room review before implementation continues.

Extend `src/modules/architecture-standard/domain/types.ts` with:

    export interface RepositorySnapshot {
      readonly files: readonly RepositoryFile[];
    }

    export interface RepositoryPolicy {
      readonly recursiveDocumentationRoots: readonly string[];
      readonly rootIndexEntries: readonly string[];
      readonly specialIndexes: Readonly<Record<string, readonly string[]>>;
      readonly excludedSegments: readonly string[];
      readonly excludedPrefixes: readonly string[];
      readonly authoredSourceIncludes: readonly string[];
      readonly authoredSourceExcludes: readonly string[];
    }

Create `src/modules/architecture-standard/domain/repository-policy.ts` exporting
`documentationPolicyV1`, `authoredSourcePolicyV1`,
`evaluateDocumentation(snapshot, policy): AnalysisResult`, and
`evaluateAuthoredSources(snapshot, policy): AnalysisResult`. Extend `domain/rules.ts` with
`DOC-LOCAL-README`, `DOC-LOCAL-INDEX`, `DOC-PARENT-INDEX`, `DOC-BROKEN-LOCAL-LINK`,
`DOC-UNSCOPED-DOCUMENT`, and `ARCH-UNSCOPED-TYPESCRIPT`. The existing `RepositoryFile`,
`RuleViolation`, and `AnalysisResult` remain the common value types.

Create `src/modules/architecture-standard/application/repositories/repository-snapshot.ts` with:

    export interface RepositorySnapshotReader {
      readWorkingTree(root: string): Promise<RepositorySnapshot>;
      readStagedTree(root: string): Promise<RepositorySnapshot>;
      readRevision(root: string, revision: string): Promise<RepositorySnapshot>;
    }

    export interface GitChange {
      readonly status: "A" | "C" | "M" | "R" | "D";
      readonly oldPath?: string;
      readonly path: string;
    }

    export interface GitChangeReader {
      changedEntries(
        root: string,
        base: string,
        head: string
      ): Promise<readonly GitChange[]>;
    }

Create `application/use-cases/analyze-documentation.ts`,
`application/use-cases/analyze-authored-sources.ts`, and
`application/use-cases/check-authored-path.ts`. The first two accept a snapshot reader, repository
root, snapshot mode (`working`, `staged`, or `revision`), and optional changed entries and return
`Promise<AnalysisResult>`. Changed analysis expands every old/new parent through its declared
documentation root, includes each ancestor README, and evaluates that closure against the complete
head-revision snapshot. `checkAuthoredPath` accepts a root, path, snapshot reader, the named v1
policies, and command runner and returns:

    export interface AuthoringCheckResult {
      readonly path: string;
      readonly checks: readonly ("documentation" | "architecture" | "lint" | "typecheck")[];
      readonly violations: readonly RuleViolation[];
      readonly commandFailures: readonly string[];
    }

Define `CommandRunner` beside that use case with:

    run(
      command: readonly string[],
      cwd: string
    ): Promise<{ readonly exitCode: number; readonly output: string }>;

For a TypeScript/TSX path, `checkAuthoredPath` evaluates the working snapshot against
`authoredSourcePolicyV1`, then runs `bunx eslint <repo-relative-path>` and
`bunx tsc --noEmit` from the Git root. For a maintained document, it evaluates the working snapshot
against `documentationPolicyV1` and runs no subprocess. A deleted path triggers the full relevant
working-snapshot policy and does not invoke file-scoped lint. A moved path checks the new path and
also runs the relevant full policy so stale old-path indexes are detected. An unsupported extension
returns an empty `checks` list. Each nonzero subprocess contributes one `commandFailures` entry
containing the command label and at most the first 40 output lines; architecture/document findings
populate `violations`. The CLI exits `0` only when both arrays are empty, `1` for findings or
command failures, and `2` for invalid input, traversal, or adapter failure.

Create adapters at
`infrastructure/repositories/file-system-snapshot.ts`,
`infrastructure/repositories/git-repository-snapshot.ts`, and
`infrastructure/services/bun-command-runner.ts`. Provider parsers live at
`infrastructure/provider-events/claude-post-tool-use.ts` and
`infrastructure/provider-events/codex-post-tool-use.ts`; each exports a function accepting
`unknown` and returning `readonly ProviderPathEvent[]`, where:

    export interface ProviderPathEvent {
      readonly path: string;
      readonly operation: "write" | "delete" | "move-from" | "move-to";
    }

Export only domain types, application use cases, and API compositions from the module root; never
export these infrastructure classes.

Add `api/composition.ts` functions `analyzeDocumentationDirectory`,
`analyzeAuthoredSourceDirectory`, `analyzeStagedRepository`, and `checkAuthoredPath`. Thin scripts
call only these public API functions. Also add
`checkProviderPostWrite(provider: "claude" | "codex", input: unknown)` there; the API composition
selects the private provider parser and invokes the public post-write use case.

The package script names and targets are fixed:

    "docs:audit": "bun scripts/check-documentation.ts --mode full"
    "docs:check": "bun scripts/check-documentation.ts --mode changed"
    "authored-files:check": "bun scripts/check-authored-files.ts"
    "hooks:install": "bun scripts/hooks/install.ts"
    "hooks:check": "bun scripts/hooks/install.ts --check"
    "test:hooks": "bunx vitest run scripts/hooks/hooks.integration.test.ts scripts/hooks/provider-post-write.test.ts"
    "authoring:check": "bun scripts/hooks/post-write.ts"

`bun run check` invokes `docs:audit` and `authored-files:check` after the Bun preflight and before
typecheck, lint, and tests.

`scripts/check-documentation.ts` accepts exactly:

    --mode full
    --mode changed --base-ref <git-ref> [--head-ref <git-ref>]
    --mode staged

Full mode reads the working tree. Changed mode requires `--base-ref`, defaults head to `HEAD`, reads
name-status entries including old and new rename paths, and analyzes the head revision snapshot
rather than the current checkout. Staged mode reads the virtual staged snapshot from D5. Missing
values, unknown flags, or unresolvable refs exit `2`.

Pre-push analyzes every distinct nonzero outgoing `local-sha` against its calculated base. It never
uses the working tree for an outgoing commit. Tests must include a dirty checkout whose outgoing SHA
is clean and a non-current local ref; results follow the outgoing revision, not checkout content.

## Expected Repository Shape

At completion, the relevant paths include:

    README.md
    .claude/
      settings.json
    .codex/
      config.toml
      hooks.json
    .githooks/
      README.md
      pre-commit
      pre-push
    .github/
      CODEOWNERS
      workflows/
        repository-quality.yml
    docs/
      README.md
      architecture/README.md
      development/
        README.md
        documentation-standards.md
        repository-hooks.md
      operations/README.md
      plans/README.md
      plans/reviews/README.md
      plans/units/README.md
      solutions/README.md
      solutions/best-practices/README.md
      sources/README.md
    scripts/
      README.md
      check-documentation.ts
      check-documentation.test.ts
      check-authored-files.ts
      hooks/
        README.md
        install.ts
        pre-commit.ts
        pre-push.ts
        post-write.ts
        provider-post-write.ts
        provider-post-write.test.ts
        hooks.integration.test.ts
    src/modules/architecture-standard/
      domain/repository-policy.ts
      application/repositories/repository-snapshot.ts
      application/use-cases/analyze-documentation.ts
      application/use-cases/analyze-authored-sources.ts
      application/use-cases/check-authored-path.ts
      infrastructure/repositories/file-system-snapshot.ts
      infrastructure/repositories/git-repository-snapshot.ts
      infrastructure/services/bun-command-runner.ts
      infrastructure/provider-events/claude-post-tool-use.ts
      infrastructure/provider-events/codex-post-tool-use.ts
      api/composition.ts
      tests/documentation-policy.test.ts
      tests/authored-source-policy.test.ts
    src/modules/README.md
    tests/fixtures/
      documentation/
      provider-hooks/

These paths are the implementation contract. New behavior must not be placed directly in shell
entrypoints.

## Plan of Work

### Milestone 1: Revalidate the corrected U1 baseline and capture red tests

Begin from a worktree based on the merged resolution of work item `5717221`. Record its commit in
this plan and compare its architecture rule catalog, package scripts, and tests with this plan. If
the correction changes any consumed interface, update this ExecPlan and repeat clean-room review
before implementation.

Create pure in-memory tests before implementation. The first failing matrix covers a nested
document without a local README, a local README that omits its sibling document, a child README not
linked by its parent, a broken relative link, anchor/query normalization, excluded paths, and a
valid root-to-leaf chain. Add authored-file cases for `src/`, `scripts/`, root TypeScript config,
tests, optional shebangs, misplaced comments, placeholder comments, fixtures, declarations, and
generated paths. The meaningful red state is an expected stable `DOC-*` or `ARCH-FILEOVERVIEW`
finding that the current implementation does not produce.

This milestone is complete when focused tests compile and fail for the missing behavior rather than
for a missing import, configuration error, or malformed fixture.

### Milestone 2: Implement the pure documentation and authored-source policy

Add typed policy inputs and pure evaluators to the `architecture-standard` domain. Extend the
application layer with full-repository and changed-path use cases without importing filesystem or
Git APIs. Add the minimum public barrel exports needed by scripts and hooks. Keep messages concise
and stable.

Make the Milestone 1 tests pass, then add mutation-oriented cases that change one valid property at
a time. Prove every stable ID independently, prove exact catalog identity rather than only catalog
length, and prove deterministic ordering.

This milestone is complete when in-memory fixtures accept a complete navigation chain and reject
each malformed condition with the exact expected ID and path.

### Milestone 3: Add filesystem, Git-diff, and CLI adapters

Extend the repository-tree infrastructure adapter to read the Markdown and authored-source inputs
needed by the policy while preserving path normalization and repository-root containment. Add a Git
changed-path adapter behind an application port. Build thin full-audit and changed-scope script
entrypoints with exit code `0` for conformance, `1` for findings, and `2` for traversal,
configuration, Git, or unexpected failures.

Add integration fixtures that exercise the real filesystem and a disposable Git history. Include
added, modified, renamed, and deleted README/doc paths, a dirty checkout whose selected revision is
clean, and a non-current local ref. Confirm failure output names the repair in plain language,
remains bounded, and follows the selected revision rather than the checkout.

This milestone is complete when the real Mandem repository can run both modes and malformed
fixtures demonstrate each failure class through the public command.

### Milestone 4: Build the documentation navigation baseline

Create the README hierarchy shown above. Each README explains the folder in one short paragraph,
links every maintained local Markdown document, and links every in-scope child documentation
directory. Update the root README with a concise documentation map, architecture entrypoint,
development entrypoint, plans entrypoint, operations entrypoint, and scripts entrypoint.

Add `docs/development/documentation-standards.md` as the plain-language source for index and
fileoverview expectations. Add `docs/development/repository-hooks.md` only when the executable hook
behavior exists in the same branch; documentation may not promise unimplemented commands.

This milestone is complete when the full audit reaches every in-scope document from the root and
reports no missing README, missing index entry, disconnected directory, or broken local link.

### Milestone 5: Add versioned Git hooks and prove them in disposable repositories

Write failing integration tests around the actual `.githooks/pre-commit` and
`.githooks/pre-push` entrypoints before substantive hook behavior. Implement the shared Bun hook
use cases and minimal entrypoints. Add installation and status commands that operate only on the
current worktree's local Git configuration.

Prove a valid staged TypeScript file commits, a missing fileoverview is rejected non-interactively,
an unindexed Markdown file is rejected, protected-branch pushes are blocked, code pushes invoke the
full gate, docs-only pushes invoke the documentation gate, and an indeterminate diff invokes the
full gate. Snapshot the repository before and after each failure to prove hooks do not mutate files,
the index, commits, branches, or remotes. In two-worktree fixtures, prove installation enables
`extensions.worktreeConfig`, leaves a sibling effectively unset when no common hook existed, and
migrates a pre-existing common hook value to the sibling before selecting `.githooks` only for the
installing worktree.

This milestone is complete when hook integration tests pass on Linux and repeated installation
produces the same local configuration without duplicate or global settings.

### Milestone 6: Add shared post-write feedback and both provider adapters

Write failing tests for the provider-neutral path classifier and post-write runner. Implement the
bounded command, then probe installed Claude Code and Codex hook capabilities in a disposable clean
Git fixture. Update the provider baseline with exact versions, commands, timeouts, observed output,
and conclusions.

Add the exact Claude and Codex configurations from D6 and the thinnest adapters that map their write
events to the shared command. Test every event form from D6, including nested launch directories,
multi-file patches, deletes, moves, paths with spaces, out-of-root paths, malformed JSON, failed
checks, and bounded feedback.

This milestone is complete when a supported provider write event invokes the expected shared check,
malformed events fail safely, and no adapter owns a distinct policy or changes repository content.

### Milestone 7: Integrate the canonical gate and close through review

Add the new checks and hook integration suite to package scripts and add the remote workflow from
D7. Make `bun run check` fail closed in a deterministic order: Bun preflight,
documentation/authored-source architecture, TypeScript, lint, and tests. Run focused tests first,
then the complete gate from a clean checkout. Install the Git hooks in the implementation worktree
and perform one disposable valid and invalid commit proof.

Configure and read back the required `main` ruleset, including required code-owner review for every
gate-defining path listed in D7, stale-approval dismissal, and approval of the most recent push.
Trigger the workflow with the PR and record a successful `repository-quality` check; a skipped,
pending, or billing-disabled check is not completion evidence.

Run independent correctness, testing/adversarial, maintainability, and agent-vendor-neutral reviews.
Repair all blocking and important findings test-first. Run the repository's single headless Learn
step, focusing on documentation or hook surprises that future work can avoid. Commit, push, and open
a PR. The worker must not merge.

This milestone is complete when the PR contains the implementation, tests, living-plan updates,
provider evidence, and Learn artifact; every local gate is green; and the issue records the branch,
commit, PR, review outcome, and exact commands.

## Concrete Steps

Run all commands from the Mandem repository root in the isolated implementation worktree.

At the start, record and verify the corrected dependency:

    git status --short --branch
    git log -1 --oneline
    git issue show 5717221
    git issue show 745eda8

Use these focused commands in milestone order:

    bunx vitest run src/modules/architecture-standard/tests/documentation-policy.test.ts
    bunx vitest run src/modules/architecture-standard/tests/authored-source-policy.test.ts
    bunx vitest run scripts/check-documentation.test.ts
    bunx vitest run scripts/hooks/hooks.integration.test.ts
    bunx vitest run scripts/hooks/provider-post-write.test.ts

Before domain implementation, the first command must fail named cases
`requires a README and local index through the root chain` and
`rejects broken and unscoped Markdown`. The second must fail
`requires a leading meaningful fileoverview for every authored source` and
`rejects unscoped TypeScript`. Before filesystem/Git adapters, the third must fail
`evaluates added renamed and deleted documents from a Git base`. Before Git-hook implementation,
the fourth must fail `pre-commit evaluates the staged snapshot` and
`pre-push classifies every ref update fail closed`. Before provider adapters, the fifth must fail
`maps Claude write events to checked paths` and
`maps Codex apply-patch headers to checked paths`. Each red state must be an assertion mismatch for
the named behavior, not missing module/configuration failure. Record the failing assertion and later
passing test in `Progress`.

After the policy and adapters exist, exercise:

    bun run docs:audit
    bun run docs:check -- --base-ref HEAD^
    bun run authored-files:check
    bun run hooks:install
    bun run hooks:check
    bun run test:hooks
    bun run authoring:check -- src/modules/runtime/domain/types.ts

Expected successful output is concise and names the checked scope. Malformed fixtures must exit `1`
and print stable IDs with repository-relative paths. Traversal, Git, or configuration failures must
exit `2` and explain the failed boundary without a stack trace in normal output.

Before handoff, run:

    bun install --frozen-lockfile
    bun run check
    bun run build
    git issue fsck
    git status --short

The install must not change `bun.lock`. The complete gate and build must exit `0`. Issue integrity
must report no errors. The final worktree must contain only intentional tracked changes before the
worker commits and pushes them.

## Validation and Acceptance

Acceptance requires all of the following observable behaviors:

- From the root README, a reader can reach every maintained document by following README links.
- A valid nested documentation fixture exits `0`.
- A fixture with a missing local README, unindexed sibling document, disconnected child README, or
  broken local link exits `1` with the exact expected `DOC-*` ID and path.
- Added, renamed, and removed documents are evaluated correctly against a disposable Git base.
- Every in-scope authored TypeScript/TSX file begins with a meaningful fileoverview after an
  optional shebang; a missing, late, string-contained, or placeholder marker is rejected.
- Generated, vendored, declaration, build, and disposable fixture paths are excluded only where the
  public policy says they are excluded.
- The real repository passes the same policy used by fixtures.
- Hook installation enables Git's worktree-config extension once, removes any inherited common
  `core.hooksPath` only after preserving it in every existing worktree, changes only the selected
  worktree to `.githooks`, is repeatable, and reports its state.
- A non-interactive pre-commit rejects missing fileoverview and documentation-index violations.
- A pre-push on a protected branch is rejected; a normal code push runs the full check; a docs-only
  push runs documentation checks; an uncertain diff runs the full check.
- Pre-push evaluates every outgoing commit snapshot, including a non-current local ref, without
  allowing unrelated dirty checkout content to change the result.
- Failed hooks do not alter working files, staged content, commits, branches, or remotes.
- The shared post-write command typechecks a TypeScript write and checks a Markdown write without
  editing either file.
- Claude Write/Edit/MultiEdit and Codex apply-patch hooks invoke the shared command with the exact
  events in their recorded fixtures—including deletes and moves—from the repository root or a
  nested launch directory, and return bounded model-visible feedback on failure.
- The `repository-quality` workflow runs on pull requests and pushes to `main`/`staging`; an active
  `main` ruleset requires both a pull request and that successful check before merge. Changes to the
  workflow, canonical commands, hook/check implementations, architecture gate, test/lint/type
  configuration, lockfile, or CODEOWNERS protection require `@BrandonJF` code-owner approval of the
  current head; a subsequent push dismisses the approval.
- `bun run check`, `bun run build`, both bounded executable probes, and `git issue fsck` pass from a
  clean checkout.

## Idempotence and Recovery

Policy checks are read-only and safe to repeat. Hook installation enables
`extensions.worktreeConfig` in the common repository if needed, preserves any prior common hook
value across existing worktrees before removing it, then writes one worktree-local Git setting and
is safe to repeat. Capture the selected worktree's value before replacement; the documented
uninstall/recovery command restores that value or unsets the worktree-local key if none existed.
Do not reconstruct a common hook value or disable `extensions.worktreeConfig` during uninstall
because sibling worktrees may rely on their worktree-local values. Never edit global Git
configuration.

If documentation baseline work exposes many failures, do not add broad exclusions or suppressions.
Repair the README chain directory by directory, rerunning the full audit after each group. If the
installed provider version contradicts the documented PostToolUse contract, stop, record the
evidence, revise this plan's adapter scope, and repeat clean-room review; do not silently omit an
adapter from an approved revision.

If work item `5717221` changes the architecture kernel after this plan is reviewed, stop before
implementation, rebase the planning branch, revise the consumed interfaces and tests here, and
repeat clean-room review. If hook execution leaves the worktree changed, treat that as a defect,
restore the disposable fixture, add a regression test, and do not continue to PR handoff until the
mutation is removed.

## Interfaces and Dependencies

The `architecture-standard` public barrel must expose typed repository-conformance results and
application surfaces without exporting infrastructure. Scripts and hook compositions may select
filesystem and Git adapters through `api/composition.ts`; normal modules may not deep-import them.

The documentation analyzer accepts the exact `RepositorySnapshot` and `RepositoryPolicy` interfaces
defined above and returns the existing `AnalysisResult` shape. The changed-file use case accepts a
base and head through `GitChangeReader`; domain code does not execute Git.

The post-write application surface accepts one repository-relative path and returns a bounded
result describing checks run, checks skipped, and findings. Provider adapters translate event input
to that path and invoke the same composition. They do not parse TypeScript, traverse documentation,
or decide policy.

Use Bun `1.3.14` and existing TypeScript, ESLint, and Vitest dependencies unless implementation
proves a small additional parser dependency is necessary. Prefer the existing source-text approach
for Markdown links and file headers. Any new dependency requires a recorded license and rationale
in this plan and `docs/architecture/third-party-attribution.md`.

## Source Provenance

Pier Docs evidence is pinned to commit
`ccc61c1161dff39f4c626a8104b1f6a7e3d2ccda`: `scripts/check_doc_discoverability.py`,
`scripts/audit_readme_discoverability.py`, `.github/workflows/doc-discoverability.yml`,
`scripts/README.md`, and `README.md`. Nucleus evidence is pinned to commit
`7265e19cb24cf9e86c3facbd91326227dfa05dd1`: `.husky/pre-commit`,
`.claude/post-tool-hook.sh`, `scripts/hooks/pre-push/run.sh`,
`scripts/hooks/pre-push/integration.sh`, and `docs/development/documentation-standards.md`.

Provider-hook contracts were checked against Claude Code `2.1.219` and Codex CLI `0.145.0`.
Codex's official Hooks reference documents repository-local `.codex/hooks.json`, PostToolUse
matching for `apply_patch`/Edit/Write, JSON on standard input, project trust, timeout behavior, and
exit `2` feedback. Claude's PostToolUse behavior is also represented by the pinned Nucleus adapter
and must be confirmed by the disposable execution probe before its configuration is accepted.
This plan embeds the required behavior so implementation does not depend on live access to those
external sources.

## Progress

- [x] (2026-07-25 18:05Z) Researched Pier Docs recursive README validation, full audit, workflow,
  and root navigation patterns.
- [x] (2026-07-25 18:05Z) Researched Nucleus fileoverview pre-commit behavior, Claude post-write
  checks, versioned pre-push behavior, and hook integration tests.
- [x] (2026-07-25 18:05Z) Created and pushed work items `5717221` and `745eda8`.
- [x] (2026-07-25 18:05Z) Authored this self-contained U1A child ExecPlan.
- [x] (2026-07-25 18:30Z) Updated the master plan, child registry, and U2 dependency status.
- [x] (2026-07-25 18:30Z) Ran the first clean-room review at `93c2c6b`; it rejected underspecified
  scope, interfaces, Git/provider hook contracts, link grammar, and focused test evidence.
- [x] (2026-07-25 18:55Z) Ran a second clean-room review at `aa5d030`; it accepted the program
  dependency model but rejected incomplete revision-snapshot, provider event, and remote-authority
  contracts.
- [x] (2026-07-25 19:20Z) Ran a third clean-room review at `e597967`; it found the remaining linked
  worktree configuration leak and self-modifiable workflow gap.
- [ ] Run clean-room re-review against the repaired exact revision and repair every material finding.
- [ ] Obtain exact operator approval and set `execution_authorized: true`.
- [ ] Complete work item `5717221`, then dispatch U1A from an isolated implementation worktree.

## Surprises & Discoveries

- Observation: Pier Docs separates changed-file validation from a full-repository audit, but its PR
  workflow triggers only when README files change.
  Evidence: `.github/workflows/doc-discoverability.yml` filters to README and checker paths even
  though a newly added non-README Markdown file can also create an indexing violation.

- Observation: Nucleus asks for fileoverview on all TypeScript files, but its pre-commit hook allows
  missing comments in non-interactive execution after printing a warning.
  Evidence: `.husky/pre-commit` exits successfully in the non-TTY branch.

- Observation: Nucleus's post-tool hook provides valuable rapid feedback but is coupled to Claude
  event JSON and package-manager commands.
  Evidence: `.claude/post-tool-hook.sh` parses a tool input path and invokes provider/repository
  specific commands. Mandem therefore needs a shared Bun command beneath thin adapters.

- Observation: Mandem's current documentation tree has multiple maintained leaf directories without
  README indexes, and its authored-source rule scans only `src/`.
  Evidence: the current tree reports missing local READMEs below `docs/architecture`,
  `docs/operations`, `docs/plans/reviews`, `docs/solutions/best-practices`, and `docs/sources`;
  `rules.ts` filters on paths beginning with `src/`.

- Observation: A fresh worktree must install the frozen dependency graph before running
  `bun run check`; otherwise `bunx` may resolve an ambient newer TypeScript and report failures that
  do not describe the locked repository.
  Evidence: the first planning-worktree check resolved TypeScript outside the installed lock state
  and failed; `bun install --frozen-lockfile` followed by the same check passed all 15 tests.

- Observation: Both current agent vendors now expose PostToolUse hooks, so vendor-neutrality does
  not require giving up immediate feedback.
  Evidence: Codex `0.145.0` documents repository-local `.codex/hooks.json` and apply-patch
  PostToolUse events; Claude `2.1.219` supplies Write/Edit PostToolUse input used by the pinned
  Nucleus adapter. Both can invoke the same Bun command.

## Decision Log

- Decision: Track the U1 correctness defects and U1A quality-gate work as separate git-native issues.
  Rationale: The former restores already-approved behavior; the latter adds a distinct,
  cross-cutting repository capability with its own review and acceptance surface.
  Date/Author: 2026-07-25 / Codex orchestrator

- Decision: Adapt Pier Docs behavior into Bun/TypeScript rather than copy its Python scripts.
  Rationale: Mandem has one runtime/toolchain contract and its conformance logic belongs in its clean
  architecture kernel, not a second language-specific policy implementation.
  Date/Author: 2026-07-25 / Codex orchestrator

- Decision: Make Git and canonical checks authoritative; use provider hooks only for faster feedback.
  Rationale: A provider-specific event format must not decide whether Mandem is conformant, and a
  missing Codex hook must not weaken the repository guarantee.
  Date/Author: 2026-07-25 / Codex orchestrator

- Decision: Check human-maintained README indexes without automatic rewriting.
  Rationale: Index descriptions carry useful orientation. Read-only validation prevents hooks from
  creating hidden diffs and reduces operator surprise.
  Date/Author: 2026-07-25 / Codex orchestrator

- Decision: Require the corrected U1 baseline before U1A implementation and block U2 on both.
  Rationale: Both units touch the architecture kernel and package gate; ordering avoids parallel
  policy implementations and merge conflict-driven design.
  Date/Author: 2026-07-25 / Codex orchestrator

- Decision: Implement both Claude and Codex PostToolUse adapters in U1A.
  Rationale: Both installed versions expose the needed lifecycle point. Thin event-to-path adapters
  preserve one shared policy while giving either operator surface immediate feedback.
  Date/Author: 2026-07-25 / Codex orchestrator

## Outcomes & Retrospective

Planning outcome: U1A now has a bounded, self-contained design grounded in the exact Pier Docs and
Nucleus mechanisms the operator named. It strengthens their useful behaviors by centralizing
policy, failing closed in non-interactive execution, avoiding hook mutations, and preserving agent
vendor neutrality. No implementation is authorized yet.

The next planning action is to update the registry and U2 dependency statement, then run a
clean-room review at the exact planning commit. The implementation dependency remains the merged
resolution of work item `5717221`.

Revision note (2026-07-25): Created the first planned U1A revision after post-U1 verification showed
that documentation discoverability and continuous authoring feedback needed a dedicated
foundational unit rather than an informal addition to U2.

Clean-room repair note (2026-07-25): After the first independent review, replaced inferred
documentation/source scopes with exact manifests; specified Markdown parsing, public interfaces,
package commands, staged/pre-push Git semantics, Claude/Codex event contracts, focused red/green
tests, provider failure behavior, source provenance, and the master/registry dependency update.

Second clean-room repair note (2026-07-25): Added revision-backed changed and pre-push evaluation,
complete root-resolving Claude/Codex hook configurations, typed delete/move events, nested-launch
tests, maintained YAML and dynamic module README coverage, and a required remote
`repository-quality` workflow plus `main` ruleset.

Third clean-room repair note (2026-07-25): Made hook installation use Git's worktree-specific
configuration and added a two-linked-worktree proof. Protected the required workflow and its
CODEOWNERS definition with fresh-head operator code-owner approval while preserving autonomous
routine PRs.
