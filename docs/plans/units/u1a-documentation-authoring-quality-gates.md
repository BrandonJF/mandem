---
title: "U1A: Documentation discoverability and continuous authoring quality gates"
plan_kind: mandem-child-execplan
program_unit: U1A
parent: ../2026-07-21-001-feat-mandem-plan.md
work_item: 745eda8
promotion: executable
execution_authorized: true
date: 2026-07-25
---

# U1A: Documentation Discoverability and Continuous Authoring Quality Gates

The repository-root `PLANS.md` defines how to maintain and execute this ExecPlan. Keep
`Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` current while
work proceeds. The operator approved revision `148819ea580606ed2be81a5bec58072471da9dba`, but the
first complete-gate run exposed a recursive revision-check design that exhausted the host's
RAM-backed temporary filesystem and killed the agent pane. This revision supersedes that approval.
Do not resume implementation until a clean-room reviewer approves the exact revised plan and the
operator explicitly authorizes that reviewed revision.

## Purpose / Big Picture

After this work, a human or agent can begin at Mandem's root `README.md` and follow a short chain of
folder indexes to every maintained document. The required checks reject a new document in an
unindexed folder and an authored TypeScript file without a useful leading `@fileoverview`. When an
active agent writes TypeScript that breaks type checking, a supported post-write hook returns
immediate feedback. Versioned Git hooks and `bun run check` enforce the same requirements when
provider hooks are unavailable.

Verification uses `bun run docs:check` on the repository and malformed fixtures. Tests verify that
removing a README link, adding an unindexed document, or adding an authored TypeScript file without
`@fileoverview` causes `bun run check` to fail. Disposable-repository tests verify that installed
hooks reject the same invalid changes. Provider-hook tests verify that supported integrations call
the shared check runner instead of implementing policy separately.

## Scope

Implementation adds Mandem's documentation navigation baseline, documentation conformance rules,
versioned Git hooks, and a provider-neutral post-write check command with verified provider
adapters. It also corrects the current architecture rule's authored-source scope so scripts and
other declared source roots cannot evade `ARCH-FILEOVERVIEW`.

This work excludes Mandem runtime workflow hooks, worker lifecycle orchestration, the TUI,
operating-document compilation, or consumer-repository hook installation. Those belong to U5-U8.
It does not require a README in every code subdirectory. Documentation directories require local
indexes; code modules continue to use one module-root README as defined by the architecture
standard. Generated output, vendored dependencies, Git internals, build output, disposable
fixtures, and hidden provider configuration are excluded through one explicit policy.

The correction tracked in work item `5717221` is a dependency because it changes the same
architecture kernel and package contract. Complete the correction or rebase onto it before
implementing U1A. Do not promote U2 until `5717221` and U1A are complete.

## Context and Orientation

Mandem currently has a root README and module READMEs, but most documentation directories have no
local README. `docs/architecture/`, `docs/operations/`, `docs/plans/reviews/`,
`docs/solutions/best-practices/`, and `docs/sources/` contain maintained documents without local
indexes. The root README does not provide a complete navigation chain. The current architecture
kernel in `src/modules/architecture-standard/domain/rules.ts` scans TypeScript only below `src/`,
even though the normative `ARCH-FILEOVERVIEW` rule says it applies to authored TypeScript source.

Pier Docs implements two relevant behaviors. Its changed-file validator requires each
non-root Markdown file to have a local README, requires that README to link the file, and requires
parent READMEs to link child documentation directories all the way to the root. Its full audit also
reports broken local links and disconnected README directories. Mandem must independently implement
these behaviors in Bun and TypeScript so Bun remains its only project runtime.

Nucleus implements three relevant behaviors. Its pre-commit hook examines staged TypeScript files for
`@fileoverview`; its Claude post-tool hook formats and typechecks a file after writes; and its
versioned pre-push script runs comprehensive verification for code changes with integration tests
around the hook. Mandem must strengthen this pattern: non-interactive enforcement may not degrade
to a warning. Provider hooks must call shared policy; they may not contain policy of their own.
Hooks may not create commits, and every hook must be testable in a disposable repository.

A “documentation directory” is an in-scope directory containing a maintained `.md`, `.yaml`, or
`.yml` file or an in-scope child documentation directory. An “index” is that directory's
`README.md`. A “navigation chain” means each child index is linked from its parent index until the
root README is reached. A
“provider hook” is an optional Claude Code, Codex, or future-agent integration that invokes a shared
Mandem command after a file write. A “Git hook” is a repository-controlled program Git invokes
before commit or push. Provider hooks improve feedback speed. Git hooks and `bun run check` enforce
conformance.

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
`docs/`: every directory at or below `docs/` that contains a maintained `.md`, `.yaml`, or `.yml`
file or an indexed child directory requires a local README; every maintained non-README file must
be linked from that README; and every child directory README must be linked from its parent's
README. A YAML-only directory is therefore in scope and requires its own README.

The manifest also declares special indexes without requiring READMEs throughout their parent
paths. Root `README.md` must link `AGENTS.md`, `CLAUDE.md`, `PLANS.md`, `docs/README.md`,
`scripts/README.md`, `.githooks/README.md`, `src/modules/README.md`, and every checked-in
`.agents/skills/<name>/SKILL.md`. Each skill's `SKILL.md` acts as the index for that skill
directory and must link every maintained Markdown file below it, including files under
`references/`. This preserves the standard skill layout without requiring a separate README.
`scripts/README.md` must link each Markdown file and child README below `scripts/`.
`src/modules/README.md` must link every immediate `src/modules/<name>/README.md`. That dynamic
pattern makes every present and future module-root README an explicit target of
`src/modules/README.md`. Module-root READMEs remain the only required code documentation below each
module. A new maintained document outside the recursive root or declared special indexes produces
`DOC-UNSCOPED-DOCUMENT`.

Exclude any path containing a complete segment `.git`, `.codex`, `.claude`, `.github`,
`node_modules`, `dist`, or `coverage`; exclude `tests/fixtures/` and a generated/vendor path only
when its complete segment is `generated`, `vendor`, or `vendored`. The checked-in
`docs/plans/reviews/`, `docs/solutions/`, and `.agents/skills/` trees are maintained documentation
and are not excluded.
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

U1A adds the missing README hierarchy and concise indexes, but the checker does not rewrite
documentation during `check`, commit, or push. Authors decide titles and descriptions; deterministic
checks verify that every file and child directory is reachable. This avoids generated
tables overwriting useful context and keeps hooks free of hidden mutations. A later explicit
`docs:sync` command may be planned if index maintenance becomes burdensome.

### D4. `@fileoverview` is enforced from one exact authored-source manifest

Extend the corrected authored-source policy in
`src/modules/architecture-standard/domain/repository-policy.ts` without removing its existing
`isExcludedAuthoredPath`, `isIncludedAuthoredTypeScriptPath`, or
`isProductionTypeScriptPath` exports. Define `authoredSourcePolicyV1` beside those helpers and the
documentation policy. Preserve their decisions for every path currently covered by U1C, and
intentionally broaden `isExcludedAuthoredPath` to return true for the ignored complete segments
listed below. The helpers, traversal, and evaluators must consume one shared manifest rather than
duplicate path lists. Include `src/**/*.ts`,
`src/**/*.tsx`, `scripts/**/*.ts`, `scripts/**/*.tsx`, `tests/**/*.ts`, `tests/**/*.tsx`, and root
`*.config.ts`/`*.config.tsx`. This includes current CLI/server files, both modules, checker and hook
scripts, contract tests, `eslint.config.ts`, and `vitest.config.ts`. Exclude any complete segment
`.git`, `node_modules`, `dist`, `coverage`, `generated`, `vendor`, or `vendored`; exclude
`tests/fixtures/**` and files ending `.d.ts`. The checker reports `ARCH-UNSCOPED-TYPESCRIPT` for any
authored `.ts` or `.tsx` file outside the include set until the manifest is deliberately updated.

The first content after an optional `#!` line must be a JSDoc comment containing `@fileoverview` and
at least one non-placeholder word before `*/`. Case-insensitive placeholder-only values `todo`,
`tbd`, `description`, `file`, and `placeholder` fail. An occurrence later in the file, in an
ordinary comment, or in a string does not pass. Test code is authored code; only disposable fixture
and declaration files receive the explicit exceptions above.

The existing architecture checker and tests consume this manifest. U1 correction landed in merge
`27d4abe1a2815bfef1bec56c71bc6d90880ef035`; U1A must preserve its package lifecycle, authored-path
scope, production-path scope, direct-I/O lexical cases, and allowed CLI/server composition
locations.

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
`bun run docs:revision -- --revision <local-sha>` and
`bun run authored-files:revision -- --revision <local-sha>` for every distinct
nonzero outgoing local SHA. Any package, lockfile, source, test, script, hook, provider
configuration, workflow, or other path invokes `bun run check:revision -- <local-sha>` for every
distinct nonzero outgoing local SHA.

