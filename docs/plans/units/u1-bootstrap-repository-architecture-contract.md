---
title: "U1: Bootstrap the standalone repository and architecture contract"
plan_kind: mandem-child-execplan
program_unit: U1
parent: ../2026-07-21-001-feat-mandem-plan.md
promotion: executable
execution_authorized: true
date: 2026-07-24
---

# U1: Bootstrap the Standalone Repository and Architecture Contract

This child ExecPlan is a living document governed by the repository-root `PLANS.md`. Read that file in full and maintain this document in accordance with it. Keep `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` current during execution. No implementation may begin until this revision passes clean-room review and receives exact operator approval.

## Purpose / Big Picture

Create Mandem's publishable Bun/TypeScript foundation and make Mandem the first repository governed by its own Nucleus-derived architecture standard.

U1 is complete when a fresh checkout can install with Bun, build the `mandem` and
`mandem-server` executables, and deterministically reject malformed architecture fixtures while
accepting Mandem's real module skeleton. Docker runtime, Compose, server health behavior, durable
processing, and local transport belong to U3.

## Context and Orientation

The program orchestrator uses `docs/plans/2026-07-21-001-feat-mandem-plan.md` to promote and
sequence work. This child ExecPlan is the sole implementation-worker authority for U1 and embeds
the program constraints U1 needs. U1 implements only the repository bootstrap and
architecture-contract boundary. It must not implement lifecycle state, SQLite persistence,
Docker runtime, provider adapters, tmux orchestration, Mandem work-item behavior, or the TUI.

U1 produces the architectural and repository substrate consumed by every later unit. Any later child ExecPlan that conflicts with U1's actual published interfaces must be revised and re-reviewed before promotion.

A “module” is a cohesive business capability under `src/modules/<module>/`. “Domain” is pure
business policy and data. “Application” coordinates use cases through interfaces called ports.
“Infrastructure” implements those ports using files, processes, databases, networks, or other
input/output. “API” is the composition boundary that wires concrete adapters to application use
cases. A “barrel” is an `index.ts` file that defines what a directory or module publicly exports.
A “composition root” is the one place where concrete infrastructure is selected and assembled.
A “stable rule ID” is a versioned identifier whose meaning and ordering do not change accidentally,
so baselines and automation can compare findings across runs.

## Requirements Trace

- Master R13-R19a: U1 supplies only the root `AGENTS.md`/`CLAUDE.md` discovery contract and
  architecture source needed to govern Mandem's own bootstrap. U5 owns the committed
  `.mandem/operating-docs/` source tree, deterministic compiler, bounded runtime prompts, and
  session-provenance hashes required for full R19/R19a completion.
- Master R43-R46: U1 provides the standalone open-source package boundary, explicit license and
  attribution, and `docs/architecture/consumer-integration-contract.md`. U8 owns the first actual
  SBP installation/migration and its public evidence; U1 must not modify SBP.
- Master R58-R64: prescriptive TypeScript web-app architecture, Nucleus precedence, self-conformance, architecture analysis, and TDD enforcement.
- Master R68: Linux-first v1.
- Master R7-R9: U1 records the installed Claude Code and Codex CLI versions and probes the
  provider capabilities that constrain U2's protocol; U5 still owns production adapters.
- Master KTD1: one Bun package, two executables, clean modules.
- Master KTD10: `git-native-issue` remains a pinned external executable behind a port.
- Master KTD12: TDD and architecture rules are executable mechanisms.
- Master KTD14: no engineer dispatch before this child plan is reviewed and approved.

## Resolved Inputs

- Public repository: `BrandonJF/mandem`.
- Package and executable name: `mandem`; the npm coordinate was unclaimed when checked on 2026-07-24.
- Mandem license: MIT.
- `git-native-issue`: external host executable pinned to `v1.3.3`, GPL-2.0, not copied, forked, linked, vendored, or bundled into Mandem's package or image.
- Worker default: `gpt-5.6-terra` with medium reasoning through project-local Codex configuration.
- Codex permission default: full access with no approval prompts for this trusted project.
- Mandem v1 does not ship a module generator. Nucleus generator behavior and tests are evidence for the architecture standard and fixtures only.
- Initial tool constraints follow the first consumer repository: TypeScript `^5.8.3`, ESLint and
  `@eslint/js` `^9.32.0`, `typescript-eslint` `^8.56.1`, and Vitest `^4.1.9`. `bun.lock` records
  the exact resolved dependency graph used for U1 verification.
- Bun runtime is pinned to `1.3.14` in package metadata and `.bun-version`.
- Reference provider versions at planning time are Claude Code `2.1.219` and Codex CLI `0.145.0`.
  U1 records the actual installed versions and capability evidence rather than assuming these
  observations remain current.
- Nucleus architecture provenance is pinned to repository commit
  `7265e19cb24cf9e86c3facbd91326227dfa05dd1`. U1 must normalize the required rules into Mandem;
  completed Mandem work must not depend on an ambient Nucleus checkout.
- The external `git-native-issue` executable is not currently installed on the reference host. U1
  must install or otherwise make the pinned v1.3.3 executable available before its first
  implementation commit, create the U1 work item, and record this child-plan path in that ledger.

## Architecture Source Precedence

Normalize the target standard from these sources in order:

1. Nucleus `docs/development/module-creation-guide.md`
2. Nucleus `docs/development/use-case-architecture-guide.md`
3. Non-conflicting rules from Nucleus `docs/development/clean-architecture-rules.md`
4. Nucleus `scripts/create-module.test.ts` and `scripts/create-module.ts` as executable examples of expected structure
5. The Mandem master ExecPlan where it intentionally strengthens portability, Bun usage, or self-conformance

When sources conflict, record the resolution in this plan's Decision Log and in the versioned architecture-standard documentation. Do not reproduce Nucleus's package-manager commands, absolute paths, app-specific Prisma/tRPC assumptions, or legacy three-layer UI framing as universal Mandem rules.

## Key Technical Decisions

### D1. Mandem is a single package with two thin entrypoints

`src/cli/main.ts` and `src/server/main.ts` are composition/presentation roots only. They parse process inputs, build module compositions, invoke application surfaces, render results, and select exit codes. They do not own business rules or direct persistence.

