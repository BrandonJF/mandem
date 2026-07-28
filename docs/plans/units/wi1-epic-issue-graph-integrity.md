---
title: "WI1: Deterministic epic issue graph checks and idempotent GitHub reconciliation"
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: code
plan_kind: mandem-issue-execplan
parent: ../2026-07-21-001-feat-mandem-plan.md
epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253
issue_id: 6a6a8bab-853f-4658-9bc0-38e2386b642d
depends_on_issue_ids:
  - 745eda80-1e74-4866-bc95-2f2983b31025
promotion: executable
execution_authorized: true
date: 2026-07-28
---

# WI1: Deterministic Epic Issue Graph Checks and Idempotent GitHub Reconciliation

This ExecPlan is a living document. Maintain it according to the repository-root `PLANS.md`, including `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective`.

---

## Goal Capsule

- **Objective:** Replace the manual issue-export repair performed on 2026-07-28 with checked-in policy and commands that can validate the local Mandem v1 work graph and reconcile its managed GitHub projection repeatedly without creating duplicates or drift.
- **Epic:** Git-native issue `abe862d6-b052-49fe-8611-bc1ab6e24253`.
- **Issue:** Git-native issue `6a6a8bab-853f-4658-9bc0-38e2386b642d`, projected to GitHub issue `#25`.
- **Dependency:** U1A issue `745eda80-1e74-4866-bc95-2f2983b31025`. Rebase implementation on U1A's merged authoring and canonical-check behavior before editing.
- **Authority:** This exact plan governs implementation only after a clean-room reviewer approves it, the operator approves that reviewed revision, and a metadata-only revision sets `execution_authorized: true`.
- **Execution profile:** Use an isolated worktree, Bun only, no `any`, and a behaviorally meaningful failing test before each implementation step.
- **Stop conditions:** Stop if the installed `git issue` version cannot provide stable git-native UUID and provider-mapping data without parsing human prose, if GitHub no longer exposes the required subissue APIs, or if reconciliation would have to delete or re-parent an unmanaged GitHub issue.
- **Tail ownership:** The implementation worker commits, pushes, opens a pull request, resolves review findings within scope, and leaves merge to the operator.

---

## Product Contract

### Summary

After this work, an operator can run one offline command to prove that every planned Mandem issue has one full git-native issue UUID and that plans, issues, dependencies, and authorization metadata agree. An explicitly named remote command will calculate the required GitHub changes, apply only managed changes when requested, and verify the result. Running the apply command again against the same state will report no changes and will not create another issue, milestone, label, comment, or parent/subissue relationship.

The workflow treats git-native UUIDs as portable identities. GitHub issue numbers are provider-specific mappings discovered from git-native issue history; they are never stored as an issue's identity.

### Problem Frame

The 2026-07-28 epic export required manual GitHub API calls after `git-native-issue` version 1.3.3 did not project later milestone and phase-label changes or native subissue hierarchy. The resulting GitHub graph is correct, but the commands that repaired it are absent from the repository and cannot be audited or repeated safely.

The issue ExecPlans also use inconsistent identity metadata. Some contain no `issue_id`, and U1A stores an abbreviated UUID. This prevents an epic from proving that every planned issue has exactly one durable native issue before execution begins.

### Requirements

#### Local relationship contract

- R1. Every managed ExecPlan names its git-native issue with a complete lowercase UUID.
- R2. Every issue ExecPlan names the epic issue, its own issue, and all direct issue dependencies in frontmatter fields with one versioned schema.
- R3. A versioned machine-readable metadata comment on each git-native issue owns its issue key, optional plan path, epic issue UUID, parent issue UUID, and direct dependency issue UUIDs. The epic issue's metadata also owns the provider repository, milestone, and managed label definitions. Plan frontmatter independently repeats portable relationship fields and must agree with the native issue.
- R4. The local checker rejects missing native issues, conflicting latest metadata comments, malformed or duplicate issue keys, duplicate plan ownership, multiple native issues for one plan path, unknown dependencies, dependency cycles, paths outside the repository, nonexistent plan paths, malformed UUIDs, and disagreement between plan frontmatter and native issue metadata. It also rejects zero or multiple epic roots, mismatched epic UUIDs, cross-epic parents, and any issue that cannot reach the one epic through parent links.
- R5. The local checker rejects an execution-authorized plan unless its issue and relationship metadata are valid and its promotion value permits execution.
- R6. The local checker returns stable, sorted findings with rule identifiers so the same repository state produces byte-for-byte equivalent diagnostic order.

#### GitHub projection and reconciliation

- R7. A read-only remote check compares each managed issue with its GitHub projection: provider mapping, open or closed state, direct parent, direct subissues, milestone, and the subset of labels owned by this workflow.
- R8. The apply command computes the desired changes before mutation, shows the proposed operations, mutates only after the operator supplies the explicit apply flag, and performs a read-only post-check.
- R9. Reconciliation requires one existing, unique GitHub Provider-ID mapping for every managed issue. A missing or ambiguous mapping fails closed before any write. Creating a provider issue through the repository-wide `git issue sync` bridge is a separate operator bootstrap action outside this command.
- R10. Reconciliation creates or updates one managed milestone and the managed label definitions by stable names, updates each managed provider issue's open or closed state, and preserves unrelated labels and other provider fields.
- R11. Reconciliation adds missing managed parent/subissue relationships and removes an unexpected relationship only when both issues belong to the native epic graph and the desired metadata names the replacement. It fails closed before all writes for any unmanaged current parent or any unmanaged subissue attached to a managed parent.
- R12. A second apply against the successfully reconciled state produces an empty operation set and performs no GitHub write.
- R13. A failed or interrupted apply is safe to retry. Each operation first reads current provider state and treats an already-satisfied result as success.
- R14. Authentication, network failure, rate limiting, ambiguous mappings, or unsupported provider behavior produces a nonzero exit and a precise diagnostic without weakening the local check.

#### Repository integration

- R15. `bun run issue-graph:check` runs offline and joins the canonical `bun run check` sequence. Developer setup merges native refs before work; CI fetches `refs/issues/*` explicitly before the gate. Missing epic refs fail rather than silently skipping graph validation.
- R16. `bun run issue-graph:remote:check` and `bun run issue-graph:remote:sync -- --apply` remain explicit operator commands because they read or mutate external state.
- R17. Repository documentation identifies the local issue graph as the implementation tracking contract, explains the two remote modes, and states that a successful local check does not prove GitHub is current.
- R18. Automated tests cover contract parsing, graph validation, provider planning, mutation idempotence, interrupted-run recovery, and a disposable-repository integration path.
- R19. `bun run issue-graph:native:set -- --issue <uuid> --file <yaml> --apply` appends and pushes one complete native metadata comment only when it differs from the current authoritative comment. Preview is the default, divergent local and remote issue refs fail closed, and repeating apply with the same payload performs no commit and no push.
- R20. `bun run vocabulary:check` checks repository-owned instructions, skills, plans, registries, and operator documentation for the detectable obsolete issue-synonym contexts listed in this plan. It reports stable file-and-line findings, joins `bun run check`, and supports a one-line documented exception for official external names, historical quotations, and established terms such as unit test that do not describe issue hierarchy. The prose rule remains broader than this automated subset and applies during authoring and review.

### Actors

- A1. A plan author assigns a full git-native UUID to an issue ExecPlan before seeking approval.
- A2. An implementation worker runs the offline checker through `bun run check`.
- A3. An operator previews or applies GitHub reconciliation with authenticated `gh` and `git issue` clients.
- A4. CI runs the offline check without credentials or network access.

### Key Flows