`check:revision` is an orchestrator, not a member of the gate it launches. It resolves the common
Git directory, derives the canonical checkout as that directory's parent, and owns only
`<canonical-checkout-parent>/<canonical-checkout-name>-worktrees/.verification/`. This sibling
namespace must be ordinary persistent storage, not an assumed-safe path. Resolve the namespace
parent's actual Linux mount through `/proc/self/mountinfo`. Accept `ext2`, `ext3`, `ext4`, `xfs`,
`btrfs`, or `zfs`. For `overlay`, recursively resolve its `upperdir` mount and accept only when that
backing mount is one of those persistent types; reject an absent or unreadable `upperdir`. Reject
`tmpfs`, `ramfs`, any overlay backed by them, and every unknown filesystem with exit `2`. The
orchestrator adds one detached worktree for the exact commit, runs
`bun install --frozen-lockfile --cache-dir <run-directory>/bun-cache`, then runs
`bun run check:revision-target`. It sets `TMPDIR`, `TMP`,
and `TEMP` to a checker-owned directory inside that run so subprocess fixtures, including the
package-entrypoint archive test, cannot return to RAM-backed `/tmp`.

`bun run check:core` is the one non-test repository gate. `bun run check` composes that core with
the full `test:run` suite. `bun run check:revision-target` composes the same core with
`test:revision-target`, which excludes only `scripts/check-revision.test.ts`, the orchestration
integration test. A package-script contract test walks the declared script dependency graph and
proves neither `check:core` nor `check:revision-target` can reach `check:revision` or `bun run
check`. `bun run check` remains the complete developer and CI gate and includes the orchestration
test.

The public `scripts/check-revision.ts` entrypoint first resolves the common Git directory and its
real parent without creating verification state. The existing Git-owned directory supplies the
bootstrap lock path `<git-common-dir>/mandem-revision-check.lock`; reject a missing, non-directory,
or symlinked common Git directory. Invoke the util-linux `flock` executable with nonblocking mode,
that lock path, and the private
`scripts/check-revision-worker.ts` command plus the validated public arguments. This makes
`flock` the parent of the worker and keeps the advisory lock for the worker's complete lifetime.
Linux releases it after normal exit, `SIGKILL`, or reboot. A missing `flock` executable or lock
acquisition failure exits `2` before the worker reads or changes verification state. No PID
determines lock ownership. The worker has no package-script entrypoint; direct invocation is an
unsupported internal interface. After locking, the worker validates the verification parent
through mount information, then uses `lstat` and realpath containment on every existing
`.verification` and `runs` component before inspecting or creating it. An absent namespace may be
created only under the held Git-directory lock. Create `.verification/`, `fsync` its existing
parent, create `.verification/runs/`, then `fsync` `.verification/`. The valid idle layout is the
real `.verification/` directory containing only an empty real `runs/` directory, with no
`active-run.json`; retain and reuse that layout after successful cleanup. Reconciliation also
accepts the bootstrap power-loss states in order: no `.verification/`, an empty real
`.verification/`, or `.verification/` containing only an empty real `runs/`. It completes the
missing creation and directory `fsync` operations before proceeding. A symlinked or malformed
component, or any other idle entry, exits `2` unchanged.

Each run ID is `run-<full-40-lowercase-hex-commit>-<32-lowercase-hex-characters>`, where the final
segment encodes exactly 16 cryptographically random bytes. Reject every other form. Its owned directory is
`.verification/runs/<run-id>/`, its detached checkout is the nonexistent child `checkout/`, and its
ownership marker is `.verification/runs/<run-id>/owner.json`. Before creating the run directory,
publish `.verification/active-run.json` durably. The sole temporary name is
`.verification/active-run.json.tmp-<run-id>`: write that same-directory regular file, `fsync` it,
rename it to the final name, then `fsync` `.verification/`. The
manifest and marker use the same closed JSON object with exactly these required properties and no
others:

    {
      "schemaVersion": 1,
      "runId": "run-<40 lowercase hex commit>-<32 lowercase hex characters>",
      "canonicalCheckout": "<absolute canonical-checkout realpath>",
      "commonGitDirectory": "<absolute common-Git-directory realpath>",
      "commit": "<40 lowercase hex commit>",
      "runDirectory": "<absolute canonical expected run-directory path>",
      "checkoutPath": "<absolute canonical expected checkout path>",
      "createdAt": "<UTC RFC 3339 timestamp with exactly three fractional-second digits and Z>"
    }

Every string is nonempty and matches the stated format. `runId` begins with the exact `commit`.
`runDirectory` equals the real `runs/` parent joined with `runId`; `checkoutPath` equals
`runDirectory` joined with the fixed `checkout` segment. The expected paths are lexical canonical
paths, not realpaths of nonexistent entries. A marker matches its manifest only when the parsed
objects have the same eight keys and every value is equal. Unknown, missing, duplicate, or
wrong-typed properties fail validation. After each entry exists, validate it with `lstat`, resolve
its realpath, and require equality with the recorded expected path before using or deleting it. After
the manifest is durable, create and `fsync` the run directory, then publish
`owner.json` through the sole temporary name `owner.json.tmp-<run-id>` with the same
write-temporary, file-`fsync`, rename, and parent-directory-`fsync` protocol. Only then register the
checkout. Never reuse a run ID or path.

While holding the advisory lock, reconciliation accepts every power-loss boundary of the one
manifested run: the exact manifest temporary file before publication; a durable manifest with
no run directory; an empty run directory; the exact marker temporary file inside that
directory; a durable matching marker before Git registration; a marked partial checkout with no
registration; or a registered checkout whose marker matches and whose
`git worktree list --porcelain` entry has the exact canonical path, `detached` state, and requested
commit. A temporary file is removable only when its exact name, run-ID grammar, complete schema,
canonical paths, commit, and common Git directory validate; a partial, lookalike, extra, or
symlinked temporary fails closed unchanged with an exact manual-inspection path. Reconciliation
removes each accepted state from newest artifact to oldest and durably removes the manifest last.
For an exact validated Git registration,
it runs only `git worktree remove --force <exact-checkout-path>` and verifies that exact
registration is gone. It never runs generic `git worktree prune`. If exact removal fails, it exits
`2` with the manifest intact and tells the operator which checker-owned path needs manual
inspection. Any other state, including
a malformed or mismatched file, symbolic link, nonempty unmarked directory, unexpected namespace
entry, generated-looking unmanifested directory, branch-attached checkout, wrong commit, path
outside `.verification/runs/`, or multiple registered verification worktrees, exits `2` without
deleting anything. It never scans, removes, or prunes sibling agent worktrees outside
`.verification/` and never alters any other worktree registration, including a stale one.

For a marked partial checkout without Git registration, cleanup walks only the recorded expected
checkout path. It uses `lstat` at every node, never follows a symbolic link, unlinks a symbolic link
itself, and removes regular entries and real directories bottom-up before removing the checkout
directory. After exact checkout removal and verification, unlink the marker and `fsync` the run
directory; remove the run directory and `fsync` the real `runs/` parent; unlink the active manifest
and `fsync` `.verification/`. Deleting either exact transaction temporary is followed by `fsync` of
its parent. Simulated interruption after any deletion or directory-`fsync` must leave a state the
next reconciliation returns to the valid idle layout.

At most one revision check, one detached verification worktree, and one dependency installation
may exist per common Git repository. The run may consume at most 8 GiB inside its owned directory.
One watchdog samples both owned-directory usage and filesystem available space at least every 250
milliseconds throughout worktree creation, installation, and the target gate. It terminates the
active child process group when the run reaches 8 GiB or available space reaches the 2 GiB reserve,
then exits `2`. It checks the same limits immediately before bootstrap, immediately before and
after each phase, and immediately after child exit. Every child temporary and cache location,
including Bun's install cache, is inside the owned run directory. Dependency installation has a 10-minute
timeout and the target gate has a 20-minute timeout; timeout terminates the child process group and
exits `2`.
Success, quality-failure, and setup-failure paths still attempt exact cleanup in `finally`, but
correctness does not depend on `finally`:
`bun run revision-worktrees:reconcile` performs the same lock-protected startup reconciliation
without launching a gate. A quality finding exits `1`; invalid input, live concurrency, unsafe
state, resource exhaustion, setup, install, orchestration, or cleanup failure exits `2`. The
command never evaluates or installs into the operator's checkout and never creates or changes a
branch or ref. Hooks never format, stage, commit, amend, push, or delete repository files or refs.

Revision-check integration tests prove that one invocation creates at most one detached checkout
and launches the target gate once; the target gate cannot re-enter revision orchestration; a live
lock rejects a concurrent invocation before checkout; an interrupted manifest and worktree are
removed by the next invocation and by the explicit reconciler; malformed or out-of-namespace state
fails closed; `tmpfs` and `ramfs` are rejected; the 8 GiB cap, 2 GiB reserve, and both timeouts are
enforced; and a neighboring agent worktree remains registered and unchanged. Crash-window fixtures
cover every accepted partial state plus a killed lock holder and a simulated reboot/PID reuse. A
registered agent worktree, a generated-looking unmanifested directory, and every mismatched state
remain untouched and produce exit `2`.

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
directory receives identical behavior. Add the following complete project hook to
`.claude/settings.json`:

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

