# U2 orchestrator reset handoff

The U2 planning work is durable in Git and the pushed git-native issue refs. One guarded change
remains unapplied: the native issue graph still records the former combined U2 structure. A fresh
orchestrator must preview that graph change again and obtain standalone approval for the new exact
target before applying it.

## Read first

From `/home/brandonjf/dev/work/mandem`, read these files completely before acting:

1. `AGENTS.md`
2. `.agents/OPERATING.md`
3. `.agents/skills/write-clearly/SKILL.md` and its complete style guide
4. `.agents/skills/track-git-native-issues/SKILL.md`
5. `PLANS.md`
6. `docs/plans/2026-07-21-001-feat-mandem-plan.md`
7. `docs/plans/issues/u2-protocol-lifecycle-sqlite.md`
8. `docs/plans/issues/u2b-durable-storage-recovery.md`
9. `docs/plans/issues/mandem-v1-issue-graph.yaml`
10. native issues `cb67d131-975c-4d97-9a6f-4934be991ac6` and
    `5abb076c-c5ba-41da-aeab-089664360dbb`

## Durable repository state

- Branch: `docs/u2-lifecycle-plan`.
- Draft planning PR: `BrandonJF/mandem#37`.
- Failed-review policy commit: `59da747c4aafe04eec83a1f7e5e8501ed2adad0f`.
- Split-plan commit: `fcbc95964ba375a08f8721f8c71efdeb639c4265`.
- Sorted graph-manifest commit: `4e1785f4eefd1b75a49c3a4fe4ffbb63c59ffaab`.
- The branch is pushed through `4e1785f` before this handoff commit.
- The former combined plan is recoverable at
  `2b53f63cc87df641cde998b59f92127729756f7d`.
- All thirteen clean-room prompts and exact reviewer-authored outputs are committed under
  `docs/plans/reviews/` and pushed.

The former U2 issue is now planned as U2A in the checked-in manifest:

- Issue UUID: `cb67d131-975c-4d97-9a6f-4934be991ac6`.
- Purpose: define requests, allowed work changes, agent control, review binding, approval binding,
  and failed-review limits.
- Plan: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md`.
- Status: replanning; not ready for clean-room review or implementation.

The new U2B issue exists and its ref is pushed:

- Issue UUID: `5abb076c-c5ba-41da-aeab-089664360dbb`.
- Short ID: `5abb076`.
- Purpose: store accepted U2A facts, return exact retry results, complete Git checkpoints, migrate
  safely, and reconstruct work after restart.
- Plan: `docs/plans/issues/u2b-durable-storage-recovery.md`.
- Status: blocked by U2A; not ready for clean-room review or implementation.

U3 now depends on U2B in its checked-in plan. The epic and issue registry describe the order as
U2A, U2B, then U3. U4 and later workflow issues continue to consume U2A's work-control rules and
receive durable runtime behavior transitively through U3.

## Why the split happened

The former combined plan received thirteen `CHANGES_REQUIRED` verdicts. The reviewers found real
gaps, but the author repaired one finding at a time and asked another reviewer to find the next
one. Clean-room review had become the main design process.

The shared process now requires:

- a behavior-readiness check before review;
- a stop and whole-plan rewrite after three failed verdicts;
- an operator choice after five failed verdicts;
- one lifetime failure count that does not reset after a rewrite.

The operator chose to split U2. Issue `cb67d13` records process finding
`5f05725e-cdcb-417e-8aba-faea74b49778` as disposition-complete for that response.

## Pending guarded issue-graph change

Do not treat the checked-in graph as applied. The new U2B ref is pushed, but native metadata on U2A,
U2B, U3, and the epic still needs the approval-guarded graph operation.

The last preview before this handoff commit reported:

    action: set-issue-graph
    repository: BrandonJF/mandem
    graph_sha256: 007be9a3178bd3e817dfa72e9038346c001f3a0678f71df0ec76d99f15e813e4
    issue_refs_sha256: c97639dcfb7fc7757f852538a7dbe2489d4db0317c2f42f6bbd92758c1081307
    implementation_sha: 4e1785f4eefd1b75a49c3a4fe4ffbb63c59ffaab

That preview becomes stale when this handoff commit changes the branch head. Do not ask the operator
to approve or apply those old values. Recompute the target after pulling this handoff commit:

    bun run issue-graph:native:apply -- --file docs/plans/issues/mandem-v1-issue-graph.yaml

State the returned `set-issue-graph` action, repository, graph digest, issue-ref baseline digest,
and implementation commit. Ask for standalone `APPROVED` or `DENIED`. If approved, record the exact
response in the required approval issue, push and verify that issue ref, then run the guarded apply
with its documented `--approval-issue` and `--apply` arguments. Run the preview again afterward and
expect zero pending native metadata changes.

Do not update any issue comment between the final preview and approval. Such a comment changes an
issue-ref baseline and invalidates the target.

## Validation state

Before the split, commit `59da747` passed `bun run check`: 27 test files and 118 tests. After the
split, these checks passed:

    git diff --check
    bun run docs:audit
    bun run authored-files:check
    bun run vocabulary:check

`bun run issue-graph:check` currently fails because the native metadata has not received the guarded
split update. The observed failures name U3's old dependency metadata and U2B's missing metadata.
This is the expected pending mutation, not approval to bypass the guarded writer. Run the complete
`bun run check` only after the approved native graph apply, then record its actual result.

## Resume sequence

1. Pull `docs/u2-lifecycle-plan` and verify the worktree is clean.
2. Merge issue refs from `origin` and read U2A and U2B completely.
3. Recompute the native issue-graph target without changing any issue ref afterward.
4. Request exact standalone approval and apply only through the guarded command if approved.
5. Verify the apply is idempotent, run `bun run check`, and update both issue refs with the verified
   result.
6. Continue U2A planning locally. Complete its seven readiness rows and exact execution
   instructions before any reviewer starts.
7. Do not start U2B planning beyond its scaffold until U2A publishes reviewed and approved public
   values.
8. Do not request implementation approval for either issue until its own plan passes a valid clean
   review within the new limits.

## Prohibited assumptions

- The user's earlier `yes` authorized the scope split and creation of U2B. It was not standalone
  approval of the later immutable `set-issue-graph` target.
- No earlier U2 clean-room verdict approves U2A or U2B.
- No implementation is authorized.
- PR #37 is a planning timeline. Its existence does not approve execution or merge.
- Do not dispatch a fourteenth reviewer against the former combined plan.
