---
title: "Define the canonical runtime protocol foundation - Plan"
type: feat
date: 2026-08-18
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: mandem-epic
execution: code
plan_kind: mandem-issue-execplan
issue_key: U2A1
parent: u2-protocol-lifecycle-sqlite.md
epic_issue_id: abe862d6-b052-49fe-8611-bc1ab6e24253
issue_id: 3bffe969-4131-40bf-9192-3e00a845910e
depends_on_issue_ids:
  - 6a6a8bab-853f-4658-9bc0-38e2386b642d
  - 745eda80-1e74-4866-bc95-2f2983b31025
  - da645bd0-9899-40b3-9f23-3b48d65362a4
promotion: planned
execution_authorized: false
---

# Define the canonical runtime protocol foundation

This ExecPlan is a living document governed by the repository-root `PLANS.md`. Keep `Progress`,
`Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` current while work
proceeds. The implementer starts with this file and the repository at the approved plan commit; no
earlier review, chat, or combined U2A plan is required.

## Purpose / Big Picture

After U2A1, every later Mandem work-control issue can turn the same input bytes into the same
validated values and digests. A caller can submit canonical JSON containing bounded identifiers,
artifact references, and one generic command envelope. The runtime module either returns the exact
validated value or one stable parse error. It never silently normalizes input, accepts two byte
spellings for the same value, or treats a structural artifact reference as authenticated evidence.

The behavior is observable by running the two new runtime-domain test files. Their fixed fixtures
show byte-for-byte round trips, stable SHA-256 results, boundary acceptance, and rejection of
duplicate keys, malformed aliases, alternate JSON spellings, oversized input, and mismatched
idempotency identities. This issue supplies representation and identity only. Later subissues own
review evidence, plan admission, active work, lifecycle events, replay, and persistence.

## Progress

- [x] (2026-08-18 23:41Z) Created the U2A1 issue and bounded scaffold during the U2A split.
- [x] (2026-08-19 22:24Z) Merged the five-subissue graph through PR #43 and made U2A1 active.
- [x] (2026-08-19 22:52Z) Completed the closed-contract, provenance, state-and-replay, milestone,
  and scope proofs in `docs/plans/contracts/u2a1-runtime-protocol-contract.ts` and its test.
- [x] (2026-08-19 22:52Z) Expanded this document into a self-contained implementation plan.
- [x] (2026-08-19 23:25Z) Preserved clean-room round 1. It found four planning blockers:
  clean-checkout setup, incomplete public signatures, label-only fixtures, and undefined error
  precedence. Repaired the plan and authoring standard before requesting another review.
- [x] (2026-08-19 23:48Z) Preserved clean-room round 2. Its one blocker showed that structural and
  serializer failure behavior remained open. Added a complete machine-checked failure matrix and
  extended the authoring standard for `unknown`-accepting serializers and structural unions.
- [x] (2026-08-20 00:05Z) Round 3 found an envelope-only error in the generic JSON fixture catalog.
  The third-failure policy required redesign or another split. U2A1 was already bounded to one
  behavior, so redesigned fixture ownership: every catalog is now constrained to errors its public
  function can decide, and a machine check prevents cross-layer fixture drift.
- [x] (2026-08-20 00:18Z) Round 4 found that the decoded-string limit was masked by the equal raw
  document limit. Lowered it to 1,000,000 bytes and added exact accepted and rejected neighbors that
  remain below the raw limit.
- [ ] Obtain one independent clean-room review of the exact plan bytes.
- [ ] Obtain exact operator approval and set `execution_authorized: true` only in the approved
  execution record.
- [ ] Implement the milestones, keep the living sections current, and merge the verified pull
  request to `main`.

## Surprises & Discoveries

- Observation: The existing runtime module contains only process identity and Bun-version behavior;
  no protocol parser or reusable scalar validator exists.
  Evidence: `src/modules/runtime/domain/types.ts` contains only `RuntimeIdentity`, and the runtime
  root barrel exports only identity, version, and Bun-version functions.
- Observation: `architecture-standard` has a sorted-object JSON helper, but it cannot serve as the
  wire parser because `JSON.parse` and `JSON.stringify` lose duplicate-key and token-spelling facts.
  Evidence: `src/modules/architecture-standard/domain/approval-contract.ts` sorts parsed object
  keys but has no raw UTF-8 tokenizer, NFC check, input-size limit, or numeric-token grammar.