`package.json` exposes `mandem` and `mandem-server` bin entries. U1 supplies only bounded
version/help behavior needed to prove packaging; later commands belong to their owning units.

### D2. U1 creates two self-conforming modules

- `architecture-standard`: owns rule definitions, violations, analysis use cases, filesystem inspection ports/adapters, public report surfaces, and the deterministic checker.
- `runtime`: owns the minimal process identity and version contract shared by both entrypoints; U2
  expands this module with lifecycle and persistence behavior.

Each module starts with:

```text
src/modules/<module>/
  README.md
  index.ts
  domain/
    index.ts
    types.ts
    errors/
    repositories/
    services/
  application/
    index.ts
    use-cases/
  infrastructure/
    index.ts
    repositories/
    services/
  api/
    index.ts
    composition.ts
  tests/
    fakes/
    fixtures/
    utils/
```

UI-only folders are not created until a real UI unit needs them. Empty placeholder code files are avoided; required directories may use fixture documentation or `.gitkeep` only when Git preservation is necessary.

### D3. The root barrel excludes infrastructure

Normal consumers import the stable domain/application/API surface through `@/modules/<name>`. Infrastructure is imported only by explicit composition roots within the owning module or top-level entrypoint. Cross-module deep imports are forbidden.

### D4. Architecture rules are data with stable identifiers

The checker returns typed violations with stable rule IDs, severity, repo-relative path, message, and optional symbol/context. Human rendering is concise and deterministic. U1 need not implement the later TOON result envelope, but its domain result must be adaptable without changing rule semantics.

The v1 rule catalog is normative:

| Rule ID | Applies when | Required behavior |
| --- | --- | --- |
| `ARCH-MODULE-NAME` | a directory directly under `src/modules/` | name is lowercase kebab-case |
| `ARCH-MODULE-DOMAIN` | every module | `domain/` exists |
| `ARCH-MODULE-APPLICATION` | every module | `application/` exists |
| `ARCH-MODULE-INFRASTRUCTURE` | every module | `infrastructure/` exists |
| `ARCH-MODULE-API` | every module | `api/` exists |
| `ARCH-MODULE-README` | every module | `README.md` exists |
| `ARCH-MODULE-ROOT-BARREL` | every module | root `index.ts` exists |
| `ARCH-DOMAIN-TYPES` | every module | `domain/types.ts` exists |
| `ARCH-API-COMPOSITION` | every module | `api/composition.ts` exists |
| `ARCH-MODULE-TESTS` | every module | `tests/` exists |
| `ARCH-MODULE-TEST-FAKES` | every module | `tests/fakes/` exists |
| `ARCH-DOMAIN-DEPENDENCY` | authored domain imports | domain does not import application, infrastructure, API, UI, or IO packages |
| `ARCH-APPLICATION-DEPENDENCY` | authored application imports | application imports only domain and application-owned ports |
| `ARCH-CROSS-MODULE-DEEP-IMPORT` | one module imports another | import resolves through `@/modules/<name>` only |
| `ARCH-INFRASTRUCTURE-ROOT-EXPORT` | a module root barrel | infrastructure is not re-exported |
| `ARCH-IO-PLACEMENT` | filesystem, process, network, database, or vendor IO import | IO exists only in infrastructure, API composition, approved scripts, or thin top-level entrypoints |
| `ARCH-FILEOVERVIEW` | authored TypeScript source | file begins with an `@fileoverview` comment |
| `ARCH-NO-EXPLICIT-ANY` | authored TypeScript source | no explicit `any` type |
| `ARCH-DOMAIN-ENTITY-PLACEMENT` | mechanically detectable exported domain entity | entity is declared in `domain/types.ts` |
| `ARCH-COMPONENT-SIZE` | authored non-barrel module component | no more than 150 physical lines |
| `ARCH-HOOK-SIZE` | authored non-barrel module hook | no more than 200 physical lines |
| `ARCH-COMPONENT-STATE` | authored module component | fewer than five direct `useState(` calls |

Every malformed fixture asserts its exact rule ID, repo-relative path, and concise message
fragment. Results sort by rule ID, then path, then message. The checker exits `0` for no
violations, `1` for architecture violations, and `2` for configuration, traversal, parse, or
unexpected tool failure.

Physical-line counting includes blank and comment lines, excludes generated files, fixtures,
vendored files, and `index.ts`/`index.tsx` barrels, and uses LF-normalized text. Other SRP judgments
that cannot be made reliable from static repository evidence in U1 remain documented guidance, not
heuristic failures.

### D5. The checker uses clean architecture itself

- Domain: rule definitions, repository-file model, violations, paths, and pure rule evaluation.
- Application: analyze-repository use case depending on a repository-tree port.
- Infrastructure: filesystem tree reader and source-text adapter.
- API: composition and report surface.
- Script: a thin wrapper that invokes the composition and renders/returns the exit status.

### D6. Repository checks have one canonical entrypoint

`bun run check` runs architecture, typecheck, lint, and tests in a deterministic fail-closed order. Individual commands remain available for focused work. Bun is the only package/runtime command documented or encoded.

### D7. Runtime packaging proof stays minimal

U1 builds and invokes both executable artifacts only far enough to prove their package entrypoints,
version output, and help output. It does not create a running server, health endpoint, Dockerfile,
or Compose configuration. U3 owns those files and behaviors so the Docker lifecycle has one unit
owner.

### D8. Planning artifacts are first-class repository content

The program ExecPlan, child registry, all U1-U10 scaffolds, and `PLANS.md` are committed in the initial repository history. No worker is dispatched from a scaffold.

## Files

### Create