Add the following complete project hook to `.codex/hooks.json`:

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

Codex reports the tool name `apply_patch`; parse `*** Add File:`, `*** Update File:`,
`*** Delete File:`, and `*** Move to:` headers in `tool_input.command`. Codex requires
project-local hook trust; document `/hooks` as the normal trust path and use
`--dangerously-bypass-hook-trust` only inside a disposable automated probe.

Both adapters require `hook_event_name: PostToolUse`, resolve paths against event `cwd`, reject
paths outside the Git root, sort and deduplicate events, and invoke the shared check once per event.
An event records `write`, `delete`, `move-from`, or `move-to`. Claude's supported tools emit writes.
For Codex, Add and Update emit writes, Delete emits delete, and a Move emits both move-from for the
Update path and move-to for the destination. Delete and move events invoke the full relevant policy
defined below so stale indexes cannot escape a path-local check.
For zero valid paths or malformed JSON, the adapter exits `2` with one concise error. Successful
checks exit `0` without output. When a check fails, the adapter exits `2` and writes at most 40 lines
to standard error; both
providers return that as model-visible feedback after the write. Provider hook failure cannot undo
the write, which is why Git and `bun run check` remain authoritative.

Provider adapter tests feed recorded, secret-free Claude Write/Edit/MultiEdit and Codex apply-patch
events into the adapters and assert selected paths, exit behavior, bounded output, and no repository
mutation. Future providers add only an event-to-path adapter and call the shared command.

### D7. The required gate and documentation describe one workflow

Add focused package scripts for full documentation audit, changed documentation validation,
authored-file validation, hook installation/status, hook integration tests, and post-write
feedback. `bun run check` includes full documentation and authored-source checks before typecheck,
lint, and tests. README instructions lead with `bun run check`; detailed maintenance and recovery
live in `docs/development/`.

Add `.github/workflows/repository-quality.yml` as the required GitHub Actions workflow. On every pull
request and every push to `main` or `staging`, it checks out full history, installs Bun `1.3.14`,
runs `bun install --frozen-lockfile`, `bun run check`, `bun run build`, and `git issue fsck`. Its
stable job/check name is `repository-quality`. Configure an active GitHub ruleset targeting
`refs/heads/main` that requires a pull request and successful `repository-quality` before merge.
Add `.github/CODEOWNERS` assigning every gate-defining path to `@BrandonJF`: `/.github/CODEOWNERS`,
`/.github/workflows/repository-quality.yml`, `/package.json`, `/bun.lock`, `/.githooks/`,
`/scripts/check-*`, `/scripts/configure-repository-ruleset.ts`,
`/scripts/configure-repository-ruleset.test.ts`, `/scripts/hooks/`,
`/src/modules/architecture-standard/`, `/eslint.config.ts`, `/tsconfig.json`, and
`/vitest.config.ts`. CODEOWNERS identifies responsibility and does not create a GitHub review
requirement. Mandem has one operator account, so the ruleset sets code-owner review, approval of the
latest push, and required GitHub approval count to false or zero. It does not grant agents bypass
permission. These controls require the automated check without requiring a second GitHub account.

Operator consent occurs in the active Mandem conversation for three consent-boundary actions:
`execute-plan` authorizes implementation of one reviewed plan, `apply-ruleset` changes live
repository administration policy, and `merge-pr` changes `main`.
Ordinary issue-ref publication, branch publication, pull-request creation, comments, and read-only
checks remain authorized workflow steps and do not require a separate response. Before each
consent-boundary action, the orchestrating agent states one exact action and immutable target, then
waits for a user message whose complete content is `APPROVED` or `DENIED`.

The orchestrating agent records the exact response in a native issue comment with this canonical
shape:

    Mandem-Approval: v1
    decision: "approved"
    action: "apply-ruleset"
    issue_id: "745eda80-1e74-4866-bc95-2f2983b31025"
    target:
      plan_sha256: "<64 lowercase hexadecimal characters>"
      ruleset_sha256: "<64 lowercase hexadecimal characters>"
      implementation_sha: "<full lowercase Git SHA>"
    actor: "operator"
    response: "APPROVED"
    evidence:
      channel: "mandem-conversation"
      conversation_id: null
      message_id: null
      recorded_at: "<RFC 3339 UTC timestamp>"

For `decision: "denied"`, `response` is exactly `"DENIED"`. No other decision, actor, response, or
action value is valid. `conversation_id` and `message_id` are strings when the orchestration
environment exposes them and explicit null otherwise. All other fields are required. Unknown keys
are rejected.

An `execute-plan` target contains only `plan_commit` and `plan_sha256`. An `apply-ruleset` target
contains only `plan_sha256`, `ruleset_sha256`, and `implementation_sha`. The plan digest is the
SHA-256 of the exact reviewed plan file. The ruleset digest is the SHA-256 of UTF-8 JSON produced by
recursively sorting object keys lexicographically, preserving array order, and emitting no
insignificant whitespace. The implementation SHA is the checked-out commit whose tracked files the
ruleset command will execute; apply rejects another HEAD or tracked worktree changes. A `merge-pr`
target contains only `repository`, `pull_request`, and `head_sha`; the repository is
`"BrandonJF/mandem"`, the pull request is a positive integer, and the head is a full lowercase Git
SHA. Changing the action or any target field requires a new response.

Canonical approval comments use the marker on the first line, LF endings, two-space YAML
indentation, double-quoted strings, explicit null, the key order shown above, and one final newline.
For each exact `issue_id`, `action`, and target, the validator selects the one approval commit that
descends from every other matching approval commit. It never selects by timestamp. No matching
comment, malformed matching content, or incomparable maximal matching commits deny authorization.
The selected decision authorizes only when it is `approved` and its response is `APPROVED`; a
selected later `denied` decision denies authorization.

The agent may append and push the approval comment solely to preserve the operator's response; that
audit write does not require another approval. The agent verifies the exact remote issue-ref head
after the push, then performs only the action and target recorded in the comment. A later plan
revision, ruleset payload, or pull-request head invalidates the earlier approval. GitHub comments
and reviews are projections or optional discussion; they do not grant consent.

Add a pure approval parser, canonical serializer, target builder, and ancestry selector under
`src/modules/architecture-standard/domain/approval-contract.ts`, with focused tests beside it.
Add `scripts/check-approval.ts` to read raw commits from one exact native issue ref and validate an
`execute-plan`, `apply-ruleset`, or `merge-pr` request. The authoritative ruleset definition is the
named export `repositoryRuleset` from `scripts/configure-repository-ruleset.ts`; approval target
construction imports that exact value. `scripts/configure-repository-ruleset.ts --apply` must call
the same approval use case before its first `gh` write and perform zero GitHub writes when approval
is absent, denied, malformed, ambiguous, stale, bound to another HEAD, or run from a tracked dirty
worktree.

Add `scripts/merge-approved-pr.ts`. It validates the exact native approval, requires the local and
remote native issue refs to have the same head, reads the current PR head through `gh`, compares it
with the approved full SHA, and only then runs `gh pr merge <number> --repo <owner/name> --merge
--match-head-commit <approved-head-sha>`. GitHub must reject the merge atomically if the head changes
after the read. The wrapper performs zero GitHub writes
for absent, denied, malformed, ambiguous, changed-target, remote-ref mismatch, or stale-head
approval. The implementation worker stops after the verified PR handoff. The orchestrating agent
or operator alone runs this approved merge command. WI1 will reuse and extend this contract rather
than define a competing approval format.

Update `.agents/OPERATING.md` with this conversation-native approval contract. The implementation
worker records the ruleset identifier and read-back output in this plan. If its credential lacks
ruleset-administration permission, the implementation worker records that exact external dependency
under `Needs you`, and U1A remains incomplete. Local hooks alone do not satisfy acceptance.

Own this external configuration through `scripts/configure-repository-ruleset.ts`, not an
undocumented UI step. The script requires an authenticated `gh` session whose token has repository
Administration write permission. It discovers the ruleset named `mandem-repository-quality` with
`gh api repos/BrandonJF/mandem/rulesets`, creates it with `POST` when absent, and replaces its
definition with `PUT repos/BrandonJF/mandem/rulesets/<id>` when present. Both calls use GitHub API
version `2026-03-10` and this exact semantic payload:

    {
      "name": "mandem-repository-quality",
      "target": "branch",
      "enforcement": "active",
      "bypass_actors": [],
      "conditions": {
        "ref_name": {
          "include": ["refs/heads/main"],
          "exclude": []
        }
      },
      "rules": [
        {
          "type": "pull_request",
          "parameters": {
            "allowed_merge_methods": ["merge"],
            "dismiss_stale_reviews_on_push": true,
            "require_code_owner_review": false,
            "require_last_push_approval": false,
            "required_approving_review_count": 0,
            "required_review_thread_resolution": true
          }
        },
        {
          "type": "required_status_checks",
          "parameters": {
            "do_not_enforce_on_create": false,
            "required_status_checks": [
              {
                "context": "repository-quality"
              }
            ],
            "strict_required_status_checks_policy": true
          }
        },
        {
          "type": "deletion"
        },
        {
          "type": "non_fast_forward"
        }
      ]
    }

