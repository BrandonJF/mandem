# Planning contracts

This directory contains machine-checkable design artifacts that support ExecPlan review without
serving as production runtime code.

- [U2A protocol contract](./u2a-protocol-contract.ts) retains the former combined issue's catalog as
  split-source evidence. It does not govern U2A1 through U2A5.
- [U2A protocol contract tests](./u2a-protocol-contract.test.ts) protect the retained catalog from
  accidental internal corruption. Each split issue must create and test its own bounded contract
  before clean-room review.