- `.codex/config.toml`
- `.bun-version`
- `.gitignore`
- `AGENTS.md`
- `CLAUDE.md`
- `LICENSE`
- `README.md`
- `PLANS.md`
- `package.json`
- `bun.lock`
- `tsconfig.json`
- `eslint.config.ts`
- `vitest.config.ts`
- `docs/architecture/mandem-system.md`
- `docs/architecture/architecture-standard-v1.md`
- `docs/architecture/third-party-attribution.md`
- `docs/architecture/consumer-integration-contract.md`
- `docs/sources/doctrine-source-manifest.yaml`
- `docs/operations/provider-capability-baseline.md`
- `docs/plans/2026-07-21-001-feat-mandem-plan.md`
- `docs/plans/units/README.md`
- `docs/plans/units/u1-bootstrap-repository-architecture-contract.md`
- `docs/plans/units/u2-protocol-lifecycle-sqlite.md`
- `docs/plans/units/u3-server-docker-resident-reconciliation.md`
- `docs/plans/units/u4-work-items-plans-queue-gates-cli.md`
- `docs/plans/units/u5-operating-docs-provider-sessions.md`
- `docs/plans/units/u6-unattended-work-review-learn-merge.md`
- `docs/plans/units/u7-complete-cli-toon-opentui.md`
- `docs/plans/units/u8-sbp-install-architecture-baseline.md`
- `docs/plans/units/u9-restart-proof-sbp-release-candidate.md`
- `docs/plans/units/u10-observability-final-v1.md`
- `assets/architecture-standard/v1/**`
- `src/cli/main.ts`
- `src/server/main.ts`
- `src/modules/architecture-standard/**`
- `src/modules/runtime/**`
- `scripts/check-architecture.ts`
- `scripts/check-architecture.test.ts`
- `tests/contract/package-entrypoints.test.ts`
- `tests/contract/provider-capability-baseline.test.ts`

No application file from Strategy Builder Pro or Nucleus is copied into Mandem. Architecture prose is adapted with attribution; fixtures are independently expressed.

## Plan of Work

### Milestone 1: Establish the work ledger and planning authority

The reviewed planning baseline lands as Mandem's exceptional root commit on `main` because the
empty remote has no base branch for a pull request. It contains project-local Codex settings,
`PLANS.md`, the master ExecPlan, the child registry, and all ten scaffolds, with execution still
unauthorized. Before the first implementation commit, make the pinned external
`git-native-issue` v1.3.3 executable available, create U1's project-local issue, and record this
canonical child-plan path plus the approved revision. A fresh session must be able to reconstruct
why U1 is authorized without chat. Every U1 implementation change then uses a worktree branch and
pull request; no implementation is pushed directly to `main`.

Stage and inspect the exceptional planning root commit with the commands below. The staged-name
output must contain only the named planning paths; any `src/`, `tests/`, package, build, Docker,
runtime, generated, or quarantined prototype path aborts the commit.

    git add -- .codex/config.toml AGENTS.md CLAUDE.md PLANS.md docs/plans
    git diff --cached --name-only
    git diff --cached --check
    git commit -m "docs: establish Mandem planning authority"
    git push -u origin main
    git rev-list --max-parents=0 HEAD

If commit creation fails, correct only the planning files or index and repeat the checks. If the
commit succeeds but push fails, preserve it and retry only the push after fixing authentication or
connectivity. Never amend or replace the root commit after it is published.

After the baseline lands, create an authority-only branch and pull request that changes this plan
and the registry from `clean-room approved` to `executable`, sets `execution_authorized: true`, and
updates only living planning records. The true flag on an unmerged authority PR is a proposal, not
execution permission. Run clean-room review on that exact PR head, calculate this plan's SHA-256,
and obtain operator approval for that exact unchanged head. Record the root SHA, authority-PR head
SHA, plan hash, verdict, and approval in the U1 git-native issue, then merge the unchanged approved
head. Milestone 2 starts only after a new worktree verifies that merged revision and hash. Do not
combine implementation with the authorization PR.

### Milestone 2: Establish the test runner and red architecture proof

Create only the package, TypeScript, Vitest, and path-alias configuration needed to execute a
focused test, then run `bun install`. Write the architecture-checker contract test and
malformed/conformant fixtures before rule implementation. The first module-not-found run may prove
that the harness is wired, but it is bootstrap evidence and is not the red proof. Add the smallest
compile-only public API seam that returns an empty violation list and contains no rule logic. Run
the focused test again and capture the meaningful failure: the malformed fixture expected its
stable rule ID but received `[]`. That assertion failure is the official red evidence. Implement
only the first rule required to make it green, then continue rule-by-rule.

### Milestone 3: Implement the pure rule kernel and repository-tree port

Add domain rule types and pure evaluators, then the application use case. Keep filesystem behavior behind the port and drive the kernel with in-memory fixtures first.

### Milestone 4: Add filesystem analysis and thin script

Implement the infrastructure reader, API composition, deterministic report rendering, and thin `scripts/check-architecture.ts` entrypoint. Prove malformed fixtures fail with stable IDs and conformant fixtures pass.

### Milestone 5: Make Mandem self-conforming

Create the `architecture-standard` and `runtime` module skeletons plus thin CLI/server entrypoints. Run the checker against Mandem itself. Any failure is fixed architecturally; no blanket ignore may exempt Mandem source.

### Milestone 6: Add provider baseline, package, and repository gates

Add Bun configuration, lint/type/test/check scripts, and bin build proof. The executables provide
only bounded version/help behavior in U1; server health, Docker image, and Compose health checks are
deliberately deferred to U3. Record the installed Claude Code and Codex versions and run a bounded,
non-mutating capability probe covering working-directory/instruction injection, full-access
permission mode, completion detection, interruption, read-only review, and fresh-session recovery.
U2 may not be promoted until this baseline shows how each required capability maps into the
provider-neutral protocol or records a blocking gap.

### Milestone 7: Verify and prepare the U1 PR

Run all U1 verification, perform independent architecture/code review, repair findings, record execution surprises, and open a PR. Merge only after the plan-defined gates pass or a separately recorded external-infrastructure exception is explicitly approved.

## Concrete Steps

Work from the Mandem repository root. Before implementation, confirm the approved plan and install
the pinned external work ledger:

    pwd
    git status --short
    sed -n '1,240p' AGENTS.md
    sed -n '1,260p' CLAUDE.md
    sed -n '1,240p' PLANS.md
    sed -n '1,$p' docs/plans/units/u1-bootstrap-repository-architecture-contract.md
    git issue version