- Observation: The former combined contract named trusted principals and adapter attestations as
  runtime primitives, but U2A1 has no authenticating adapter and cannot honestly produce trust.
  Evidence: the U2A split assigns complete review-attestation validation to U2A2 and later adapter
  work to U4/U5. U2A1 now returns structural values only.

## Decision Log

- Decision: Implement a repository-owned recursive-descent JSON tokenizer instead of calling
  `JSON.parse` on untrusted bytes.
  Rationale: duplicate keys, invalid UTF-8, alternate number tokens, and noncanonical escape
  spellings must remain observable until rejection.
  Date/Author: 2026-08-19 / Codex
- Decision: Allow only unsigned safe integers in canonical JSON v1.
  Rationale: every numeric value currently required by the protocol is a bounded count or version;
  excluding negative, fractional, exponent, and unsafe values gives one portable spelling.
  Date/Author: 2026-08-19 / Codex
- Decision: Model repository and external artifact references as a discriminated union without a
  `trusted` brand or nullable location fields.
  Rationale: the shape can be validated here, while U2A2 and later policies must separately verify
  the adapter evidence that makes a reference trustworthy.
  Date/Author: 2026-08-19 / Codex
- Decision: Keep the command envelope generic and exclude lifecycle concurrency, actor, time, and
  event fields.
  Rationale: U2A1 can bind command kind and payload identity without taking ownership of policy
  fields that belong to U2A3 through U2A5.
  Date/Author: 2026-08-19 / Codex
- Decision: Domain-separate every digest and include the canonical byte length.
  Rationale: a digest for one protocol purpose must not be reusable as another purpose, and the
  length prefix makes concatenation boundaries explicit.
  Date/Author: 2026-08-19 / Codex
- Decision: Validation follows a declared phase order, and every rejection family has a fixed code,
  path, and detail rule.
  Rationale: source-byte order cannot resolve conflicts between framing, syntax, schema, scalar,
  decoder, and digest failures.
  Date/Author: 2026-08-19 / Codex
- Decision: Keep U2A1 as one issue after the third failed verdict, but redesign its fixture catalogs
  around public-function ownership instead of splitting the same generic codec across issues.
  Rationale: the remaining contradiction crossed the generic JSON/envelope test boundary; another
  issue boundary would duplicate the canonical codec rather than remove the ambiguity.
  Date/Author: 2026-08-20 / Codex

## Outcomes & Retrospective

Planning is complete, but no runtime implementation exists and execution is not authorized. The
expected outcome is one small runtime-only protocol foundation whose public exports let U2A2 begin
without copying a grammar or inventing a trust rule. Update this section after each milestone and
again after merge with the exact test result and merge commit.

## Context and Orientation

Mandem is one strict TypeScript package run with Bun 1.3.14. A module lives under
`src/modules/<name>/` and follows `docs/architecture/architecture-standard-v1.md`: pure domain
files contain no input/output, cross-module imports use only public root barrels, every authored
TypeScript file has an `@fileoverview`, and module root barrels never export infrastructure.

The existing `src/modules/runtime/` module is intentionally small. `domain/types.ts` defines
`RuntimeIdentity`; `domain/bun-version.ts` validates the Bun version; `domain/index.ts` and the root
`index.ts` expose those values. `api/composition.ts` builds process identity. U2A1 adds pure domain
files and root exports without changing application, infrastructure, or API composition behavior.

In this plan, canonical JSON means one exact UTF-8 byte spelling for a JSON value. A scalar alias is
a string or number whose grammar has been validated once and represented by a branded TypeScript
type. A digest is a lowercase hexadecimal SHA-256 result. Structural means that the bytes and field
grammar are valid; it does not mean Git, GitHub, or another provider authenticated the claim.
Idempotency means recognizing a retry of the same command kind and payload without executing it
twice. U2A1 supplies the identity that later storage will compare; it does not store or deduplicate
requests.

The machine-checkable planning contract at
`docs/plans/contracts/u2a1-runtime-protocol-contract.ts` governs the closed inventories below. Its
adjacent test checks catalog ordering, plan parity, fixture coverage, provenance, milestone
dependencies, and exclusions. If this prose and that catalog disagree, repair both before review;
the implementer does not choose between them.

