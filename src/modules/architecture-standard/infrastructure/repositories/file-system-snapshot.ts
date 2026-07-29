/** @fileoverview Filesystem-backed repository snapshot reader. */
import { lstat, readFile, readdir } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import type { RepositorySnapshotReader } from "../../application/repositories/repository-snapshot";
import { documentationPolicyV1 } from "../../domain/repository-policy";
import type { RepositoryFile, RepositorySnapshot } from "../../domain/types";

function ignored(name: string): boolean { return documentationPolicyV1.excludedSegments.includes(name); }

export class FileSystemSnapshot implements RepositorySnapshotReader {
  async readWorkingTree(root: string): Promise<RepositorySnapshot> {
    const absoluteRoot = resolve(root);
    const files: RepositoryFile[] = [];
    const visit = async (directory: string): Promise<void> => {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        if (ignored(entry.name)) continue;
        const location = join(directory, entry.name);
        const metadata = await lstat(location);
        if (metadata.isSymbolicLink()) continue;
        if (metadata.isDirectory()) await visit(location);
        else if (metadata.isFile()) {
          const path = relative(absoluteRoot, location).replaceAll("\\", "/");
          if (path.startsWith("../") || path === "") throw new Error("filesystem traversal left the repository root");
          files.push({ path, text: await readFile(location, "utf8") });
        }
      }
    };
    await visit(absoluteRoot);
    return { files: files.sort((left, right) => left.path.localeCompare(right.path)) };
  }

  async readStagedTree(root: string): Promise<RepositorySnapshot> { throw new Error(`staged snapshots require Git for ${root}`); }
  async readRevision(root: string, revision: string): Promise<RepositorySnapshot> { throw new Error(`revision snapshots require Git for ${root} at ${revision}`); }
}