If the last command does not report version 1.3.3, use a temporary directory outside the
repository, check out the upstream `v1.3.3` tag, run its `install.sh` with `$HOME/.local` as the
destination, ensure `$HOME/.local/bin` is on `PATH`, and rerun `git issue version`. Do not use an
unpinned `latest` installer. If installation cannot complete, record the failure in `Progress` and
stop before implementation.

    u1_gni_dir=$(mktemp -d)
    git clone --branch v1.3.3 --depth 1 \
      https://github.com/remenoscodes/git-native-issue.git "$u1_gni_dir"
    (cd "$u1_gni_dir" && ./install.sh "$HOME/.local")
    export PATH="$HOME/.local/bin:$PATH"
    git issue version

Create the U1 work item and initialize its durable issue chain before the first implementation
commit:

    git issue init origin
    git issue create "feat: bootstrap Mandem repository and architecture contract" \
      -m "Canonical ExecPlan: docs/plans/units/u1-bootstrap-repository-architecture-contract.md" \
      -l feat -l mandem -p high
    git issue ls --format full
    git issue fsck

Record the returned issue identifier in `Progress`. Then follow Milestones 2 through 6 in order,
updating the living sections after every stopping point. Use `bun` and `bunx` only. The
behavior-bearing architecture checker is test-first: run its focused test and capture a meaningful
red failure before implementing the smallest rule kernel that makes it green.

The authorization transition is:

1. Commit and push the reviewed planning baseline with `execution_authorized: false`.
2. Install/verify `git issue`, create the U1 issue, and record the root SHA and plan path.
3. Create a planning-only authorization branch and PR; change this plan/registry promotion
   metadata and living records only, including `execution_authorized: true`.
4. Clean-room review the exact PR head. Calculate its plan SHA-256, obtain operator approval for
   that exact head, and record the verdict, approval, head SHA, and plan hash in the issue without
   changing the PR head.
5. Merge that unchanged approved head and verify the merged file has the approved hash.
6. Create a new U1 implementation worktree from that merged revision. Only then start Milestone 2.

Acquire the pinned Nucleus source only for normalization and provenance:

    u1_nucleus_dir=$(mktemp -d)
    git clone --filter=blob:none --no-checkout \
      https://github.com/BrandonJF/nucleus.git "$u1_nucleus_dir"
    git -C "$u1_nucleus_dir" fetch --depth 1 origin \
      7265e19cb24cf9e86c3facbd91326227dfa05dd1
    git -C "$u1_nucleus_dir" checkout --detach \
      7265e19cb24cf9e86c3facbd91326227dfa05dd1
    git -C "$u1_nucleus_dir" rev-parse HEAD

Read the five pinned source files named by Architecture Source Precedence. Record their hashes with:

    sha256sum \
      "$u1_nucleus_dir/docs/development/module-creation-guide.md" \
      "$u1_nucleus_dir/docs/development/use-case-architecture-guide.md" \
      "$u1_nucleus_dir/docs/development/clean-architecture-rules.md" \
      "$u1_nucleus_dir/scripts/create-module.test.ts" \
      "$u1_nucleus_dir/scripts/create-module.ts"

Acquire the remaining doctrine inputs read-only at their pinned revisions. For private BrandonJF
repositories, authenticated Git access is expected; failure blocks manifest completion rather
than permitting an unpinned substitute.

    u1_sbp_dir=$(mktemp -d)
    git clone --filter=blob:none --no-checkout \
      https://github.com/BrandonJF/strategy-builder-pro.git "$u1_sbp_dir"
    git -C "$u1_sbp_dir" fetch --depth 1 origin \
      01677c0afcf6171515ec1e788e6bc64ca5310659
    git -C "$u1_sbp_dir" checkout --detach \
      01677c0afcf6171515ec1e788e6bc64ca5310659
    sha256sum "$u1_sbp_dir/CLAUDE.md" \
      "$u1_sbp_dir/docs/architecture/ADR.md"

    u1_pier_dir=$(mktemp -d)
    git clone --filter=blob:none --no-checkout \
      https://github.com/BrandonJF/pier-infra.git "$u1_pier_dir"
    git -C "$u1_pier_dir" fetch --depth 1 origin \
      7491afbf775ecad83f0c80c7a41a61950fa3dc07
    git -C "$u1_pier_dir" checkout --detach \
      7491afbf775ecad83f0c80c7a41a61950fa3dc07
    sha256sum "$u1_pier_dir/AGENTS.md" \
      "$u1_pier_dir/docs/operations/agentic-execution.md"

    u1_axi_dir=$(mktemp -d)
    git clone --filter=blob:none --no-checkout \
      https://github.com/kunchenguid/axi.git "$u1_axi_dir"
    git -C "$u1_axi_dir" fetch --depth 1 origin \
      b88620b3e87441bdaa330e9fdd313cde68d7fa77
    git -C "$u1_axi_dir" checkout --detach \
      b88620b3e87441bdaa330e9fdd313cde68d7fa77
    sha256sum "$u1_axi_dir/principles.yaml"

    u1_toon_dir=$(mktemp -d)
    git clone --branch v4.0.0 --depth 1 \
      https://github.com/toon-format/toon.git "$u1_toon_dir"
    git -C "$u1_toon_dir" rev-parse HEAD
    sha256sum "$u1_toon_dir/README.md" "$u1_toon_dir/LICENSE"

Hash Mandem's own approved decision inputs from the repository checkout:

    sha256sum \
      docs/plans/2026-07-21-001-feat-mandem-plan.md \
      docs/plans/units/u1-bootstrap-repository-architecture-contract.md

In
`docs/sources/doctrine-source-manifest.yaml`, record the Nucleus repository URL, full commit,
source paths, SHA-256 content digests, normalized Mandem artifact, license/attribution status, and
change owner. The same manifest records the pinned SBP commit
`01677c0afcf6171515ec1e788e6bc64ca5310659`, Pier Infra commit
`7491afbf775ecad83f0c80c7a41a61950fa3dc07`, AXI commit
`b88620b3e87441bdaa330e9fdd313cde68d7fa77`, TOON v4.0.0 documentation/specification source, and
the local decision artifacts used by later operating-doc compilation. Do not copy private
application source into Mandem; normalize principles and cite provenance.

