# Mandem

Mandem orchestrates bounded agent sessions through durable, observable workflows.

Run `bun run check` to validate the repository, then run `bun run build` to create the two
executables.

## Repository guides

- [Agent instructions](./AGENTS.md) and [Claude instructions](./CLAUDE.md) point every supported
  harness to the shared [operating contract](./.agents/OPERATING.md).
- [ExecPlan rules](./PLANS.md) describe how Mandem authors and executes implementation plans.
- [Documentation](./docs/README.md) indexes all maintained Mandem documentation.
- [Architecture](./docs/architecture/README.md) describes the system and repository rules.
- [Development](./docs/development/README.md) explains documentation and source-authoring practice.
- [Operations](./docs/operations/README.md) records process and provider evidence.
- [Plans](./docs/plans/README.md) indexes the epic plan and issue ExecPlans.
- [Scripts](./scripts/README.md) describes repository-maintenance entrypoints.
- [Git hooks](./.githooks/README.md) reserves the location for versioned Git hook entrypoints.
- [Modules](./src/modules/README.md) indexes the module-level architecture documentation.

## Agent workflow

The shared operating contract routes agents to [clear writing](./.agents/skills/write-clearly/SKILL.md)
and [git-native issue tracking](./.agents/skills/track-git-native-issues/SKILL.md). The
[agent vendor-neutrality principle](./docs/architecture/agent-vendor-neutrality.md) explains why
repository rules live in shared documents, skills, commands, and checks rather than in a single
vendor's configuration.

## Issue graph workflow

Git-native issue refs store the issue graph. Every managed issue uses a full UUID, and each issue
ExecPlan repeats that UUID, its epic UUID, and its direct dependency UUIDs so `bun run
issue-graph:check` can reject disagreement offline. GitHub issue numbers are provider mappings;
they are not portable issue identity.

Run `git issue merge origin` before local work, then run `bun run issue-graph:check`. Use `bun run
issue-graph:remote:check` for a read-only GitHub comparison. The separate `bun run
issue-graph:remote:sync -- --approval-issue <uuid>` command records a complete native transaction
and prints its exact approval target. Its `--apply` mode requires a matching conversation approval,
changes only the declared GitHub fields, and can be repeated safely after interruption.
