# Repository scripts

This directory contains Bun entrypoints for repository maintenance and validation. Start with
`bun run check` for the complete local quality gate.

- [Hook scripts](./hooks/README.md) documents the versioned Git hooks and post-write adapters.

Run `bun run repository-ruleset:check` to read the GitHub protection rules that apply to `main`.
Repository administrators can run `bun run repository-ruleset:apply` to create or update the
required ruleset through the GitHub CLI.

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