After package configuration exists, use these commands from the repository root:

    bun --version
    bun install
    bun run test:run -- scripts/check-architecture.test.ts
    bun run architecture:check
    bun run typecheck
    bun run lint
    bun run test:run
    bun run check
    bun run build
    ./dist/mandem --version
    ./dist/mandem --help
    ./dist/mandem-server --version
    ./dist/mandem-server --help

`bun --version` must print `1.3.14`. `package.json` maps the `mandem` bin to
`dist/mandem` and `mandem-server` to `dist/mandem-server`. `bun run build` uses two explicit
`bun build --compile` invocations to create those Linux executables from `src/cli/main.ts` and
`src/server/main.ts`. Both print the same package version for `--version`; `--help` names only the
bounded U1 version/help surface and exits zero. Do not invent Docker or server-health commands.

Record `claude --version`, `claude --help`, `codex --version`, `codex --help`, and
`codex exec --help`. Then execute the provider matrix below in disposable temporary Git
repositories. The contract test creates a repository containing committed `PROBE.md` with the
single line `MANDEM_PROVIDER_MARKER_7F3A`, configures a local test-only Git identity, and records
the fixture commit SHA. Every invocation has a 60-second completion timeout; the interruption
probe sends `SIGINT` after 3 seconds and requires exit within 10 further seconds. It captures
bounded output, cleans up, and asserts both the fixture and Mandem tracked trees remain unchanged.

| Capability | Claude probe | Codex probe | Passing evidence |
| --- | --- | --- | --- |
| working directory and instruction injection | From the fixture cwd: `claude -p --permission-mode plan "Read PROBE.md and return exactly its one-line contents. Do not modify files."` | `codex exec -C <repo> --sandbox read-only --ephemeral "Read PROBE.md and return exactly its one-line contents. Do not modify files."` | zero exit; final output contains `MANDEM_PROVIDER_MARKER_7F3A`; Git stays clean |
| trusted full-access mode | From the fixture cwd: `claude -p --dangerously-skip-permissions "Return exactly MANDEM_PROVIDER_OK. Do not use tools or modify files."` | `codex exec -C <repo> --dangerously-bypass-approvals-and-sandbox --ephemeral "Return exactly MANDEM_PROVIDER_OK. Do not use tools or modify files."` | zero exit without an approval prompt; final output contains `MANDEM_PROVIDER_OK`; Git stays clean |
| structured completion | From the fixture cwd: `claude -p --permission-mode plan --output-format json "Return exactly MANDEM_PROVIDER_OK. Do not modify files."` | `codex exec -C <repo> --sandbox read-only --ephemeral --json "Return exactly MANDEM_PROVIDER_OK. Do not modify files."` | zero exit; Claude JSON and Codex JSONL parse; the final result contains `MANDEM_PROVIDER_OK` and recorded provider version |
| interruption | From the fixture cwd, launch full-access print mode with `Use the shell to run sleep 30, then return MANDEM_PROVIDER_LATE.` and send `SIGINT` after 3 seconds | same prompt through full-access ephemeral `codex exec`, then the same signal | no successful `MANDEM_PROVIDER_LATE` completion, process exits within 10 seconds after the signal, and Git stays clean |
| read-only review | From the fixture cwd: `claude -p --permission-mode plan "Review only PROBE.md. Return exactly READ_ONLY: followed by its marker. Do not modify files."` | `codex exec -C <repo> --sandbox read-only --ephemeral` with the same literal prompt | final output contains `READ_ONLY: MANDEM_PROVIDER_MARKER_7F3A`; Git stays clean |
| fresh-session recovery | Start a new non-resumed print invocation with only: `Read PROBE.md. With no transcript or prior session, return exactly NEXT: followed by its marker.` | start a new ephemeral `codex exec` with only the same literal prompt | final output contains `NEXT: MANDEM_PROVIDER_MARKER_7F3A`; evidence records a distinct fresh process and no resume/session argument |

If an installed flag differs, record the exact help-derived equivalent; do not silently omit a
capability. A missing equivalent is a blocking result for U2. Write commands, exit status,
bounded stdout/stderr digest, fixture commit SHA, and conclusion into
`docs/operations/provider-capability-baseline.md`; never record authentication material or an
environment dump.

The architecture checker command accepts an optional repository path:

    bun run architecture:check -- .
    bun run architecture:check -- tests/fixtures/architecture/malformed

The clean repository invocation exits `0`. The malformed fixture invocation exits `1` and prints
the asserted stable violations. Exit `2` means the tool itself failed and is never accepted as an
architecture finding.

Before the pull request, rerun `bun run check` from a clean worktree, record the tested commit SHA,
run fresh architecture and code review, resolve findings, push the branch, and open the U1 pull
request. The worker must not merge it.

## Test Scenarios

### Architecture happy path

- A repository containing conformant `architecture-standard` and `runtime` modules passes with no violations.
- The real Mandem source tree passes the same analyzer used for fixtures.
- Stable output ordering produces identical results across repeated runs.

### Structural and naming failures

- Missing `infrastructure/`, `domain/types.ts`, module README, root barrel, or API composition yields its specific stable rule ID.
- `CandidateSearch`, `candidate_search`, a leading hyphen, or whitespace in a module directory yields the module-name violation.
- A root barrel exporting `./infrastructure` fails.

### Dependency failures

- Domain importing application or infrastructure fails.
- Application importing infrastructure or API fails.
- One module importing another module's internal file fails.
- A composition root explicitly importing its owning infrastructure adapter passes.

### Placement and source failures

- Direct filesystem/network/process IO in domain or application fails.
- A TypeScript source file without `@fileoverview` fails.
- Explicit `any` fails; `unknown` and precise generics pass.
- A domain entity declared in a repository interface instead of `domain/types.ts` fails when mechanically detectable.
- A 151-line component, 201-line hook, or component with five direct `useState(` calls fails with
  its stable rule ID; boundary-sized 150/200-line files pass.

### Repository and package behavior

