# Agent vendor neutrality

## Principle

Mandem owns its engineering process. Claude, Codex, and future agent harnesses are replaceable
interfaces to that process.

Shared instructions therefore belong in repository-owned documents, skills, commands, and checks.
Vendor entry files and hooks may help a harness discover or invoke those shared resources, but they
must not define a separate operating policy.

## Why

Putting the complete contract in `CLAUDE.md`, a Codex configuration file, or another vendor-owned
entry point creates several problems:

- agents receive different instructions depending on the harness that starts them;
- a change to the engineering process must be copied across files and can drift;
- replacing or adding a harness requires reconstructing policy from vendor-specific configuration;
- reviewers cannot identify one authoritative place for shared behavior.

A shared contract with thin discovery adapters gives every harness the same rules while preserving
the small amount of integration each harness may require.

## Placement test

Before adding agent-facing behavior, ask:

1. Would this rule still apply if the repository changed agent vendors?
2. Does it describe Mandem's process, authorization, quality standard, or work state?
3. Can multiple harnesses follow it without translation?

If any answer is yes, place the behavior in a shared document, skill, command, or check. Point to it
from the relevant entry file when discovery is necessary.

Use vendor-specific configuration only for a capability that the harness itself requires, such as
an event payload adapter or permission setting. Keep the integration thin and route it to shared
behavior. A vendor adapter must not weaken, replace, or duplicate the repository policy.

## Repository structure

- `.agents/OPERATING.md` is the shared agent operating contract.
- `.agents/skills/` contains reusable procedures selected for particular work.
- `PLANS.md` governs ExecPlans.
- `AGENTS.md` and `CLAUDE.md` are equivalent discovery adapters.
- Provider-specific hooks and settings translate harness events into shared commands.

The shared resource is authoritative when an adapter and shared policy disagree. Correct the
adapter rather than introducing vendor-specific process behavior.
