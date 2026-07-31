import { applyDependencyCatalog } from "./apply-catalog";
import type { VirtualFileSystemProcessor } from "./pipeline";
import { pruneShadcnUiFiles } from "./prune-shadcn-ui-files";

export { applyDependencyCatalog } from "./apply-catalog";
export { runPostProcessPipeline } from "./pipeline";
export type { VirtualFileSystemProcessor } from "./pipeline";

export const defaultPostProcessors: readonly VirtualFileSystemProcessor[] = [
  applyDependencyCatalog,
  pruneShadcnUiFiles,
];