- `mandem --version` and `mandem-server --version` execute from built bin entries and return
  bounded deterministic output; each `--help` path is concise and successful.
- Missing or malformed package metadata fails the package contract test.
- Bun other than 1.3.14 fails the version preflight with one concise remediation.
- The focused checker test asserts that the malformed fixture exits `1`; `bun run check` passes
  only after all fixtures, the real repository, and the remaining checks are green.
- The doctrine source manifest contains immutable revisions/digests and maps every adopted source
  to a normalized Mandem artifact and owner.
- Claude and Codex capability probes record versioned evidence for every capability required before
  U2; a missing capability blocks U2 promotion rather than being inferred.

## Validation and Acceptance

- `bun install --frozen-lockfile` succeeds from a clean checkout after `bun.lock` exists.
- `bun run typecheck` reports no errors.
- `bun run lint` reports no errors.
- `bun run test:run` passes focused, contract, and integration suites.
- `bun run architecture:check` passes the real repository and fails the malformed fixture with expected stable rule IDs.
- `bun run check` passes from a clean checkout.
- `bun run build` produces executable `dist/mandem` and `dist/mandem-server` artifacts matching
  the `package.json` bin map.
- Both executable artifacts return bounded version/help output without vendor credentials.
- `git issue fsck` passes and the U1 issue points to this canonical plan.
- No tracked file contains a copied `git-native-issue` implementation or bundles its executable.
- The source manifest verifies the pinned Nucleus, SBP, Pier Infra, AXI, and TOON provenance used by
  U1/U5.
- The provider baseline names actual Claude/Codex versions and supplies non-mutating evidence for
  the U2 protocol constraints.

Every verification record must name the commit SHA under test. The worker report must separately record the observed red failure, green result, and refactor/check result.

## Idempotence and Recovery

- Dependency installation failure leaves source unchanged and is retriable.
- Architecture checker parse/read failures are typed violations or explicit tool failures; they never silently pass.
- Re-running `git issue init`, focused tests, architecture analysis, and repository checks must not
  duplicate the U1 work item or mutate accepted results. If issue initialization already exists,
  inspect and reuse it.
- A failed milestone keeps the branch and worktree intact. No cleanup occurs before PR merge, verification, and durable closure.
- If a planning assumption conflicts with actual package, Bun, TypeScript, or Git behavior, stop
  implementation, update this child ExecPlan, re-run clean-room review, and obtain approval for the
  changed revision.

## Interfaces and Dependencies

The `architecture-standard` public barrel must expose pure types representing a repository file,
an architecture rule, a rule violation, and an analysis result. A violation contains a stable rule
ID, severity, repository-relative path, concise message, and optional context. The application
layer defines a repository-tree port that accepts a repository root and returns the readable file
inventory without leaking filesystem types into domain code. Its analyze-repository use case
accepts that port plus the versioned rule set and returns violations in deterministic rule-ID/path
order. The infrastructure layer implements the port using Bun/Node filesystem primitives. The API
composition root selects that adapter and exposes one function used by the script.

The `runtime` public barrel must expose only process identity and version data plus a pure function
that returns the bounded version result for either executable. Neither module root barrel exports
infrastructure. `src/cli/main.ts`, `src/server/main.ts`, and `scripts/check-architecture.ts` remain
thin composition/presentation entrypoints.

`package.json` declares Bun `1.3.14`, maps `mandem` to `dist/mandem` and `mandem-server` to
`dist/mandem-server`, and exposes `build`, `typecheck`, `lint`, `test:run`,
`architecture:check`, and `check` scripts. `.bun-version` contains `1.3.14`. The build script
compiles `src/cli/main.ts` and `src/server/main.ts` into the two mapped Linux executables with Bun's
`--compile` mode. The package contract test asserts the bin map, executable files, zero-exit
version/help behavior, and matching package version.

`docs/architecture/consumer-integration-contract.md` defines the stable configuration and adapter
boundary that U8 will use to install Mandem into SBP. U1 defines only the configuration schema,
architecture-check invocation/result, operating-doc input boundary, and ownership split; it does
not modify SBP or implement the U8 migration.

U1 closes with:

- exact Mandem package and architecture-standard versions;
- committed module and layer rules with stable IDs;
- public module barrels and composition-root locations;
- canonical repository commands and CI-equivalent check contract;
- runtime module public surface available for U2 extension;
- executable composition boundaries and explicit U3 ownership of Docker/runtime behavior;
- third-party license/installation decision record;
- consumer integration contract ready for U8 without copying consumer source;
- verification evidence tied to the merged U1 SHA.

U2 must revalidate its scaffold against these real outputs before its child plan is promoted.

## Artifacts and Notes

The durable U1 artifacts are the git-native U1 issue, this living ExecPlan, the pinned architecture
source revision, `docs/architecture/architecture-standard-v1.md`, stable rule definitions and
fixtures, package metadata and lockfile, test evidence, commits, pull request, reviews, and final
verification tied to a commit SHA. Terminal transcripts belong here only when they prove a
milestone; keep them short and remove secrets or unrelated host details.

The temporary source checkout used to install `git-native-issue` is not a Mandem artifact and must
not be copied or committed. The quarantined premature prototype is also not implementation input.
If an executor consults it for comparison, that fact and every adopted decision must be recorded in
the Decision Log and re-reviewed.

## Definition of Done

- Planning-only initial history exists and this exact child plan is the approved execution authority.
- Mandem is a public MIT-licensed Bun repository with no npm/package-name collision.
- The repository contains the master plan and linked U1-U10 child-plan registry.
- `architecture-standard` and `runtime` are self-conforming clean-architecture modules.
- The deterministic checker rejects every enumerated malformed fixture and accepts Mandem itself.
- Both executables build and bounded U1 version/help behavior works.
- All U1 verification passes or an explicit external-infrastructure exception is durably approved.
- Review findings and execution surprises are resolved or converted into tracked downstream work.
- A U1 PR is open, reviewed, and ready for the master plan's landing process.

## Progress

