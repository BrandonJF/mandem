# Provider capability baseline

Recorded 2026-07-24 for the U1 implementation branch. Claude Code is `2.1.219`; Codex CLI is `0.145.0`. The non-mutating working-directory/instruction probe passed for both providers against disposable Git fixture commit `b7a860749ad65aa19e558b749287580cf262d11f`: each exited 0, returned `MANDEM_PROVIDER_MARKER_7F3A`, and left the fixture clean.

The installed help surfaces confirm the required invocation forms: Claude print mode with `--permission-mode plan` and `--dangerously-skip-permissions`; Codex `exec -C`, `--sandbox read-only`, `--dangerously-bypass-approvals-and-sandbox`, `--ephemeral`, and `--json`. U2 promotion remains blocked until its owner runs and records the remaining bounded full-access, JSON completion, interruption, read-only-review, and fresh-session probes required by the U1 ExecPlan. This conservative result is intentional: U1 does not infer unexecuted provider behavior.
