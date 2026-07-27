# Mandem

Mandem orchestrates bounded agent sessions through durable, observable workflows.

Agent entry files point to the shared [operating contract](./.agents/OPERATING.md). The contract
routes every supported agent to the same repository skills, including
[clear writing](./.agents/skills/write-clearly/SKILL.md) and
[git-native issue tracking](./.agents/skills/track-git-native-issues/SKILL.md).

Run `bun run check` to validate this repository, then `bun run build` to create the two bounded executables.

See the [U1C engineering process audit](./docs/operations/2026-07-27-u1c-engineering-process-audit.md)
for the agents, skills, commands, decisions, and review loops used during one Codex session.
