import type { FileTree } from "../paths";

/**
 * In-memory file map with POSIX-relative paths, inspired by a minimal virtual FS.
 */
export class VirtualFileSystem {
  private readonly files = new Map<string, string>();

  public addFile(relativePath: string, content: string): void {
    const k = relativePath.replaceAll("\\", "/");
    this.files.set(k, content);
  }

  public getFileCount(): number {
    return this.files.size;
  }

  public toFileTree(): FileTree {
    return Object.fromEntries(this.files) as FileTree;
  }
}
