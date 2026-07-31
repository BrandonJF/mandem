# WI1 Approval and Recovery Review

Date: 2026-07-29

Plan: `docs/plans/issues/wi1-epic-issue-graph-integrity.md`

Reviewed plan commit: `81d91b4608ddffbb4d4fbe2de1d22ca1f394a7cd`

Reviewed plan SHA-256: `4585680643841ee453904bf378a55f2008fceb9c7ce540ee37be5fc259df0aca`

## Result

Clean-room, coherence, and feasibility reviews approved the exact plan revision with no P0, P1,
or P2 findings. Implementation remains unauthorized because `execution_authorized` is `false`.

The reviews confirmed that:

- git-native issues remain authoritative and GitHub remains a one-way managed projection;
- native graph approval records the complete baseline ref map and permits only deterministic
  baseline-to-result transitions;
- lost native push responses and partial batches cannot broaden force-with-lease authority;
- projection preparation records or reuses one canonical native transaction containing the full
  managed provider snapshot and ordered operations;
- provider apply accepts only a satisfied operation prefix plus the exact approved suffix;
- an intervening native comment prevents stale transaction reuse;
- remote comparison is read-only, preparation is idempotent, and provider mutation requires exact
  conversation approval;
- epic, issue, and subissue remain the only hierarchy terms.

## Resolved Findings

Review iterations removed legacy retry text that allowed a newly planned provider operation list,
made restart evidence durable in native issue history, defined the approval-ref self-update state
machine, corrected current issue states and managed-label expectations, added milestone-state
reconciliation, and made transaction reuse compatible with direct approval ancestry.