- F1. **Offline validation.** The command loads versioned relationship metadata from git-native issue refs, reads the plans declared by those issues, validates both directions of every relationship, sorts findings, and exits zero only when they agree.
- F2. **Remote preview.** The command first runs offline validation, loads GitHub state for provider-mapped issues, computes a stable operation list, prints it, and exits nonzero when drift exists without mutating GitHub.
- F3. **Remote apply.** With `--apply`, the command applies only the stable provider-operation list one operation at a time, re-reads state after recoverable conflicts, and then runs the remote check again. It never changes or pushes native issue refs.
- F4. **Retry after interruption.** A rerun recomputes state. Completed operations disappear from the plan and remaining operations execute once.
- F5. **New planned issue.** A contributor creates or selects a git-native issue first, appends its versioned relationship comment, then adds the same full UUID and dependencies to the issue ExecPlan. The checker fails until both records agree.
- F6. **Native metadata update.** An operator previews one complete metadata payload, applies it through the native setter, observes the exact issue ref push, and can repeat the command with zero writes.

### Acceptance Examples

- AE1. Given the checked-in Mandem v1 graph and no network access, when `bun run issue-graph:check` runs, it exits zero and prints a concise success line with the contract version and managed issue count.
- AE2. Given an issue ExecPlan with an abbreviated `issue_id`, when the local check runs, it exits nonzero with the plan path and a stable malformed-UUID rule.
- AE3. Given two plans that claim one UUID, when the local check runs, it reports both paths in one duplicate-ownership finding.
- AE4. Given a valid local graph and GitHub missing one parent/subissue relationship, when remote preview runs, it prints one add-subissue operation and performs no writes.
- AE5. Given the same drift and explicit apply, when remote sync runs, it adds the relation, verifies the provider state, and exits zero.
- AE6. Given the state produced by AE5, when the same apply command runs again, it reports zero planned operations and makes zero mutation calls.
- AE7. Given an interrupted run after a label update but before a milestone update, when apply runs again, it skips the satisfied label operation, applies the remaining milestone operation, and passes the post-check.
- AE8. Given a subissue whose current GitHub parent is outside the managed graph, when apply runs, it fails with an unmanaged-parent diagnostic and does not re-parent the issue.
- AE9. Given absent GitHub credentials, when `bun run check` runs, the local check still completes; when a remote command runs, it fails without changing local refs.

### Scope Boundaries

This issue manages the Mandem v1 epic, its declared subissues, their provider projection, one named milestone, and a small declared label vocabulary. It does not mirror arbitrary repository issues, implement bidirectional merge semantics, replace `git-native-issue`, schedule work, or add Mandem runtime issue behavior planned in U4.

The first implementation supports GitHub through `gh` because the repository already uses GitHub and the installed bridge records GitHub provider IDs. The domain and application layers use ports so another provider can be added later without changing graph validation.

The command preserves issue bodies, comments, assignees, projects, and labels outside the managed label set declared on the native epic issue. It may close or reopen only provider issues whose native metadata assigns them to the epic and whose unique Provider-ID mappings target the configured repository.

### Dependencies and Open Questions

U1A must merge first because it changes the canonical check sequence, documentation rules, and authored-source scope that this implementation consumes. No launch-blocking product or architecture question remains. The adapter reads raw Git commit objects through the exact version 1 storage contract below; it does not depend on formatted `git issue show` output.

---

## Planning Contract

### Context and Orientation

The epic plan is `docs/plans/2026-07-21-001-feat-mandem-plan.md`. Its issue ExecPlans live below `docs/plans/units/`, and `docs/plans/units/README.md` records their sequence. The authoritative issue ledger is stored in Git refs managed by `git-native-issue`; contributors use `git issue show`, `git issue merge`, `git issue sync`, and `git issue fsck` to inspect and exchange it.

On 2026-07-28, the epic was projected to GitHub `#29`, its subissues to issues `#21` through `#32`, and the current hierarchy was applied with GitHub's subissue API. The milestone and selected labels were also applied directly because the installed bridge did not update those fields on existing issues. These numbers are historical evidence only. The implementation must discover current numbers from provider records attached to each full git-native UUID.

The existing architecture checker places pure rules in `src/modules/architecture-standard/domain/`, orchestration in `application/`, filesystem and process behavior in `infrastructure/`, composition in `api/`, and a thin entrypoint in `scripts/`. Extend that module because this work checks whether Mandem's repository conforms to its planning and tracking contract. Do not place graph logic in a standalone script.

### Versioned Native-Issue Contract

The git-native issue refs are the authoritative epic graph. Each managed issue receives an append-only comment whose first line is exactly `Mandem-Graph-Metadata: v1`; the remaining comment is YAML with only `issue_key`, `epic_issue_id`, `plan`, `parent_issue_id`, `depends_on_issue_ids`, `provider`, `milestone`, and `managed_labels`. The last three fields are nested objects valid only on the epic. Parsing rejects unknown keys.

When metadata changes, append a new complete comment with `git issue comment <uuid> --message <complete-payload>` and immediately push the exact issue ref. The checker selects the unique metadata commit that descends from every other reachable metadata commit. If no unique maximal metadata commit exists because independent refs were merged, it reports `IGRAPH-NATIVE-CONFLICT`; an operator resolves it by appending one complete metadata comment after the merge. The checker never selects by timestamp, author, title, or GitHub comment order.

Plan frontmatter duplicates the issue UUID, epic UUID, and dependencies so an ExecPlan remains self-contained. The checker compares that declaration with its authoritative native issue. When the two disagree, it fails; it never rewrites the native issue from the plan. Relationship changes begin with a new native issue metadata comment, followed by matching plan edits.

During implementation, append the reviewed metadata below to the epic, U1, U1C, U1A, its incident, WI1, and U2-U10 issue refs. Then edit each plan to use complete `epic_issue_id`, `issue_id`, and `depends_on_issue_ids`. Add WI1 as a dependency of U2 because the checker must join the repository gate before the next runtime issue can receive execution authorization. Update U2's plan and status comment after its native metadata.

The exact plan-frontmatter contract for an issue is:

    epic_issue_id: <full lowercase UUID>
    issue_id: <full lowercase UUID>
    depends_on_issue_ids:
      - <full lowercase UUID>

The epic ExecPlan uses `issue_id` for its own full UUID and an empty `depends_on_issue_ids` array. An issue may use `plan: null` when it does not require an ExecPlan. A non-null plan path belongs to exactly one issue.

The native setter accepts YAML without the comment marker. A subissue with an ExecPlan has exactly this shape:

    issue_key: "U2"
    epic_issue_id: "abe862d6-b052-49fe-8611-bc1ab6e24253"
    plan: "docs/plans/units/u2-protocol-lifecycle-sqlite.md"
    parent_issue_id: "abe862d6-b052-49fe-8611-bc1ab6e24253"
    depends_on_issue_ids:
      - "6a6a8bab-853f-4658-9bc0-38e2386b642d"
      - "745eda80-1e74-4866-bc95-2f2983b31025"
      - "da645bd0-9899-40b3-9f23-3b48d65362a4"

An incident subissue without an ExecPlan uses the same relationship fields and `plan: null`:

    issue_key: "U1A-INCIDENT-1"
    epic_issue_id: "abe862d6-b052-49fe-8611-bc1ab6e24253"
    plan: null
    parent_issue_id: "745eda80-1e74-4866-bc95-2f2983b31025"
    depends_on_issue_ids: []

