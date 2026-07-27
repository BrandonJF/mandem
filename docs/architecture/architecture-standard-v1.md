# Mandem architecture standard v1

Mandem modules live below `src/modules/<lowercase-kebab-name>/`. Every module contains `domain`, `application`, `infrastructure`, `api`, `tests/fakes`, `README.md`, a root `index.ts`, `domain/types.ts`, and `api/composition.ts`.

Domain contains pure policy and types. Application coordinates domain policy through ports. Infrastructure performs input/output. API composition selects adapters. A module root barrel exports only stable domain, application, and API surfaces; it never exports infrastructure. One module may use another only through `@/modules/<name>`.

The deterministic checker enforces stable `ARCH-*` IDs: module shape and naming; domain/application dependency direction; cross-module barrel imports; infrastructure root-barrel exclusion; IO placement; `@fileoverview`; explicit-`any` exclusion; unscoped TypeScript paths; mechanically detectable domain-entity placement; and physical component/hook/state limits. It sorts findings by rule ID, path, then message. Exit code 0 means conformant, 1 means findings, and 2 means checker failure.

The checker reads every TypeScript candidate except files in `.git`, `node_modules`, `dist`, `coverage`, `generated`, `vendor`, and `vendored`. It excludes declaration files and files below `tests/fixtures/`. Included authored source is `src/`, `scripts/`, `tests/`, and root `*.config.ts` or `*.config.tsx` files. Included authored source needs a file overview and cannot use explicit `any`. Other collected TypeScript files receive `ARCH-UNSCOPED-TYPESCRIPT`. Production dependency, module-shape, and IO rules apply only to `src/` production files.

IO includes the declared Node built-ins, `@octokit/rest`, `Bun.connect`, `process.stdin`, and `process.stdout.write`. These operations are allowed only in infrastructure, an exact `api/composition.ts` file, or the two entrypoints. The checker ignores the same tokens in comments and literal text while retaining executable template expressions.

The package declares `prepack: bun run build` and publishes only `dist`, `README.md`, and `LICENSE`. The package contract test packs a clean `git archive` of a committed SHA, verifies both executable paths in the tarball, installs it into an empty Bun consumer, and invokes both installed commands.

This is an adaptation of Nucleus sources at commit `7265e19cb24cf9e86c3facbd91326227dfa05dd1`, not a copied framework. Mandem deliberately removes Nucleus package-manager commands, absolute paths, application-specific Prisma/tRPC assumptions, and legacy UI layering.
