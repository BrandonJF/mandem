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
