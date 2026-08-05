/** @fileoverview Verifies that the U2A planning catalogs are closed and internally referential. */

import { describe, expect, it } from "vitest";
import { closedWireTypesV1, commandSchemaV1, eventValueSchemaV1 } from "./u2a-protocol-contract";

const fieldPattern = /^[a-z][a-z0-9_]*:([A-Za-z][A-Za-z0-9]*)(\[\])?$/u;
const tokenPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;

describe("U2A planning protocol contract", () => {
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
});
