# Coordination

This module ports Strategy Builder Pro's topic message bus, session registry and TTL
merge lock into Mandem. SQLite stores require Bun 1.3.14 and no database server.
The initial ports and their 27 tests come from its `scripts/agents/coord-service/`;
Strategy Builder Pro retains its unchanged copy until consumers migrate.

Application ports preserve the existing method and message shapes. Infrastructure
provides SQLite persistence. The API composes adapters for the CLI and local service.

Delivery and operational readiness are tracked in
[issue #51's living plan](../../../docs/coordination-plan-51.md).
