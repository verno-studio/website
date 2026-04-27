import { Result } from "better-result";
import type { ProjectConfig } from "./config";
import { mergeTemplateLayers } from "./core/embed-templates";
import { applyTemplateVars } from "./core/template-processor";
import { VirtualFileSystem, virtualTreeFromFileTree } from "./core/virtual-fs";
import { GeneratorError } from "./generator-error";
import { defaultPostProcessors, runPostProcessPipeline } from "./processors";
import type { FileTree } from "./paths";
import type { GeneratorOptions, VirtualFileTree } from "./types";

const toInterpolatedFileTree = (merged: Map<string, string>, config: ProjectConfig): FileTree => {
  const vfs = new VirtualFileSystem();
  for (const [rel, raw] of merged) {
    vfs.writeFile(rel, applyTemplateVars(raw, config));
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
      const merged = mergeTemplateLayers(config.template);
      if (merged.size === 0) {
        throw new GeneratorError({
          message: `No embedded template files for template "${config.template}".`,
          phase: "initialization",
        });
      }
      const interpolated = toInterpolatedFileTree(merged, config);
      const processed = runPostProcessPipeline(interpolated, config, defaultPostProcessors);
      return virtualTreeFromFileTree(processed, config.projectName, config);
    },
  });

export const buildInterpolatedFileTree = (config: ProjectConfig): FileTree =>
  toInterpolatedFileTree(mergeTemplateLayers(config.template), config);