`bun run repository-ruleset:apply` performs that idempotent create/update and then reads the exact
ruleset back. `bun run repository-ruleset:check` is read-only and exits `1` when any field above
differs, including a nonempty bypass list; it exits `2` for authentication, authorization, API, or
ambiguous duplicate-name failures. Apply creates or updates a ruleset only when discovery finds
zero or one matching ruleset. On more than one match, it exits `2` without mutation. Tests mock only
the `gh` and raw-Git process boundaries and cover create, update, already-conformant, drifted,
duplicate-with-no-mutation, unauthenticated, unauthorized, no-approval, approved, denied, malformed,
wrong-action, changed-plan, changed-ruleset, changed-implementation, tracked-dirty,
changed-PR-head, remote-ref mismatch, later-denied, and incomparable approval responses. Every
non-approved case asserts zero GitHub writes.
Milestone 7 runs `gh auth status`, then apply and check. If `gh` reports missing authentication or
insufficient permission, the worker records the command, exit status, and secret-free API response
in `Progress`, comments the same concise blocker
on work item `745eda8`, marks the unit `Needs you`, and stops before claiming completion.

## Normative Interfaces

The file and export names below are fixed for this unit. If an implementer changes a file or export
name, they must update this plan and obtain another clean-room review before continuing.

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

Extend the existing `src/modules/architecture-standard/domain/repository-policy.ts`, preserving its
public `isExcludedAuthoredPath`, `isIncludedAuthoredTypeScriptPath`, and
`isProductionTypeScriptPath` exports, and add `documentationPolicyV1`, `authoredSourcePolicyV1`,
`evaluateDocumentation(snapshot, policy): AnalysisResult`, and
`evaluateAuthoredSources(snapshot, policy): AnalysisResult`. Extend `domain/rules.ts` with
`DOC-LOCAL-README`, `DOC-LOCAL-INDEX`, `DOC-PARENT-INDEX`, `DOC-BROKEN-LOCAL-LINK`,
and `DOC-UNSCOPED-DOCUMENT`; preserve the existing `ARCH-UNSCOPED-TYPESCRIPT` catalog entry and
evaluation behavior. The existing `RepositoryFile`,
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
    "docs:revision": "bun scripts/check-documentation.ts --mode revision"
    "authored-files:check": "bun scripts/check-authored-files.ts --mode full"
    "authored-files:revision": "bun scripts/check-authored-files.ts --mode revision"
    "check:revision": "bun scripts/check-revision.ts"
    "check:core": "bun run preflight:bun && bun run docs:audit && bun run authored-files:check && bun run architecture:check && bun run typecheck && bun run lint"
    "check": "bun run check:core && bun run test:run"
    "check:revision-target": "bun run check:core && bun run test:revision-target"
    "test:revision-target": "MANDEM_ARCHIVE_COMMIT=$(git rev-parse HEAD) bunx vitest run --exclude scripts/check-revision.test.ts"
    "revision-worktrees:reconcile": "bun scripts/check-revision.ts --reconcile-only"
    "hooks:install": "bun scripts/hooks/install.ts"
    "hooks:check": "bun scripts/hooks/install.ts --check"
    "test:hooks": "bunx vitest run scripts/hooks/hooks.integration.test.ts scripts/hooks/provider-post-write.test.ts"
    "authoring:check": "bun scripts/hooks/post-write.ts"
    "approval:check": "bun scripts/check-approval.ts"
    "pr:merge:approved": "bun scripts/merge-approved-pr.ts"
    "repository-ruleset:apply": "bun scripts/configure-repository-ruleset.ts --apply"
    "repository-ruleset:check": "bun scripts/configure-repository-ruleset.ts --check"

`bun run check` invokes `docs:audit` and `authored-files:check` after the Bun preflight and before
typecheck, lint, and tests.

The approval checker accepts exactly one of:

    bun run approval:check -- --issue <uuid> --action execute-plan --plan <path> --plan-commit <full-sha>
    bun run approval:check -- --issue <uuid> --action apply-ruleset --plan <path>
    bun run approval:check -- --issue <uuid> --action merge-pr --repository <owner/name> --pull-request <positive-integer> --head <full-sha>

For `apply-ruleset`, the command reads the reviewed plan and imports the exact exported
`repositoryRuleset` value to compute both target digests. It exits `0` only for current approval,
`1` for absent, denied, malformed, stale, or ambiguous approval, and `2` for Git or filesystem
failure. It never writes refs or contacts GitHub.

The approved merge command accepts:

    bun run pr:merge:approved -- --issue <uuid> --repository <owner/name> --pull-request <positive-integer> --head <full-sha>

It performs the same approval check, verifies the remote native issue ref and current provider PR
head, and then requests a merge commit. It exits `1` without a merge request for approval or target
failure and `2` for Git, network, authentication, or provider failure.

`scripts/check-documentation.ts` accepts exactly:

    --mode full
    --mode changed --base-ref <git-ref> [--head-ref <git-ref>]
    --mode staged
    --mode revision --revision <git-ref>

Full mode reads the working tree. Changed mode requires `--base-ref`, defaults head to `HEAD`, reads
name-status entries including old and new rename paths, and analyzes the head revision snapshot
rather than the current checkout. Staged mode reads the virtual staged snapshot from D5. Missing
values, unknown flags, or unresolvable refs exit `2`.

`scripts/check-authored-files.ts` accepts exactly `--mode full`, `--mode staged`, or
`--mode revision --revision <git-ref>`. Full mode reads the working tree, staged mode reads the
virtual staged snapshot, and revision mode reads only the selected Git tree. Missing values,
unknown flags, or unresolvable refs exit `2`. `scripts/check-revision.ts` accepts either exactly one
nonzero revision or the sole flag `--reconcile-only`. Revision mode verifies the argument resolves
to a commit and implements the bounded detached-worktree flow specified in D5. Reconcile-only mode
repairs or validates the owned namespace without installing dependencies or running the target
gate. Unsafe state, live concurrency, insufficient space, setup, install, target-gate, or cleanup
failures exit `2`.

`scripts/check-revision-worker.ts` is a private orchestration adapter reached only through the
locked public entrypoint. It owns manifest validation, reconciliation, resource observation,
detached-worktree lifecycle, dependency installation, and target-gate execution. Filesystem-type
validation parses `/proc/self/mountinfo` with the allowlist and overlay-backing rules in D5 before
`.verification` is created. Child processes use argument arrays and isolated process groups so
timeout or storage-cap termination reaches the complete descendant tree.

Pre-push analyzes every distinct nonzero outgoing `local-sha` against its calculated base. It never
uses the working tree for an outgoing commit. Tests must include a dirty checkout whose outgoing SHA
is clean and a non-current local ref; results follow the outgoing revision, not checkout content.

## Expected Repository Shape

At completion, the relevant paths include:

    README.md
    .agents/
      skills/
        write-clearly/
          SKILL.md
          agents/
            openai.yaml
          references/
            style-guide.md
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
      configure-repository-ruleset.ts
      configure-repository-ruleset.test.ts
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
linked by its parent, a YAML-only documentation directory, a broken relative link, anchor/query
normalization, excluded paths, and a valid root-to-leaf chain. Add authored-file cases for `src/`,
`scripts/`, root TypeScript config,
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

This milestone is complete when the evaluator accepts a complete navigation chain and reports the
exact expected ID and path for each malformed condition.

### Milestone 3: Add filesystem, Git-diff, and CLI adapters

Extend the repository-tree infrastructure adapter to read the Markdown and authored-source inputs
needed by the policy while preserving path normalization and repository-root containment. Add a Git
changed-path adapter behind an application port. Build thin full-audit and changed-scope script
entrypoints with exit code `0` for conformance, `1` for findings, and `2` for traversal,
configuration, Git, or unexpected failures.

Add integration fixtures that exercise the real filesystem and a disposable Git history. Include
added, modified, renamed, and deleted README/doc paths, a dirty checkout whose selected revision is
clean, a non-current local ref, and the actual pre-push entrypoint selecting both documentation-only
revision commands and the disposable full-revision gate. The full-revision integration test uses a
real disposable Git repository on ordinary project storage and proves the package-entrypoint
contract can read the selected commit's Git objects, the operator checkout remains dirty and
untouched, and no verification worktree registration remains after success or failure. Add focused
orchestration tests for the nonrecursive target gate, single-run lock, stale-run reconciliation,
path-containment rejection, 2 GiB free-space floor, checker-owned temporary environment, and
neighboring agent-worktree preservation. Confirm failure output names the repair in plain
language, remains bounded, and follows the selected revision rather than the checkout.

This milestone is complete when the implementer can run both modes against the Mandem repository
and malformed fixtures demonstrate each failure class through the public command.

### Milestone 4: Build the documentation navigation baseline

Create the README hierarchy shown above. In each README, write one short paragraph about the
folder, list every maintained local Markdown document, and list every in-scope child documentation
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

