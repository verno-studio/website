import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Result } from "better-result";
import { FileWriteError } from "./file-write-error";
import type { VirtualDirectory, VirtualFile, VirtualFileTree, VirtualNode } from "./types";

const writeNode = async (
  node: VirtualNode,
  baseDir: string,
  relativePath: string,
  written: string[],
): Promise<void> => {
  const nodePath = relativePath === "" ? node.name : `${relativePath}/${node.name}`;

  if (node.type === "file") {
    const fileNode = node as VirtualFile;
    const fullPath = path.join(baseDir, relativePath, node.name);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, fileNode.content, "utf-8");
    written.push(nodePath);
    return;
  }

  const dir = node as VirtualDirectory;
  const dirPath = path.join(baseDir, relativePath, dir.name);
  await mkdir(dirPath, { recursive: true });
  for (const child of dir.children) {
    // oxlint-disable-next-line no-await-in-loop -- sequential by design
    await writeNode(child, baseDir, nodePath, written);
  }
};

/**
 * Writes a virtual file tree to disk under `destDir`.
 */
export const writeTree = (
  tree: VirtualFileTree,
  destDir: string,
): Promise<Result<readonly string[], FileWriteError>> =>
  Result.tryPromise({
    catch: (e) => {
      if (FileWriteError.is(e)) {
        return e;
      }
      return new FileWriteError({
        cause: e,
        message: e instanceof Error ? e.message : String(e),
      });
    },
    try: async () => {
      const written: string[] = [];
      for (const child of tree.root.children) {
        // oxlint-disable-next-line no-await-in-loop -- sequential by design
        await writeNode(child, destDir, "", written);
      }
      return written as readonly string[];
    },
  });
