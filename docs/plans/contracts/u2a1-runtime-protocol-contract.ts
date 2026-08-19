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