Public type inventory: `ArtifactKindV1`, `ArtifactProviderV1`, `ArtifactReferenceV1`, `BranchNameV1`, `CanonicalJsonErrorCodeV1`, `CanonicalJsonValueV1`, `CommandEnvelopeV1`, `ExternalArtifactIdV1`, `ExternalArtifactReferenceV1`, `GitSha`, `IdempotencyIdentityV1`, `NonnegativeSafeIntegerV1`, `ParseResultV1`, `PayloadDecoderV1`, `PositiveSafeIntegerV1`, `ProtocolTokenV1`, `RepoPath`, `RepositoryArtifactReferenceV1`, `RepositorySlugV1`, `Sha256`, `UtcTimestamp`, `Uuid`

Public function inventory: `canonicalDigestV1`, `commandPayloadDigestV1`, `parseArtifactReferenceV1`, `parseBranchNameV1`, `parseCanonicalJsonV1`, `parseCommandEnvelopeV1`, `parseExternalArtifactIdV1`, `parseGitShaV1`, `parseNonnegativeSafeIntegerV1`, `parsePositiveSafeIntegerV1`, `parseProtocolTokenV1`, `parseRepoPathV1`, `parseRepositorySlugV1`, `parseSha256V1`, `parseUtcTimestampV1`, `parseUuidV1`, `serializeCanonicalJsonV1`, `serializeCommandEnvelopeV1`

Scope exclusion inventory: `approval-record-parsing`, `authenticated-principals`, `clean-review-validation`, `event-catalogs`, `lifecycle-command-catalogs`, `lifecycle-replay`, `persistence`, `policy-specific-trusted-observations`, `state-transitions`, `workspace-leases`

## Closed Wire Contract

Create `src/modules/runtime/domain/canonical-json-v1.ts`. Define `CanonicalJsonValueV1` recursively as
`null`, boolean, unsigned safe integer, NFC string, readonly array, or readonly object whose values
are canonical JSON. Define `ParseResultV1<T>` as
`{ readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: { readonly code:
CanonicalJsonErrorCodeV1; readonly path: string; readonly detail: string } }`. Public
parse functions never throw for untrusted input and never return partial values.

`parseCanonicalJsonV1(bytes)` first rejects input over 1,048,576 bytes, a byte-order mark, malformed
UTF-8, and any carriage return. It then tokenizes the raw bytes without `JSON.parse`. The maximum
nesting depth is 16, each object or array has at most 1,024 entries, and one decoded string has at
most 1,000,000 UTF-8 bytes. Check the raw byte limit before allocating nested values. The input must
end in exactly one line feed and contain no other insignificant whitespace.

Object keys are unique and ordered by Unicode scalar value, which is the same order as comparing
their valid UTF-8 byte sequences. Arrays retain declared order. Every key and string is already NFC;
normalization that would change the input is rejection, not conversion. The only accepted numbers
match `0|[1-9][0-9]*` and are no greater than `Number.MAX_SAFE_INTEGER`.

Strings use double quotes. The accepted and emitted spellings are `\"` for quote, `\\` for
backslash, the short escapes `\b`, `\t`, `\n`, `\f`, and `\r`, and lowercase `\u00xx` only for
the remaining U+0000 through U+001F controls. Printable Unicode scalars appear directly as their
shortest UTF-8 encoding. Reject `\/`, uppercase hexadecimal escapes, surrogate escapes, and a
Unicode escape for a printable scalar. `serializeCanonicalJsonV1(value)` validates an `unknown`
value against these rules and returns the exact bytes through `ParseResultV1<Uint8Array>`.

A successful canonical parse requires byte equality with serialization and returns its value as
`{ readonly json: CanonicalJsonValueV1; readonly canonical_bytes: Uint8Array; readonly digest:
Sha256 }`; `canonical_bytes` is a defensive copy of the exact
input and `digest` uses the domain `mandem-canonical-json-v1`. The stable error codes are
`invalid-utf8`, `invalid-json`, `non-canonical-json`, `json-limit-exceeded`, `invalid-scalar`,
`invalid-envelope`, and `payload-digest-mismatch`. `path` is a
JSON Pointer with `~` and `/` escaped as `~0` and `~1`, or the empty string for a whole-input error.
`detail` is a stable short explanation and must not contain raw input bytes.

