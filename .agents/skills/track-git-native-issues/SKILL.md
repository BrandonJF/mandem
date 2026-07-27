---
name: track-git-native-issues
description: Use project-local git-native issues as the first entry point for substantial repository work and status questions. Apply when an agent needs to identify active or remaining work, start multi-step work, record a milestone or blocker, hand work to another agent, reconcile issue/plan/PR state, or close verified work.
---

# Track Git-Native Issues

Use `git issue` to identify the active work and its next action. Keep the issue concise enough that a
fresh agent can orient itself before reading plans, pull requests, or chat history.

## Roles

- The git-native issue records the work item's current phase, blocker, latest verified result, and
  next action.
- A child ExecPlan contains complete implementation instructions, decisions, and detailed evidence.
- Git records code state. GitHub records pull-request and review state.
- The Mandem event ledger will record transition history after the product implements it.

Do not copy every plan entry or terminal transcript into the issue. Link the durable artifact and
record the status needed to choose the next action.

## Find the Active Work

Before substantial work or a repository-status answer:

1. Verify the repository and tool:

       git rev-parse --show-toplevel
       git issue version

2. Merge issue updates from the configured remote when a remote exists:

       git issue merge origin

3. List open work:

       git issue ls --state open --format full --sort priority

4. Select the issue:
   - Use the issue named by the user.
   - Otherwise, inspect an issue labeled `in-progress`.
   - If several issues are eligible, read their dependency and next-action comments. Recommend an
     order, but do not silently reprioritize work.
   - If no issue covers substantial requested work, create one before planning or editing.

5. Read the complete selected issue:

       git issue show <issue-id>

Follow its plan path, PR, and commit references only after this orientation.

## Decide Whether to Track

Create or reuse an issue when work:

- requires several steps or files;
- changes behavior, architecture, workflow, or repository instructions;
- begins from an approved plan;
- discovers a bug or follow-up that will outlive the current step;
- needs a durable handoff, review, or operator decision.

Do not create an issue for:

- a simple question;
- read-only exploration with no resulting work;
- a trivial correction completed immediately;
- work the user explicitly says not to track.

Search before creating:

    git issue search "<specific phrase>" --state all --ignore-case

Create with conventional change vocabulary such as `docs:`, `feat:`, or `fix:`:

    git issue create "<type>: <outcome>" \
      --message "<scope, observable completion, and important exclusions>" \
      --label <type> \
      --priority <level>

Do not create duplicate parent and child issues for one indivisible change.

## Record Transitions

### Start

Mark an open issue before changing files:

    git issue edit <issue-id> --add-label in-progress --remove-label blocked \
      --message "Started <bounded scope>"

### Progress

Add a comment after a meaningful transition, including:

- plan revision proposed, reviewed, or approved;
- implementation dispatch;
- a verified milestone or commit;
- PR creation;
- review findings and repairs;
- a blocker or operator decision;
- merge and post-merge verification.

Use this compact structure:

    Phase: <planning|approval|work|review|learn|merge|verification|complete>
    Result: <observable result and artifact reference>
    Blocker: <none or exact blocker>
    Next: <one concrete action>

Do not comment for routine reads, repeated green commands, or status polls.

### Block

Keep the issue open and replace `in-progress` with `blocked`:

    git issue edit <issue-id> --remove-label in-progress --add-label blocked \
      --message "Blocked: <condition>. Needs: <decision or external change>."

### Resume

Replace `blocked` with `in-progress` and comment with the changed condition and next action.

### Complete

Close only after the issue's outcome is merged or otherwise delivered and its required verification
passes:

    git issue state <issue-id> --close \
      --message "Completed: <outcome and verification>" \
      --fixed-by <commit-sha> \
      --reason completed

Remove status labels before closing when the installed CLI retains them.

## Publish Issue Changes

Issue commits live outside the current branch. After each meaningful mutation, resolve the full ref
and push that ref:

    git show-ref | rg "refs/issues/<issue-id>"
    git push origin refs/issues/<full-uuid>

Do not assume a normal branch push includes issue refs. Do not enable GitHub issue export unless the
operator or repository configuration explicitly authorizes that projection.

## Reconcile Disagreements

When records disagree:

1. Use Git commits for what code exists and GitHub for the PR's current state.
2. Use the exact reviewed plan content for implementation instructions and its recorded approval
   boundary.
3. Stop before implementation if plan approval or scope is ambiguous.
4. Update the git-native issue with the verified phase, blocker, and next action.
5. Repair stale plan living records or registries in the appropriate planning change; do not use
   them as a reason to leave the issue stale.

The issue remains the first status entry point. It does not override an unapproved ExecPlan or claim
that unmerged code exists.

## Return

For a status request, report:

- active issue and phase;
- completed result;
- blocker;
- next permitted action.

For a mutation, report the issue ID and confirm whether its ref was pushed.
