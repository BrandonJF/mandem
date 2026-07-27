# Provider capability baseline

Recorded 2026-07-24. Claude Code is `2.1.219`; Codex CLI is `0.145.0`. Each probe used a disposable Git repository with committed `PROBE.md` containing only `MANDEM_PROVIDER_MARKER_7F3A`, a 60-second completion bound, bounded captured output, and a clean-tree assertion. No authentication material was recorded.

Working-directory/instruction injection passed previously for both providers at fixture `b7a860749ad65aa19e558b749287580cf262d11f`: each exited 0, returned the marker, and left the tree clean.

Trusted full-access and structured completion passed at fixture `219ef727109a389ad7ad20f04b0edaabb3737dd8`. Claude command `claude -p --dangerously-skip-permissions` and Codex command `codex exec -C <fixture> --dangerously-bypass-approvals-and-sandbox --ephemeral` both exited 0 with `MANDEM_PROVIDER_OK`; output SHA-256 values were respectively `190d8602a5e8576e58a721d32afa29cbe9ecb7666b126953663a4ef31aa90178` and `da9ff12c08b1c1f00650d255598f5d570077951b36209aa76bf0ea30c31e44bf`. Claude `--permission-mode plan --output-format json` and Codex `--sandbox read-only --ephemeral --json` both exited 0 and produced parseable structured output containing the marker; their digests were `86102b2ee39963277f42d03d1584885dad2578e95940e4fb5db9345adae19ffc` and `43b2651e662273e040c5ae2d08c27ecec27758f0eb10844f5680fe9ee41aedd7`. The fixture remained clean.

Read-only review passed at fixture `564710fb49cd8ce5b0fb62e65acae7e8bfaaf648`: Claude plan mode and Codex read-only ephemeral mode both exited 0, returned `READ_ONLY: MANDEM_PROVIDER_MARKER_7F3A`, and left the fixture clean. Output digests: `1b592366e20a40c63005bb222b9a8ecc0fe8b20666ff64157124b731ffad3a1a` and `198e4719f77529ca4d765d3131925a6409b507766f23c3acdd96612552aae02c`.

Fresh-session recovery passed: a new Claude process at fixture `bb5ac2de547f99d5d836e68c4faa8d190e56a600` exited 0 and returned `NEXT: MANDEM_PROVIDER_MARKER_7F3A`; a separate ephemeral Codex process exited 0 and returned the same value with no resume argument and a clean fixture.

Interruption passed at fixture `2d40ecf5b7aaf905ea95129eee0f2784a8843c03`: full-access print sessions were sent `SIGINT` three seconds after a requested `sleep 30`. Neither returned `MANDEM_PROVIDER_LATE`; Claude completed its interrupted wrapper with exit 0 and digest `556db53504c7fa1a7489a001db64986fee1df89460e9047b69c68cb4cdf54b61`, while Codex exited 1 with digest `67702c2a8f822bd71a8dc4de77826c4ed7f0dd3e2b54d807cd7272fb5ae57dfd`. Both stopped within the ten-second post-signal bound and left the fixture clean.

Conclusion: every required U2 protocol capability has direct, non-mutating versioned evidence. U2 must still map these provider-specific flags and outcomes into its provider-neutral protocol; this baseline is no longer a missing-capability blocker.

## Post-write hook probe

Recorded 2026-07-27 in a disposable Git repository. Claude Code was `2.1.220`; Codex CLI was
`0.145.0`. The repository contained the exact U1A project hook configurations and a symlink to the
working U1A hook script. The probe asked each provider to create one unindexed Markdown file. That
intentional policy failure made hook feedback observable. No authentication material was recorded.

Claude command:

    claude -p --dangerously-skip-permissions 'Use the Write tool to create probe.md containing exactly "# Probe". After the write, report the PostToolUse feedback verbatim.'

Claude completed in 9.6 seconds, exited `0`, and returned `DOC-UNSCOPED-DOCUMENT probe.md` as a
blocking PostToolUse error. Its project hook timeout is 120 seconds.

Codex command:

    codex exec -C <fixture> --dangerously-bypass-approvals-and-sandbox --dangerously-bypass-hook-trust --ephemeral 'Use apply_patch to add codex-probe.md containing exactly # Codex probe. Then report any PostToolUse feedback verbatim.'

Codex completed in 9.3 seconds, exited `0`, and returned `DOC-UNSCOPED-DOCUMENT codex-probe.md`
through its PostToolUse hook. Its project hook timeout is 120 seconds. The probe also replayed the
existing Claude-created `probe.md`, so Codex reported both expected findings. The temporary
repository was removed after recording this result. The bypass-trust flag was limited to this
disposable probe; operators trust project-local Codex hooks through `/hooks`.
