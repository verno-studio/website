import { applyDependencyCatalog } from "./apply-catalog";
import type { FileTreeProcessor } from "./pipeline";
import { runPostProcessPipeline } from "./pipeline";

export { applyDependencyCatalog, runPostProcessPipeline };
export type { FileTreeProcessor };

export const defaultPostProcessors: readonly FileTreeProcessor[] = [applyDependencyCatalog];
