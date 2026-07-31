# WI1 engineering process audit

The root agent completed WI1, merged its implementation, verified the result on `main`, closed the
native issue, aligned GitHub, and changed U2 from blocked to planned. This audit evaluates that
process. It focuses on exact authorization, native issue ownership, deterministic reconciliation,
review effectiveness, recovery behavior, and changes that should improve U2 delivery.

## Scope and evidence

This audit covers work from the WI1 planning revision through the U2 planning handoff. It draws
from:

- native issue `6a6a8bab-853f-4658-9bc0-38e2386b642d` for WI1;
- native issue `cb67d131-975c-4d97-9a6f-4934be991ac6` for U2;
- planning PR [#33](https://github.com/BrandonJF/mandem/pull/33);
- implementation PR [#35](https://github.com/BrandonJF/mandem/pull/35);
- planning merge `645f32287b96d0fe22086e8a16deb7d64071bc04`;
- implementation merge `2efc4d7cf1f8e968ca38c46938014185d825ca8b`;
- the WI1 ExecPlan and its living records;
- the implementation commits between those merges;
- local tests, native issue integrity checks, GitHub Actions, and live projection checks;
- the orchestration trace for approval, authentication, review, and recovery decisions.

The command examples identify consequential command families. They omit routine reads and status
polls. The repository still does not contain a complete machine-readable session transcript.

## Outcome

| Result | Evidence |
| --- | --- |
| WI1 plan merged | PR #33, merge `645f32287b96d0fe22086e8a16deb7d64071bc04` |
| Native graph populated | 15 managed issue refs; repeated apply reported 0 commits and 0 pushes |
| GitHub projection aligned | First approved transaction performed 5 writes; its repeat performed 0 writes |
| WI1 implementation merged | PR #35, head `a9331a894df2af7ae25dd6ae71075c7e50aadd81`, merge `2efc4d7cf1f8e968ca38c46938014185d825ca8b` |
| Post-merge verification passed | 27 test files, 118 tests, 16 native issues valid |
| WI1 closed | Native issue fixed by `2efc4d7`; GitHub issue #25 closed and aligned |
| U2 released for planning | Native issue `cb67d13` and GitHub issue #30 labeled `planned` |
| Final projection proved idempotent | 3 writes for the WI1/U2 transition, then 0 writes; 15 managed issues and 0 remaining operations |

## Process rules used

| Source | Effect |
| --- | --- |
| `.agents/OPERATING.md` | Required native issue orientation, canonical issue vocabulary, exact conversation approval, Bun commands, TDD, isolated worktrees, and repository-owned policy. |
| `PLANS.md` | Required a self-contained living ExecPlan, observable acceptance, recovery instructions, and continued execution through approved milestones. |
| WI1 ExecPlan | Defined native refs as authoritative, GitHub as a one-way projection, complete transaction digests, managed provider fields, and zero-write retry acceptance. |
| `track-git-native-issues` | Made native issues the first status record and required every meaningful issue mutation to be pushed by its exact ref. |
| `write-clearly` | Controlled issue comments, plans, documentation, PR text, commit messages, and operator updates. |
| Operator responses | Authorized only the immutable target stated immediately before each standalone `APPROVED`. |

The root agent applied skills as procedures within the approved scope. A skill did not authorize a
new provider write, graph mutation, or merge.

## Roles and review assignments

The root agent performed the implementation and retained responsibility for authorization,
provider writes, issue-ref publication, PR creation, merge, and post-merge verification. Three
existing review agents received bounded read-only assignments.

| Reviewer | Assignment | Result |
| --- | --- | --- |
| `clean_room_review` | Check whether a fresh reader could prove safe native-ref application and recovery. | Found missing full-batch preflight and a lost-push state hidden by local metadata equality. Final re-review reported no findings. |
| `feasibility_review` | Test interruption, retry, approval, transaction, and provider-snapshot behavior. | Found non-retryable parent changes, stale approval risk, lost-push and lost-response defects, and snapshot ownership gaps. A follow-up found one unstable operation key. Final re-review reported no findings. |
| `coherence_review` | Compare implementation, plans, and operating vocabulary. | Found orphaned ExecPlans that local discovery missed and active hierarchy aliases that the vocabulary check did not cover. Final re-review reported no findings. |

No reviewer received merge permission. The root agent requested exact merge approval only after
all three review tracks reported no actionable findings and GitHub Actions passed.

## Orchestration timeline

### 1. Revised and authorized the WI1 plan

The operator clarified three design rules while the plan was under review:

1. Native issue refs hold the authoritative issue state.
2. GitHub is a derived projection and never writes authoritative state back into native issues.
3. Epic, issue, and subissue are the only hierarchy terms. Classification labels such as bug and
   incident do not create new hierarchy levels.

The root agent updated repository operating standards and the WI1 ExecPlan, then ran clean-room,
coherence, and feasibility reviews. A later vocabulary correction invalidated the first reviewed
revision, so the root agent repeated review rather than treating the earlier verdict as current.

The final reviewed plan target was:

```text
plan commit: 81d91b4608ddffbb4d4fbe2de1d22ca1f394a7cd
plan SHA-256: 4585680643841ee453904bf378a55f2008fceb9c7ce540ee37be5fc259df0aca
```

The operator sent standalone `APPROVED`. The root agent recorded that response as a canonical
`Mandem-Approval: v1` comment on the WI1 native issue before execution.

### 2. Resolved the planning merge prerequisite

The first attempt to merge planning PR #33 exposed a repository-rule dependency: the required
repository-quality workflow was not yet available on `main`. U1A had to merge first so later PRs
could satisfy that rule.

GitHub also required a refreshed CLI authorization before the session could update workflow files.
This was a credential-scope issue, not a limitation of `git` or `gh`. The operator completed the
interactive authorization once, after which ordinary branch pushes and PR operations continued
through the CLI.

After U1A supplied the workflow, the root agent recorded approval for exact PR #33 head
`eff81485a2e3bf115c042906604fa08414d6f20c` and merged it as `645f322`.

### 3. Implemented offline graph validation

The first implementation commits added:

- versioned native graph metadata parsing;
- plan frontmatter identity checks;
- parent, dependency, promotion, and authorization validation;
- raw Git parsing for native issue event chains;
- stable findings for malformed or conflicting records;
- the `bun run issue-graph:check` offline command;
- a vocabulary check joined to `bun run check`.

The offline command uses no credentials or provider reads. It now validates 15 managed issues and
independently enumerates checked-in issue ExecPlans, so deletion of a native issue ref cannot hide
an orphaned plan.

### 4. Applied the native graph under exact approval

The native graph operation affected 15 independent refs. Before mutation, the command printed a
complete target containing:

- a graph digest;
- every approved baseline ref head;
- a digest of that ref map; and
- the exact implementation commit.

The operator approved that complete target. The writer appended deterministic metadata commits and
pushed each exact ref with a lease. The first accepted run produced 15 commits and 15 pushes. Its
immediate repeat produced 0 commits and 0 pushes.

Two discoveries required new targets rather than silent correction:

- The incident issue had both `incident` and `u1a` labels, while the first desired-state file
  expected only `incident`.
- The native epic policy parser preserved YAML quote characters in managed label definitions.

The root agent corrected each reviewed input, requested approval for the changed immutable target,
and reran the guarded apply. The final correction changed one epic metadata commit; its repeat
performed zero writes.

### 5. Implemented deterministic GitHub projection

The implementation separated provider work into three stages:

1. Read GitHub and compute a sorted operation list without mutation.
2. Store the complete provider snapshot and operation list in an immutable native transaction
   comment.
3. Apply only the exact approved transaction after verifying its digests and approval ref.

The adapter manages only fields declared by the native epic policy: selected label definitions,
selected labels on issues, one milestone, issue state, and managed parent relationships. Provider
numbers remain adapter data. Native UUIDs remain the portable identity.

The first live transaction contained five operations. After exact approval, the command performed
five writes, reread GitHub after every write, and finished with no drift. Its immediate repeat
performed zero writes.

### 6. Repaired implementation review findings

The first review round found defects that the initial green suite did not cover.

| Finding | Risk | Repair |
| --- | --- | --- |
| Local metadata equality skipped writer classification. | A lost push or changed remote ref could appear complete. | Added full writer inspection and required local and remote heads to equal the accepted baseline before skipping. |
| Native refs were checked and written one at a time. | A later invalid ref could be discovered after earlier writes. | Added a complete preflight of every managed ref before the first write. |
| Parent removal and addition formed one provider operation. | Interruption between the two API calls was not retryable as an exact suffix. | Split removal and addition into separate operations. |
| The add-operation key changed after removal. | A valid partial move looked like unapproved provider drift. | Assigned the add operation one stable key and added a partial-removal regression test. |
| Approval was checked only before the first provider write. | Approval could change during a multi-write transaction. | Rechecked the exact local and remote approval ref before every GitHub mutation. |
| Transaction preparation did not recover a lost push. | A locally created transaction could not be republished safely. | Added direct-child recognition and an exact leased retry. |
| Lost responses reported zero writes. | Operational evidence understated attempted mutation. | Counted each attempted provider write before awaiting its response. |
| Approved snapshots included unmanaged fields. | Unrelated GitHub labels could invalidate an approved transaction. | Hashed and stored only provider fields managed by the native policy. |
| Plan discovery began from native issue refs. | A checked-in plan with a missing issue ref could disappear from validation. | Enumerated plan paths independently and required one matching native issue. |
| Vocabulary detection covered too few active aliases. | Maintained plans could reintroduce nonstandard hierarchy terms while checks passed. | Expanded the finite checker, migrated maintained prose, and added regression cases for each added form. |

After repair, the repository passed 118 tests. All three reviewers rechecked the exact final
revision and reported no actionable findings.

### 7. Opened, watched, and merged the implementation PR

The root agent committed the review repairs as `a9331a8`, pushed
`feat/wi1-issue-graph-integrity`, and opened PR #35. The PR description stated the ownership model,
retry design, live write counts, and validation evidence.

The repository-quality workflow passed. The PR remained clean, mergeable, and free of review
feedback through the five-minute settle period. The root agent then stated one merge action and its
immutable target:

```text
repository: BrandonJF/mandem
pull request: 35
head: a9331a894df2af7ae25dd6ae71075c7e50aadd81
```

The operator sent standalone `APPROVED`. The guarded merge command verified the recorded approval
and current GitHub head, then merged PR #35 as `2efc4d7`.

### 8. Corrected a malformed approval record

The root agent's first attempt to record the PR #35 merge approval placed `recorded_at` outside the
`evidence` object. The guarded merge command rejected the record before any merge attempt.

Appending a corrected approval was not sufficient. The approval selector parses every commit whose
message starts with `Mandem-Approval: v1` and fails when any such commit is malformed, including an
older ancestor. The root agent therefore:

1. identified the malformed head `6bfb3c27eb015e8e4eac4fc2c30a6c913e4487d6`;
2. moved only the WI1 issue ref back to its known parent;
3. appended the canonical approval with the same operator response, target, and timestamp; and
4. replaced the remote head under an exact `--force-with-lease` expectation.

The rejected commit remains recoverable by its SHA. The canonical replacement is
`bad126a1ed03f6b7dfc296f866211844eed8bf89`.

This recovery was controlled, but the design is unnecessarily fragile. The serializer should be
the only normal path for recording approval. The selector should also report malformed records
without making every unrelated future approval permanently unusable, while still failing closed
for a malformed record that could match the requested target.

### 9. Verified `main`, closed WI1, and released U2 for planning

After merge, the root agent fast-forwarded local `main` and ran:

```bash
bun run check
git issue fsck
bun run issue-graph:remote:check
```

The code gate passed 27 test files and 118 tests. Native integrity passed for all 16 issue refs.
GitHub had automatically closed issue #25 because PR #35 used `Fixes #25`, while the native WI1
issue was still open. The remote comparison reported that difference instead of treating GitHub as
authoritative.

The root agent then removed WI1's status label, closed the native issue with merge `2efc4d7`, and
changed U2 from blocked to planned after confirming all three native dependencies were closed.
Those authoritative changes produced a final three-operation GitHub transaction:

- remove `blocked` from WI1;
- remove `blocked` from U2; and
- add `planned` to U2.

The operator approved the exact transaction. The first apply performed three writes, the repeat
performed zero writes, and the final comparison reported 15 managed issues and 0 operations.

## Commands and controls

### Native issue status and publication

```bash
git issue merge origin
git issue ls --state open --format full --sort priority
git issue show <uuid>
git issue comment <uuid> -m '<canonical record or status>'
git issue fsck
git push origin refs/issues/<uuid>
git ls-remote origin refs/issues/<uuid>
```

A branch push never substituted for an issue-ref push. The root agent verified the remote ref after
every approval and other consequential issue transition.

### Graph validation and native apply

```bash
bun run issue-graph:check
bun run issue-graph:native:apply -- --approval-issue <uuid> --file <graph.yaml>
bun run issue-graph:native:apply -- --approval-issue <uuid> --file <graph.yaml> --apply
```

Preview did not mutate native refs. Apply required a canonical approval that matched every digest,
baseline, and implementation commit.

### GitHub projection

```bash
bun run issue-graph:remote:check
bun run issue-graph:remote:sync -- --approval-issue <uuid>
bun run issue-graph:remote:sync -- --approval-issue <uuid> --apply
```

Remote check was read-only. Sync preparation wrote only the immutable native transaction. Apply
required exact approval and changed only policy-managed GitHub fields.

### Merge

```bash
bun run pr:merge:approved -- \
  --issue <uuid> \
  --repository BrandonJF/mandem \
  --pull-request 35 \
  --head a9331a894df2af7ae25dd6ae71075c7e50aadd81
```

The command reread the PR head before merge and used GitHub's matching-head protection.

## What worked

1. Exact approval targets prevented broad conversational approval from authorizing changed plans,
   graph inputs, provider operations, or PR heads.
2. Native issue refs remained authoritative even when GitHub automatically changed issue state.
3. Read-only planning separated diagnosis from mutation and made every provider write reviewable.
4. Immediate zero-write repeats proved idempotence against the real native refs and GitHub state.
5. Independent reviewers found interruption and ownership defects that ordinary success-path tests
   missed.
6. The implementation encoded review findings as regression tests instead of relying on prose.
7. The final U2 transition used the same projection mechanism as implementation-time changes.

## What should improve for U2

### Generate approval records

Agents should not hand-format canonical approval comments. Add one command that accepts the
immutable target, serializes it with `serializeApproval`, appends it to the selected native issue,
pushes the exact ref, and verifies the remote head. Test the complete recording path, including the
final newline and nested evidence fields.

### Make malformed-history handling precise

The selector currently lets one malformed approval-shaped ancestor disable every later approval
request on that issue. Preserve fail-closed behavior for the requested action and target, but
define a recovery rule that does not require rewriting a published issue ref for an unrelated
malformed record.

### Derive status transitions before projection preparation

Closing WI1 and releasing U2 required a second projection transaction after merge. This was
correct, but the expected post-merge native transitions should be listed before requesting merge
approval so the operator can see the complete remaining sequence.

### Remove remaining historical hierarchy aliases from current issue fields

The latest native metadata and status comments use epic, issue, and subissue, but initial issue
descriptions and some unmanaged classification labels still contain older terms. Immutable history
should remain unchanged. Editable current fields and managed labels should be migrated through a
separate reviewed graph change if the repository intends the vocabulary rule to apply to them.

### Persist an orchestration manifest

The audit still required reconstruction from chat, commits, issues, plans, PRs, and provider state.
A machine-readable run record should identify:

- selected issue and ExecPlan;
- immutable approval targets and approval commits;
- native and provider transactions;
- agents and review assignments;
- test commands and results;
- PR heads and merge commits; and
- recovery events such as lost pushes or replaced malformed records.

## Practices to carry into U2

1. Start from the native U2 issue and its complete ExecPlan.
2. Revalidate every dependency against its merged output before expanding the scaffold.
3. Keep implementation authorization false until the exact reviewed plan is approved.
4. Use one serializer-backed command for every approval record.
5. Design each write as an idempotent operation with a stable identity and observable completion.
6. Test lost responses, lost pushes, partial batches, concurrent changes, and third-state drift.
7. Run independent clean-room, feasibility, and coherence review before opening the implementation
   PR.
8. Require the full gate, exact-head checks, and a settled PR before requesting merge approval.
9. Plan the native completion transition and GitHub projection as explicit post-merge work.
10. Finish with a zero-write repeat and a read-only comparison that reports no remaining operations.

