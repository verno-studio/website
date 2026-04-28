import type { ProjectConfig } from "../config";
import type { VirtualFileSystem } from "../core/virtual-fs";

export type VirtualFileSystemProcessor = (vfs: VirtualFileSystem, config: ProjectConfig) => void;

export const runPostProcessPipeline = (
  vfs: VirtualFileSystem,
  config: ProjectConfig,
  processors: readonly VirtualFileSystemProcessor[],
): void => {
  for (const processor of processors) {
    processor(vfs, config);
  }
};
