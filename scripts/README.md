# Repository scripts

This directory contains Bun entrypoints for repository maintenance and validation. Start with
`bun run check` for the complete local quality gate.

- [Hook scripts](./hooks/README.md) documents the versioned Git hooks and post-write adapters.

Run `bun run repository-ruleset:check` to read the GitHub protection rules that apply to `main`.
Repository administrators can run `bun run repository-ruleset:apply` to create or update the
required ruleset through the GitHub CLI.