- [x] (2026-07-24) Master program ExecPlan reviewed and merged in Strategy Builder Pro.
- [x] (2026-07-24) Public `BrandonJF/mandem` repository created.
- [x] (2026-07-24) Package/repository coordinate and git-native-issue license boundary resolved.
- [x] (2026-07-24) Premature unreviewed implementation quarantined outside the repository.
- [x] (2026-07-24) U1-U10 child-plan registry scaffolded.
- [x] (2026-07-24) Installed the Nucleus `PLANS.md` contract and durable Codex/Claude discovery instructions.
- [x] (2026-07-24) Rewrote this child ExecPlan to satisfy the `PLANS.md` section and self-containment contract.
- [x] (2026-07-24) Repaired the clean-room verification findings: executable authorization
  transition, meaningful TDD red seam, complete rule catalog, reproducible doctrine acquisition,
  provider probe matrix, checker exit contract, Bun pin, and U8 consumer handoff.
- [x] (2026-07-24) Final independent clean-room verification returned no unresolved P0-P2 findings.
- [x] (2026-07-24) Published planning root
  `a600d340c5306dad64f7405de6bb6b30b0a8f1b7` and initialized U1 issue `da645bd`.
- [x] (2026-07-24) Prepared the metadata-only authority proposal.
- [x] (2026-07-24) Recorded exact operator approval for head
  `b3aa645fa0b4995d01ddb23639d54706e6ea467f` and merged it unchanged as
  `2e9ad31d4a83c366ee36a3e3247ad4fcb559c573`.
- [x] (2026-07-24) Created and audited an isolated worktree on
  `feat/u1-bootstrap-architecture-contract`; implementation has not started.
- [x] (2026-07-24) Planning-only initial commit published to `origin/main`.
- [x] (2026-07-24) Milestone 2: installed Bun dependencies, captured the meaningful red proof (`expected [] to deeply equal ArrayContaining` for `ARCH-MODULE-INFRASTRUCTURE`), then made the focused test green.
- [x] (2026-07-24) Milestones 3-5: implemented the deterministic pure rule kernel, filesystem repository-tree adapter, thin checker script, and self-conforming `architecture-standard` and `runtime` modules.
- [x] (2026-07-24) Milestone 6: added package/build/lint/type/test gates, bounded compiled entrypoints, source doctrine manifest, consumer contract, and a conservative versioned provider baseline.
- [x] (2026-07-24) Milestone 7: independently reviewed the implementation, repaired the explicit-`any` self-check false positive and Vitest runtime mismatch, and verified `bun run check`, build, and both executable surfaces on `87004e92c2610b8e61067be10a1abe5c63ea215d`.
- [x] (2026-07-24) Pushed `feat/u1-bootstrap-architecture-contract` and opened U1 PR #4 without merging it.
- [x] (2026-07-24) Repaired independent-review P1/P2 findings: robust import-specifier resolution, IO API placement, complete public rule catalog, LF boundaries, package-bin integration contract, Bun preflight, and the full provider capability matrix.
- [x] (2026-07-24) Verified repaired implementation at `aed575083fb5bec975a78d9291e1dc3cc4504e23`: canonical check, build, entrypoint invocation, and issue fsck all passed.
- [x] (2026-07-24) Closed second-review findings with bare-application import rejection, exact IO placement, `as any` detection, and a deterministic 22-rule malformed matrix.
- [x] (2026-07-24) Closed final-review nested-type/process IO and explicit matrix-row findings; provider baseline state is consistently complete.
- [x] (2026-07-24) Closed final P2 template-literal type interpolation coverage for explicit `any`.

## Surprises & Discoveries

- Observation: The program-level U1-U10 implementation units were not sufficiently self-contained for direct engineer dispatch.
  Evidence: The first U1 worker had to infer architecture-checker and repository decisions from a bounded unit packet.
  Response: Introduced KTD14 and this reviewed-child-ExecPlan promotion contract before accepting implementation.

- Observation: A repository-scoped full-access policy cannot be assumed from the parent Strategy Builder Pro session.
  Evidence: The standalone repository initially triggered separate filesystem approvals.
  Response: Commit project-local Codex permissions and Terra worker defaults as part of planning authority.

- Observation: The first U1 child-plan draft was created without first reading the canonical Nucleus `PLANS.md`.
  Evidence: The draft omitted the required `PLANS.md` reference, several skeleton sections, and the bottom revision note.
  Response: Installed the verbatim contract, added durable discovery instructions, and blocked clean-room promotion until the draft is rewritten against it.

- Observation: Clean-room review of the master exposed duplicate Docker ownership and a missing
  R6 bootstrap ledger path.
  Evidence: U1 and U3 both named Docker/Compose files, while Mandem's own work-item adapter does not
  arrive until U4.
  Response: Moved all Docker/runtime behavior to U3 and made U1 use the pinned external
  `git-native-issue` executable before its first implementation commit.

- Observation: The pinned `git-native-issue` installer requires its source directory as the
  current working directory.
  Evidence: Running the absolute `install.sh` path from Mandem fails its `bin/git-issue` source
  check; running `./install.sh` from the pinned checkout installed v1.3.3 successfully.
  Response: Corrected the plan command to enter the temporary checkout for installation and
  recorded the actual installed version before initializing issue `da645bd`.

- Observation: Vitest executes these tests in a Node-compatible worker where the global `Bun` object is unavailable.
  Evidence: The first integration tests failed with `ReferenceError: Bun is not defined`.
  Response: Used Node-compatible `child_process` and `fs/promises` only in tests; production filesystem IO remains behind the Bun-oriented infrastructure adapter.

- Observation: The original checker used substring regexes that did not resolve relative imports and counted a trailing LF as an extra physical line.
  Evidence: New focused regressions initially failed to find a relative cross-module deep import, Node/Bun IO, and 150/200-line boundary files.
  Response: Replaced the narrow checks with import-specifier collection plus normalized relative/alias resolution and LF-aware line counting.

## Decision Log

- Decision: Treat the master plan as a program ExecPlan and U1-U10 as child-plan boundaries.
  Rationale: Cross-program dependency reasoning and implementation-level self-containment are different planning altitudes.
  Date/Author: 2026-07-24 / Brandon and Codex