Prove that Git commits a valid staged TypeScript file, rejects a missing fileoverview
non-interactively, rejects an unindexed Markdown file, and blocks a protected-branch push. Verify
that the pre-push hook runs the full gate for code pushes, the documentation gate for docs-only
pushes, and the full gate for an indeterminate diff. Compare repository snapshots before and after
each failure to confirm that no hook changes files, the index, commits, branches, or remotes. In
two-worktree fixtures, prove installation enables
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

This milestone is complete when an adapter receives a supported provider write event and invokes
the expected shared check, rejects malformed events safely, and does not implement a distinct
policy or change repository content.

### Milestone 7: Integrate the single repository-quality gate and complete review

Add the new checks and hook integration suite to package scripts and add the GitHub Actions workflow
from D7. Make `bun run check` return a nonzero exit status when any check fails, and run the checks
in this deterministic order: Bun preflight, documentation/authored-source architecture,
TypeScript, lint, and tests. Run focused tests first. Run `bun run check:revision` against the
current commit and observe exactly one target-gate launch and no remaining verification worktree.
Then run the complete gate from a clean checkout. Install the Git hooks in the implementation worktree
and perform one disposable valid and invalid commit proof.

After the operator approves the exact reviewed revision in the active conversation, record and push
the structured native approval comment before changing GitHub. Configure and read back the required
`main` ruleset, including no GitHub review requirement and no account bypass.
Use `bun run repository-ruleset:apply` followed by `bun run repository-ruleset:check`; do not
configure it manually. Trigger the workflow with the PR and record a successful
`repository-quality` check; a skipped, pending, or billing-disabled check is not completion
evidence.

The bootstrap order is exact. First commit and review the revised plan. Request `APPROVED` for
`execute-plan` with its commit and file SHA-256, append and push the matching native approval record,
then verify the canonical comment and exact pushed ref with `git cat-file commit`, `git
merge-base --is-ancestor`, and `git ls-remote`. The approval checker is itself a U1A deliverable, so
this one `execute-plan` bootstrap uses the same schema and ancestry rule through explicit Git
commands rather than a command that does not exist yet. This exception permits no GitHub write and
does not apply after the checker exists. Set execution authorization without changing the reviewed
instructions. Implement the approval and ruleset changes test-first and commit the resulting clean tracked tree.
Compute the plan, canonical ruleset JSON, and implementation commit targets. Request `APPROVED` for
`apply-ruleset` with all three, append and push the matching native approval record, run the
approval check, then run the ruleset apply and read-only check.

The implementation worker then pushes the final branch, opens the PR, waits for
`repository-quality`, completes review, and returns the verified head to the orchestrator without
merging. The orchestrator requests `APPROVED` for `merge-pr` with the PR number and full head SHA,
appends and pushes the matching native approval record, and runs `pr:merge:approved`. That command
re-reads the provider head immediately before the merge request and refuses any changed head.

Run independent correctness, testing/adversarial, maintainability, and agent-vendor-neutral reviews.
Repair all blocking and important findings test-first. Run the repository's single headless Learn
step, focusing on documentation or hook surprises that future work can avoid. Commit, push, and open
a PR. The worker must not merge; only the orchestrator or operator may run the approved merge
command after the worker returns the verified PR head.

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
    bunx vitest run scripts/check-revision.test.ts
    bunx vitest run src/modules/architecture-standard/domain/approval-contract.test.ts
    bunx vitest run scripts/check-approval.test.ts
    bunx vitest run scripts/merge-approved-pr.test.ts
    bunx vitest run scripts/configure-repository-ruleset.test.ts
    bunx vitest run scripts/hooks/hooks.integration.test.ts
    bunx vitest run scripts/hooks/provider-post-write.test.ts

Before domain implementation, the first command must fail named cases
`requires a README and local index through the root chain` and
`rejects broken and unscoped Markdown`. The second must fail
`requires a leading meaningful fileoverview for every authored source` and
`rejects unscoped TypeScript`. Before filesystem/Git adapters, the third must fail
`evaluates added renamed and deleted documents from a Git base`. Before ruleset configuration, the
fourth must fail `creates updates and verifies the canonical repository ruleset`. Before Git-hook
implementation, the fifth must fail `pre-commit evaluates the staged snapshot` and
`pre-push classifies every ref update fail closed`. Before provider adapters, the sixth must fail
`maps Claude write events to checked paths` and
`maps Codex apply-patch headers to checked paths`. Each red state must be an assertion mismatch for
the named behavior, not missing module/configuration failure. Record the failing assertion and later
passing test in `Progress`.

Before repairing revision verification, `scripts/check-revision.test.ts` must fail named cases that
prove the target gate is nonrecursive, a live lock prevents a second checkout, an interrupted run
is reconciled, and unsafe state fails closed without touching a neighboring worktree. Cover a
killed lock holder, simulated reboot and PID reuse, every manifest/marker/registration creation
window, `tmpfs` rejection, generated-looking unowned content, a registered neighboring agent
worktree, the 8 GiB cap, the 2 GiB reserve, and both child timeouts. Do not run `bun run check` or
`bun run check:revision` while the recursive implementation remains reachable.

The required red/green test names are `keeps revision target dependencies nonrecursive`,
`launches one checkout and one target gate for the selected revision`, `releases the advisory lock
after kill and reboot`, `serializes concurrent first-run namespace creation`, `reconciles every
bootstrap directory and durable manifest and marker power-loss boundary`, `removes only the exact
detached requested revision registration`, `never prunes and preserves a stale neighboring registration`, `rejects
symlinked verification components and malformed transaction state`, `rejects unmanifested
generated names and registered agent worktrees`, `rejects lookalike and invalid transaction
temporaries`, `removes nested partial checkout content without following symlinks`, `durably
reconciles every cleanup deletion boundary`, `keeps Bun cache and child temporary writes inside the
owned run`, `accepts supported persistent storage and rejects
ephemeral or unknown mounts`, `stops at the run cap and preserves the reserve during checkout`,
`stops install before it consumes the reserve`, `stops the target gate before it consumes the reserve`,
`terminates install and target process groups at their deadlines`, and `checks the selected
revision without changing a dirty checkout`. Each case must have a nearby passing control and
assert its exit status, bounded diagnostic, worktree registrations, transaction files, and
operator-checkout status as applicable.

Before changing the live ruleset, the approval tests must fail named cases that prove canonical
serialization and fail-closed enforcement: `serializes one canonical approval record`, `rejects
malformed and unknown approval fields`, `binds ruleset approval to plan and payload digests`,
`binds merge approval to pull request and head`, `rejects a wrong action or changed target`,
`selects the unique ancestry-maximal decision`, `rejects incomparable approval decisions`, `a later
denial supersedes approval`, `rejects a changed implementation or tracked dirty tree`, `re-reads
the PR head before merging`, and `performs no GitHub write without current approval`. Each case must
have a passing control. The script tests use disposable Git repositories with real issue refs and
mock only the GitHub process boundary. Merge tests assert zero merge calls for absent, denied,
malformed, stale-head, changed-target, and remote-ref-mismatch approval, and assert that a provider
head change at the merge boundary fails the compare-and-swap request without merging.

After the policy and adapters exist, exercise:

    bun run docs:audit
    bun run docs:check -- --base-ref HEAD^
    bun run authored-files:check
    bun run hooks:install
    bun run hooks:check
    bun run test:hooks
    bun run authoring:check -- src/modules/runtime/domain/types.ts
    bun run approval:check -- --issue 745eda80-1e74-4866-bc95-2f2983b31025 --action apply-ruleset --plan docs/plans/units/u1a-documentation-authoring-quality-gates.md
    bun run repository-ruleset:check
    bun run revision-worktrees:reconcile
    bun run check:revision -- "$(git rev-parse HEAD)"

Successful commands must print concise output that names the checked scope. Commands that evaluate
malformed fixtures must exit `1` and print stable IDs with repository-relative paths. Commands that
encounter traversal, Git, or configuration failures must exit `2` and explain the failed boundary
without a stack trace in normal output.

Before handoff, run:

    bun install --frozen-lockfile
    bun run check
    bun run build
    bunx vitest run tests/contract/package-entrypoints.test.ts
    bunx vitest run src/modules/architecture-standard/tests/rules.test.ts
    git issue fsck
    bun run repository-ruleset:check
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
- The hook installer enables Git's worktree-config extension once, removes any inherited common
  `core.hooksPath` only after preserving it in every existing worktree, changes only the selected
  worktree to `.githooks`, is repeatable, and reports its state.
- A non-interactive pre-commit rejects missing fileoverview and documentation-index violations.
- The pre-push hook rejects a protected-branch push. For a normal code push, it runs the full check;
  for a docs-only push, it runs documentation checks; and for an uncertain diff, it runs the full
  check.
- Pre-push evaluates every outgoing commit snapshot, including a non-current local ref, without
  allowing unrelated dirty checkout content to change the result.
- Exact-revision verification launches one detached disk-backed checkout and one nonrecursive
  target gate. A simultaneous invocation exits `2` before creating another checkout.