The epic payload has exactly this nesting:

    issue_key: "EPIC"
    epic_issue_id: "abe862d6-b052-49fe-8611-bc1ab6e24253"
    plan: "docs/plans/2026-07-21-001-feat-mandem-plan.md"
    parent_issue_id: null
    depends_on_issue_ids: []
    provider:
      kind: "github"
      owner: "BrandonJF"
      repository: "mandem"
    milestone:
      title: "Mandem v1"
      description: "Tracks the planned Mandem v1 issues through final publication."
      state: "open"
      due_on: null
    managed_labels:
      blocked:
        color: "B60205"
        description: "Work cannot proceed until its recorded dependency or decision changes."
      in-progress:
        color: "ededed"
        description: ""
      incident:
        color: "D93F0B"
        description: "Operational or reliability incident."
      planned:
        color: "D4C5F9"
        description: "Tracked work that requires planning or authorization before execution."
      u10:
        color: "ededed"
        description: ""
      u1a:
        color: "C5DEF5"
        description: "Mandem issue U1A."
      u1c:
        color: "C5DEF5"
        description: "Mandem issue U1C."
      u2:
        color: "ededed"
        description: ""
      u3:
        color: "ededed"
        description: ""
      u4:
        color: "ededed"
        description: ""
      u5:
        color: "ededed"
        description: ""
      u6:
        color: "ededed"
        description: ""
      u7:
        color: "ededed"
        description: ""
      u8:
        color: "ededed"
        description: ""
      u9:
        color: "ededed"
        description: ""

Epic metadata requires `provider`, `milestone`, and the complete `managed_labels` object shown above; subissues reject those keys. Every payload requires the five relationship fields shown above. The issue UUID comes from `refs/issues/<uuid>` and is not duplicated in the comment. `issue_key` must match `^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*$` and be unique within the graph.

The checker enumerates every authoritative metadata comment and requires exactly one epic root. That root has `epic_issue_id` equal to its ref UUID, `parent_issue_id: null`, and the provider policy fields. Every other managed issue names that same `epic_issue_id`, has a non-null parent in the graph, rejects provider policy fields, and reaches the root by following parent links. A second self-rooted entry, a mismatched epic UUID, a cross-epic parent, or a disconnected component produces `IGRAPH-EPIC` before any provider planning. `plan` may be null for any issue, and `depends_on_issue_ids` may be empty. Bug, feature, incident, and chore remain labels or other classifications; they never change this hierarchy schema.

The setter parses YAML to typed values and compares those values, not source formatting. Before it appends, it serializes a canonical comment with `Mandem-Graph-Metadata: v1` on the first line, then YAML with LF endings, two-space indentation, double-quoted strings, explicit `null`, and one final newline. Relationship keys use the order shown above. Provider keys order as `kind`, `owner`, `repository`; milestone keys as `title`, `description`, `state`, `due_on`; dependency UUIDs and managed-label names sort lexicographically. Label keys order as `color`, `description`. The checker normalizes older v1 comments through the same serializer before equality comparison.

Allowed `promotion` values are `scaffolded`, `planned`, `clean-room-approved`, `executable`, and `complete`. `execution_authorized: true` is valid only with `promotion: executable`. A completed issue uses `promotion: complete` and `execution_authorized: false`. Normalize U1A from its current `clean-room-approved` plus `true` combination to `executable` plus `true`; this changes stale metadata, not its already recorded authority.

The reviewed native issue migration set follows. Each line identifies the target ref and its complete relationship values. `state` and `labels` refer to the git-native issue's built-in fields; the relationship comment does not duplicate them. The epic comment additionally contains the nested `provider`, `milestone`, and complete `managed_labels` objects from the canonical epic payload above.

      - { issue_key: EPIC, issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, plan: docs/plans/2026-07-21-001-feat-mandem-plan.md, parent_issue_id: null, depends_on_issue_ids: [], state: open, labels: [in-progress] }
      - { issue_key: U1, issue_id: da645bd0-9899-40b3-9f23-3b48d65362a4, epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, plan: docs/plans/units/u1-bootstrap-repository-architecture-contract.md, parent_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, depends_on_issue_ids: [], state: closed, labels: [] }
      - { issue_key: U1C, issue_id: 5717221b-f9e6-4c8f-abca-77a1ad3811bf, epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, plan: docs/plans/units/u1-corrective-architecture-package-contract.md, parent_issue_id: da645bd0-9899-40b3-9f23-3b48d65362a4, depends_on_issue_ids: [da645bd0-9899-40b3-9f23-3b48d65362a4], state: closed, labels: [u1c] }
      - { issue_key: U1A, issue_id: 745eda80-1e74-4866-bc95-2f2983b31025, epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, plan: docs/plans/units/u1a-documentation-authoring-quality-gates.md, parent_issue_id: da645bd0-9899-40b3-9f23-3b48d65362a4, depends_on_issue_ids: [5717221b-f9e6-4c8f-abca-77a1ad3811bf], state: open, labels: [in-progress, u1a] }
      - { issue_key: U1A-INCIDENT-1, issue_id: 38f956c8-0f18-4d85-af1a-d908bcc54248, epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, plan: null, parent_issue_id: 745eda80-1e74-4866-bc95-2f2983b31025, depends_on_issue_ids: [], state: open, labels: [incident] }
      - { issue_key: WI1, issue_id: 6a6a8bab-853f-4658-9bc0-38e2386b642d, epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, plan: docs/plans/units/wi1-epic-issue-graph-integrity.md, parent_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, depends_on_issue_ids: [745eda80-1e74-4866-bc95-2f2983b31025], state: open, labels: [planned] }
      - { issue_key: U2, issue_id: cb67d131-975c-4d97-9a6f-4934be991ac6, epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, plan: docs/plans/units/u2-protocol-lifecycle-sqlite.md, parent_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, depends_on_issue_ids: [da645bd0-9899-40b3-9f23-3b48d65362a4, 745eda80-1e74-4866-bc95-2f2983b31025, 6a6a8bab-853f-4658-9bc0-38e2386b642d], state: open, labels: [blocked, u2] }
      - { issue_key: U3, issue_id: d946e066-84d5-4651-b3b4-30a18e80008c, epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, plan: docs/plans/units/u3-server-docker-resident-reconciliation.md, parent_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, depends_on_issue_ids: [cb67d131-975c-4d97-9a6f-4934be991ac6], state: open, labels: [blocked, u3] }
      - { issue_key: U4, issue_id: 11538b56-bd63-42c2-8242-87ac7a76d35d, epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, plan: docs/plans/units/u4-work-items-plans-queue-gates-cli.md, parent_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, depends_on_issue_ids: [cb67d131-975c-4d97-9a6f-4934be991ac6, d946e066-84d5-4651-b3b4-30a18e80008c], state: open, labels: [blocked, u4] }
      - { issue_key: U5, issue_id: cf239716-00e2-46ae-82e7-84ac8f31baaf, epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, plan: docs/plans/units/u5-operating-docs-provider-sessions.md, parent_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, depends_on_issue_ids: [d946e066-84d5-4651-b3b4-30a18e80008c, 11538b56-bd63-42c2-8242-87ac7a76d35d], state: open, labels: [blocked, u5] }
      - { issue_key: U6, issue_id: 22a35ab0-878b-448b-9341-6679b70a499d, epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, plan: docs/plans/units/u6-unattended-work-review-learn-merge.md, parent_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, depends_on_issue_ids: [cb67d131-975c-4d97-9a6f-4934be991ac6, d946e066-84d5-4651-b3b4-30a18e80008c, 11538b56-bd63-42c2-8242-87ac7a76d35d, cf239716-00e2-46ae-82e7-84ac8f31baaf], state: open, labels: [blocked, u6] }
      - { issue_key: U7, issue_id: 6ca36caa-37e2-447b-935e-792a6f6566b6, epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, plan: docs/plans/units/u7-complete-cli-toon-opentui.md, parent_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, depends_on_issue_ids: [cb67d131-975c-4d97-9a6f-4934be991ac6, d946e066-84d5-4651-b3b4-30a18e80008c, 11538b56-bd63-42c2-8242-87ac7a76d35d, cf239716-00e2-46ae-82e7-84ac8f31baaf, 22a35ab0-878b-448b-9341-6679b70a499d], state: open, labels: [blocked, u7] }
      - { issue_key: U8, issue_id: 9e6cde19-27d2-4228-8a93-628829ae1b92, epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, plan: docs/plans/units/u8-sbp-install-architecture-baseline.md, parent_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, depends_on_issue_ids: [da645bd0-9899-40b3-9f23-3b48d65362a4, cb67d131-975c-4d97-9a6f-4934be991ac6, d946e066-84d5-4651-b3b4-30a18e80008c, 11538b56-bd63-42c2-8242-87ac7a76d35d, cf239716-00e2-46ae-82e7-84ac8f31baaf, 22a35ab0-878b-448b-9341-6679b70a499d, 6ca36caa-37e2-447b-935e-792a6f6566b6], state: open, labels: [blocked, u8] }
      - { issue_key: U9, issue_id: 7351af1b-d406-4768-bbf9-21f878aad28a, epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, plan: docs/plans/units/u9-restart-proof-sbp-release-candidate.md, parent_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, depends_on_issue_ids: [da645bd0-9899-40b3-9f23-3b48d65362a4, cb67d131-975c-4d97-9a6f-4934be991ac6, d946e066-84d5-4651-b3b4-30a18e80008c, 11538b56-bd63-42c2-8242-87ac7a76d35d, cf239716-00e2-46ae-82e7-84ac8f31baaf, 22a35ab0-878b-448b-9341-6679b70a499d, 6ca36caa-37e2-447b-935e-792a6f6566b6, 9e6cde19-27d2-4228-8a93-628829ae1b92], state: open, labels: [blocked, u9] }
      - { issue_key: U10, issue_id: 237397e3-cf06-4c6f-bf5d-ce83d8187ee3, epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, plan: docs/plans/units/u10-observability-final-v1.md, parent_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253, depends_on_issue_ids: [7351af1b-d406-4768-bbf9-21f878aad28a], state: open, labels: [blocked, u10] }

