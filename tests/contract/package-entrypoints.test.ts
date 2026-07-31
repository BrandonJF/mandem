/** @fileoverview Contract tests for bounded package entrypoints. */
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertBunVersion, runtimeVersion } from "@/modules/runtime";

describe("runtime package identity", () => {
  it("runs the repository checks in the documented deterministic order", async () => {
    const manifest = JSON.parse(await readFile("package.json", "utf8")) as { scripts: Record<string, string> };
    expect(manifest.scripts["check:core"]).toBe(
      "bun run preflight:bun && bun run docs:audit && bun run authored-files:check && bun run architecture:check && bun run vocabulary:check && bun run issue-graph:check && bun run typecheck && bun run lint",
    );
    expect(manifest.scripts.check).toBe("bun run check:core && bun run test:run");
    expect(manifest.scripts["check:revision-target"]).toBe(
      "bun run check:core && bun run test:revision-target",
    );
    expect(manifest.scripts["repository-ruleset:apply"]).toBe("bun scripts/configure-repository-ruleset.ts --apply");
    expect(manifest.scripts["repository-ruleset:check"]).toBe("bun scripts/configure-repository-ruleset.ts --check");
  });

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

  it("packs a clean committed archive that installs both declared executables", async () => {
    const candidate = process.env.MANDEM_ARCHIVE_COMMIT;
    expect(candidate).toMatch(/^[0-9a-f]{40}$/);
    if (!candidate) throw new Error("MANDEM_ARCHIVE_COMMIT must name a full commit SHA");
    execFileSync("git", ["cat-file", "-e", `${candidate}^{commit}`]);
    const root = await mkdtemp(join(tmpdir(), "mandem-package-"));
    const source = join(root, "source");
    const consumer = join(root, "consumer");
    try {
      await mkdir(source);
      await mkdir(consumer);
      execFileSync("git", ["archive", "--format=tar", "--output", join(root, "source.tar"), candidate]);
      execFileSync("tar", ["-xf", join(root, "source.tar"), "-C", source], { stdio: "pipe" });
      execFileSync("bun", ["install", "--frozen-lockfile"], { cwd: source, stdio: "pipe" });
      execFileSync("bun", ["pm", "pack"], { cwd: source, stdio: "pipe" });
      const tarballName = (await readdir(source)).find((entry) => entry.endsWith(".tgz"));
      expect(tarballName).toBeDefined();
      const tarball = join(source, tarballName ?? "");
      const entries = execFileSync("tar", ["-tvf", tarball], { encoding: "utf8" });
      expect(entries).toContain("package/dist/mandem");
      expect(entries).toContain("package/dist/mandem-server");
      expect(entries).toMatch(/-rwx\S*.*package\/dist\/mandem\n/);
      expect(entries).toMatch(/-rwx\S*.*package\/dist\/mandem-server\n/);
      const archiveManifest = JSON.parse(execFileSync("tar", ["-xOf", tarball, "package/package.json"], { encoding: "utf8" })) as { bin: Record<string, string>; files: string[]; scripts: { prepack: string } };
      expect(archiveManifest.bin).toEqual({ mandem: "dist/mandem", "mandem-server": "dist/mandem-server" });
      expect(archiveManifest.scripts.prepack).toBe("bun run build");
      expect(archiveManifest.files).toEqual(["dist", "README.md", "LICENSE"]);
      execFileSync("bun", ["add", tarball], { cwd: consumer, stdio: "pipe" });
      for (const [name, version] of [["mandem", "mandem 0.1.0"], ["mandem-server", "mandem-server 0.1.0"]] as const) {
        const bin = join(consumer, "node_modules/.bin", name);
        expect(execFileSync(bin, ["--version"], { encoding: "utf8" }).trim()).toBe(version);
        expect(execFileSync(bin, ["--help"], { encoding: "utf8" }).trim()).toContain("--version");
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 30_000);
});
