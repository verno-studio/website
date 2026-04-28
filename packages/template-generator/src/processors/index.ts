import { applyDependencyCatalog } from "./apply-catalog";
import type { VirtualFileSystemProcessor } from "./pipeline";
import { runPostProcessPipeline } from "./pipeline";
import { pruneShadcnUiFiles } from "./prune-shadcn-ui-files";

export { applyDependencyCatalog, runPostProcessPipeline };
export type { VirtualFileSystemProcessor };

export const defaultPostProcessors: readonly VirtualFileSystemProcessor[] = [
  applyDependencyCatalog,
  pruneShadcnUiFiles,
];