The epic issue's `managed_labels` field defines these exact reviewed values. Colors omit the leading `#`; an empty quoted string is intentional.

    blocked: { color: B60205, description: "Work cannot proceed until its recorded dependency or decision changes." }
    planned: { color: D4C5F9, description: "Tracked work that requires planning or authorization before execution." }
    in-progress: { color: ededed, description: "" }
    incident: { color: D93F0B, description: "Operational or reliability incident." }
    u1c: { color: C5DEF5, description: "Mandem issue U1C." }
    u1a: { color: C5DEF5, description: "Mandem issue U1A." }
    u2: { color: ededed, description: "" }
    u3: { color: ededed, description: "" }
    u4: { color: ededed, description: "" }
    u5: { color: ededed, description: "" }
    u6: { color: ededed, description: "" }
    u7: { color: ededed, description: "" }
    u8: { color: ededed, description: "" }
    u9: { color: ededed, description: "" }
    u10: { color: ededed, description: "" }

The milestone contract is title `Mandem v1`, description `Tracks the planned U1–U10 epic through final v1 publication.`, open state, and no due date. Labels outside the managed set are preserved.

The provider projection derives desired issue state from each native issue's built-in `State` trailer and desired managed-label assignments from the intersection of its built-in `Labels` trailers with the epic issue's `managed_labels` keys. GitHub fields never flow back into these native values through this reconciler.

The initial diagnostic catalog is `IGRAPH-NATIVE-METADATA`, `IGRAPH-NATIVE-CONFLICT`, `IGRAPH-UUID`, `IGRAPH-ISSUE-KEY`, `IGRAPH-EPIC`, `IGRAPH-PATH`, `IGRAPH-PLAN-OWNER`, `IGRAPH-ISSUE-MISSING`, `IGRAPH-DEPENDENCY`, `IGRAPH-CYCLE`, `IGRAPH-FRONTMATTER`, `IGRAPH-AUTHORIZATION`, `IGRAPH-PROVIDER-MAPPING`, `IGRAPH-PROVIDER-STATE`, `IGRAPH-PROVIDER-LABEL`, `IGRAPH-PROVIDER-MILESTONE`, `IGRAPH-PROVIDER-PARENT`, `IGRAPH-PROVIDER-UNMANAGED-PARENT`, and `IGRAPH-PROVIDER-UNMANAGED-SUBISSUE`. Findings sort by rule ID, issue UUID, plan path, then message.

### Key Technical Decisions

- KTD1. **Validate locally before reading or mutating GitHub.** Local errors must never cause provider writes, and CI must not need credentials.
- KTD2. **Use native issue metadata plus plan cross-checks.** Git-native refs own epic discovery and provider policy. Plan frontmatter repeats portable relationships and is compared to detect stale edits. Checked-in plans and GitHub never override native metadata.
- KTD3. **Separate desired-state planning from mutation.** Pure domain code returns stable typed operations. The GitHub adapter executes those operations. Tests can prove idempotence without network access.
- KTD4. **Use full git-native UUIDs as identities.** The provider adapter resolves GitHub numbers from existing provider mappings in native issue history. No checked-in contract contains a GitHub issue number.
- KTD5. **Own only provider fields declared by native issues.** Reconciliation may update mapped managed issue state, managed labels, the managed milestone, and managed hierarchy. It preserves unrelated provider data and fails before destructive or ambiguous re-parenting.
- KTD6. **Make apply explicit and post-verified.** Remote check is read-only by default. `--apply` authorizes only the printed operation types, and successful completion requires a fresh zero-drift comparison.
- KTD7. **Model already-satisfied writes as success.** Before each write, the adapter checks current state. GitHub conflict or duplicate responses trigger one re-read; if desired state now exists, execution continues.
- KTD8. **Use typed command runners rather than shell strings.** Infrastructure calls `git`, `git issue`, and `gh` with argument arrays. It never interpolates issue content into a shell command and never logs credentials.
- KTD9. **Do not make remote synchronization part of the canonical gate.** `bun run check` proves repository integrity offline. Operators and scheduled automation invoke remote comparison separately.

### Rejected Alternatives

Using GitHub issue numbers in plan frontmatter was rejected because forks and alternate providers assign different numbers. Treating `git issue sync` as sufficient was rejected because version 1.3.3 did not update current milestones, later label changes, or native subissue hierarchy during the observed export. Deriving the entire graph from prose was rejected because prose is not a stable machine interface. Automatically removing all unexpected labels or hierarchy was rejected because the workflow does not own unrelated GitHub state.

### Failure and Recovery Model

The application first builds a complete desired graph and rejects every local finding. Remote preview then loads all provider state before producing any operation. If any provider mapping is missing or ambiguous, planning stops with `IGRAPH-PROVIDER-MAPPING` and no provider write. Apply writes operations in stable order: label definitions, milestone definition, issue state, issue labels and milestone assignments, then subissue additions or managed re-parenting.

Each operation has a deterministic key formed from contract version, operation type, issue UUID, and desired value. The key appears in diagnostic output but need not be stored remotely because the provider state itself proves completion. A retry reloads state and recomputes operations. The implementation must never use a local “completed operations” file as evidence that GitHub changed.

If GitHub applies a write but the response is lost, the adapter re-reads that resource. If the desired state exists, it records success. If state remains uncertain, it exits nonzero and tells the operator to rerun. A missing provider mapping requires the operator to run and review the repository-wide bridge separately, merge and push resulting issue refs, and rerun the checker; the reconciler never invokes that broad bridge.

### Security and External-State Controls

