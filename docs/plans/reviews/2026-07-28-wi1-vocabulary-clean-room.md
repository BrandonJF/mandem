# WI1 Vocabulary Revision Review

Date: 2026-07-28

Plan: `docs/plans/units/wi1-epic-issue-graph-integrity.md`

Reviewed plan SHA-256: `33dbed40661bcaa65ba41723c3d8307dad5f97e8063334bd4efc6f635d900869`

## Result

Clean-room, coherence, and feasibility reviews approved the revised plan. Implementation remains
unauthorized because `execution_authorized` is `false`.

The reviews confirmed that:

- epic, issue, and subissue are the only hierarchy terms;
- a subissue is defined only by its parent relationship;
- bug, feature, incident, and chore classify issues independently of hierarchy;
- the native metadata schema has no hierarchy `kind` field;
- issue keys are valid and unique;
- exactly one structurally identifiable epic root exists;
- every subissue reaches that root through parent links;
- the planned vocabulary check has a deterministic one-line exception mechanism.

## Resolved Findings

The first clean-room pass required validation for malformed and duplicate issue keys and an exact
repository vocabulary-migration scope. The plan now defines `IGRAPH-ISSUE-KEY`, names the complete
prose corpus, specifies rejected contexts, and defines tests and one-line exceptions.

The first feasibility pass required a deterministic epic discriminator. The plan now defines
`IGRAPH-EPIC`, requires exactly one self-rooted epic, limits provider policy to that root, requires
all other managed issues to share and reach it, and rejects multiple roots, cross-epic parents, and
disconnected issues before provider planning.

The coherence review approved the hierarchy and classification model without changes.
