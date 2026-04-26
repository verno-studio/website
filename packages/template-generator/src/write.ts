import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { FileTree } from "./paths";
import { resolveUnderRoot } from "./paths";

export const writeFileTree = async (root: string, files: FileTree): Promise<readonly string[]> => {
  const written: string[] = [];
  for (const [rel, content] of Object.entries(files)) {
    const relPosix = rel.replaceAll("\\", "/");
    const full = resolveUnderRoot(root, relPosix);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, content, "utf-8");
    written.push(relPosix);
  }
  return written;
};