Use `gh api` so authentication remains in the existing GitHub CLI credential store. Never read or print the token. Encode REST payloads as structured arguments or JSON passed directly to the child process, not shell-expanded text. Remote tests use fakes and do not contact GitHub. A live smoke test may read the configured repository; mutation smoke testing occurs only through the explicit apply command against the already-declared managed graph.

---

## Implementation Steps

### Step 1. Define and validate the native relationship contract

- **Goal:** Produce a pure, versioned parser and validator that proves native issue metadata, plan frontmatter, and required local issue records agree.
- **Files:** Create `src/modules/architecture-standard/domain/issue-graph-types.ts`, `src/modules/architecture-standard/domain/issue-graph-policy.ts`, and `src/modules/architecture-standard/domain/issue-graph-policy.test.ts`. Extend the module domain barrel.
- **Approach:** Define branded full-UUID, repository-relative plan-path, issue-key, promotion, and issue-state types. Parse unknown native metadata and plan frontmatter into typed values with explicit findings. Build a directed graph, verify ownership and references in both directions, detect cycles, and return sorted findings. Keep filesystem and Git reads out of domain code.
- **Test scenarios:** Begin with failing tests for malformed and abbreviated UUIDs; malformed and duplicate issue keys; incomparable latest metadata comments; duplicate plan ownership; multiple issues for one plan path; zero and multiple epic roots; mismatched epic UUIDs; cross-epic parents; disconnected issues; missing epic, dependency, issue, and plan; mismatched dependencies; path traversal; dependency cycles; invalid authorization and promotion combinations; unknown metadata keys; epic-only provider fields; required parent fields for subissues; null and non-null plan paths; canonical field order; sorted dependency UUIDs and label names; CRLF normalization to LF with one final newline; semantic equality across differently formatted YAML; and stable finding order. Add a complete valid Mandem v1 fixture that returns no findings.
- **Verification:** Run the domain test file directly with Bun/Vitest and observe the new tests fail before implementation and pass afterward.

### Step 2. Read plans and git-native issues through application ports

- **Goal:** Assemble a complete local snapshot without parsing human display output or relying on the current branch to contain issue refs.
- **Files:** Create `src/modules/architecture-standard/application/ports/issue-graph-repository.ts`, `src/modules/architecture-standard/application/use-cases/check-issue-graph.ts`, `src/modules/architecture-standard/infrastructure/repositories/git-native-issue-graph-repository.ts`, and matching tests and fakes. Extend application and infrastructure barrels.
- **Approach:** Add ports for repository files, git-native issue records, provider mappings, and Git ref publication. Read version 1 issue commits and `Mandem-Graph-Metadata: v1` comments through the raw Git object contract defined in `Interfaces and Dependencies`. Enumerate local `refs/issues/*` without mutating them for offline check. Parse YAML with a Bun-compatible maintained dependency only if the repository does not already provide a parser; pin it in `package.json` and `bun.lock`.
- **Test scenarios:** Begin with failures for a missing issue ref, unknown issue or graph-metadata version, malformed state trailer, conflicting metadata heads, duplicate provider mapping, a stale issue plan path, and a plan-frontmatter mismatch. Verify paths with spaces and Unicode are passed as process arguments. Verify the adapter never invokes a shell and does not require `gh` or network access.
- **Verification:** Run the application and adapter test files, then run the local use case against the repository fixture and expect the same sorted findings as the pure domain layer.

### Step 3. Normalize the current Mandem v1 graph and add the offline command

- **Goal:** Make the checked-in epic graph satisfy the new contract and include the local check in the repository gate.
- **Files:** Update the managed plan frontmatter and vocabulary in `AGENTS.md`, `CLAUDE.md`, `.agents/**/*.md`, `PLANS.md`, `README.md`, `docs/**/*.md`, `scripts/README.md`, and every `src/**/README.md`; rename obsolete plan paths and update every reference; append authoritative metadata comments to all managed git-native issues; create `src/modules/architecture-standard/application/use-cases/set-native-issue-graph-metadata.ts`, `src/modules/architecture-standard/api/issue-graph.ts`, `src/modules/architecture-standard/api/issue-graph.test.ts`, `scripts/check-issue-graph.ts`, `scripts/check-vocabulary.ts`, `scripts/set-issue-graph-metadata.ts`, and their tests; update the API and public module barrels, `package.json`, U1A's `.github/workflows/repository-quality.yml`, and documentation indexes required by U1A.
- **Approach:** Compose the filesystem and git-native adapters with the application use cases in the API module. Keep scripts limited to argument parsing, rendering, and exit status. The setter fetches the exact remote issue ref into a temporary ref and applies the ancestry state machine in `Idempotence and Recovery`; it never appends on a stale local head. Only `--apply` may append through `git issue comment` or push the exact existing local ref. Use the setter to apply the reviewed native metadata set above, then normalize plan frontmatter and the complete repository-owned prose corpus named above. Rename `docs/plans/units/` to `docs/plans/issues/`, rename files containing `work-item` or `corrective` when those words classify hierarchy, and update all links and native plan paths.

  The vocabulary checker rejects the phrases `program ExecPlan`, `program issue`, `program graph`, `program plan`, `program orchestrator`, `program membership`, `work item`, `work-item`, `child ExecPlan`, `child plan`, `child scaffold`, `child issue`, `child item`, `corrective item`, `corrective work`, `support item`, `support issue`, and `support incident`, plus `unit` when it modifies issue, plan, scaffold, hierarchy, or key. Matching is case-insensitive and includes inline code and fenced code. This finite list automates common violations; authors and reviewers still enforce the operating contract's general prohibition on using any synonym as a substitute.

  An exceptional physical line must be preceded immediately by `<!-- vocabulary-check: allow-next-line reason="TEXT" -->`. `TEXT` must contain at least ten non-whitespace characters. The directive applies to exactly the next physical line, including a line inside a code fence, and never to a blank line or another directive. Directives cannot nest. The checker rejects a malformed directive, a blank or directive target, an unused directive whose target has no vocabulary finding, and a second directive before the first has been consumed. This mechanism permits a precise historical quotation or official external term without suppressing a paragraph, file, or pattern. The checker does not support file-wide, block, glob, or configuration-file exclusions.

  Add `vocabulary:check` and `issue-graph:check` before typecheck in the repository `check` sequence. Before the CI gate, add `git fetch origin '+refs/issues/*:refs/issues/*'` to `.github/workflows/repository-quality.yml`; the quoted refspec prevents shell glob expansion.
- **Test scenarios:** Begin with a failing disposable-repository test that creates plan files and issue refs, then proves success, malformed-plan failure, missing-issue failure, and deterministic output. Add vocabulary fixtures for every rejected phrase, case variants, inline and fenced code, sorted findings, and renamed-path discovery. Test a valid one-line exception, missing and short reasons, a blank target, a directive target, an unused directive, adjacent or nested directives, and proof that the following line is checked normally. Verify the setter preview performs no commit or push; first apply appends and pushes one ref; a local-behind remote ref fails without append; divergent refs fail without append; a merged metadata conflict appends one resolving canonical comment even when one conflicting payload matches the request; retry after a lost push performs zero commits and one push only when the remote-to-local range is exactly the expected metadata commit; an extra unpushed comment causes zero pushes and an operator-review error; and the next repeated apply performs zero commits and zero pushes. Verify `bun run vocabulary:check` and `bun run issue-graph:check` do not invoke `gh`, fetch, merge, sync, or push. Verify the CI workflow fetches issue refs before `bun run check` and the current repository passes.
- **Verification:** Run `bun run issue-graph:check` twice and compare output. Run `bun run check` without GitHub credentials and expect success.

### Step 4. Plan GitHub reconciliation without mutation

