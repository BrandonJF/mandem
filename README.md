# Mandem

Mandem orchestrates bounded agent sessions through durable, observable workflows.

Agents use the [write-clearly skill](./.agents/skills/write-clearly/SKILL.md) before communicating
or writing prose in this repository. They use the
[git-native issue skill](./.agents/skills/track-git-native-issues/SKILL.md) to find active work and
keep its status current.

Run `bun run check` to validate this repository, then `bun run build` to create the two bounded executables.

See the [U1C engineering process audit](./docs/operations/2026-07-27-u1c-engineering-process-audit.md)
for the agents, skills, commands, decisions, and review loops used during one Codex session.