Serialization accepts only the canonical value model: `null`, booleans, nonnegative safe integers,
NFC strings, dense arrays with own values at every index, and plain objects whose own enumerable
keys are strings and whose prototype is `Object.prototype` or `null`. It rejects `undefined`,
functions, symbols, bigint, negative or non-integer numbers, sparse arrays, symbol keys, accessors,
class instances, dates, maps, sets, typed arrays, and cycles. It traverses without invoking getters.
A cycle returns `invalid-json` at the pointer where the repeated reference occurs with detail
`cyclic value is forbidden`. Other unsupported values use `invalid-json` at their pointer and
detail `unsupported JavaScript value`; non-plain objects use detail `expected a plain object`.
Serialization enforces the same depth, collection, decoded-string, and 1,048,576-byte complete
document limits as parsing. Oversized output returns `json-limit-exceeded` at the first overflowing
value, or `""` for total output size, with the literal detail in the compiled fixture matrix.

Validation uses this deterministic order: raw byte limit; UTF-8; BOM, carriage-return, and final-LF
framing; JSON syntax and numeric token grammar; duplicate keys, key order, escapes, NFC, and exact
canonical spelling; depth, collection, and decoded-string limits; envelope shape; envelope scalars
in the interface field order below; payload decoder; kind and digest equality. The corresponding
codes are, in order, `json-limit-exceeded`, `invalid-utf8`, `non-canonical-json`, `invalid-json`,
`non-canonical-json`, `json-limit-exceeded`, `invalid-envelope`, `invalid-scalar`, the decoder's
code, and `payload-digest-mismatch`. Streaming limit checks may stop before later phases. Within an
array, report the lowest index; within an object, report the first key in canonical key order.
Schema errors use the offending or missing field pointer and the literal details in the planning
fixture catalog. A decoder returns paths relative to its payload root; the envelope parser prefixes
them with `/payload`, preserves its code and detail, and maps a decoder throw to
`invalid-envelope` at `/payload` with detail `payload decoder threw`.

Create `src/modules/runtime/domain/protocol-primitives-v1.ts`. Implement the public branded aliases
with these exact rules:

    declare const protocolBrandV1: unique symbol;
    type BrandV1<T, N extends string> = T & { readonly [protocolBrandV1]: N };
    export type Uuid = BrandV1<string, "Uuid">;
    export type Sha256 = BrandV1<string, "Sha256">;
    export type GitSha = BrandV1<string, "GitSha">;
    export type UtcTimestamp = BrandV1<string, "UtcTimestamp">;
    export type RepoPath = BrandV1<string, "RepoPath">;
    export type RepositorySlugV1 = BrandV1<string, "RepositorySlugV1">;
    export type BranchNameV1 = BrandV1<string, "BranchNameV1">;
    export type ProtocolTokenV1 = BrandV1<string, "ProtocolTokenV1">;
    export type ArtifactKindV1 = BrandV1<string, "ArtifactKindV1">;
    export type ExternalArtifactIdV1 = BrandV1<string, "ExternalArtifactIdV1">;
    export type NonnegativeSafeIntegerV1 = BrandV1<number, "NonnegativeSafeIntegerV1">;
    export type PositiveSafeIntegerV1 = BrandV1<number, "PositiveSafeIntegerV1">;

- `Uuid` is 36 lowercase ASCII bytes matching
  `[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}`. Reject
  uppercase, braces, nil values, other versions, and other variants.
- `Sha256` is 64 lowercase hexadecimal ASCII bytes and `GitSha` is 40. Reject the all-zero value.
- `UtcTimestamp` is exactly 24 ASCII bytes in `YYYY-MM-DDTHH:mm:ss.sssZ`, names a real Gregorian
  date and 24-hour time, excludes leap seconds, and formats back to the identical bytes.
- `RepoPath` is NFC UTF-8 of 1 through 1,024 bytes. It is relative and slash-separated; every
  segment is 1 through 255 bytes and is neither `.`, `..`, nor `.git`. Reject leading or trailing
  slash, empty segments, backslash, controls, a drive prefix, percent-encoded traversal, and any
  input changed by NFC normalization.
- `RepositorySlugV1` is 3 through 201 printable ASCII bytes with exactly one slash. Each component
  is 1 through 100 bytes, begins and ends in an alphanumeric, and otherwise contains only
  alphanumerics, dot, underscore, or hyphen. Equality is exact and case-sensitive.
- `BranchNameV1` is 1 through 255 printable ASCII bytes accepted by the pure branch-ref rules in
  this plan. Reject `HEAD`, a leading hyphen, lone `@`, leading or trailing slash, repeated slash,
  trailing dot, a `.` or `..` segment, a segment ending `.lock`, and any `..`, `@{`, backslash,
  space, control, tilde, caret, colon, question mark, asterisk, or left bracket. Do not invoke Git.
