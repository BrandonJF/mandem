/** @fileoverview Verifies that the U2A planning catalogs are closed and internally referential. */

import { describe, expect, it } from "vitest";
import { closedWireTypesV1, commandSchemaV1, eventValueSchemaV1, recursiveWireSchemaV1 } from "./u2a-protocol-contract";

const fieldPattern = /^[a-z][a-z0-9_]*:([A-Za-z][A-Za-z0-9]*)(\[\])?$/u;
const tokenPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;

describe("retained U2A split-source protocol contract", () => {
  it("keeps command and event catalogs unique and canonically ordered by explicit keys", () => {
    expect(Object.keys(commandSchemaV1)).toHaveLength(29);
    expect(Object.keys(eventValueSchemaV1)).toHaveLength(31);
    expect(new Set(Object.keys(commandSchemaV1)).size).toBe(29);
    expect(new Set(Object.keys(eventValueSchemaV1)).size).toBe(31);
    expect(Object.keys(commandSchemaV1).every((value) => tokenPattern.test(value))).toBe(true);
    expect(Object.keys(eventValueSchemaV1).every((value) => tokenPattern.test(value))).toBe(true);
  });

  it("gives every command field a named closed wire type", () => {
    const known = new Set<string>(closedWireTypesV1);
    for (const fields of Object.values(commandSchemaV1)) {
      expect(fields.length).toBeGreaterThan(0);
      expect(new Set(fields).size).toBe(fields.length);
      for (const field of fields) {
        const match = fieldPattern.exec(field);
        expect(match, field).not.toBeNull();
        expect(known.has(match?.[1] ?? ""), field).toBe(true);
      }
    }
  });

  it("gives every event one named closed value type", () => {
    const known = new Set<string>(closedWireTypesV1);
    for (const valueType of Object.values(eventValueSchemaV1)) {
      expect(known.has(valueType), valueType).toBe(true);
    }
  });

  it("contains no unconstrained raw string field", () => {
    expect(JSON.stringify(commandSchemaV1)).not.toContain(":string");
    expect(JSON.stringify(eventValueSchemaV1)).not.toContain('"string"');
  });

  it("distinguishes the initial fencing counter from issued tokens", () => {
    expect(recursiveWireSchemaV1.FencingCounterV1).toBe("decimal:uint64-nonnegative:no-leading-zero");
    expect(recursiveWireSchemaV1.FencingTokenV1).toBe("decimal:uint64-positive:no-leading-zero");
    expect(recursiveWireSchemaV1.FencingTokenByResourceV1).toEqual([
      "work:FencingCounterV1",
      "integration:FencingCounterV1",
    ]);
    expect(recursiveWireSchemaV1.PullRequestNumberV1).toBe("json-integer:1..2147483647");
    expect(recursiveWireSchemaV1.GateValidityMillisecondsV1).toBe("json-integer:1..86400000");
    expect(recursiveWireSchemaV1.ReviewerRoleV1).toBe("utf8:nfc:1..128");
  });

  it("requires authenticated provenance on the trusted principal", () => {
    expect(recursiveWireSchemaV1.TrustedPrincipalV1).toContain("trust:TrustedAdapterAttestationV1");
    expect(recursiveWireSchemaV1.WorkspaceTargetV1).toContain("branch:BranchNameV1");
    expect(recursiveWireSchemaV1.BranchNameV1).toBe("ascii:git-branch-ref:1..255");
    expect(commandSchemaV1["record-lease-heartbeat"]).toEqual(["lease_id:Uuid", "fencing_token:FencingTokenV1"]);
    expect(commandSchemaV1["resume-queued"]).toEqual(["resolution_code:ResolutionCodeV1", "evidence:ArtifactReferenceV1[]"]);
    expect(commandSchemaV1["resume-work"]).toEqual(["workspace:WorkspaceTargetV1", "evidence:ArtifactReferenceV1[]"]);
  });

  it("defines every closed wire type exactly once in the recursive schema", () => {
    expect(Object.keys(recursiveWireSchemaV1).sort()).toEqual([...closedWireTypesV1].sort());
    for (const definition of Object.values(recursiveWireSchemaV1)) {
      expect(typeof definition === "string" || definition.length > 0).toBe(true);
    }
  });

  it("uses only explicit scalar, enum, union, or imported-type definition grammars", () => {
    const allowed = /^(ascii|closed-enum|closed-object|closed-union|decimal|external-closed-type|json-integer|json|utf8):/u;
    for (const definition of Object.values(recursiveWireSchemaV1)) {
      if (typeof definition === "string") expect(allowed.test(definition), definition).toBe(true);
    }
  });

  it("resolves every structural union variant to a registered definition", () => {
    const known = new Set<string>(closedWireTypesV1);
    for (const definition of Object.values(recursiveWireSchemaV1)) {
      if (typeof definition !== "string" || !definition.startsWith("closed-union:")) continue;
      for (const variant of definition.slice("closed-union:".length).split("|")) {
        expect(known.has(variant), definition).toBe(true);
      }
    }
  });

  it("resolves every recursive object-field reference to a declared wire type", () => {
    const known = new Set<string>(closedWireTypesV1);
    for (const definition of Object.values(recursiveWireSchemaV1)) {
      if (typeof definition === "string") continue;
      for (const field of definition) {
        const expression = field.slice(field.indexOf(":") + 1).replace(/\[\]$/u, "");
        for (const member of expression.split("|")) {
          const type = member.trim();
          if (/^[A-Z][A-Za-z0-9]*$/u.test(type)) expect(known.has(type), field).toBe(true);
        }
      }
    }
  });
});
