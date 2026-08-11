# Planning contracts

This directory contains machine-checkable design artifacts that support ExecPlan review without
serving as production runtime code.

- [U2A protocol contract](./u2a-protocol-contract.ts) is the canonical planning catalog for U2A
  command fields and event value mappings.
- [U2A protocol contract tests](./u2a-protocol-contract.test.ts) prove catalog and immediate wire-type
  closure before clean-room review.