- `ProtocolTokenV1` and `ArtifactKindV1` are 1 through 64 lowercase ASCII bytes matching
  `[a-z][a-z0-9]*(?:-[a-z0-9]+){0,7}`.
- `ExternalArtifactIdV1` is 1 through 256 printable ASCII bytes without leading or trailing
  whitespace, `://`, `?`, `#`, `=`, controls, or case-insensitive `Bearer `, `Basic `, `Cookie `,
  and `Token ` prefixes. It is an opaque non-secret identifier, never a URL or credential.
- `NonnegativeSafeIntegerV1` is an integer from zero through `Number.MAX_SAFE_INTEGER`.
  `PositiveSafeIntegerV1` starts at one. Reject non-number values, negative zero, fractions,
  infinities, and values outside the range.

Every scalar parser has signature `(value: unknown, path?: string) => ParseResultV1<Brand>`, where
the optional path defaults to `""`, and uses `invalid-scalar` at that path. It does not coerce,
trim, case-fold, or normalize. The exact exported declarations are:

    export function parseUuidV1(value: unknown, path?: string): ParseResultV1<Uuid>;
    export function parseSha256V1(value: unknown, path?: string): ParseResultV1<Sha256>;
    export function parseGitShaV1(value: unknown, path?: string): ParseResultV1<GitSha>;
    export function parseUtcTimestampV1(value: unknown, path?: string): ParseResultV1<UtcTimestamp>;
    export function parseRepoPathV1(value: unknown, path?: string): ParseResultV1<RepoPath>;
    export function parseRepositorySlugV1(value: unknown, path?: string): ParseResultV1<RepositorySlugV1>;
    export function parseBranchNameV1(value: unknown, path?: string): ParseResultV1<BranchNameV1>;
    export function parseProtocolTokenV1(value: unknown, path?: string): ParseResultV1<ProtocolTokenV1>;
    export function parseExternalArtifactIdV1(value: unknown, path?: string): ParseResultV1<ExternalArtifactIdV1>;
    export function parseNonnegativeSafeIntegerV1(value: unknown, path?: string): ParseResultV1<NonnegativeSafeIntegerV1>;
    export function parsePositiveSafeIntegerV1(value: unknown, path?: string): ParseResultV1<PositiveSafeIntegerV1>;

Define `ArtifactProviderV1` as `"git" | "git-issue" | "github" | "codex" | "local"`. The exact
artifact declarations are:

    export interface RepositoryArtifactReferenceV1 {
      readonly location: "repository"; readonly kind: ArtifactKindV1; readonly path: RepoPath;
      readonly commit: GitSha; readonly digest: Sha256;
    }
    export interface ExternalArtifactReferenceV1 {
      readonly location: "external"; readonly kind: ArtifactKindV1; readonly provider: ArtifactProviderV1;
      readonly external_id: ExternalArtifactIdV1; readonly digest: Sha256;
    }
    export type ArtifactReferenceV1 = RepositoryArtifactReferenceV1 | ExternalArtifactReferenceV1;
    export function parseArtifactReferenceV1(value: unknown, path?: string): ParseResultV1<ArtifactReferenceV1>;

A repository artifact is
`{ location: "repository"; kind; path; commit; digest }`. An external artifact is
`{ location: "external"; kind; provider; external_id; digest }`. `parseArtifactReferenceV1`
rejects unknown keys and validates every field. The repository form binds a path to one nonzero Git
commit and content digest. The external form binds a provider-issued identifier to a digest. Neither
form is trusted evidence by itself, and no public type contains a trust flag.

For artifacts, validate the root object, `location`, selected-variant unknown keys, required fields
in declaration order, then scalar values in that order. For envelopes, validate the root object,
unknown top-level keys in canonical order, required top-level fields in declaration order,
`protocol_version`, the idempotency object and its keys, top-level scalars, then the payload decoder
and digest bindings. The compiled `structuralFailureOraclesV1` matrix covers wrong roots, every
missing field, invalid discriminants and providers, unknown and cross-variant keys, nested
idempotency shape, payload shape, cycles, unsupported JavaScript values, and serializer overflow.
Each row's code, path, detail, and precedence is normative; implementation tests execute every row.

