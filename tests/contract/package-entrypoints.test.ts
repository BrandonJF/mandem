/** @fileoverview Contract tests for bounded package entrypoints. */
import { describe, expect, it } from "vitest";
import { runtimeVersion } from "@/modules/runtime";

describe("runtime package identity", () => {
  it("provides deterministic bounded version output for both executables", () => {
    expect(runtimeVersion("mandem")).toBe("mandem 0.1.0");
    expect(runtimeVersion("mandem-server")).toBe("mandem-server 0.1.0");
  });
});
