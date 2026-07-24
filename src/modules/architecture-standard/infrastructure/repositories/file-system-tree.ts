/** @fileoverview Bun filesystem implementation of the repository-tree port. */
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import type { RepositoryTree } from "../../application/use-cases/analyze-repository";
import type { RepositoryFile } from "../../domain/types";

const ignored = new Set([".git", "node_modules", "dist", "coverage"]);
export class FileSystemTree implements RepositoryTree {
  async read(root: string): Promise<RepositoryFile[]> {
    const files: RepositoryFile[] = [];
    const visit = async (directory: string): Promise<void> => {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        if (ignored.has(entry.name)) continue;
        const location = join(directory, entry.name);
        if (entry.isDirectory()) await visit(location);
        else if (/\.(?:ts|tsx)$/.test(entry.name) || entry.name === "README.md" || entry.name === ".gitkeep") files.push({ path: relative(root, location).replaceAll("\\", "/"), text: await Bun.file(location).text() });
      }
    };
    await visit(root);
    return files.sort((left, right) => left.path.localeCompare(right.path));
  }
}
