/** @fileoverview Contract tests for bounded package entrypoints. */
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { assertBunVersion, runtimeVersion } from "@/modules/runtime";

describe("runtime package identity", () => {
  it("provides deterministic bounded version output for both executables", () => {
    expect(runtimeVersion("mandem")).toBe("mandem 0.1.0");
    expect(runtimeVersion("mandem-server")).toBe("mandem-server 0.1.0");
  });

  it("rejects a Bun runtime other than the mandated version", () => {
    expect(() => assertBunVersion("1.3.13")).toThrow("Mandem requires Bun 1.3.14");
    expect(() => assertBunVersion("1.3.14")).not.toThrow();
  });

  it("builds and invokes the package bin entries", async () => {
    const manifest = JSON.parse(await readFile("package.json", "utf8")) as { version: string; bin: Record<string, string> };
    expect(manifest.bin).toEqual({ mandem: "dist/mandem", "mandem-server": "dist/mandem-server" });
    execFileSync("bun", ["run", "build"], { stdio: "pipe" });
    for (const [name, location] of Object.entries(manifest.bin)) {
      expect(execFileSync(`./${location}`, ["--version"], { encoding: "utf8" }).trim()).toBe(`${name} ${manifest.version}`);
      expect(execFileSync(`./${location}`, ["--help"], { encoding: "utf8" }).trim()).toContain("--version");
    }
  });
});
