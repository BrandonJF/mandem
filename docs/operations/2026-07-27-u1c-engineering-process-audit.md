# U1C engineering process audit

The root agent completed the authorized U1C correction, closed git-native issue `5717221`, and
stopped before unauthorized U1A implementation. This audit records the process that led to that
outcome, including U1A revalidation through planning PR
[#14](https://github.com/BrandonJF/mandem/pull/14). It compares the observed process with Mandem's
intended process and identifies practices that can transfer to other repositories.

## Scope and evidence

This is a retrospective of one harness session. It draws from:

- the session's orchestration trace;
- git-native issues `5717221` and `745eda8`;
- planning PR #12 and implementation PR #13;
- merge commits `3ac5c4` and `27d4abe`;
- the U1C and U1A issue ExecPlans;
- commits and test evidence recorded in those plans and issues.

The command lists identify each consequential command family and show representative commands
preserved in the session trace. They omit repeated status polls and repeated reads unless those
calls changed a decision. The repository contains no machine-readable transcript, so these lists
are not a complete shell history.

## Outcome

The following table provides the completion evidence.

| Result | Evidence |
| --- | --- |
| U1C planning authorization merged | PR #12, merge `3ac5c4124533c0de0217b4569b09bc068893b63c` |
| U1C implementation merged | PR #13, reviewed head `686d4e2`, merge `27d4abe1a2815bfef1bec56c71bc6d90880ef035` |
| U1C issue closed | git-native issue `5717221`, fixed by `27d4abe` |
| Post-merge validation passed | 26 tests, build, four executable probes, four package-contract tests |
| U1A dependency revalidated | PR #14, head `148819e`, plan SHA-256 `8559c4da...f321ad` |
| U1A authorization preserved | `execution_authorized: false` |

## Where the process came from

The root agent applied repository rules, the approved plan, installed skills, and its own judgment.
Each source constrained a different part of the work.

| Source | How the root agent used it |
| --- | --- |
| Harness system and developer instructions | Use commentary updates, preserve user changes, prefer `rg`, use `apply_patch`, avoid destructive actions, verify work, and use available skills when their descriptions match the task. |
| Repository `AGENTS.md` | Read `CLAUDE.md`; use a repository-root `PLANS.md` ExecPlan for significant work; execute only a self-contained issue plan with `execution_authorized: true`. |
| Repository `CLAUDE.md` | Read the writing skill before prose; use Bun; avoid `any`; use behavior-first tests; keep ExecPlan living sections current; use isolated worktrees; have workers commit, push, and open PRs without merging. |
| Repository `PLANS.md` | Bind implementation to the complete approved issue ExecPlan, record exact approval, maintain living records, use clean-room review, and treat the epic plan as context rather than implementation authority. |
| Approved U1C issue ExecPlan | Specified the permitted correction, milestones, red-green tests, validation, review, Learn step, PR handoff, and completion evidence. |
| Compound Engineering skills | Provided detailed operating procedures for worktrees, execution, simplification, code review, PR work, and the optional Learn artifact decision. |
| GitHub plugin skill | Provided GitHub orientation and connector guidance. The root agent used `gh` for most mutations because the required operations were available locally. |
| Codex orchestration judgment | Chose which matching skills to load, divided work among agents, ordered review and repair loops, selected focused validation commands, and decided when evidence was sufficient to merge. |
| Operator approval | The operator authorized only the exact U1C planning PR head and plan hash; they did not authorize U1A. |

Codex selected matching installed skills because its system instructions required it to do so.
Therefore, the installed skills' availability and descriptions affected the session's default
process even though Mandem did not explicitly name Compound Engineering.

## Skills used

### Skills executed

| Skill | Why the root agent selected it | Effect on the work |
| --- | --- | --- |
| `write-clearly` | `CLAUDE.md` requires it for all repository prose. | Controlled chat updates, plan edits, issue comments, commit messages, and PR descriptions. |
| `compound-engineering:ce-work` | The operator approved execution of a concrete, self-contained issue ExecPlan. | Supplied the end-to-end implementation workflow and shipping tail. |
| `compound-engineering:ce-worktree` | Both repository rules and the skill require isolated implementation work. | Led to separate U1C implementation and U1A revalidation worktrees. |
| `compound-engineering:ce-simplify-code` | The full tests had passed, and the worker needed a behavior-preserving cleanup pass. | The worker made three small simplifications before final review. |
| `compound-engineering:ce-code-review` | The approved plan required independent correctness and maintainability review. | The reviewers completed two structured review rounds, and the worker made test-first repairs. |
| GitHub general orientation skill | The task involved issue and PR state. | Supplied repository and PR handling guidance. |

### Skills inspected but not executed

| Skill | Decision |
| --- | --- |
| `compound-engineering:ce-compound` | The root agent evaluated whether to add a `docs/solutions/` learning. It decided that regression tests and the published architecture standard captured the reusable lesson more directly, so it did not create another document. |

### Skills not used

The root agent did not invoke the full autonomous `lfg` pipeline. The operator approved a bounded
ExecPlan, and Mandem's rules required exact authorization, living-plan maintenance, independent
review, and controlled merge decisions. The root agent therefore orchestrated those steps directly.

It also did not use `ce-babysit-pr`. PR monitoring was short-lived and synchronous in this session,
and the root agent completed the review and merge sequence without a continuing watch loop.

## Agents used

The root Codex agent remained responsible for authorization, orchestration, merge decisions,
post-merge verification, issue state, and U1A revalidation.

| Agent | Harness identity | Assignment | Result |
| --- | --- | --- | --- |
| Root orchestrator | `/root` | Bind approval, authorize the plan, dispatch work, manage reviews, merge exact heads, validate `main`, update issues, and revalidate U1A. | Completed the workflow and preserved the U1A authorization boundary. |
| U1C implementation worker | `/root/implement_u1c` (`Helmholtz`) | Execute the complete authorized U1C issue ExecPlan in the implementation worktree using TDD; commit, push, and open PR #13 without merging. | Implemented U1C and returned final head `686d4e2`. |
| U1C review worker | `/root/review_u1c_final` (`Boyle`) | Review the implementation independently. | Performed an independent U1C review; the U1C plan records its findings and the subsequent repairs. |
| U1C exact-head verifier | `/root/verify_u1c_clean` (`Dalton`) | Verify the exact final PR head, including the living-record-only final commit. | Reported CLEAN at `686d4e2`; confirmed code, tests, package metadata, and instructions had not changed since the reviewed code head. |
| U1A revalidation reviewer | `/root/review_u1a_revalidation` | Perform read-only clean-room review of the revised U1A plan against corrected U1C. | Found four specification defects across successive rounds; reported CLEAN after repair. |

The root agent gave the implementation worker the complete authorized issue ExecPlan as its only
implementation instructions. The review agents received read-only, bounded assignments. No agent
received permission to merge.

## Orchestration timeline

### 1. Bound the operator's approval

The root agent treated `Approved` as approval of:

- planning PR #12 head `75817d04b68cc29323ab1eaa6d9fdcec00d47fa0`; and
- U1C plan SHA-256 `1f87f07a4976ba8266cc707a5e9a7930501545137bd8336e8993303590a81231`.

It did not treat the message as general approval of U1A or later issues.

The agent recorded the approval in git-native issue `5717221`, changed only authorization metadata
and living records, ran an independent verification, committed the authorization as `b71a2e3`, and
merged PR #12 as `3ac5c4`.

This sequence came from `PLANS.md`, the U1C issue plan, and the issue's restart handoff.

### 2. Created isolated implementation state

The root agent created:

```text
/home/brandonjf/dev/work/mandem-worktrees/u1-correction
branch: fix/u1-architecture-package
base: 3ac5c4124533c0de0217b4569b09bc068893b63c
```

The root agent then dispatched the U1C implementation worker. This followed `CLAUDE.md`,
`ce-worktree`, and the approved plan.

### 3. Ran red-green implementation

The worker first ran seven intended failing cases: six architecture-checker behavior groups and one
package-binary contract.

It then implemented:

- package lifecycle and installable binary contracts;
- authored-source path policy;
- architecture scanner and evaluator corrections;
- repository traversal updates;
- focused tests and documentation.

The worker opened draft PR #13. The root did not merge at this point.

### 4. Simplified the green implementation

During the `ce-simplify-code` pass, the worker made three behavior-preserving changes:

- reused `isExcludedAuthoredPath`;
- precomputed directory prefixes;
- tokenized each source file once.

The full test suite still passed.

### 5. Ran independent review and repair loops

The first structured reviewer found four important gaps:

1. a regular-expression literal could hide direct I/O;
2. lexical cases were incomplete;
3. the script fileoverview contract lacked an explicit assertion;
4. application-layer vendor I/O lacked a fixture.

The worker repaired each finding test-first.

The next reviewer found three more gaps:

1. `/[//]/` could still hide direct I/O;
2. module test paths incorrectly received production I/O rules;
3. allowed I/O locations lacked positive tests.

The worker again repaired each finding test-first.

A final verifier found one missing positive test for `src/server/main.ts`. The worker added that
test without changing production behavior.

The exact reviewed code head was `82b28af`. The worker then added only living-plan records and
pushed final PR head `686d4e2`. The exact-head verifier confirmed that the 32 added plan lines did
not change code, tests, package metadata, or implementation instructions.

### 6. Chose the Learn artifact

The approved U1C plan required one Learn step. The root agent inspected `ce-compound` and considered
a new `docs/solutions/` document. It decided against one because:

- the regression tests directly encoded every silent-pass case; and
- `docs/architecture/architecture-standard-v1.md` published the durable rule.

The U1C plan records that decision. This was a judgment call informed by the skill, not a mandatory
plugin action.

### 7. Merged and verified the exact head

The root agent updated PR #13 with the final evidence and a post-deploy validation section, marked
it ready, and recorded the review checkpoint in issue `5717221`.

After the root agent selected exact head `686d4e2`, GitHub merged it as `27d4abe`. The root agent
then updated local `main` and ran:

```bash
bun run check
bun run build
./dist/mandem --version
./dist/mandem --help
./dist/mandem-server --version
./dist/mandem-server --help
MANDEM_ARCHIVE_COMMIT=27d4abe1a2815bfef1bec56c71bc6d90880ef035 \
  bunx vitest run tests/contract/package-entrypoints.test.ts
```

The results were:

- Bun `1.3.14`;
- 26 tests passed;
- four package-contract tests passed;
- the build and all four executable probes passed;
- `main` was clean and synchronized.

The root agent closed issue `5717221` with `Fixed-By: 27d4abe`.

### 8. Revalidated U1A without authorizing it

The root agent read the complete U1A plan and compared it with the corrected U1C interfaces. It
found immediate drift:

- U1A said to create `repository-policy.ts`, but U1C had already created it;
- U1A said to add `ARCH-UNSCOPED-TYPESCRIPT`, but U1C already owned it;
- U1A did not explicitly preserve the new package and architecture regression contracts.

The root agent created:

```text
/home/brandonjf/dev/work/mandem-worktrees/u1a-revalidation
branch: docs/revalidate-u1a
base: 27d4abe1a2815bfef1bec56c71bc6d90880ef035
```

It changed U1A's promotion state from `clean-room-approved` to `planned`, revised the consumed
interfaces, and kept `execution_authorized: false`.

### 9. Used clean-room review to repair the U1A specification

The U1A reviewer found these defects:

| Round | Finding | Plan repair |
| --- | --- | --- |
| 1 | Pre-push commands could not evaluate outgoing revisions without reading the checkout. | Added revision-specific documentation and authored-source commands plus an exact-revision full gate. |
| 1 | YAML-only documentation directories were excluded by one definition and included by another. | Defined maintained files as `.md`, `.yaml`, and `.yml`; added a YAML-only fixture. |
| 1 | New ignored segments conflicted with preserving U1C's authored-path helper behavior verbatim. | Made the broadening intentional and required one shared manifest plus compatibility tests. |
| 2 | A `git archive` checkout lacked Git objects required by U1C's package-contract tests. | Replaced the archive design with a temporary detached Git worktree and mandatory cleanup tests. |
| 3 | The Context section still described documentation directories as Markdown-only. | Made the Context definition match the normative YAML-aware definition. |

The reviewer then reported no P0, P1, or P2 findings. The root agent restored
`promotion: clean-room-approved`, kept `execution_authorized: false`, ran the full 26-test gate,
and opened planning PR #14.

## Commands and tools used

### Repository and plan inspection

The root agent repeatedly used:

```bash
sed -n '<start>,<end>p' <file>
rg -n '<pattern>' <paths>
rg --files
git status --short --branch
git log -1 --oneline
git diff --check
sha256sum <plan>
```

It read `CLAUDE.md`, the writing skill and style guide, complete `PLANS.md`, the complete child
plans, relevant architecture files, package metadata, tests, and issue state before acting.

### Worktree and branch management

Representative commands:

```bash
git worktree add -b fix/u1-architecture-package \
  /home/brandonjf/dev/work/mandem-worktrees/u1-correction <authorized-base>

git worktree add -b docs/revalidate-u1a \
  /home/brandonjf/dev/work/mandem-worktrees/u1a-revalidation main
```

The root agent used separate worktrees for implementation and planning revalidation.

### Project validation

The session used Bun exclusively for project commands:

```bash
bun install --frozen-lockfile
bun run check
bun run build
bunx vitest run <focused-test>
```

One fresh worktree initially lacked installed dependencies. When the root agent ran
`bun run check`, Bun used `bunx` to resolve an ambient TypeScript version and the command failed.
The root agent identified missing dependencies as the cause, ran `bun install --frozen-lockfile`,
confirmed `bun.lock` was unchanged, reran the full test suite, and confirmed that it passed.

### Git-native issue operations

Representative commands:

```bash
git issue show 5717221
git issue show 745eda8
git issue comment <issue-id> -m '<message>'
git issue fsck
git push origin refs/issues/<uuid>
```

The root agent used issue comments as durable handoffs for approval, dispatch, review, completion,
and U1A revalidation.

### GitHub operations

The root agent used `gh` for PR reads and mutations, including:

```bash
gh pr view <number> --json ...
gh pr create --base main --head <branch> --title <title> --body <body>
```

It verified exact PR heads before merge and recorded the resulting merge SHAs. The root agent used
GitHub's merge operation only after independent review and exact-head validation.

### Harness orchestration tools

The root agent used these harness primitives:

| Tool | Use |
| --- | --- |
| `exec_command` | Read files, inspect Git state, run Bun, Git, git-native issue, and `gh` commands. |
| `write_stdin` | Poll commands that outlived the first execution window. |
| `apply_patch` | Edit plans and documentation without shell write tricks. |
| `update_plan` | Expose the current orchestration state and mark completed stages. |
| `spawn_agent` | Dispatch bounded implementation and review assignments. |
| `followup_task` | Ask an existing reviewer to re-review repaired plan revisions. |
| `send_message` | Request a prompt verdict from a running reviewer. |
| `wait_agent` and `list_agents` | Observe agent completion without duplicating work. |

## Decision model

The root agent effectively used this precedence:

```text
operator's exact approval
        |
        v
repository instructions: AGENTS.md -> CLAUDE.md -> PLANS.md
        |
        v
authorized issue ExecPlan
        |
        v
matching skill procedures
        |
        v
root-agent judgment for choices not fixed above
```

The root agent treated installed skills as procedures. It did not use them to expand the approved
scope. For example, `ce-work` described an end-to-end workflow, but the U1C plan defined what the
worker could implement. Likewise, the root agent did not use `lfg` to ship unrelated work.

## Alignment with Mandem's goals

### Strong alignment

- The root agent bound approval to an exact commit and plan hash.
- The worker received one complete, authorized issue plan.
- The root agent and worker used isolated worktrees.
- The worker implemented through red-green testing.
- Independent reviewers found defects that ordinary green tests had missed.
- The worker repaired review findings test-first.
- The root agent verified the final PR head after living-record updates.
- The plans and issues contain decisions, surprises, evidence, and outcomes.
- The root agent verified the merge on `main`.
- The root agent stopped at the U1A authorization boundary.

### Process supplied by plugins rather than Mandem

Mandem's repository rules require isolation, TDD, review, and a Learn step, but they do not
currently prescribe:

- a named simplification pass after green tests;
- the exact `ce-code-review` review structure;
- how to decide whether Learn needs a `docs/solutions/` artifact;
- detailed PR-description construction;
- automatic PR monitoring behavior.

The installed Compound Engineering plugin supplied those defaults. The observed process therefore
reflects both Mandem and the active Codex plugin environment.

### Gaps and risks

1. **Skill selection is environment-dependent.** Another operator or harness without the Compound
   Engineering plugin may follow a different review and shipping process.
2. **The process trace is not automatically durable.** This audit required reconstruction from
   chat, Git history, issues, and plans.
3. **Agent identities are operational, not contractual.** Names such as `Helmholtz` and `Dalton`
   help inspect one run but do not define stable roles for future runs.
4. **Some commands live only in the chat trace.** Plans record validation evidence, but they do not
   record every orchestration tool call.
5. **The root agent both orchestrated and merged.** Independent agents reviewed the work, but the
   root agent retained final merge authority. That matches this run's harness rules but should be an
   explicit project choice.

## Practices to reuse in other repositories

The following practices do not depend on the Compound Engineering plugin:

1. Write one self-contained implementation plan with explicit authorization metadata.
2. Bind approval to the exact plan content and commit.
3. Give the implementation worker only the approved scope.
4. Use an isolated branch and worktree.
5. Require a named failing test before each behavior change.
6. Run a cleanup pass only after the tests pass.
7. Use independent review with severity levels and exact file evidence.
8. Repair review findings test-first and repeat review until clean.
9. Verify the exact final PR head, including documentation-only final commits.
10. Run post-merge checks on the default branch.
11. Store approval, dispatch, review, and completion evidence in a durable tracker.
12. Revalidate dependent plans after a corrected dependency lands.

## Recommended repository changes

If Mandem's maintainers want this process regardless of installed plugins, they should document the
following in repository-owned instructions:

- the required review roles and severity scale;
- whether every implementation gets a post-green simplification pass;
- the minimum number and independence of review rounds;
- the exact-head verification requirement after living-plan edits;
- the Learn artifact decision rule;
- who may merge after a worker opens a PR;
- which orchestration events must be written to the issue or plan;
- a machine-readable session manifest containing agents, skills, commands, commits, reviews, and
  outcomes.

A future session manifest could use this shape:

```yaml
session:
  operator_approval:
    plan_commit: "<sha>"
    plan_digest: "<sha256>"
  agents:
    - role: implementer
      assignment: "<bounded task>"
    - role: reviewer
      assignment: "<read-only review>"
  skills:
    - name: "<skill>"
      reason: "<repository rule, explicit request, or task match>"
  evidence:
    tests: ["<command and result>"]
    reviews: ["<review run and verdict>"]
    merge: "<sha>"
```

This would let maintainers compare intended and observed process without reconstructing a chat
session.