- **Goal:** Compare the valid local graph with GitHub state and return a typed, stable operation plan.
- **Files:** Create `src/modules/architecture-standard/application/ports/issue-graph-provider.ts`, `src/modules/architecture-standard/application/use-cases/plan-issue-graph-reconciliation.ts`, `src/modules/architecture-standard/domain/issue-graph-operations.ts`, and tests.
- **Approach:** Model provider state independently from GitHub responses. Compare mapped managed issue state, managed label definitions and assignments, milestone definition and assignments, and direct parent/subissue relationships. Treat unrelated labels and fields as outside the comparison. Refuse ambiguous mappings, unmanaged current parents, and unmanaged subissues attached to managed parents.
- **Test scenarios:** Begin with failures for missing and duplicate provider mappings, duplicate milestone names, unmanaged current parents, unmanaged subissues under managed parents, and an unsupported provider. Verify exact operations for open and closed state drift, missing labels, changed managed label definitions, missing milestone, missing assignment, missing subissue link, and managed re-parenting. Verify already-correct state returns an empty array and that input ordering cannot change output order.
- **Verification:** Run domain and application tests and inspect one stable operation transcript fixture.

### Step 5. Execute and verify idempotent GitHub reconciliation

- **Goal:** Add explicit preview and apply commands backed by a GitHub adapter and prove retry safety.
- **Files:** Create `src/modules/architecture-standard/infrastructure/services/github-issue-graph-provider.ts`, `src/modules/architecture-standard/application/use-cases/reconcile-issue-graph.ts`, `src/modules/architecture-standard/api/issue-graph-reconciliation.ts`, `src/modules/architecture-standard/api/issue-graph-reconciliation.test.ts`, `scripts/reconcile-issue-graph.ts`, and corresponding tests. Update all affected barrels, `package.json`, and operator documentation.
- **Approach:** Implement GitHub reads and writes with `gh api` argument arrays and the exact REST contract in `Interfaces and Dependencies`. Never invoke `git issue sync`. Execute one stable operation at a time, re-read after conflicts or uncertain responses, and finish with a fresh comparison. The API module composes ports and adapters. The script defaults to preview and only parses arguments, renders operations, and returns the API result; only `--apply` mutates.
- **Test scenarios:** Begin with a fake provider that records calls. Verify preview has zero writes; a complete apply uses the expected operation order; issue state is reconciled only for mapped managed issues; a second apply has zero writes; a lost response followed by matching state succeeds; interruption followed by retry completes only remaining operations; authentication and rate-limit failures exit nonzero; missing mappings, unmanaged current parents, and unmanaged subissues under managed parents cause zero writes; the bridge is never invoked; the exact singular subissue removal endpoint and payload are used; and command arguments do not expose tokens or interpret issue text as shell syntax.
- **Verification:** Run all reconciliation tests. Then run `bun run issue-graph:remote:check` against `BrandonJF/mandem` and expect zero drift. Run the apply command twice regardless of initial drift; if state was already current, both are zero-write proof runs, otherwise the first repairs drift and the second reports zero operations.

### Step 6. Document the contract and integrate final verification

- **Goal:** Make the workflow discoverable and prove the complete repository remains conformant.
- **Files:** Update `README.md`, `docs/plans/README.md`, `docs/plans/units/README.md`, `scripts/README.md`, and `src/modules/architecture-standard/README.md` as required by the merged U1A indexing policy.
- **Approach:** Explain when contributors create an issue, where full UUIDs appear, how local check differs from remote check, what apply owns, and how to recover from interruption. Include one example that uses UUIDs and no GitHub issue number.
- **Test scenarios:** U1A documentation checks must discover every new file and link. Command help tests must distinguish offline check, remote preview, and explicit apply.
- **Verification:** Run the full verification contract and inspect `git diff --check`.

---

## Plan of Work

Milestone 1 implements Steps 1 and 2. It ends when a pure test fixture and a disposable Git repository both prove that the reviewed v1 graph either validates or returns stable rule IDs. No GitHub process runs during this milestone.

Milestone 2 implements Step 3. It appends the reviewed metadata to native issue refs, pushes each ref, normalizes every plan's frontmatter against those native records, and connects the offline command to the repository check through the API composition layer. It ends when `bun run issue-graph:check` and the full offline gate pass without credentials.

Milestone 3 implements Step 4. It translates provider snapshots into a stable operation list without mutation. It ends when tests cover every managed provider field, missing mappings, unmanaged parents, and ordering independence.

Milestone 4 implements Step 5. It adds the GitHub adapter, preview, explicit apply, immediate re-read behavior, and zero-write retry proof. It ends when fake-provider interruption tests pass and the live remote check reports the actual repository state without changing it.

Milestone 5 implements Step 6 and the shipping tail. It completes indexed documentation, runs live apply twice, captures the required zero-write evidence from the second run, runs every gate, pushes the implementation branch, and opens a pull request.

---

## Concrete Steps

Work from an isolated implementation worktree rebased on the merge commit that completes U1A. Confirm Bun and git-native issue versions before edits:

    bun --version
    git issue version
    git status --short --branch

For each step, add the named failing test first and run only that test file. Preserve the failing output in this plan's `Artifacts and Notes`, implement the smallest behavior, then rerun the focused test. After Step 3, run:

    bun run issue-graph:native:set -- --issue <full-uuid> --file <payload.yaml>
    bun run issue-graph:native:set -- --issue <full-uuid> --file <payload.yaml> --apply
    bun run issue-graph:native:set -- --issue <full-uuid> --file <payload.yaml> --apply
    bun run issue-graph:check
    bun run check
    git issue fsck

For each reviewed payload, preview prints the normalized metadata and intended exact ref. First apply appends and pushes one metadata commit. Second apply prints `native issue metadata already current: 0 commits, 0 pushes`.

Expect the local command to print one line in this form and exit zero:

    issue graph native v1 valid: 15 managed issues

The managed count is fifteen: the epic and fourteen subissues. Thirteen issues have ExecPlans; the incident subissue does not. If the reviewed native metadata set changes before authorization, revise this plan and repeat review instead of silently changing the expected value.

After U4 and U5 tests pass, preview the provider comparison:

    bun run issue-graph:remote:check

An aligned provider prints `issue graph remote valid: 15 managed issues, 0 operations` and exits zero. Drift prints the sorted operations, performs no writes, and exits one. Operational failures such as missing authentication or an ambiguous provider mapping exit two.

When preview reports only operations permitted by this plan, apply and immediately prove repeatability:

    bun run issue-graph:remote:sync -- --apply
    bun run issue-graph:remote:sync -- --apply

The first command must finish with zero post-check drift. The second must print `issue graph remote valid: 15 managed issues, 0 operations, 0 writes`. Run both even when the initial preview is already aligned; in that case both apply invocations must perform zero writes.

Finish from the repository root:

    bun run check
    git issue fsck
    git diff --check

Commit the branch with a value-focused message, push it, and open a pull request. Push any git-native issue ref immediately after the corresponding `git issue comment` or status mutation; a branch push does not publish issue refs.

---

## Idempotence and Recovery

The offline command is read-only. Repeating it against the same files and refs returns the same ordered diagnostics. It does not fetch, merge, sync, push, or invoke `gh`.

The native setter is the only command in this plan that changes authoritative graph metadata. It fetches the matching remote ref into a temporary ref and compares exact heads and ancestry without merging. When heads are equal and one unique authoritative metadata comment equals the requested canonical payload, it returns zero commits and zero pushes. When heads are equal but metadata differs or the reachable metadata comments have no unique maximum, apply appends one resolving canonical comment and pushes it. When local is behind remote or the refs diverged, it makes no mutation and instructs the operator to run `git issue merge origin`, review the merge, and retry.