Create `src/modules/runtime/domain/protocol-envelope-v1.ts`. Define these exact generic interfaces:

    export interface IdempotencyIdentityV1<K extends ProtocolTokenV1> {
      readonly key: Uuid;
      readonly kind: K;
      readonly payload_digest: Sha256;
    }

    export interface CommandEnvelopeV1<K extends ProtocolTokenV1, P extends CanonicalJsonValueV1> {
      readonly protocol_version: 1;
      readonly command_id: Uuid;
      readonly project_id: Uuid;
      readonly issue_id: Uuid;
      readonly correlation_id: Uuid;
      readonly causation_id: Uuid | null;
      readonly idempotency: IdempotencyIdentityV1<K>;
      readonly payload: P & { readonly kind: K };
    }

    export type PayloadDecoderV1<K extends ProtocolTokenV1, P extends CanonicalJsonValueV1> =
      (value: CanonicalJsonValueV1, path: string) => ParseResultV1<P & { readonly kind: K }>;
    export function parseCanonicalJsonV1(bytes: Uint8Array): ParseResultV1<{
      readonly json: CanonicalJsonValueV1; readonly canonical_bytes: Uint8Array; readonly digest: Sha256;
    }>;
    export function serializeCanonicalJsonV1(value: unknown): ParseResultV1<Uint8Array>;
    export function canonicalDigestV1(domain: unknown, value: unknown): ParseResultV1<Sha256>;
    export function parseCommandEnvelopeV1<K extends ProtocolTokenV1, P extends CanonicalJsonValueV1>(
      bytes: Uint8Array, payloadDecoder: PayloadDecoderV1<K, P>
    ): ParseResultV1<CommandEnvelopeV1<K, P>>;
    export function serializeCommandEnvelopeV1<K extends ProtocolTokenV1, P extends CanonicalJsonValueV1>(
      value: unknown, payloadDecoder: PayloadDecoderV1<K, P>
    ): ParseResultV1<Uint8Array>;
    export function commandPayloadDigestV1<K extends ProtocolTokenV1, P extends CanonicalJsonValueV1>(
      kind: unknown, payload: unknown, payloadDecoder: PayloadDecoderV1<K, P>
    ): ParseResultV1<Sha256>;

`parseCommandEnvelopeV1(bytes, payloadDecoder)` applies the 262,144-byte envelope limit before the
general JSON parser, rejects every unknown or missing envelope key, validates the scalar fields,
and calls the supplied pure decoder for the policy-owned payload. The payload decoder must reject
unknown payload keys and return a payload whose `kind` is a `ProtocolTokenV1`. U2A1 does not define
any concrete command kind or payload.

`commandPayloadDigestV1(kind, payload, payloadDecoder)` validates the kind, invokes the decoder at
the empty path, requires `payload.kind === kind`, and computes the payload
digest with domain `mandem-command-payload-v1`. `parseCommandEnvelopeV1` requires the idempotency
kind to equal `payload.kind` and its digest to equal the recomputed digest. A mismatch returns
`payload-digest-mismatch`. `serializeCommandEnvelopeV1` repeats the same validations before
returning bytes, so a cast or manually assembled value cannot bypass them.

`canonicalDigestV1(domain, value)` validates the domain with `ProtocolTokenV1` at `/domain`, then
serializes the
value, and computes SHA-256 over ASCII domain bytes, one zero byte, the canonical byte length as an
unsigned 64-bit big-endian integer, and the canonical bytes including their final line feed. It
returns lowercase `Sha256`. The fixed domain `mandem-canonical-json-v1` is used for the digest
returned by `parseCanonicalJsonV1`; payload identity uses `mandem-command-payload-v1`. Tests include
literal expected hashes so an implementation cannot change the formula and update both sides.

## Five Pre-Review Proofs

The `closed-contract` proof is the compiled catalog in
`docs/plans/contracts/u2a1-runtime-protocol-contract.ts`. Its test requires the public inventories
above to match, keeps the catalogs sorted and unique, checks that fixtures cover accepted and
rejected boundaries, and fixes all parser limits. No later issue may add a second grammar for these
types; it must import the runtime root barrel.

The `provenance` proof records four value paths in the compiled contract. Callers and later adapters
produce canonical bytes, but parsing supplies no authentication. A later Git adapter produces a
repository reference after resolving committed bytes; a later provider adapter produces an
external reference after authentication. U2A1 validates only structure and immutable coordinates.
`canonicalDigestV1` alone produces derived digests. U2A2 is the first policy consumer and must pair
references with its own trusted observation rather than accepting them as proof.

