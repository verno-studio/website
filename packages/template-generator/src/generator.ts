import { Result } from "better-result";
import { assertValidProjectConfig } from "./config";
import type { ProjectConfig } from "./config";
import { mergeTemplateLayers } from "./core/embed-templates";
import { applyTemplateVars, renderTemplatePathIfNeeded } from "./core/template-processor";
import {
  VirtualFileSystem,
  virtualFileSystemFromFileTree,
  virtualTreeFromFileTree,
} from "./core/virtual-fs";
import { GeneratorError } from "./generator-error";
import { defaultPostProcessors, runPostProcessPipeline } from "./processors";
import type { FileTree } from "./paths";
import type { GeneratorOptions, VirtualFileTree } from "./types";

const toInterpolatedFileTree = (merged: Map<string, string>, config: ProjectConfig): FileTree => {
  const vfs = new VirtualFileSystem();
  for (const [rel, raw] of merged) {
    const outRel = renderTemplatePathIfNeeded(rel, config);
    vfs.writeFile(outRel, applyTemplateVars(raw, config));
  }
  return vfs.toFileTree();
};

export const generate = (options: GeneratorOptions): Result<VirtualFileTree, GeneratorError> =>
  Result.try({
    catch: (e) => {
      if (GeneratorError.is(e)) {
        return e;
      }
      return new GeneratorError({
        cause: e,
        message: e instanceof Error ? e.message : String(e),
        phase: "unknown",
      });
    },
    try: () => {
      const { config } = options;
      assertValidProjectConfig(config);
      const merged = mergeTemplateLayers(config);
      if (merged.size === 0) {
        throw new GeneratorError({
          message: "No embedded template files for the given project configuration.",
          phase: "initialization",
        });
      }
      const interpolated = toInterpolatedFileTree(merged, config);
      const vfs = virtualFileSystemFromFileTree(interpolated);
      runPostProcessPipeline(vfs, config, defaultPostProcessors);
      return virtualTreeFromFileTree(vfs.toFileTree(), config.projectName, config);
    },
  });

export const buildInterpolatedFileTree = (config: ProjectConfig): FileTree => {
  assertValidProjectConfig(config);
  return toInterpolatedFileTree(mergeTemplateLayers(config), config);
};