When local is ahead of remote, the setter may recover a lost push only when `remote..local` contains exactly one commit, that commit is a `Mandem-Graph-Metadata: v1` comment, and its canonical payload equals the request. It then pushes the existing local ref with zero new commits. Any additional local issue comment, state edit, merge, or metadata commit causes an operator-review error and zero pushes. Apply always pushes `refs/issues/<uuid>:refs/issues/<uuid>` without force.

If the first push response is lost, retry fetches the remote ref. When remote still trails local by exactly the expected metadata commit, retry performs zero commits and one push. When remote and local heads are exactly equal, retry succeeds with zero commits and zero pushes. If remote is a descendant of local, the setter treats local as behind and requires merge and review even when the remote history contains the attempted commit. Disposable-repository tests cover equal, remote-descendant, behind, ahead, diverged, lost-response, and final no-op states.

Remote preview is also read-only. Apply reloads the complete provider snapshot before planning, then re-reads the resource immediately before each write. If the expected current state changed since planning, it discards the remaining operation list, reloads all state, and either continues with a newly sorted plan when every difference remains managed or exits two when the new state is ambiguous or unmanaged.

After each write, apply reads the resource again. A matching desired value completes the operation even if the write response was lost or returned a duplicate/conflict status. A nonmatching value stops the run. A retry never trusts a local completion marker; it reloads GitHub and plans only the remaining differences.

State changes use a field-specific issue patch. Label reconciliation adds or removes only labels named in the native epic issue's `managed_labels`. Milestone reconciliation selects the one milestone whose exact title matches native epic metadata. Hierarchy reconciliation removes a current parent only after proving both current and desired parents are managed. An unmanaged subissue attached to a managed parent produces `IGRAPH-PROVIDER-UNMANAGED-SUBISSUE` before any write; the operator must decide that external relationship separately. These rules preserve provider state outside the reviewed contract.

The command never invokes the repository-wide bridge. If a Provider-ID is missing, the operator may separately preview and run `git issue sync github:BrandonJF/mandem --state all`, review its repository-wide effects, merge and push exact issue refs, and rerun the checker. That bootstrap is not authorized by `issue-graph:remote:sync -- --apply`.

---

## Artifacts and Notes

The first manual reconciliation established these provider relationships: epic issue `#29` contains direct subissues `#21`, `#22` through `#28`, and `#30` through `#32`; U1 issue `#21` contains U1C `#18` and U1A `#20`; U1A `#20` contains incident `#17`. These numbers are evidence for the current repository only and do not appear in plan identity metadata.

The installed `git-native-issue` version is 1.3.3. Its sync command accepts provider, state, and dry-run options but no managed-UUID filter. Its edit command cannot replace an existing issue description, while `git issue comment` can append versioned metadata to the native ref. Those observed constraints are why native issue comments own relationships, the reconciler requires existing Provider-ID mappings, and remote apply never invokes bridge sync.

During implementation, append concise red/green transcripts here for the contract parser, disposable repository, reconciliation retry test, live preview, first apply, and second zero-write apply. Do not paste tokens, complete issue bodies, or large test logs.

---

## Interfaces and Dependencies

The domain layer defines `NativeIssueGraphV1`, `IssueGraphEntry`, `IssueGraphFinding`, `ProviderIssueState`, and a discriminated `IssueGraphOperation` union. The application layer exposes these interfaces:

    interface LocalIssueGraphRepository {
      listIssueRefs(): Promise<readonly string[]>;
      readIssue(issueId: string): Promise<LocalIssueRecord | null>;
      readPlan(path: string): Promise<string>;
    }

    interface IssueGraphProvider {
      readSnapshot(repository: string, mappings: readonly ProviderMapping[]): Promise<ProviderSnapshot>;
      apply(operation: IssueGraphOperation): Promise<void>;
    }

    function checkIssueGraph(input: CheckIssueGraphInput): Promise<CheckIssueGraphResult>;
    function setNativeIssueGraphMetadata(input: SetNativeIssueGraphMetadataInput): Promise<SetNativeIssueGraphMetadataResult>;
    function planIssueGraphReconciliation(input: PlanReconciliationInput): ReconciliationPlan;
    function reconcileIssueGraph(input: ReconcileIssueGraphInput): Promise<ReconcileIssueGraphResult>;

Use `unknown` only at untrusted parse boundaries and narrow it before domain construction. Do not use `any`. `LocalIssueRecord` includes full UUID, local open/closed state, and zero or more provider mappings. `ProviderMapping` includes provider kind, owner, repository, and provider issue number as an adapter value, never as portable identity. `IssueGraphOperation` includes create-or-update managed label, create-or-update milestone, set managed issue state, add managed label, remove managed label, set milestone, add subissue, and move managed subissue.

The API layer exposes `runLocalIssueGraphCheck(options)`, `runSetNativeIssueGraphMetadata(options)`, and `runIssueGraphReconciliation(options)`. All three accept injected ports for tests. Production composition creates filesystem, git-native ref, process-runner, and GitHub adapters. Scripts contain no policy.

The git-native adapter reads the commits reachable from each exact `refs/issues/<uuid>` ref with `git rev-list` and `git cat-file commit`. Version 1 issues use an empty tree and store the record in commit messages. The root commit ends with `State`, `Labels`, `Priority`, optional `Milestone`, and `Format-Version: 1` trailers. Later commits record field changes, Provider-ID lines, ordinary comments, or complete `Mandem-Graph-Metadata: v1` comments. Parse recognized content from raw commit messages, not formatted `git issue show` output. Use `git merge-base --is-ancestor` to select the one metadata commit that descends from every other metadata commit; reject zero metadata comments for a claimed managed issue, incomparable latest comments, unknown versions, multiple distinct GitHub Provider-ID values, mappings to another repository, or a ref whose UUID does not match its ref name. Characterization tests copy representative root, edit, close, Provider-ID, provider-comment, native-metadata, and conflicting-metadata commit messages from the current repository into fixtures.

The GitHub adapter sends `X-GitHub-Api-Version: 2022-11-28`, requests JSON, follows pagination for every list, and uses these endpoints:

- `GET /repos/{owner}/{repo}/issues/{issue_number}` reads provider issue `id`, number, state, milestone, and labels. `PATCH` on the same path sends only `state` or `milestone` for the corresponding operation.
- `GET /repos/{owner}/{repo}/labels` lists definitions. `POST /repos/{owner}/{repo}/labels` creates a missing definition. `PATCH /repos/{owner}/{repo}/labels/{name}` updates only the native-epic-policy color and description.
- `POST /repos/{owner}/{repo}/issues/{issue_number}/labels` adds named managed labels. `DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}` removes one unexpected managed label. Never replace the complete label array.
- `GET /repos/{owner}/{repo}/milestones?state=all` lists milestones. `POST /repos/{owner}/{repo}/milestones` creates the exact managed title. `PATCH /repos/{owner}/{repo}/milestones/{milestone_number}` updates only managed description and due-date fields.
- `GET /repos/{owner}/{repo}/issues/{issue_number}/parent` reads the direct parent; a not-found response means no parent. `GET /repos/{owner}/{repo}/issues/{issue_number}/sub_issues` lists direct subissues.
- `POST /repos/{owner}/{repo}/issues/{parent_number}/sub_issues` with `{"sub_issue_id": <provider issue database id>}` adds a direct subissue. `DELETE /repos/{owner}/{repo}/issues/{parent_number}/sub_issue` with the same payload removes it before a permitted managed move. The fake-adapter test asserts this exact singular delete path and payload.

Treat successful GET, POST, PATCH, and DELETE responses according to GitHub's documented 2xx range. Treat 401 and 403 as authentication or permission failures, 404 as absent only for reads explicitly described above, 409 and 422 as reasons to re-read once, and 429 or a rate-limit 403 as an operational failure that reports GitHub's reset information without sleeping. Parse `gh api` JSON from stdout and render sanitized stderr on failure.

