# Mandem architecture standard v1

Mandem modules live below `src/modules/<lowercase-kebab-name>/`. Every module contains `domain`, `application`, `infrastructure`, `api`, `tests/fakes`, `README.md`, a root `index.ts`, `domain/types.ts`, and `api/composition.ts`.

Domain contains pure policy and types. Application coordinates domain policy through ports. Infrastructure performs input/output. API composition selects adapters. A module root barrel exports only stable domain, application, and API surfaces; it never exports infrastructure. One module may use another only through `@/modules/<name>`.

The deterministic checker enforces stable `ARCH-*` IDs: module shape and naming; domain/application dependency direction; cross-module barrel imports; infrastructure root-barrel exclusion; IO placement; `@fileoverview`; explicit-`any` exclusion; mechanically detectable domain-entity placement; and physical component/hook/state limits. It sorts findings by rule ID, path, then message. Exit code 0 means conformant, 1 means findings, and 2 means checker failure.

This is an adaptation of Nucleus sources at commit `7265e19cb24cf9e86c3facbd91326227dfa05dd1`, not a copied framework. Mandem deliberately removes Nucleus package-manager commands, absolute paths, application-specific Prisma/tRPC assumptions, and legacy UI layering.
