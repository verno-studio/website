import type { ProjectConfig } from "../config";
import type { FileTree } from "../paths";
import { packageJsonString } from "../templates/strings";
import type { VirtualDirectory, VirtualFile, VirtualFileTree } from "../types";

const normalizePosixPath = (relativePath: string): string => relativePath.replaceAll("\\", "/");

const dirnamePosix = (p: string): string => {
  const i = p.lastIndexOf("/");
  return i === -1 ? "" : p.slice(0, i);
};

const extname = (name: string): string => {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1);
};

const sortChildren = (node: VirtualDirectory): void => {
  node.children.sort((a, b) => {
    if (a.type === "directory" && b.type === "file") {
      return -1;
    }
    if (a.type === "file" && b.type === "directory") {
      return 1;
    }
    return a.name.localeCompare(b.name);
  });
  for (const c of node.children) {
    if (c.type === "directory") {
      sortChildren(c);
    }
  }
};

/**
 * In-memory file map with POSIX-relative paths; builds a nested virtual tree for writers.
 */
export class VirtualFileSystem {
  private readonly files = new Map<string, string>();

  public exists(relativePath: string): boolean {
    return this.files.has(normalizePosixPath(relativePath));
  }

  public readFile(relativePath: string): string | undefined {
    return this.files.get(normalizePosixPath(relativePath));
  }

  public readJson(relativePath: string): unknown {
    const raw = this.readFile(relativePath);
    if (raw === undefined) {
      throw new Error(`Missing file in tree: ${relativePath}`);
    }
    return JSON.parse(raw) as unknown;
  }

  public deleteFile(relativePath: string): boolean {
    return this.files.delete(normalizePosixPath(relativePath));
  }

  public writeFile(relativePath: string, content: string): void {
    const k = normalizePosixPath(relativePath);
    this.files.set(k, content);
  }

  public writeJson(relativePath: string, data: Record<string, unknown>): void {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("writeJson expects a plain object");
    }
    this.writeFile(relativePath, packageJsonString(data));
  }

  public getFileCount(): number {
    return this.files.size;
  }

  public getDirectoryCount(): number {
    const dirs = new Set<string>();
    for (const key of this.files.keys()) {
      let d = dirnamePosix(key);
      while (d !== "") {
        dirs.add(d);
        d = dirnamePosix(d);
      }
    }
    return dirs.size;
  }

  public toFileTree(): FileTree {
    return Object.fromEntries(this.files);
  }

  public toVirtualFileTree(rootName: string): {
    root: VirtualDirectory;
    fileCount: number;
    directoryCount: number;
  } {
    const root: VirtualDirectory = { children: [], name: rootName, path: "", type: "directory" };
    const sorted = [...this.files.keys()].toSorted((a, b) => a.localeCompare(b));
    for (const fullPath of sorted) {
      this.addFile(root, fullPath);
    }
    sortChildren(root);
    return {
      directoryCount: this.getDirectoryCount(),
      fileCount: this.getFileCount(),
      root,
    };
  }

  private addFile(root: VirtualDirectory, fullPath: string): void {
    const parts = fullPath.split("/").filter((s) => s.length > 0);
    if (parts.length === 0) {
      return;
    }
    const content = this.files.get(fullPath);
    if (content === undefined) {
      return;
    }

    let current = root;
    let pathSoFar = "";

    for (let i = 0; i < parts.length; i += 1) {
      const name = parts[i];
      if (name === undefined) {
        return;
      }
      pathSoFar = pathSoFar === "" ? name : `${pathSoFar}/${name}`;
      const isFile = i === parts.length - 1;

      if (isFile) {
        const fileNode: VirtualFile = {
          content,
          extension: extname(name),
          name,
          path: fullPath,
          type: "file",
        };
        current.children.push(fileNode);
        return;
      }

      let dir = current.children.find(
        (c): c is VirtualDirectory => c.type === "directory" && c.name === name,
      );
      if (dir === undefined) {
        dir = { children: [], name, path: pathSoFar, type: "directory" };
        current.children.push(dir);
      }
      current = dir;
    }
  }
}

export const virtualFileSystemFromFileTree = (tree: FileTree): VirtualFileSystem => {
  const vfs = new VirtualFileSystem();
  for (const [k, v] of Object.entries(tree)) {
    vfs.writeFile(k, v);
  }
  return vfs;
};

export const virtualTreeFromFileTree = (
  tree: FileTree,
  rootName: string,
  config: ProjectConfig,
): VirtualFileTree => {
  const vfs = virtualFileSystemFromFileTree(tree);
  const { root, fileCount, directoryCount } = vfs.toVirtualFileTree(rootName);
  return { config, directoryCount, fileCount, root };
};
