# WI1 Program Issue Graph Integrity Clean-Room Review

Date: 2026-07-28

Plan: `docs/plans/units/wi1-program-issue-graph-integrity.md`

Reviewed Git blob: `aa2b204946bf3ea014fffc141780fb69c2792d0a`

Plan SHA-256: `5fc59317d85997c8522adc742212a53d48078616ff0b6305bae48a7c816ae3bf`

## Verdict

Approved with no remaining blocking findings.

The reviewed plan makes git-native issue refs authoritative for program membership, parent relationships, plan paths, dependencies, state, provider mappings, milestone policy, and managed label policy. ExecPlan frontmatter repeats portable UUID relationships and must agree with native issue metadata. GitHub is a one-way projection and cannot update the authoritative graph through this reconciler.

The plan keeps implementation unauthorized. Its frontmatter remains `promotion: planned` and `execution_authorized: false`. The operator must approve the exact reviewed revision before a metadata-only authorization change permits implementation.

## Review Coverage

Three fresh review passes checked:

- internal consistency, required `PLANS.md` sections, dependency sequencing, API composition, command behavior, and verification coverage;
- feasibility against `git-native-issue` version 1.3.3, including raw Git storage, append-only comments, provider mappings, exact GitHub REST endpoints, and CI issue-ref fetching;
- external-state safety, native-source authority, deterministic metadata conflicts, local and remote ancestry states, interrupted push recovery, unmanaged GitHub relationships, and second-run zero-write evidence.

## Findings Resolved

The plan removed the original hand-edited manifest authority, repository-wide bridge calls from reconciliation, and unsupported issue-description edits. It added complete native metadata payloads, canonical serialization, required and forbidden field rules, exact program graph values, managed provider definitions, an idempotent native metadata setter, raw Git characterization tests, explicit GitHub state projection, unmanaged-parent and unmanaged-child failures, API composition, exact REST paths, and CI issue-ref fetch behavior.

The final retry contract permits a native metadata no-op only when local and remote issue-ref heads are equal and one unique authoritative comment matches the requested canonical payload. Lost-push recovery may publish only one expected metadata commit. Local-behind, remote-descendant, divergent, conflicting, or unrelated unpushed histories fail for merge and operator review.

## Approval Boundary

This verdict applies only to the exact plan blob and SHA-256 above. Any substantive edit requires another clean-room review. A later change that only records the operator's exact approval and sets `promotion: executable` with `execution_authorized: true` may cite this verdict without reopening technical review.