- After a simulated hard interruption, the next invocation and the explicit reconciler remove only
  the checker-owned stale worktree and state. A malformed record, out-of-namespace path, unexpected
  namespace entry, RAM-backed filesystem, 8 GiB run, less than 2 GiB reserve, or child timeout exits
  `2` without touching an agent worktree.
- Failed hooks do not alter working files, staged content, commits, branches, or remotes.
- The shared post-write command typechecks a TypeScript write and checks a Markdown write without
  editing either file.
- Claude Write/Edit/MultiEdit and Codex apply-patch hooks invoke the shared command with the exact
  events in their recorded fixtures—including deletes and moves—from the repository root or a
  nested launch directory, and return bounded model-visible feedback on failure.
- The `repository-quality` workflow runs on pull requests and pushes to `main`/`staging`; an active
  `main` ruleset requires both a pull request and that successful check before merge. Changes to the
  workflow, canonical commands, hook/check implementations, architecture gate, test/lint/type
  configuration, lockfile, or CODEOWNERS map make the approval scope especially important for this
  U1A PR. Every PR merge requires an exact operator `APPROVED` response for its repository, PR
  number, and current head in the active Mandem conversation. The orchestrating agent records and
  pushes that approval in the native issue and uses the approved merge command; a subsequent push
  invalidates it.
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

Revision verification is restart-safe as well as idempotent. Normal completion attempts exact
cleanup, and every later invocation reconciles the durable manifest before creating new work. If a
pane, process, or host dies after worktree creation, run `bun run revision-worktrees:reconcile`.
The command may delete only the manifest-named immediate child of `.verification/` after validating
its marker, canonical path, and Git registration. Preserve malformed state for diagnosis and exit
`2`; never broaden cleanup to the parent worktree namespace. If the lock owner is still alive,
wait for that process or stop it deliberately before retrying. Free disk space before retrying a
2 GiB floor failure.

If documentation baseline work exposes many failures, do not add broad exclusions or suppressions.
Repair the README chain directory by directory, rerunning the full audit after each group. If the
installed provider's behavior contradicts the documented PostToolUse contract, stop, record the
evidence, revise this plan's adapter scope, and repeat clean-room review. Do not silently omit an
adapter from an approved revision.

If implementing work item `5717221` changes the architecture kernel after this plan is reviewed,
stop before implementation, rebase the planning branch, revise the consumed interfaces and tests
here, and repeat clean-room review. If hook execution leaves the worktree changed, treat that as a defect,
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
- [x] (2026-07-25 19:40Z) Completed clean-room and mandatory headless document review through
  reviewed commit `a4a5c11`; repaired every P0/P1 plan finding and recorded the durable verdict.
- [x] (2026-07-25 20:45Z) Marked the `a4a5c11` review as superseded after applying the repository
  writing standard and adding `.agents/skills/` to the documentation policy. A new review is
  required for this revision.
- [x] (2026-07-25 20:50Z) A fresh Terra reviewer approved commit `b73e960` and plan SHA-256
  `2a2d1dd72869bdde93d5318626e56084ac12ff890da61eccfadf5390d1b48339` with no P0/P1
  blockers.
- [x] (2026-07-27) Completed work item `5717221` in merge
  `27d4abe1a2815bfef1bec56c71bc6d90880ef035` and revalidated U1A against the corrected kernel.
  Updated the plan to extend, rather than recreate, the authored-source policy and added focused
  regression gates for the corrected architecture and package contracts. This edit supersedes the
  prior clean-room approval; implementation remains unauthorized pending a fresh review.
- [x] (2026-07-27) The first post-U1C clean-room review found two P1 contract gaps and one P2
  ambiguity: pre-push commands were not revision-aware, YAML-only directories were inconsistently
  scoped, and new ignored segments conflicted with preserving the U1C helper verbatim. Repaired the
  plan with exact revision commands, a disposable revision gate, YAML-only coverage, and an explicit
  compatible broadening of the shared authored-source manifest.
- [x] (2026-07-27) The second post-U1C clean-room review found one P1: an exported archive lacks
  the Git objects required by U1C's package contract. Replaced the archive design with an exact-SHA
  detached worktree, mandatory cleanup, and a real end-to-end regression proof.
- [x] (2026-07-27) The final post-U1C clean-room review found no P0, P1, or P2 blockers after one
  remaining terminology mismatch was repaired. Promoted the plan to `clean-room-approved`;
  implementation remains unauthorized.
- [x] (2026-07-27) The operator approved exact plan revision
  `148819ea580606ed2be81a5bec58072471da9dba`; set `execution_authorized: true` without changing
  implementation scope.
- [x] (2026-07-27) Created isolated worktree
  `/home/brandonjf/dev/work/mandem-worktrees/u1a-implementation` on
  `feat/u1a-quality-gates` from authorized plan merge
  `94d53d8f7c0be165f9b2d8f2fc5cdf4ec5b5a787`. Dispatched Milestones 1–3 to a bounded
  implementation worker with the complete approved plan.
- [x] (2026-07-27 21:10Z) Implemented and verified Milestones 1–3. Added the pure v1
  documentation and authored-source policy, stable `DOC-*` catalog, in-memory policy tests,
  filesystem and Git snapshot adapters, changed-path application ports, and full/revision/staged
  CLI entrypoints. The initial documentation-catalog test failed with all five missing `DOC-*`
  identifiers; the focused suite now passes 31 tests. `bunx tsc --noEmit`, focused ESLint, `bun run
  architecture:check`, `bun scripts/check-documentation.ts --mode full`, and `bun
  scripts/check-authored-files.ts --mode full` also pass.
- [x] (2026-07-27 21:20Z) Implemented Milestone 4 documentation navigation baseline at
  `ed04f2d`; the full documentation policy and repository check pass.
- [x] (2026-07-27 21:30Z) Implemented and verified Milestone 5. The initial hook integration suite
  failed because both checked-in entrypoints were absent (`expected null to be 0/1`). The focused
  suite now passes three disposable-repository tests covering staged TypeScript and documentation
  rejection, protected refs, documentation-only/code/indeterminate pre-push classification, and
  worktree-local hook installation with common-value migration. `bunx tsc --noEmit` and
  `git diff --check` pass.
- [x] (2026-07-27 21:25Z) Implemented and verified Milestone 6. The initial provider-adapter
  suite failed because the adapter and provider configurations were absent (`expected 1 to be 2`
  and missing `.claude/settings.json`). The focused suite now passes seven tests covering Claude
  Write/Edit/MultiEdit, Codex add/update/delete/move headers, nested directories, duplicate paths,
  spaces, malformed input, out-of-root paths, bounded failures, no fixture mutation, and exact
  configurations. Disposable live probes verified Claude Code `2.1.220` Write and Codex CLI
  `0.145.0` apply_patch PostToolUse feedback through the shared adapter; the recorded evidence is
  `docs/operations/provider-capability-baseline.md`.
- [ ] Complete Milestone 7 review, Learn, and implementation PR (completed: local repository-gate
  integration, workflow, CODEOWNERS, ruleset command, and active GitHub ruleset `19852337`;
  remaining: correct the single-operator approval design, obtain exact conversation approval,
  update and verify the live ruleset, verify the hosted workflow, complete reviews and Learn, and
  open the PR).
- [x] (2026-07-27 21:32Z) Integrated the local Milestone 7 quality-gate work. Added the
  `repository-ruleset:apply` and `repository-ruleset:check` package commands, ordered the canonical
  gate as Bun preflight, documentation, authored-source, architecture, TypeScript, lint, and tests,
  added the `repository-quality` workflow and gate-path CODEOWNERS entries, and added the mocked
  GitHub ruleset create, update, conformance, drift, duplicate, authentication, and authorization
  tests. The initial focused test failed because `configure-repository-ruleset.ts` did not exist;
  after implementation, the focused suite passed 3 tests and `bun run check` passed 50 tests.
- [x] (2026-07-28 22:18Z) Revised the plan after the live merge attempt proved that GitHub
  code-owner and latest-push approval require a second account. Defined exact conversation approval
  recorded in the native issue, retained the required automated check, and reset execution
  authorization pending fresh review and exact operator approval.
- [x] (2026-07-28 22:42Z) Resolved fresh review findings by defining canonical action targets and
  ancestry selection, binding ruleset approval to the executing commit, adding fail-closed ruleset
  and merge commands, and assigning merge execution only to the orchestrator or operator.
- [x] (2026-07-28 22:58Z) Completed fresh clean-room, coherence, and feasibility review of the
  conversation-native approval revision; all reviewers approved with no remaining blockers.
- [x] (2026-07-27 21:55Z) Applied validated clean-room findings test-first. The first focused run
  failed four new assertions: root/special-index links, punctuation/tag-only fileoverviews,
  changed root-link regressions, and provider symlink escape handling. Added root and dynamic
  special-index checks, retained root/special findings in changed analysis, resolved provider paths
  physically, unioned duplicate pre-push SHA paths, and separated quality-gate exit `1` from setup
  and cleanup exit `2`. The focused suite now passes 24 tests; `bun run docs:audit`, `bun run
  authored-files:check`, and `bunx tsc --noEmit` pass.
