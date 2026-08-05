# Reviewed Targets

Reviewed `docs/plans/issues/u2-protocol-lifecycle-sqlite.md` at commit `dca04a3211de0decacda615d31e3b9d26e385256`, SHA-256 `52d856998c1ed7a375f1e3908755170a8b59549eafa5ab231918c4fdde745661`. Reviewed `PLANS.md` at commit `dca04a3211de0decacda615d31e3b9d26e385256`, SHA-256 `379d104b449be58f46c74b226d16b5dfebd09a96f5c91a00328c697585232140`.

## Verdict

The ExecPlan is not yet executor-safe for a novice autonomous executor.

## Blocking Findings

### CR-001 — P1: Work acquisition has no immutable dependency requirement input

Repository evidence: the plan declares three `depends_on_issue_ids` in its front matter (lines 14–17). `LifecycleEvaluationInputV1` provides only `dependency_statuses` (lines 1037–1047), while `LifecycleSnapshotV1`, `PlanTargetV1`, and `AcquireWorkLeaseCommandV1` carry no required dependency-ID collection (lines 482, 775–797, and 394). The acquisition predicate nevertheless requires one complete status for every “declared dependency” (lines 1252–1256).

Failure scenario: a reducer evaluating `acquire-work-lease` cannot determine which issue IDs must be represented. It can accept an empty or incomplete status list, or reject a complete list, only by reading plan front matter or inventing an out-of-band requirement. Both choices violate the stated pure-reducer boundary and make U2B replay unable to reproduce the decision from public values.

Smallest required repair: add one immutable, typed dependency requirement source to the submitted plan/snapshot or to a separately attested reducer input. Define its canonical binding to the plan target, exact sorting and equality checks against `dependency_statuses`, event/fold handling where needed, and focused success, omission, duplicate, foreign-ID, and replay tests.

### CR-002 — P1: Gate requirements are caller-selectable rather than bound to the reviewed plan

Repository evidence: `ReviewValidationInputV1` accepts `required_gates` as a separate argument (lines 1306–1318), and `ValidatedReviewEvidenceV1` stores that collection (lines 625–640). `ReviewManifestV1`, `PlanTargetV1`, and the submitted-plan command contain no gate-requirement declaration or digest (lines 482, 586–600, and 389). The plan only states in prose that accepted review evidence reads required gates from the reviewed plan (lines 1263–1267).

Failure scenario: the adapter or caller that invokes review validation can supply an empty or substituted `required_gates` array. The resulting accepted review then binds that caller-selected set, so Learn and merge can proceed without the gates the reviewed plan required. A novice cannot implement the missing declaration format, byte source, or equality check without choosing security behavior.

Smallest required repair: specify a closed gate-requirement declaration, its immutable source and digest binding to the reviewed plan, and how review validation derives or verifies the supplied collection. Require exact equality before constructing `ValidatedReviewEvidenceV1`, then add substitution, omission, changed-plan, and replay/freshness fixtures.

### CR-003 — P1: The required acquisition branch comparison has no comparison target

Repository evidence: `WorkspaceTargetV1` includes `branch` and `head` (lines 487 and 524–526), but `PlanTargetV1` has only `path`, `commit`, and `digest` (line 482), and `PullRequestTargetV1` has no branch (line 484). Despite this, the workspace rule requires “branch/head equality with the approved plan target” (lines 649–654 and 1257–1259).

Failure scenario: an executor cannot implement or test the branch predicate because the approved plan target contains no branch. Treating the plan commit as the head still leaves the branch comparison undefined; treating any branch as valid defeats the stated predicate. This also leaves no deterministic way for replay to identify an invalid branch.

Smallest required repair: either add a validated approved-workspace branch and head source, bind it immutably to the approved plan/approval evidence, and define the equality checks, or remove the branch predicate and state the exact head-only rule. Update the acquisition, workspace-observation, event/fold, and branch-mismatch fixtures together.

## Residual Low-Risk Concerns

None.

## Verification Notes

I read the bound `AGENTS.md`, `.agents/OPERATING.md`, `PLANS.md`, canonical clean-room prompt, and complete ExecPlan. I verified the bound plan, `PLANS.md`, and prompt SHA-256 values from commit `dca04a3211de0decacda615d31e3b9d26e385256` and inspected the current architecture contract, runtime types, approval contract, and package scripts. I used the bound bytes for the review and did not read prior review prompts or reviewer outputs.

MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED
