import type { ProjectConfig } from "./config";

export interface VirtualFile {
  type: "file";
  path: string;
  name: string;
  content: string;
  extension: string;
}

export interface VirtualDirectory {
  type: "directory";
  path: string;
  name: string;
  children: VirtualNode[];
}

export type VirtualNode = VirtualFile | VirtualDirectory;

export interface VirtualFileTree {
  root: VirtualDirectory;
  fileCount: number;
  directoryCount: number;
  config: ProjectConfig;
}

export interface GeneratorOptions {
  readonly config: ProjectConfig;
}