- [x] (2026-07-27) Diagnosed GitHub issue #17 after the complete gate killed the agent pane. The
  revision-check integration test recursively launched `bun run check`, which launched the same
  integration test again. Each level created a RAM-backed `/tmp` worktree and installed
  dependencies until the host reached about 29.5 GiB and killed the pane.
- [x] (2026-07-27) Removed 136 abandoned checker and package directories after confirming no live
  process owned them, pruned stale Git worktree metadata, and verified that the U1A branch, seven
  commits, and three uncommitted policy-repair files remained intact.
- [x] (2026-07-28 15:20Z) The operator instructed Codex to read the U1A reset handoff and continue,
  authorizing exact recovery-plan commit `cecfc0c8ede4c9493b50193bf76edbd321d49a8f`.
- [x] (2026-07-27) A fresh clean-room reviewer approved recovery plan content SHA-256
  `f8c58462bf7b8f6a2fd4325023fb20e715005dc5d66237e29d21e48228f86580` with no P0, P1, or
  P2 findings. Recorded the durable verdict and promoted the plan to `clean-room-approved`;
  implementation remains unauthorized pending exact operator approval.
- [x] (2026-07-28 15:27Z) Repaired revision orchestration with a nonrecursive target gate,
  Git-directory advisory lock, disk-backed owned namespace, durable manifest and marker,
  exact-worktree reconciliation, isolated temporary and Bun cache paths, storage reserve and run
  caps, child timeouts, and process-group termination. The package graph test failed before the
  new commands existed. The complete 61-test gate and an exact-revision run both pass without
  recursion or abandoned state.

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

- Observation: U1C introduced the authored-source scope and unscoped-TypeScript rule before U1A.
  Evidence: merge `27d4abe1a2815bfef1bec56c71bc6d90880ef035` added the three public
  repository-policy helpers, `ARCH-UNSCOPED-TYPESCRIPT`, package entrypoint contracts, and focused
  architecture regression tests. U1A must extend these interfaces instead of recreating them.

- Observation: Vitest's Node-compatible worker does not provide the Bun global even though Bun runs
  the test command.
  Evidence: the first filesystem and Git adapter tests failed with `ReferenceError: Bun is not
  defined` from `Bun.file` and `Bun.spawn`. The adapters now use Node filesystem and child-process
  APIs inside the infrastructure layer; the same tests pass under Bun's Vitest runner.

- Observation: PR #16 added `.agents/OPERATING.md` after the reviewed U1A plan was authored, and
  each skill now contains generated `agents/openai.yaml` metadata.
  Evidence: the root README must link `.agents/OPERATING.md` for the repository navigation chain;
  `openai.yaml` is provider metadata rather than maintained Markdown documentation.

- Observation: A disposable hook fixture can execute the checked-in entrypoints by symlinking
  `.githooks/` and `scripts/` while retaining its own Git index and refs.
  Evidence: the first hook test run failed only because `.githooks/pre-commit` and
  `.githooks/pre-push` did not exist; after adding them, the staged-snapshot assertion passed.

- Observation: Claude Code installed version `2.1.220`, one patch release newer than the `2.1.219`
  version named in the original plan, and still delivered the required PostToolUse feedback.
  Evidence: `claude --version` printed `2.1.220`; a disposable Write probe returned
  `DOC-UNSCOPED-DOCUMENT probe.md` as a blocking hook error.

- Observation: Codex PostToolUse passes its apply-patch event after prior provider writes remain in
  the disposable repository, so a full documentation check can report both old and new violations.
  Evidence: the Codex probe returned findings for `codex-probe.md` and the earlier `probe.md`.

- Observation: The package archive contract test needs an explicit commit SHA when it runs outside
  the `test:run` package command.
  Evidence: a direct focused Vitest invocation failed because `MANDEM_ARCHIVE_COMMIT` was unset;
  rerunning with `MANDEM_ARCHIVE_COMMIT=$(git rev-parse HEAD)` passed.

- Observation: GitHub adds an empty `required_reviewers` array to the pull-request rule when it
  returns a ruleset, even when the submitted semantic payload omits that optional field.
  Evidence: ruleset `19852337` matched every required value but the first read-back comparison
  failed until the comparator normalized this empty server default. The focused regression test
  failed before the repair and now passes.

- Observation: Lexical path containment accepts a repository symlink whose target is outside the
  repository, including a deleted target beneath that symlink.
  Evidence: a Codex event for `escape/write.md` exited `0` before the adapter resolved the nearest
  existing path component; write, delete, and move tests now exit `2` with an outside-repository
  error.

- Observation: A duplicate outgoing SHA can have different changed-path classifications when each
  remote ref supplies a different comparison base.
  Evidence: replacing the SHA's first path set with its last set would classify a combined source
  and documentation history as documentation-only. The pre-push adapter now unions the path sets
  and invokes `check:revision`.

- Observation: An integration test entered the same complete gate that included the integration
  test, so each child process created another detached worktree and dependency installation.
  Evidence: GitHub issue #17 records the chain
  `check-revision.test.ts` to `check-revision.ts` to `bun run check` and back to
  `check-revision.test.ts`; the killed run left 136 directories consuming 21 GiB in `/tmp`.

- Observation: GNU `du` can fail while a child test removes files from the monitored run
  directory.
  Evidence: the first complete recovery gate reported transient `No such file or directory`
  diagnostics for package-test and ESLint temporary files. The watchdog now sums allocated blocks
  with a no-follow filesystem walk and tolerates entries removed during sampling.

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

- Decision: Treat the corrected U1C repository-policy helpers as compatibility surfaces for U1A.
  Rationale: They are already consumed by traversal and architecture evaluation. Deriving them and
  the new policy objects from one manifest prevents scope drift while preserving verified behavior.
  Date/Author: 2026-07-27 / Codex orchestrator

- Decision: Ignore only GitHub's empty `required_reviewers` read-back default during ruleset
  comparison.
  Rationale: The approved payload does not require named reviewers, and an empty server-supplied
  array does not change its behavior. Every required field and any nonempty reviewer list still
  participates in drift detection.
  Date/Author: 2026-07-27 / Codex orchestrator

- Decision: Authorize implementation of exact reviewed revision
  `148819ea580606ed2be81a5bec58072471da9dba`.
  Rationale: The operator explicitly approved that clean-room-approved revision. This metadata and
  living-record update does not change its implementation instructions.
  Date/Author: 2026-07-27 / Brandon and Codex orchestrator

- Decision: Add `.agents/OPERATING.md` to `documentationPolicyV1.rootIndexEntries` and exclude
  `.agents/skills/*/agents/openai.yaml` from documentation scope.
  Rationale: The shared operating contract is a maintained root document and must be discoverable.
  Generated provider metadata is not Markdown authoring guidance and D2 limits the skill index
  requirement to maintained Markdown files.
  Date/Author: 2026-07-27 / Codex implementation worker

- Decision: Keep the existing `architectureRules` export architecture-only and publish the expanded
  catalog through `repositoryRules` and `documentationRules`.
  Rationale: U1C contract tests treat `architectureRules` as the exact `ARCH-*` catalog. Separate
  exported views add `DOC-*` rules without changing that compatibility surface.
  Date/Author: 2026-07-27 / Codex implementation worker

- Decision: Make hook entrypoints POSIX shell launchers and keep policy execution in TypeScript.
  Rationale: Git can execute the checked-in entrypoints directly, while the shared architecture
  composition remains the only location that evaluates repository policy.
  Date/Author: 2026-07-27 / Codex implementation worker

- Decision: Parse provider event formats in private infrastructure adapters and run the same public
  authoring use case for every normalized path event.
  Rationale: The adapters only translate provider input. They do not classify documentation or
  source policy, so a future provider can add one parser without duplicating conformance rules.
  Date/Author: 2026-07-27 / Codex implementation worker

- Decision: Test repository-ruleset behavior through a typed `gh` process boundary and leave real
  ruleset application to the orchestrator.
  Rationale: The command needs deterministic local coverage without changing remote repository
  administration state. The implementation worker's bounded scope excludes that external mutation.
  Date/Author: 2026-07-27 / Codex implementation worker

- Decision: Treat root and declared special indexes as global documentation invariants during
  changed-file analysis.
  Rationale: A changed root index can disconnect an unchanged target, so filtering those findings
  by the changed file path hides a real regression.
  Date/Author: 2026-07-27 / Codex implementation worker

- Decision: Validate provider event paths through their physical filesystem location before using
  their lexical repository-relative form.
  Rationale: `..` checks do not identify symlink escapes. Resolving the target, or its nearest
  existing parent for deleted and new paths, rejects every out-of-repository event consistently.
  Date/Author: 2026-07-27 / Codex implementation worker

- Decision: Supersede the prior authorization and separate exact-revision orchestration from its
  nonrecursive target gate.
  Rationale: A gate cannot safely include an integration test that launches that same gate.
  Explicit command layering preserves full local and CI coverage while making one pushed-revision
  check finite and testable.
  Date/Author: 2026-07-27 / Codex orchestrator

