# Repository scripts

This directory contains Bun entrypoints for repository maintenance and validation. Start with
`bun run check` for the complete local quality gate.

- [Hook scripts](./hooks/README.md) documents the versioned Git hooks and post-write adapters.

Run `bun run repository-ruleset:check` to read the GitHub protection rules that apply to `main`.
Repository administrators can run `bun run repository-ruleset:apply` to create or update the
required ruleset through the GitHub CLI.

Run `bun run plan-review:choices -- --failed-verdicts <count> --permits-used <count>` before
dispatching or requesting another clean-room plan review. It prints the choices allowed by the
retained issue's complete review history.

## Native issue graph

- `bun run issue-graph:check` validates native issue metadata and matching ExecPlan frontmatter
  without network access.
- `bun run issue-graph:native:apply -- --file <manifest>` previews one complete native metadata
  transaction. Add `--approval-issue <uuid> --apply` only after recording approval of the exact
  graph digest, issue-ref baseline digest, and implementation commit. A repeat must report zero
  commits and zero pushes.
- `bun run issue-graph:remote:check` reads GitHub and reports managed state, label, milestone, and
  parent/subissue drift. It never writes GitHub or native refs.
- `bun run issue-graph:remote:sync -- --approval-issue <uuid>` publishes or reuses one immutable
  native projection transaction and prints its approval target. Add `--apply` only after recording
  approval of that exact target. A retry verifies the completed operation prefix from GitHub and
  applies only the exact remaining suffix.

The projection commands preserve issue bodies, comments, assignees, projects, and labels outside
the epic's managed label set. They never invoke repository-wide `git issue sync`.

## Local repository quality

Run `bun run ci:local -- <PR-number> <full-head-SHA>` from a Mandem checkout.
The reporter verifies the PR head, fetches through SSH, creates a clean detached
worktree, and runs the workflow's frozen install, `bun run check` (including tests),
`bun run build`, and `git issue fsck`. It requires Bun 1.3.14, git-issue 1.3.3 and the
existing authenticated `gh` login. It posts the completed success or failure as
`repository-quality` through `gh api`; it never changes settings or merges a PR.
Logs remain under `~/.local/state/mandem/local-ci/`, and the reporter prints the path.
A status-posting error exits unsuccessfully. An interrupted run cannot post success.
The reporter checks the exact commit supplied even if the PR later advances; a new
head needs a new run. The orchestration owner checks the result and local log before
merging. This is the bounded first slice of issue #49; Actions-runner registration
and host setup remain separate work with the user's token and host authorization.

The local reporter strips GitHub token environment variables from repository
commands and redacts known credential values and GitHub token patterns in retained
output. It verifies the requested HEAD and tracked sources again after all checks.
It rejects temporary filesystem paths, including symlinks and tmpfs, before it
creates logs or scratch. Install with `bun install --frozen-lockfile` before
running its focused tests with `bunx vitest run
src/modules/architecture-standard/tests/local-quality-reporter.test.ts`.
