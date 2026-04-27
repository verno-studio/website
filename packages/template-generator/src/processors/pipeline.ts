import type { ProjectConfig } from "../config";
import type { FileTree } from "../paths";

export type FileTreeProcessor = (tree: FileTree, config: ProjectConfig) => FileTree;

export const runPostProcessPipeline = (
  tree: FileTree,
  config: ProjectConfig,
  processors: readonly FileTreeProcessor[],
): FileTree => {
  let current = tree;
  for (const processor of processors) {
    current = processor(current, config);
  }
  return current;
};