The `state-and-replay` proof is intentionally bounded: U2A1 has no state, event, fold, or recovery
operation. Its relevant invariant is representation replay. For every accepted fixture,
parse → serialize produces byte-identical output, repeated digest calls match, and rebuilding an
envelope from the parsed value preserves its idempotency identity. Deleting all in-memory values
and reparsing the stored bytes produces the same typed values and digest. The focused tests prove
these cases; lifecycle event replay belongs exclusively to U2A5.

The `milestone` proof is `milestoneDependencyCatalogV1`. The first milestone imports only existing
runtime files and its own JSON and primitive files. The second imports those merged first-milestone
files plus the envelope file. The final milestone changes barrels and documentation only after both
focused suites pass. No test imports `execution` or a later U2A subissue.

The `scope` proof is the compiled exclusion inventory. U2A1 owns one independently demonstrable
behavior: structural bytes and identity become one canonical typed representation. U2A2 owns clean
review evidence, U2A3 owns plan admission, U2A4 owns active work, U2A5 owns lifecycle composition
and replay, and U2B owns persistence. U2A1 cannot define concrete lifecycle commands, trusted
principals, approval parsing, state transitions, leases, events, or storage.

Run this evidence before review from a clean checkout. The required bootstrap is:

    bun --version
    bun install --frozen-lockfile
    git diff --exit-code -- bun.lock

The first command must print `1.3.14`; installation must exit zero; the final command must produce
no diff. If installation is interrupted or fails, rerun the same frozen-lockfile command. Do not
delete the lockfile or dependency cache without evidence of corruption. Then run:

    bunx vitest run docs/plans/contracts/u2a1-runtime-protocol-contract.test.ts

The expected result is one passing file and eleven passing tests. Any failure means the plan is not
ready for clean-room review.

## Plan of Work

Milestone 1 creates scalar and canonical JSON behavior. First write failing tests in
`src/modules/runtime/domain/canonical-json-v1.test.ts` and
`src/modules/runtime/domain/protocol-primitives-v1.test.ts` from every named fixture in the planning
contract. Include literal byte arrays where invalid UTF-8 or byte-order matters and literal digest
expectations for the empty object, nested object, Unicode string, and maximum safe integer. Then
implement the tokenizer, serializer, digest framing, brands, and scalar parsers in
`canonical-json-v1.ts` and `protocol-primitives-v1.ts`. Keep tokenizer state private. The milestone
ends only when both focused test files pass together and architecture checks remain green.

Milestone 2 creates structural artifact and command identity behavior. Extend the primitive test
with both artifact union variants and every forbidden external-ID shape. Add
`protocol-envelope-v1.test.ts` before `protocol-envelope-v1.ts`; use a tiny test-only payload decoder
with two known fields so unknown-key behavior is visible without importing a later issue. Test exact
envelope bytes, an envelope-only field change that preserves payload digest, a payload change that
changes it, a kind change, digest mismatch, unknown envelope and payload keys, byte limit equality,
and the first byte above the limit. Implement the envelope only after those tests fail for the
expected missing behavior.

Milestone 3 publishes the reviewed handoff. Add stable type and function exports to
`src/modules/runtime/domain/index.ts` and `src/modules/runtime/index.ts`. Keep
`src/modules/runtime/domain/types.ts` limited to the existing `RuntimeIdentity`; do not create a
second protocol declaration there. Expand `src/modules/runtime/README.md` with the canonical-byte
contract, the structural-not-trusted warning, the two fixed digest domains, and one short parse
example. Confirm existing CLI and server consumers still compile without changes. Run the complete
repository checks, then commit, push, open a pull request, and follow the guarded merge workflow.

## Concrete Steps

Work from the repository root in the isolated worktree created for U2A1. Before implementation,
confirm the approved plan commit and that execution authorization matches it. Then run:

    bun --version
    bun install --frozen-lockfile
    git diff --exit-code -- bun.lock
    git status --short
    bunx vitest run docs/plans/contracts/u2a1-runtime-protocol-contract.test.ts

Expect Bun 1.3.14, an unchanged lockfile, a clean worktree, and eleven passing planning-contract tests.
If installation is interrupted or fails, rerun `bun install --frozen-lockfile`. Create the Milestone 1 tests and
run them before implementation:

    bunx vitest run src/modules/runtime/domain/canonical-json-v1.test.ts src/modules/runtime/domain/protocol-primitives-v1.test.ts

Expect failures caused by missing exports or behavior. Implement only Milestone 1, rerun that exact
command until it passes, then run:

    bun run architecture:check
    bun run typecheck

