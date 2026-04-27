import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { FileTree } from "./paths";
import { resolveUnderRoot } from "./paths";

/**
 * Writes a flat file tree (POSIX keys) to disk under `root`.
 */
export const writeTree = async (root: string, tree: FileTree): Promise<readonly string[]> => {
  const written: string[] = [];
  for (const [rel, content] of Object.entries(tree)) {
    const relPosix = rel.replaceAll("\\", "/");
    const full = resolveUnderRoot(root, relPosix);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, content, "utf-8");
    written.push(relPosix);
  }
  return written;
};
