/** @fileoverview Tests persistent filesystem resolution for revision verification. */
import { describe, expect, it } from "vitest";
import { persistentFilesystem } from "./revision-storage";

describe("revision storage", () => {
  it("accepts a persistent filesystem and a persistently backed overlay", () => {
    expect(persistentFilesystem("1 0 0:1 / / rw - ext4 /dev/root rw\n", "/work")).toBe("ext4");
    const mounts =
      "1 0 0:1 / / rw - ext4 /dev/root rw\n" +
      "2 1 0:2 / /work rw - overlay overlay rw,lowerdir=/lower,upperdir=/var/lib/overlay/upper,workdir=/var/lib/overlay/work\n";
    expect(persistentFilesystem(mounts, "/work/repository")).toBe("ext4");
  });

  it("rejects RAM-backed overlays, missing upperdirs, and cycles", () => {
    const ram =
      "1 0 0:1 / / rw - ext4 /dev/root rw\n" +
      "2 1 0:2 / /run rw - tmpfs tmpfs rw\n" +
      "3 1 0:3 / /work rw - overlay overlay rw,upperdir=/run/upper\n";
    expect(() => persistentFilesystem(ram, "/work/repository")).toThrow(/tmpfs/);
    expect(() => persistentFilesystem("1 0 0:1 / / rw - overlay overlay rw\n", "/work")).toThrow(/upperdir/);
    expect(() =>
      persistentFilesystem(
        "1 0 0:1 / / rw - overlay overlay rw,upperdir=/work/upper\n",
        "/work",
      ),
    ).toThrow(/cycle/);
  });
});