The implementation may add one maintained YAML parser compatible with Bun if U1A has not already added one. Pin the dependency and cover unknown-key rejection in tests. Do not add a GitHub SDK; `gh api` is the only provider process dependency.

---

## Verification Contract

| Gate | Command from repository root | Expected result |
| --- | --- | --- |
| Focused graph tests | `bunx vitest run src/modules/architecture-standard/domain/issue-graph-policy.test.ts src/modules/architecture-standard/application/use-cases/check-issue-graph.test.ts` | All local contract tests pass. |
| Focused reconciliation tests | `bunx vitest run src/modules/architecture-standard/application/use-cases/plan-issue-graph-reconciliation.test.ts src/modules/architecture-standard/application/use-cases/reconcile-issue-graph.test.ts src/modules/architecture-standard/infrastructure/services/github-issue-graph-provider.test.ts` | Planning, apply, retry, and idempotence tests pass. |
| Script integration | `bunx vitest run scripts/check-issue-graph.test.ts scripts/set-issue-graph-metadata.test.ts scripts/reconcile-issue-graph.test.ts` | Disposable-repository, native setter, and provider command behavior pass. |
| Local graph | `bun run issue-graph:check` | Exits zero with the contract version and managed count; no network process runs. |
| Git-native storage | `git issue fsck` | Reports no corrupt local issue objects or refs. |
| Canonical gate | `bun run check` | Every repository check passes without GitHub credentials. |
| Remote comparison | `bun run issue-graph:remote:check` | Exits zero and reports no managed GitHub drift. |
| Idempotent apply proof | `bun run issue-graph:remote:sync -- --apply` twice | Both runs finish with zero post-check drift; the second run reports zero writes. |
| Diff hygiene | `git diff --check` | Produces no output. |

Remote comparison requires authenticated `gh`, network access, and permission to read the configured repository. Apply additionally requires issue write permission. CI must run every gate except the two remote commands and the live apply proof.

---

## Definition of Done

- Native `Mandem-Graph-Metadata: v1` comments include the epic, WI1, U1, U1C, U1A, its incident subissue, and U2-U10 with full UUID relationships, and every exact issue ref was pushed.
- Every managed plan contains the required machine-readable relationship fields and agrees with its authoritative native issue metadata.
- The offline checker reports stable rule IDs, rejects every scenario in R4-R6, runs without credentials, and is part of `bun run check`.
- Remote preview reports all managed projection drift without mutation.
- Remote apply changes only declared fields, passes the interrupted-run tests, and performs zero writes on a second run.
- The live GitHub projection has the native issue states, declared direct hierarchy, milestone, and managed labels, while all unrelated provider data remains intact; unmanaged subissues under managed parents fail closed before writes.
- Documentation explains creation, checking, preview, apply, retry, and ownership boundaries.
- `git issue fsck`, all focused tests, `bun run check`, `git diff --check`, and the remote comparison pass.
- The implementation branch is committed, pushed, and represented by an open pull request. The worker does not merge it.

---

## Progress

- [x] (2026-07-28 20:26Z) Recorded the tracking issue and observed the bridge gaps from the first Mandem v1 GitHub projection.
- [x] (2026-07-28 20:26Z) Drafted this implementation-ready issue ExecPlan with explicit idempotence, retry, and ownership rules.
- [x] (2026-07-28 20:36Z) Repaired the first clean-room findings by removing repository-wide bridge calls and unsupported issue-description edits, defining the full graph and provider contract, and resolving state and zero-write semantics.
- [x] (2026-07-28 20:40Z) Revised the contract after operator clarification so native issue refs own all graph and provider-policy inputs and GitHub is a one-way derived projection.
- [x] (2026-07-28 20:47Z) Completed clean-room, coherence, and feasibility review; the later vocabulary correction invalidated that reviewed revision.
- [x] (2026-07-28 21:24Z) Completed fresh clean-room, coherence, and feasibility review of the revised vocabulary contract and resolved both blocking findings.
- [ ] Obtain operator approval of the exact reviewed revision.
- [ ] Change only authorization metadata to `promotion: executable` and `execution_authorized: true`.
- [ ] Rebase an isolated implementation worktree on merged U1A and complete Steps 1-6 in order.
- [ ] Open the implementation pull request and record verification evidence.

## Surprises & Discoveries

- Observation: `git-native-issue` version 1.3.3 exported initial labels but did not project later milestone or phase-label edits to existing GitHub issues during the 2026-07-28 reconciliation.
  Evidence: The local sync completed, but direct GitHub reads still showed missing milestone and phase-label state until explicit API writes corrected them.
- Observation: The installed CLI has no local command for native parent or dependency relationships, while GitHub exposes parent and subissue relationships separately.
  Evidence: The documented CLI command set and local help contain issue CRUD, merge, sync, and provider mappings, but no structured parent or dependency mutation command.
- Observation: Current issue ExecPlan identity metadata is incomplete or abbreviated.
  Evidence: U1A contains `issue_id: 745eda8`, while multiple U2-U10 scaffolds contain no `issue_id`.

## Decision Log

- Decision: Store the authoritative relationship graph in versioned git-native issue comments and compare it with plan frontmatter.
  Rationale: The operator identified native issues as the authoritative work ledger. Plans repeat portable identity for execution safety, and GitHub remains a derived provider projection.
  Date/Author: 2026-07-28 / Codex
- Decision: Keep remote reconciliation outside `bun run check`.
  Rationale: Canonical validation must run without credentials or network access, and external mutation requires explicit operator intent.
  Date/Author: 2026-07-28 / Codex
- Decision: Preserve unmanaged provider fields and fail on unmanaged re-parenting.
  Rationale: The command must be repeatable without claiming ownership of unrelated GitHub state.
  Date/Author: 2026-07-28 / Codex
- Decision: Require a second zero-write apply as acceptance evidence.
  Rationale: Automated tests prove modeled idempotence; the repeated live command proves the adapter observes the real provider state consistently.
  Date/Author: 2026-07-28 / Codex
- Decision: Use epic, issue, and subissue as the only hierarchy terms.
  Rationale: A subissue describes parentage only. Labels such as bug and incident classify issues independently, which avoids duplicate names and overloaded hierarchy meanings.
  Date/Author: 2026-07-28 / Codex

## Outcomes & Retrospective

Planning is being revised and is not authorized. No implementation or provider mutation is authorized by this revision.

Revision note (2026-07-28): Created WI1 after the initial manual Mandem v1 GitHub projection exposed bridge gaps. The plan makes local relationships machine-readable, defines a deterministic offline check, and specifies an explicit idempotent reconciliation command with retry and provider-ownership boundaries.

Revision note (2026-07-28): Repaired first-pass clean-room findings. The reconciler now refuses missing mappings instead of invoking the repository-wide bridge, reads git-native version 1 records from raw Git commits instead of requiring unsupported description edits, includes the complete reviewed graph and provider definitions, manages mapped issue state explicitly, and defines exact commands, interfaces, endpoints, exit codes, retry behavior, and API composition.

Revision note (2026-07-28): Clarified authority after operator feedback. Versioned comments in native issue refs now own the graph and provider policy; plan frontmatter is a checked cross-reference, and GitHub is only a projection. Removed the hand-edited manifest design, added deterministic conflict handling for concurrent metadata comments, covered state and unmanaged-subissue planning, and corrected GitHub's singular subissue removal endpoint.

Revision note (2026-07-28): Standardized the model on epic, issue, and subissue. Removed hierarchy kinds and the program, work-item, unit, child-item, support-item, and corrective-item synonyms. Classifications such as bug and incident are independent labels.
