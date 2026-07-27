# Repository hooks

Mandem runs the same authoring policy through provider feedback, Git hooks, and repository checks.
Provider feedback is fast but optional. Git hooks and `bun run check` determine whether a change
conforms.

Run `bun run authoring:check -- <repository-relative-path>` after writing a TypeScript, TSX,
Markdown, YAML, or YML file. The command does not edit files. It checks TypeScript with ESLint,
the architecture policy, and TypeScript; it checks documentation against the documentation policy.

Claude Code reads `.claude/settings.json` and runs the shared post-write adapter after Write, Edit,
or MultiEdit. Codex reads `.codex/hooks.json` and runs it after Edit, Write, or `apply_patch`.
Trust project-local Codex hooks through `/hooks`. Use `--dangerously-bypass-hook-trust` only in a
disposable automated probe.

Install versioned Git hooks in the current worktree with `bun run hooks:install`. Check that
worktree's setting with `bun run hooks:check`. Installation does not change global Git settings.

GitHub runs the `repository-quality` check for pull requests and for pushes to `main` and `staging`.
Repository administrators can verify the required `main` protection with
`bun run repository-ruleset:check`. They can create or update that protection with
`bun run repository-ruleset:apply`; the command requires an authenticated GitHub CLI session with
repository administration permission.