- Decision: Mandem must pass its own architecture checker from U1 onward.
  Rationale: Exempting the orchestration product from the architecture it enforces would make the standard non-credible and allow internal drift.
  Date/Author: 2026-07-24 / Brandon

- Decision: Keep `git-native-issue` as an external pinned host executable.
  Rationale: This preserves the selected git-native work model without copying or bundling GPL-2.0 code into Mandem.
  Date/Author: 2026-07-24 / Brandon and Codex

- Decision: Use the Nucleus `PLANS.md` text as Mandem's ExecPlan contract and require both Codex and Claude entry guidance to point to it.
  Rationale: The governing format must be durable and discoverable by a stateless agent before it authors, reviews, discusses, or executes a plan.
  Date/Author: 2026-07-24 / Brandon and Codex

- Decision: Make this child ExecPlan the sole U1 implementation authority.
  Rationale: The program master sequences work, but a worker must receive one bounded,
  self-contained contract without reconciling two authorities.
  Date/Author: 2026-07-24 / Codex after clean-room master review

- Decision: Pin architecture provenance to Nucleus commit
  `7265e19cb24cf9e86c3facbd91326227dfa05dd1`.
  Rationale: The completed Mandem standard must be reproducible and usable without an ambient
  sibling checkout.
  Date/Author: 2026-07-24 / Codex after clean-room master review

- Decision: Defer Dockerfile, Compose, server health, and local transport to U3.
  Rationale: U3 owns the runtime lifecycle; U1 proves package entrypoints and architecture only.
  Date/Author: 2026-07-24 / Codex after clean-room master review

- Decision: Permit the reviewed planning baseline as the only direct root commit to `main`.
  Rationale: The empty GitHub repository has no base branch for a planning pull request; afterward
  U1 and every implementation unit use worktree branches and pull requests.
  Date/Author: 2026-07-24 / Codex bootstrap discovery

- Decision: Treat AXI and TOON as pinned external provenance, not Mandem-owned frameworks.
  Rationale: Mandem adapts AXI's interface principles and the independently governed TOON format;
  explicit source, version, license, and normalized-artifact records prevent later readers from
  mistaking either name or standard for an internal invention.
  Date/Author: 2026-07-24 / Brandon and Codex

- Decision: Replace the provisional provider blocker with actual bounded probe evidence.
  Rationale: Full-access, JSON, read-only, fresh-session, and interruption behaviors were observed in disposable clean Git fixtures and recorded without secrets.
  Date/Author: 2026-07-24 / Codex

## Outcomes & Retrospective

Planning outcome: U1 has a dependency-aware, self-contained execution contract, clean-room
approval, exact head-bound operator approval, a durable git-native issue, and an isolated
implementation worktree. It is ready for Milestone 2; implementation has not started.

Implementation outcome (in progress): Milestones 2-6 are implemented. The checker uses pure
typed rules through an application port and filesystem adapter, passes on Mandem, and rejects the
malformed fixture with exit 1. Both compiled executables emit their bounded version/help results.
The provider baseline has complete direct evidence for the required U2 protocol capabilities.

Verification outcome (2026-07-24): `bun run check` passed architecture checking, strict TypeScript,
ESLint, and all four Vitest tests; `bun run build` emitted both Linux executables; each emitted its
expected version and help output. This was observed at
`87004e92c2610b8e61067be10a1abe5c63ea215d`. The branch remains unmerged pending its U1 PR.

Revision note (2026-07-24): Rewrote U1 against the complete repository-root `PLANS.md` contract,
then repaired the clean-room verification findings. Added plain-language orientation, exact
commands, observable validation, recovery, artifacts, interfaces, an executable authorization
transition, a meaningful test-first seam, the normative architecture rule catalog, reproducible
source acquisition, provider capability probes, and the U8 consumer handoff. Pinned Nucleus,
AXI, TOON, and git-native-issue provenance, made the external issue ledger a pre-implementation
requirement, corrected its installer working directory from observed v1.3.3 behavior, and moved
Docker/runtime ownership to U3. This revision replaces the earlier draft that had not been authored
after reading `PLANS.md`.

Post-merge living update (2026-07-24): Recorded exact approval, unchanged merge, durable issue,
and isolated-worktree readiness. No implementation instruction changed.

Execution living update (2026-07-24): Recorded Milestones 2-6, the red/green proof, the Vitest
runtime discovery, the conservative provider decision, and the remaining Milestone 7 work. This
update keeps the plan restartable from repository state.

Pre-PR living update (2026-07-24): Recorded final local verification, review repairs, and the
remaining push/PR handoff without changing U1's approved implementation scope.

PR handoff update (2026-07-24): Opened https://github.com/BrandonJF/mandem/pull/4 from the U1
branch. The branch is intentionally preserved and unmerged for the master landing process.

Review-repair update (2026-07-24): Closed the independent P1/P2 checker, package-contract, Bun
preflight, provider-matrix, boundary-counting, and rule-catalog findings with proof-first tests.
The provider baseline now contains every required observed capability rather than a provisional U2
blocker.

Repair verification update (2026-07-24): At `aed575083fb5bec975a78d9291e1dc3cc4504e23`,
`bun run check` passed the Bun pin preflight, checker, strict typecheck, lint, and eleven tests;
the compiled executables returned their bounded version/help results; and `git issue fsck` passed.

Second-review repair update (2026-07-24): Application has no unapproved bare imports; IO is
limited to infrastructure, `api/composition.ts`, scripts, and the two entrypoints; and explicit
`any` includes assertion form. A table-driven fixture now exercises all 22 stable IDs in sorted
output.

Template-type repair update (2026-07-24): The explicit-`any` tokenization now preserves only
interpolation expressions from template literals while masking ordinary string values and comments.
At `4d1f181130f73ab9683ff50166b218052a5544ba`, the red template-type regression was green and
the canonical check, build, entrypoint, and issue-fsck gates passed.

Final-review verification update (2026-07-24): At
`23d9b34bdc2e266c0ae66651f666abd2a0481530`, nested `Array<any[]>` and `node:process`
regressions passed, each malformed-matrix row asserted its exact ID/path/message fragment, and
the provider baseline no longer contained stale blocker state. All canonical gates passed.
