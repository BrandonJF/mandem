# Reviewed Targets

Verified ExecPlan `docs/plans/issues/u2-protocol-lifecycle-sqlite.md` at commit `c2d51ae5bd335e494e204aa5877d4925c9bbb028`, SHA-256 `0c37271bb0f17d3be044fea127514293e19018ae44fbc5964736b6946b290e2e`.

Verified `PLANS.md` at commit `c2d51ae5bd335e494e204aa5877d4925c9bbb028`, SHA-256 `379d104b449be58f46c74b226d16b5dfebd09a96f5c91a00328c697585232140`.

# Verdict

The ExecPlan is not yet executor-safe for a novice autonomous executor.

# Blocking Findings

## CR-001 — P1: The closed protocol leaves accepted string values undefined

Repository evidence: `docs/plans/issues/u2-protocol-lifecycle-sqlite.md` declares `PullRequestTargetV1.repository` as `string` and both `GateRequirementV1.gate_id` and `GateDecisionV1.gate_id` as `string`. The protocol rules define exact grammars for many other strings, including identifiers, paths, timestamps, external IDs, branches, and process evidence codes, but define neither a grammar, byte bound, normalization rule, nor configured-repository comparison for these values. The plan nevertheless requires a closed canonical schema and says gate values are sorted and replaced by gate ID.

Failure scenario: two workers can validly choose different rules for repository names or gate IDs, such as accepting arbitrary Unicode versus printable ASCII, or treating differently normalized strings as the same gate. They can then parse the same bytes differently, sort or replace different gate entries, and produce different events and snapshots. U2B cannot replay one deterministic result from those incompatible values.

Smallest required repair: define validated named types for repository and gate IDs, including their exact byte grammar, normalization, bounds, and equality with the configured repository where required. Use those types in every affected interface and add fixed accepted and rejected parser, canonical-order, gate-replacement, and replay fixtures.

# Residual Low-Risk Concerns

None.

# Verification Notes

I read `AGENTS.md`, `.agents/OPERATING.md`, the complete bound `PLANS.md`, and the complete bound ExecPlan. I inspected the existing runtime module, the public architecture-standard approval contract, the architecture rules, and package commands. I verified the three dispatch-bound files by hashing their bytes from commit `c2d51ae5bd335e494e204aa5877d4925c9bbb028`; each digest matched the dispatch.

MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED
