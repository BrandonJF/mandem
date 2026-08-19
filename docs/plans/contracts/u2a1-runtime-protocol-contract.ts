/** @fileoverview Machine-checkable pre-review contract for the bounded U2A1 runtime protocol. */

export const publicTypeCatalogV1 = {
  ArtifactKindV1: "brand:string:protocol-token",
  ArtifactProviderV1: "enum:git|git-issue|github|codex|local",
  ArtifactReferenceV1: "union:RepositoryArtifactReferenceV1|ExternalArtifactReferenceV1",
  BranchNameV1: "brand:string:git-branch-ref",
  CanonicalJsonErrorCodeV1: "enum:invalid-utf8|invalid-json|non-canonical-json|json-limit-exceeded|invalid-scalar|invalid-envelope|payload-digest-mismatch",
  CanonicalJsonValueV1: "recursive:null|boolean|unsigned-safe-integer|nfc-string|array|object",
  CommandEnvelopeV1: "generic-object:kind,payload",
  ExternalArtifactIdV1: "brand:string:non-secret-provider-id",
  ExternalArtifactReferenceV1: "object:location=external,kind,provider,external_id,digest",
  GitSha: "brand:string:lower-hex-40-nonzero",
  IdempotencyIdentityV1: "generic-object:key,kind,payload_digest",
  NonnegativeSafeIntegerV1: "brand:number:0..9007199254740991",
  ParseResultV1: "generic-union:success|failure",
  PayloadDecoderV1: "generic-function:canonical-payload-to-parse-result",
  PositiveSafeIntegerV1: "brand:number:1..9007199254740991",
  ProtocolTokenV1: "brand:string:lower-kebab-1..64",
  RepoPath: "brand:string:nfc-relative-slash-path-1..1024-bytes",
  RepositoryArtifactReferenceV1: "object:location=repository,kind,path,commit,digest",
  RepositorySlugV1: "brand:string:owner/name-3..201-ascii-bytes",
  Sha256: "brand:string:lower-hex-64-nonzero",
  UtcTimestamp: "brand:string:rfc3339-utc-milliseconds-24-bytes",
  Uuid: "brand:string:rfc4122-v4-lowercase-36-bytes",
} as const;

export const publicFunctionCatalogV1 = [
  "canonicalDigestV1",
  "commandPayloadDigestV1",
  "parseArtifactReferenceV1",
  "parseBranchNameV1",
  "parseCanonicalJsonV1",
  "parseCommandEnvelopeV1",
  "parseExternalArtifactIdV1",
  "parseGitShaV1",
  "parseNonnegativeSafeIntegerV1",
  "parsePositiveSafeIntegerV1",
  "parseProtocolTokenV1",
  "parseRepoPathV1",
  "parseRepositorySlugV1",
  "parseSha256V1",
  "parseUtcTimestampV1",
  "parseUuidV1",
  "serializeCanonicalJsonV1",
  "serializeCommandEnvelopeV1",
] as const;

export const canonicalLimitsV1 = {
  max_bytes: 1_048_576,
  max_depth: 16,
  max_collection_entries: 1_024,
  max_string_bytes: 1_048_576,
  max_command_envelope_bytes: 262_144,
} as const;

export const boundaryFixtureCatalogV1 = {
  canonical_json: [
    "null", "boolean", "zero", "max-safe-integer", "nfc-unicode", "control-escapes",
    "nested-key-order", "duplicate-key", "unknown-envelope-key", "noncanonical-key-order",
    "leading-zero", "negative-number", "fraction", "exponent", "unsafe-integer", "invalid-utf8",
    "bom", "missing-final-lf", "extra-final-lf", "non-nfc", "lone-surrogate", "depth-limit",
    "collection-limit", "byte-limit",
  ],
  scalars: [
    "uuid-valid", "uuid-uppercase", "uuid-wrong-version", "uuid-wrong-variant", "uuid-nil",
    "sha256-valid", "sha256-uppercase", "sha256-zero", "git-sha-valid", "git-sha-zero",
    "timestamp-valid", "timestamp-offset", "timestamp-precision", "timestamp-invalid-date",
    "repo-path-valid-unicode", "repo-path-traversal", "repo-path-dot-git", "repo-path-backslash",
    "repo-path-non-nfc", "repository-slug-valid", "repository-slug-extra-slash",
    "branch-valid", "branch-head", "branch-leading-hyphen", "branch-dot-lock", "branch-at-brace",
    "token-valid", "token-uppercase", "token-empty-component", "external-id-valid",
    "external-id-url", "external-id-query", "external-id-credential-prefix",
    "safe-integer-zero", "safe-integer-max", "positive-integer-zero",
  ],
  identity: [
    "payload-digest-domain", "payload-digest-kind-binding", "idempotency-kind-mismatch",
    "idempotency-digest-mismatch", "envelope-round-trip", "envelope-unknown-key",
  ],
} as const;

const encoder = new TextEncoder();
const jsonBytes = (source: string): Uint8Array => encoder.encode(source);
const nestedArrayBytes = (depth: number): Uint8Array => jsonBytes(`${"[".repeat(depth)}0${"]".repeat(depth)}\n`);
const repeatedArrayBytes = (count: number): Uint8Array => jsonBytes(`[${Array.from({ length: count }, () => "0").join(",")}]\n`);
const stringDocumentBytes = (contentBytes: number): Uint8Array => jsonBytes(`"${"a".repeat(contentBytes)}"\n`);
const nestedArrayValue = (depth: number): unknown => {
  let value: unknown = 0;
  for (let index = 0; index < depth; index += 1) value = [value];
  return value;
};

/** Literal or deterministically constructed bytes and expected results used before implementation. */
export const canonicalFixtureOraclesV1 = {
  null: { bytes: jsonBytes("null\n"), value: null },
  boolean: { bytes: jsonBytes("true\n"), value: true },
  zero: { bytes: jsonBytes("0\n"), value: 0 },
  "max-safe-integer": { bytes: jsonBytes("9007199254740991\n"), value: 9_007_199_254_740_991 },
  "nfc-unicode": { bytes: jsonBytes('"é"\n'), value: "é" },
  "control-escapes": { bytes: jsonBytes('"\\b\\t\\n\\f\\r\\u0000"\n'), value: "\b\t\n\f\r\u0000" },
  "nested-key-order": { bytes: jsonBytes('{"a":[1,true,null],"z":"é"}\n'), value: { a: [1, true, null], z: "é" } },
  "duplicate-key": { bytes: jsonBytes('{"a":1,"a":1}\n'), code: "non-canonical-json", path: "/a", detail: "duplicate object key" },
  "unknown-envelope-key": { bytes: jsonBytes('{"extra":0}\n'), code: "invalid-envelope", path: "/extra", detail: "unknown envelope key" },
  "noncanonical-key-order": { bytes: jsonBytes('{"z":0,"a":0}\n'), code: "non-canonical-json", path: "/a", detail: "object keys are not ordered" },
  "leading-zero": { bytes: jsonBytes("01\n"), code: "invalid-json", path: "", detail: "invalid unsigned integer token" },
  "negative-number": { bytes: jsonBytes("-1\n"), code: "invalid-json", path: "", detail: "invalid unsigned integer token" },
  fraction: { bytes: jsonBytes("1.0\n"), code: "invalid-json", path: "", detail: "invalid unsigned integer token" },
  exponent: { bytes: jsonBytes("1e0\n"), code: "invalid-json", path: "", detail: "invalid unsigned integer token" },
  "unsafe-integer": { bytes: jsonBytes("9007199254740992\n"), code: "invalid-json", path: "", detail: "unsigned integer exceeds safe range" },
  "invalid-utf8": { bytes: Uint8Array.from([0xc3, 0x28, 0x0a]), code: "invalid-utf8", path: "", detail: "input is not valid UTF-8" },
  bom: { bytes: Uint8Array.from([0xef, 0xbb, 0xbf, 0x6e, 0x75, 0x6c, 0x6c, 0x0a]), code: "non-canonical-json", path: "", detail: "byte-order mark is forbidden" },
  "missing-final-lf": { bytes: jsonBytes("null"), code: "non-canonical-json", path: "", detail: "exactly one final LF is required" },
  "extra-final-lf": { bytes: jsonBytes("null\n\n"), code: "non-canonical-json", path: "", detail: "exactly one final LF is required" },
  "non-nfc": { bytes: jsonBytes('"é"\n'), code: "non-canonical-json", path: "", detail: "string is not NFC" },
  "lone-surrogate": { bytes: jsonBytes('"\\ud800"\n'), code: "invalid-json", path: "", detail: "surrogate escape is forbidden" },
  "depth-limit-accepted": { bytes: nestedArrayBytes(16), value: nestedArrayValue(16) },
  "depth-limit-rejected": { bytes: nestedArrayBytes(17), code: "json-limit-exceeded", path: "/0/0/0/0/0/0/0/0/0/0/0/0/0/0/0/0", detail: "maximum depth is 16" },
  "collection-limit-accepted": { bytes: repeatedArrayBytes(1_024), value: Array.from({ length: 1_024 }, () => 0) },
  "collection-limit-rejected": { bytes: repeatedArrayBytes(1_025), code: "json-limit-exceeded", path: "/1024", detail: "maximum collection size is 1024" },
  "byte-limit-accepted": { bytes: stringDocumentBytes(1_048_573), value: "a".repeat(1_048_573) },
  "byte-limit-rejected": { bytes: stringDocumentBytes(1_048_574), code: "json-limit-exceeded", path: "", detail: "maximum input size is 1048576 bytes" },
} as const;

export const scalarFixtureOraclesV1 = {
  "uuid-valid": { input: "123e4567-e89b-42d3-a456-426614174000", value: "same bytes" },
  "uuid-uppercase": { input: "123E4567-E89B-42D3-A456-426614174000", code: "invalid-scalar", path: "/id", detail: "expected lowercase RFC 4122 version 4 UUID" },
  "uuid-wrong-version": { input: "123e4567-e89b-12d3-a456-426614174000", code: "invalid-scalar", path: "/id", detail: "expected lowercase RFC 4122 version 4 UUID" },
  "uuid-wrong-variant": { input: "123e4567-e89b-42d3-7456-426614174000", code: "invalid-scalar", path: "/id", detail: "expected lowercase RFC 4122 version 4 UUID" },
  "uuid-nil": { input: "00000000-0000-0000-0000-000000000000", code: "invalid-scalar", path: "/id", detail: "expected lowercase RFC 4122 version 4 UUID" },
  "sha256-valid": { input: "1".repeat(64), value: "same bytes" },
  "sha256-uppercase": { input: "A".repeat(64), code: "invalid-scalar", path: "/digest", detail: "expected nonzero lowercase hexadecimal SHA-256" },
  "sha256-zero": { input: "0".repeat(64), code: "invalid-scalar", path: "/digest", detail: "expected nonzero lowercase hexadecimal SHA-256" },
  "git-sha-valid": { input: "1".repeat(40), value: "same bytes" },
  "git-sha-zero": { input: "0".repeat(40), code: "invalid-scalar", path: "/commit", detail: "expected nonzero lowercase hexadecimal Git SHA-1" },
  "timestamp-valid": { input: "2024-02-29T23:59:59.999Z", value: "same bytes" },
  "timestamp-offset": { input: "2024-02-29T23:59:59.999+00:00", code: "invalid-scalar", path: "/time", detail: "expected UTC timestamp with millisecond precision" },
  "timestamp-precision": { input: "2024-02-29T23:59:59Z", code: "invalid-scalar", path: "/time", detail: "expected UTC timestamp with millisecond precision" },
  "timestamp-invalid-date": { input: "2023-02-29T23:59:59.999Z", code: "invalid-scalar", path: "/time", detail: "timestamp date is invalid" },
  "repo-path-valid-unicode": { input: "docs/é.md", value: "same bytes" },
  "repo-path-traversal": { input: "docs/../secret", code: "invalid-scalar", path: "/path", detail: "repository path contains a forbidden segment" },
  "repo-path-dot-git": { input: ".git/config", code: "invalid-scalar", path: "/path", detail: "repository path contains a forbidden segment" },
  "repo-path-backslash": { input: "docs\\file", code: "invalid-scalar", path: "/path", detail: "repository path must use slash separators" },
  "repo-path-non-nfc": { input: "docs/é.md", code: "invalid-scalar", path: "/path", detail: "repository path is not NFC" },
  "repository-slug-valid": { input: "BrandonJF/mandem", value: "same bytes" },
  "repository-slug-extra-slash": { input: "BrandonJF/mandem/extra", code: "invalid-scalar", path: "/repository", detail: "expected exact owner/name repository slug" },
  "branch-valid": { input: "docs/u2a1-plan", value: "same bytes" },
  "branch-head": { input: "HEAD", code: "invalid-scalar", path: "/branch", detail: "branch name violates the pure branch-ref grammar" },
  "branch-leading-hyphen": { input: "-topic", code: "invalid-scalar", path: "/branch", detail: "branch name violates the pure branch-ref grammar" },
  "branch-dot-lock": { input: "topic.lock", code: "invalid-scalar", path: "/branch", detail: "branch name violates the pure branch-ref grammar" },
  "branch-at-brace": { input: "topic@{1}", code: "invalid-scalar", path: "/branch", detail: "branch name violates the pure branch-ref grammar" },
  "token-valid": { input: "submit-plan-review", value: "same bytes" },
  "token-uppercase": { input: "Submit-plan", code: "invalid-scalar", path: "/kind", detail: "expected lowercase kebab token" },
  "token-empty-component": { input: "submit--plan", code: "invalid-scalar", path: "/kind", detail: "expected lowercase kebab token" },
  "external-id-valid": { input: "run_12345", value: "same bytes" },
  "external-id-url": { input: "https://example.com/run", code: "invalid-scalar", path: "/external_id", detail: "external artifact identifier must be non-secret and opaque" },
  "external-id-query": { input: "run?token=x", code: "invalid-scalar", path: "/external_id", detail: "external artifact identifier must be non-secret and opaque" },
  "external-id-credential-prefix": { input: "Bearer abc", code: "invalid-scalar", path: "/external_id", detail: "external artifact identifier must be non-secret and opaque" },
  "safe-integer-zero": { input: 0, value: 0 },
  "safe-integer-max": { input: 9_007_199_254_740_991, value: 9_007_199_254_740_991 },
  "positive-integer-zero": { input: 0, code: "invalid-scalar", path: "/count", detail: "expected positive safe integer" },
} as const;

export const digestFixtureOraclesV1 = [
  { id: "empty-object", domain: "mandem-canonical-json-v1", bytes: jsonBytes("{}\n"), digest: "64890e7ca189e4adc6073800cf49b19919282ce8b47f283ed368885b75484f01" },
  { id: "nested-object", domain: "mandem-canonical-json-v1", bytes: jsonBytes('{"a":[1,true,null],"z":"é"}\n'), digest: "f64695c8966783e53a707d5d9ece9443d5e976714be1e2a79127370f8d04b5c3" },
  { id: "unicode-string", domain: "mandem-canonical-json-v1", bytes: jsonBytes('"é"\n'), digest: "00fba9d160bc26289a8d0757039879601e01e7ca9586a389bd3fa768188dcc72" },
  { id: "max-safe-integer", domain: "mandem-canonical-json-v1", bytes: jsonBytes("9007199254740991\n"), digest: "64765721564939a646c2d6afe614fc2d2d53a21ef6301f3d67e78aa885c3a534" },
] as const;

export const identityFixtureOraclesV1 = {
  payload: { kind: "test-command", value: 1 },
  changed_payload: { kind: "test-command", value: 2 },
  payload_digest: "8e3a5e71b09d707d9a6393372f1cb69b17fc3c7c5a82e0ee139908f59a46eb56",
  changed_payload_digest: "cb5ec30b114c98fc8ce4f74d24f204db3d6ff03284e436c79944ea9af8ea668d",
  envelope: {
    protocol_version: 1,
    command_id: "123e4567-e89b-42d3-a456-426614174000",
    project_id: "223e4567-e89b-42d3-a456-426614174000",
    issue_id: "323e4567-e89b-42d3-a456-426614174000",
    correlation_id: "423e4567-e89b-42d3-a456-426614174000",
    causation_id: null,
    idempotency: {
      key: "523e4567-e89b-42d3-a456-426614174000",
      kind: "test-command",
      payload_digest: "8e3a5e71b09d707d9a6393372f1cb69b17fc3c7c5a82e0ee139908f59a46eb56",
    },
    payload: { kind: "test-command", value: 1 },
  },
  failures: {
    "idempotency-kind-mismatch": { code: "payload-digest-mismatch", path: "/idempotency/kind", detail: "idempotency kind does not match payload kind" },
    "idempotency-digest-mismatch": { code: "payload-digest-mismatch", path: "/idempotency/payload_digest", detail: "idempotency digest does not match payload" },
    "envelope-unknown-key": { code: "invalid-envelope", path: "/extra", detail: "unknown envelope key" },
  },
} as const;

export const provenanceCatalogV1 = [
  {
    value: "canonical input bytes",
    producer: "caller or later adapter",
    authentication: "none in U2A1",
    immutable_binding: "successful parse retains exact canonical bytes and their SHA-256 digest",
    consumer: "schema decoders in U2A2 through U2A5",
    trust_result: "structural-only",
  },
  {
    value: "repository artifact reference",
    producer: "later Git adapter after resolving committed bytes",
    authentication: "outside U2A1; U2A1 validates only path, commit, kind, and digest grammar",
    immutable_binding: "path plus Git commit plus content digest",
    consumer: "U2A2 review-evidence validation and later workflow evidence",
    trust_result: "structural-only",
  },
  {
    value: "external artifact reference",
    producer: "later provider adapter after authenticating a provider response",
    authentication: "outside U2A1; U2A1 rejects URL and credential-shaped external identifiers",
    immutable_binding: "provider plus opaque external identifier plus content digest",
    consumer: "policy-specific trusted observations in U2A2 through U2A5",
    trust_result: "structural-only",
  },
  {
    value: "canonical digest",
    producer: "canonicalDigestV1",
    authentication: "not applicable; deterministic local computation",
    immutable_binding: "domain separator, zero byte, uint64 byte length, and canonical bytes",
    consumer: "idempotency identity and later policy contracts",
    trust_result: "derived",
  },
] as const;

export const milestoneDependencyCatalogV1 = {
  "scalar-and-json": [
    "src/modules/runtime/domain/canonical-json-v1.ts",
    "src/modules/runtime/domain/canonical-json-v1.test.ts",
    "src/modules/runtime/domain/protocol-primitives-v1.ts",
    "src/modules/runtime/domain/protocol-primitives-v1.test.ts",
  ],
  "artifact-and-envelope": [
    "src/modules/runtime/domain/canonical-json-v1.ts",
    "src/modules/runtime/domain/protocol-primitives-v1.ts",
    "src/modules/runtime/domain/protocol-envelope-v1.ts",
    "src/modules/runtime/domain/protocol-envelope-v1.test.ts",
  ],
  "public-handoff": [
    "src/modules/runtime/domain/index.ts",
    "src/modules/runtime/index.ts",
    "src/modules/runtime/README.md",
  ],
} as const;

export const scopeExclusionsV1 = [
  "approval-record-parsing",
  "authenticated-principals",
  "clean-review-validation",
  "event-catalogs",
  "lifecycle-command-catalogs",
  "lifecycle-replay",
  "persistence",
  "policy-specific-trusted-observations",
  "state-transitions",
  "workspace-leases",
] as const;
