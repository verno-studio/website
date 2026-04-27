import { applyDependencyCatalog } from "./processors/apply-catalog";
import { buildTemplateVarMap } from "./build-template-vars";
import type { ProjectConfig } from "./config";
import { VirtualFileSystem } from "./core/virtual-fs";
import { interpolate } from "./interpolate";
import type { FileTree } from "./paths";
import { RAW_TEMPLATES } from "./templates.generated";
import type { GenerateResult } from "./types";
import { GeneratorError } from "./types";

const loadInterpolatedFileTree = (config: ProjectConfig): FileTree => {
  const raw = RAW_TEMPLATES[config.template];
  if (raw === undefined) {
    throw new GeneratorError(`Unknown template: ${String(config.template)}`, { config });
  }
  const vars = buildTemplateVarMap(config);
  const vfs = new VirtualFileSystem();
  for (const [rel, content] of Object.entries(raw)) {
    vfs.addFile(rel, interpolate(content, vars));
  }
  return vfs.toFileTree();
};

/**
 * Produces a file tree (after dependency catalog) for the given project config.
 */
export const generate = (config: ProjectConfig): GenerateResult => {
  const base = loadInterpolatedFileTree(config);
  const tree = applyDependencyCatalog(base, config);
  return { config, fileCount: Object.keys(tree).length, tree };
};

/**
 * Unprocessed template (interpolated only). Useful for unit tests and processors.
 */
export const buildInterpolatedFileTree = (config: ProjectConfig): FileTree =>
  loadInterpolatedFileTree(config);