For Milestone 2, add the envelope tests first and run:

    bunx vitest run src/modules/runtime/domain/protocol-envelope-v1.test.ts

After implementing the envelope, run all three runtime-domain suites together. For Milestone 3,
update the barrels and README, then run:

    bun run check

The complete command must report every check and test passing. Record the actual file and test
counts in `Progress` and `Outcomes & Retrospective`; do not copy the planning-time count as an
implementation result.

After local verification, commit only U2A1 files, push the feature branch, and open a pull request
against `main`. The orchestrator watches checks and feedback. Before merge it states the repository,
pull-request number, and exact head commit, receives standalone operator approval, records that
approval in the native issue, and runs `bun run pr:merge:approved`. Verify `origin/main` contains
the merge commit and that U2A2 can import every public handoff through `@/modules/runtime`.

## Validation and Acceptance

Acceptance requires behavior, not only compilation. The canonical JSON tests must demonstrate that
one accepted byte string reparses and reserializes without a byte change, that object order and
array order behave differently as specified, and that each alternative spelling fails with its
stable code. Raw invalid UTF-8, duplicate keys, unsafe numbers, non-NFC input, and all four limit
boundaries must fail without throwing or returning a partial value.

Every scalar grammar needs the accepted minimum, accepted maximum where meaningful, and first
invalid neighbor. Path tests measure UTF-8 bytes rather than JavaScript character count. Timestamp
tests include leap day, invalid date, offset, missing milliseconds, and leap second. Branch tests
exercise every forbidden sequence named above without calling Git.

Artifact tests prove that location selects one complete shape, unknown or cross-variant fields fail,
and URL or credential material cannot enter `external_id`. They also state in test names that valid
structure does not confer trust. Envelope tests prove kind and payload digest equality before a
success result, reject unknown keys, and show identical inputs produce identical bytes and digest.

The public handoff is accepted only when a test imports every inventory member from
`@/modules/runtime`, the existing entrypoint tests still pass, `bun run check` is green, the pull
request is merged through the approved head, and a fresh checkout of `main` can run the focused
runtime tests. U2A2 remains blocked until that merge verification succeeds.

## Idempotence and Recovery

All implementation commands are safe to repeat. The parser and digest functions are pure and read
no clock, environment, filesystem, Git repository, provider, or process state. Tests use fixed
bytes and literal expected hashes.

If a tokenizer change breaks several fixtures, return to the last passing milestone commit rather
than weakening fixtures. If the worktree disappears, recreate it at the approved plan commit and
resume from the latest pushed U2A1 branch; the native issue records the branch and phase. If the
pull-request head changes after approval, the guarded merge rejects it and the orchestrator must
request approval for the new exact head. No migration or destructive data operation exists.

## Artifacts and Notes

The durable pre-review evidence is:

    docs/plans/contracts/u2a1-runtime-protocol-contract.ts
    docs/plans/contracts/u2a1-runtime-protocol-contract.test.ts
    docs/plans/issues/u2a1-runtime-protocol-foundation.md

The preserved combined U2A plan at Git commit
`1dc6f582030d31f17571761ce7f2a340a0774b06` is historical evidence only. It is not an input required
for implementation and cannot override this plan. `PLANS.md` remains unchanged.

## Interfaces and Dependencies

Use only Bun and the existing TypeScript toolchain. `node:crypto` is allowed in the pure runtime
domain for SHA-256; do not add a package. Do not import `architecture-standard`, `execution`, an
adapter, or Node input/output APIs. The runtime root barrel is the only supported cross-module
import path for later consumers.

At completion, `src/modules/runtime/index.ts` exports every name in the public type and function
inventories. The implementations live in the three named domain files. Tests may import adjacent
domain files while developing, but add one public-barrel reachability test before completion.
Concrete policy decoders implement the payload callback in later issues; U2A1 supplies no command
catalog and no default decoder that accepts arbitrary objects.

Plan revision note (2026-08-19): Replaced the split scaffold with a complete U2A1 implementation
contract. After clean-room rounds 1 and 2, added clean-checkout bootstrap and recovery, exact
exported signatures and UUID grammar, literal executable boundary and digest oracles, deterministic
validation precedence, and a closed structural and serializer failure matrix. `PLANS.md` remains
unchanged. After the mandatory third-failure redesign, fixture catalogs are also checked against
the error authority of their owning public function.
Round 4 made the string-size guard independently reachable below the raw document limit and added
adjacent executable fixtures.
