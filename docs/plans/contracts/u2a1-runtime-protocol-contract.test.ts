/** @fileoverview Verifies the U2A1 pre-review contract and its ExecPlan parity. */

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  boundaryFixtureCatalogV1,
  canonicalFixtureOraclesV1,
  canonicalLimitsV1,
  digestFixtureOraclesV1,
  identityFixtureOraclesV1,
  milestoneDependencyCatalogV1,
  provenanceCatalogV1,
  publicFunctionCatalogV1,
  publicTypeCatalogV1,
  scalarFixtureOraclesV1,
  scopeExclusionsV1,
  structuralFailureOraclesV1,
} from "./u2a1-runtime-protocol-contract";

const planPath = "docs/plans/issues/u2a1-runtime-protocol-foundation.md";

function inlineInventory(plan: string, label: string): readonly string[] {
  const pattern = new RegExp(`^${label}: (.+)$`, "mu");
  const value = pattern.exec(plan)?.[1];
  if (!value) return [];
  return [...value.matchAll(/`([^`]+)`/gu)].map((match) => match[1] ?? "");
}

describe("U2A1 pre-review contract", () => {
  it("keeps the public type and function catalogs unique and sorted", () => {
    const types = Object.keys(publicTypeCatalogV1);
    const functions = [...publicFunctionCatalogV1];
    expect(types).toEqual([...types].sort());
    expect(functions).toEqual([...functions].sort());
    expect(new Set(types).size).toBe(types.length);
    expect(new Set(functions).size).toBe(functions.length);
  });

  it("binds the ExecPlan inventories to the compiled catalogs", () => {
    const plan = readFileSync(planPath, "utf8");
    expect(inlineInventory(plan, "Public type inventory")).toEqual(Object.keys(publicTypeCatalogV1));
    expect(inlineInventory(plan, "Public function inventory")).toEqual(publicFunctionCatalogV1);
    expect(inlineInventory(plan, "Scope exclusion inventory")).toEqual(scopeExclusionsV1);
  });

  it("covers every boundary family with accepted and rejected fixtures", () => {
    expect(boundaryFixtureCatalogV1.canonical_json).toContain("max-safe-integer");
    expect(boundaryFixtureCatalogV1.canonical_json).toContain("duplicate-key");
    expect(boundaryFixtureCatalogV1.canonical_json).toContain("invalid-utf8");
    expect(boundaryFixtureCatalogV1.canonical_json).toContain("byte-limit");
    expect(boundaryFixtureCatalogV1.scalars).toContain("uuid-valid");
    expect(boundaryFixtureCatalogV1.scalars).toContain("uuid-wrong-version");
    expect(boundaryFixtureCatalogV1.scalars).toContain("repo-path-traversal");
    expect(boundaryFixtureCatalogV1.identity).toContain("envelope-round-trip");
    expect(boundaryFixtureCatalogV1.identity).toContain("idempotency-digest-mismatch");
  });

  it("provides executable canonical and scalar fixture oracles", () => {
    expect(canonicalFixtureOraclesV1["byte-limit-accepted"].bytes).toHaveLength(canonicalLimitsV1.max_bytes);
    expect(canonicalFixtureOraclesV1["byte-limit-rejected"].bytes).toHaveLength(canonicalLimitsV1.max_bytes + 1);
    expect(canonicalFixtureOraclesV1["depth-limit-accepted"].bytes[0]).toBe("[".charCodeAt(0));
    expect(canonicalFixtureOraclesV1["depth-limit-rejected"].path.split("/")).toHaveLength(canonicalLimitsV1.max_depth + 1);
    expect(canonicalFixtureOraclesV1["collection-limit-accepted"].bytes).toBeInstanceOf(Uint8Array);
    expect(canonicalFixtureOraclesV1["collection-limit-rejected"].path).toBe(`/${canonicalLimitsV1.max_collection_entries}`);
    for (const fixture of [...Object.values(canonicalFixtureOraclesV1), ...Object.values(scalarFixtureOraclesV1)]) {
      if ("code" in fixture) {
        expect(fixture.code.length).toBeGreaterThan(0);
        expect(fixture.path).toBeDefined();
        expect(fixture.detail.length).toBeGreaterThan(0);
      } else {
        expect("value" in fixture).toBe(true);
      }
    }
  });

  it("keeps fixture errors with the public function that can decide them", () => {
    const canonicalCodes = new Set(["invalid-utf8", "invalid-json", "non-canonical-json", "json-limit-exceeded"]);
    for (const fixture of Object.values(canonicalFixtureOraclesV1)) {
      if ("code" in fixture) expect(canonicalCodes.has(fixture.code)).toBe(true);
    }
    expect(structuralFailureOraclesV1.envelope.some((fixture) => fixture.id === "unknown-key" && fixture.code === "invalid-envelope")).toBe(true);
  });

  it("pins digest framing to independent literal SHA-256 oracles", () => {
    for (const fixture of digestFixtureOraclesV1) {
      const length = new Uint8Array(8);
      new DataView(length.buffer).setBigUint64(0, BigInt(fixture.bytes.byteLength));
      const digest = createHash("sha256")
        .update(fixture.domain, "ascii")
        .update(Uint8Array.of(0))
        .update(length)
        .update(fixture.bytes)
        .digest("hex");
      expect(digest).toBe(fixture.digest);
    }
    expect(identityFixtureOraclesV1.payload_digest).not.toBe(identityFixtureOraclesV1.changed_payload_digest);
    expect(Object.values(identityFixtureOraclesV1.failures).every((failure) => failure.path.startsWith("/"))).toBe(true);
  });

  it("closes every structural and serializer failure result", () => {
    const failures = Object.values(structuralFailureOraclesV1).flat();
    expect(structuralFailureOraclesV1.artifact.map((fixture) => fixture.id)).toEqual(expect.arrayContaining([
      "root-not-object", "missing-location", "invalid-location", "repository-cross-variant-provider",
      "external-cross-variant-path", "external-invalid-provider",
    ]));
    expect(structuralFailureOraclesV1.envelope.filter((fixture) => fixture.id.startsWith("missing-"))).toHaveLength(8);
    expect(structuralFailureOraclesV1.envelope.filter((fixture) => fixture.id.startsWith("idempotency-missing-"))).toHaveLength(3);
    expect(structuralFailureOraclesV1.serializer.map((fixture) => fixture.id)).toEqual(expect.arrayContaining([
      "cyclic-object", "sparse-array", "non-plain-object", "output-too-large",
    ]));
    for (const failure of failures) {
      expect(failure.code.length).toBeGreaterThan(0);
      expect(failure.path).toBeDefined();
      expect(failure.detail.length).toBeGreaterThan(0);
      expect("input" in failure || "value" in failure || "construction" in failure).toBe(true);
    }
  });

  it("bounds raw allocation before nested parsing", () => {
    expect(canonicalLimitsV1.max_command_envelope_bytes).toBeLessThan(canonicalLimitsV1.max_bytes);
    expect(canonicalLimitsV1.max_depth).toBeGreaterThan(0);
    expect(canonicalLimitsV1.max_collection_entries).toBeGreaterThan(0);
    expect(canonicalLimitsV1.max_string_bytes).toBeLessThanOrEqual(canonicalLimitsV1.max_bytes);
  });

  it("does not upgrade structural input into trusted evidence", () => {
    expect(provenanceCatalogV1).toHaveLength(4);
    for (const row of provenanceCatalogV1) {
      expect(row.producer.length).toBeGreaterThan(0);
      expect(row.authentication.length).toBeGreaterThan(0);
      expect(row.immutable_binding.length).toBeGreaterThan(0);
      expect(row.consumer.length).toBeGreaterThan(0);
      expect(["structural-only", "derived"]).toContain(row.trust_result);
    }
    expect(JSON.stringify(publicTypeCatalogV1)).not.toContain("Trusted");
  });

  it("orders milestone imports without a later-file dependency", () => {
    const first = new Set(milestoneDependencyCatalogV1["scalar-and-json"]);
    const second = milestoneDependencyCatalogV1["artifact-and-envelope"];
    expect(second.filter((path) => path.includes("canonical-json") || path.includes("protocol-primitives")).every((path) => first.has(path))).toBe(true);
    expect(milestoneDependencyCatalogV1["public-handoff"].every((path) => path.endsWith("index.ts") || path.endsWith("README.md"))).toBe(true);
  });

  it("keeps lifecycle, trust policy, and persistence outside U2A1", () => {
    expect(scopeExclusionsV1).toEqual([...scopeExclusionsV1].sort());
    expect(scopeExclusionsV1).toContain("clean-review-validation");
    expect(scopeExclusionsV1).toContain("lifecycle-replay");
    expect(scopeExclusionsV1).toContain("policy-specific-trusted-observations");
    expect(scopeExclusionsV1).toContain("persistence");
  });
});