- Decision: Authorize implementation of exact recovery-plan revision
  `cecfc0c8ede4c9493b50193bf76edbd321d49a8f`.
  Rationale: The operator instructed Codex to read the reset handoff and continue after the
  clean-room review approved that exact commit with no P0, P1, or P2 findings.
  Date/Author: 2026-07-28 / Brandon and Codex orchestrator

- Decision: Own one bounded, disk-backed verification namespace with durable reconciliation.
  Rationale: Process-finally cleanup cannot run after SIGKILL or reboot, and RAM-backed `/tmp`
  multiplies the impact of a runaway checkout. A lock, manifest, path validation, one-worktree
  bound, and explicit reconciler make interruption recoverable without risking agent worktrees.
  Date/Author: 2026-07-27 / Codex orchestrator

- Decision: Use exact operator responses in the active Mandem conversation instead of GitHub review
  approvals.
  Rationale: The repository has one GitHub account, so GitHub code-owner or latest-push approval
  requirements cannot be satisfied. An exact `APPROVED` or `DENIED` response can authorize one
  stated immutable target, while the orchestrating agent records the decision in the native issue
  before acting.
  Date/Author: 2026-07-28 / Brandon and Codex orchestrator

## Outcomes & Retrospective

Planning produced a self-contained U1A design based on the pinned Pier Docs and Nucleus mechanisms.
It centralizes policy, fails closed in non-interactive execution, avoids hook mutations, and
supports both agent vendors. The operator authorized implementation of the exact reviewed revision
on 2026-07-27.

Milestone 5 is complete. Versioned hooks evaluate the staged snapshot before commits and selected
commit snapshots before pushes. The installer confines `.githooks` to the selected worktree while
preserving a prior common hook path in sibling worktrees.

Work item `5717221` is resolved, the post-U1C clean-room review passed, and the operator approved the
earlier plan revision. This material approval-contract revision supersedes that authorization, so
implementation is paused pending fresh review and exact approval.

Milestone 6 is complete. The shared `authoring:check` command checks one path without editing it;
Claude and Codex configurations call thin PostToolUse adapters that normalize provider events and
invoke that shared policy. Focused tests and disposable live-provider probes verify feedback and
failure boundaries. Milestone 7 remains.

Milestones 1–3 now provide pure deterministic policies and repository adapters. The focused policy,
snapshot, CLI, and existing architecture suite passes 31 tests. The next implementation worker can
build the README navigation baseline in Milestone 4; the full documentation audit already passes
against the current checked-out baseline, but `bun run check` will include the new checks only in the
later package-gate integration milestone.

The local Milestone 7 work is complete. `bun run check` now runs the documentation and
authored-source checks before the existing architecture, TypeScript, lint, and test stages. The
repository includes the required workflow, code-owner map, and tested GitHub ruleset command. The
remaining Milestone 7 work requires repository-administration access and hosted workflow evidence;
the orchestrator owns those actions.

Validated review repairs are complete locally. Documentation evaluation now requires the root
README and checks dynamic skill, script, hook, and module indexes. Changed-revision analysis retains
global-index failures. Provider adapters reject physical symlink escapes, pre-push combines paths
for duplicate outgoing commits, and the detached revision checker returns `1` for a failing quality
gate and `2` for setup or cleanup failures. A disposable integration test proves that exact-revision
behavior, a dirty caller checkout, and successful cleanup on both passing and failing gates.

The P0 revision-check recovery is implemented and verified. `bun run check` passes 61 tests, and
`bun run check:revision -- "$(git rev-parse HEAD)"` launches one detached checkout, runs the
nonrecursive 60-test target suite, removes the transaction, and exits successfully. Remaining U1A
work is the hosted workflow and review handoff described in Milestone 7.

The first live ruleset design assumed a second GitHub account could approve the last push and
code-owner changes. Mandem has one operator account. This revision removes GitHub approval
requirements, keeps pull requests and `repository-quality` mandatory, and defines exact
conversation responses recorded in native issues as the operator consent mechanism. The material
change supersedes prior execution authorization and requires fresh review and exact approval.

Superseded operator approval note (2026-07-27): Brandon approved exact earlier plan revision
`148819ea580606ed2be81a5bec58072471da9dba`, which set `execution_authorized: true` at that time.
The current material revision supersedes that approval and has `execution_authorized: false`; the
earlier decision has no current execution effect.

Post-U1C revalidation note (2026-07-27): Rebased the plan's assumptions on merge
`27d4abe1a2815bfef1bec56c71bc6d90880ef035`. The corrected kernel already owns authored-source
scope helpers and `ARCH-UNSCOPED-TYPESCRIPT`, so this revision requires U1A to preserve and derive
those surfaces from the new manifest. Added explicit focused regression commands for the corrected
architecture rules and package entrypoints. This instruction change supersedes the 2026-07-25
clean-room approval; `execution_authorized` remains false.

Single-operator approval revision note (2026-07-28): Replaced the unsatisfiable GitHub code-owner
and latest-push approval requirements with an exact `APPROVED` or `DENIED` response in the active
Mandem conversation. The orchestrating agent records that decision against one immutable target in
the native issue before acting. GitHub continues to require a pull request and the
`repository-quality` check.

Approval-verification repair note (2026-07-28): Defined exact `execute-plan`, `apply-ruleset`, and
`merge-pr` target schemas; canonical serialization and ancestry selection; approval-record audit
publication; ruleset implementation binding; and commands that perform zero GitHub writes unless
the current native approval matches the exact live action target.

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

Final document-review note (2026-07-25): Corrected the stale next-planning-action summary so it
matches the current `Progress` state: the registry and U2 dependency update are already complete;
clean-room re-review and operator approval remain.

Clean-room approval note (2026-07-25): The final reviewed content is commit `a4a5c11`, SHA-256
`378cf11ff6f27d50d4c789a67a9e3cf135ec7f3a4d5e08cceec9bf12ef7a7bc6`. The durable review lives
at `docs/plans/reviews/2026-07-25-u1a-clean-room.md`. Language and policy changes later superseded
that review; implementation remains unauthorized.

Clean-room refresh note (2026-07-25): A fresh Terra reviewer approved the plan version in commit
`b73e9607897f45a52b4d1beb49b93ecbcfe4d218`, SHA-256
`2a2d1dd72869bdde93d5318626e56084ac12ff890da61eccfadf5390d1b48339`. The reviewer found no
P0/P1 blockers. The durable verdict is
`docs/plans/reviews/2026-07-25-u1a-clean-room-refresh.md`; implementation remains unauthorized.

Implementation note (2026-07-27): Completed Milestones 1–3 without adding README baseline files,
Git hooks, provider adapters, workflow configuration, or ruleset configuration. Recorded the
post-plan shared operating contract and generated provider metadata scope decision above. The next
approved milestones remain 4–6.

Milestone 6 implementation note (2026-07-27): Added the shared post-write command, private Claude
and Codex event parsers, exact project configurations, focused event fixtures, a provider-hook
maintenance guide, and recorded disposable probe evidence. The Claude probe used installed
version `2.1.220`; the plan's required `2.1.219` behavior remains compatible. No Milestone 7
workflow, CODEOWNERS, ruleset, or canonical-gate integration was added.

Milestone 7 local implementation note (2026-07-27): Added the deterministic canonical package
gate, the `repository-quality` workflow, code-owner entries for all D7 gate paths, and the
repository-ruleset apply/check command with process-boundary tests. This update records completed
local work and explicitly leaves the authorized external ruleset mutation, hosted workflow proof,
review, Learn, and PR work to the orchestrator.

P0 recovery revision note (2026-07-27): Superseded the prior authorization after GitHub issue #17
proved that the approved revision-check design was recursive and depended on `finally` cleanup in
RAM-backed `/tmp`. Replaced that contract with a nonrecursive target gate, one disk-backed
checker-owned namespace, an operating-system advisory lock, transactional manifest and ownership
marker, explicit crash reconciliation, filesystem-type rejection, an 8 GiB run cap, a 2 GiB
free-space reserve, child timeouts, checker-owned subprocess temporary variables, and adversarial
no-collateral cleanup tests. Implementation remains unauthorized until this exact revision passes
clean-room review and receives operator approval.

P0 recovery clean-room note (2026-07-27): A fresh reviewer approved plan-content SHA-256
`f8c58462bf7b8f6a2fd4325023fb20e715005dc5d66237e29d21e48228f86580` with no P0, P1, or P2
findings. The durable verdict is
`docs/plans/reviews/2026-07-27-u1a-p0-recovery-clean-room.md`. This metadata and living-record
update does not alter the reviewed implementation contract; `execution_authorized` remains false.

P0 recovery authorization note (2026-07-28): Brandon instructed Codex to read the U1A reset
handoff and continue, authorizing exact reviewed commit
`cecfc0c8ede4c9493b50193bf76edbd321d49a8f`. This update sets
`execution_authorized: true` and records the authorization without changing the reviewed
implementation contract.
