# Reviewed Targets

I reviewed `docs/plans/issues/u2a1-runtime-protocol-foundation.md` at commit `11d8dd983fed5e39565955becc66d7df3c2efffd` with SHA-256 `74f38301b5bb42b39084404ba876adeefa982a526b7d60f153c964565e5f393f`.

I reviewed `PLANS.md` at commit `11d8dd983fed5e39565955becc66d7df3c2efffd` with SHA-256 `86b545172b5830f1b454800b1ea2940266849f587e30c3b1e1fadce3351c3cf0`.

# Verdict

The ExecPlan is not yet executor-safe for a novice autonomous executor.

# Blocking Findings

## CR-001 — High — The plan omits the clean-worktree dependency bootstrap

Repository evidence: `package.json` declares `vitest` as a development dependency and the committed tree contains `bun.lock`, but this worktree has no `node_modules` directory. The first required evidence command in the plan, `bunx vitest run docs/plans/contracts/u2a1-runtime-protocol-contract.test.ts` (lines 280–285 and 317–323), failed before it loaded the test because `vitest/config` and `vitest` were unavailable. The plan nevertheless says to expect one passing file and seven passing tests.

Failure scenario: An executor starts from a fresh checkout or isolated worktree, follows the first command, and receives a module-not-found startup error. The plan gives no prerequisite command or recovery instruction, so the executor cannot reach the stated pre-review proof without guessing how to install the locked dependencies.

Smallest required repair: Add a repository-root bootstrap step before every Vitest, typecheck, or repository-check command: verify Bun 1.3.14, run the lockfile-preserving dependency installation command, and state the expected success result and retry action. Update `Idempotence and Recovery` to cover an interrupted installation.

## CR-002 — High — The public parser, serializer, digest, and decoder interfaces are not specified enough to implement or consume

Repository evidence: `PLANS.md` requires the plan to specify the types and function signatures that must exist (lines 138–146). The ExecPlan lists only function names on line 132. It defines the two envelope interfaces on lines 209–226, but it never gives TypeScript signatures for `parseArtifactReferenceV1`, `parseCanonicalJsonV1`, `parseCommandEnvelopeV1`, `serializeCommandEnvelopeV1`, `canonicalDigestV1`, or `commandPayloadDigestV1`. In particular, lines 228–238 do not define the payload-decoder input, generic parameters, result type, error type, or how a decoder failure becomes the required envelope result. Lines 240–245 require `canonicalDigestV1` to validate its inputs and serialize an `unknown` value, yet state only that it returns a `Sha256`; they do not specify how invalid domain or value input is reported. The scalar rule on lines 199–200 similarly requires a caller-supplied JSON Pointer but does not specify the path parameter or the concrete success type for each parser.

Failure scenario: Two executors can make mutually incompatible but plausible choices: a throwing digest function versus `ParseResultV1`, a decoder that receives raw bytes versus a parsed value, or a decoder failure reported as `invalid-scalar`, `invalid-envelope`, or passed through unchanged. Later U2A consumers then receive a different public API and error behavior from the same approved plan.

Smallest required repair: In `Interfaces and Dependencies`, give exact exported TypeScript declarations for every inventory member. Define the artifact-reference interfaces with field types, every parser and serializer parameter and `ParseResultV1` specialization, the digest-function failure contract, and the payload-decoder type and error translation rule. Include the exact UUID ASCII grammar rather than referring a novice to RFC 4122.

## CR-003 — High — The required fixtures and hash oracles are names rather than executable test data

Repository evidence: The plan says Milestone 1 must create tests "from every named fixture" and include literal hash expectations (lines 289–296). The claimed compiled contract, `docs/plans/contracts/u2a1-runtime-protocol-contract.ts`, contains only fixture labels such as `"nfc-unicode"`, `"duplicate-key"`, `"depth-limit"`, and `"payload-digest-domain"` (lines 56–79). It defines no bytes, decoded values, expected successful serialization, expected error code or path, depth interpretation, limit-boundary values, envelope fixture, or literal SHA-256 digest. Its adjacent test only checks that selected label strings exist; it does not supply those missing expectations.

Failure scenario: A novice must invent the Unicode input, each boundary's accepted and rejected neighbors, the test payload decoder, and all four promised hash constants. Different valid choices can leave alternate spellings, limits, and digest framing untested, while still satisfying the catalog-label test and the plan's broad wording.

Smallest required repair: Replace or supplement the label catalog with repository-owned fixtures that give exact UTF-8 bytes, parsed values, expected canonical bytes, result code and JSON Pointer for every rejection, and literal expected SHA-256 values for the four required digest cases. Define whether root counts toward depth and give exact at-limit and first-over-limit byte fixtures. Have the pre-review test verify the fixture contents and plan parity, not only fixture names.

## CR-004 — Medium — The stable error contract has no deterministic code assignment or validation precedence

Repository evidence: Lines 165–169 enumerate seven stable error codes and require the first failure in byte order. They do not map any violation class to a code or define precedence when a parser discovers a raw-byte failure, a JSON grammar failure, a canonical-spelling failure, a scalar failure, and an envelope-shape failure in different validation passes. The acceptance criteria require every alternate spelling to fail with its stable code (lines 355–359), but the fixture catalog supplies neither the expected codes nor error paths.

Failure scenario: For duplicate keys, non-NFC text, prohibited string escapes, unknown envelope fields, or an invalid scalar inside a syntactically valid envelope, one executor can return `invalid-json` while another can return `non-canonical-json`, `invalid-scalar`, or `invalid-envelope`. Both can claim the error is stable within their implementation, but later consumers cannot rely on the documented protocol.

Smallest required repair: Specify a deterministic validation sequence and a complete violation-to-code table, including the required JSON Pointer and stable detail for each fixture family. State how the raw-byte-order rule applies across parser, canonicality, scalar, and envelope validation passes, then bind the rules in the fixture tests.

# Residual Low-Risk Concerns

None.

# Verification Notes

I verified the manifest's reviewed-plan, governing-`PLANS.md`, and review-prompt commit and SHA-256 bindings from Git. I read the bound `PLANS.md`, bound ExecPlan, `AGENTS.md`, `.agents/OPERATING.md`, the runtime module files, `package.json`, the architecture rule implementation, and the U2A1 planning contract and test. I used the bound bytes for the reviewed plan, `PLANS.md`, and canonical review prompt. The planning-contract Vitest command could not start because the fresh worktree lacked installed dependencies; it did not run tests or alter tracked files.

MANDEM_REVIEW_VERDICT: CHANGES_REQUIRED
