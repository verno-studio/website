export {
  type PackageManager,
  type ProjectConfig,
  type TemplateId,
  defaultNpmScopeFromProjectName,
} from "./config";
export {
  DEPENDENCY_VERSIONS,
  getDependencyVersion,
  type ManagedDependency,
} from "./catalog/dependencies";
export {
  getShadcnExecSpec,
  getUltraciteExecSpec,
  packageManagerField,
  TOOLING,
} from "./catalog/tooling";
export { buildInterpolatedFileTree, generate } from "./generator";
export {
  buildTemplateVarMap,
  componentsStyleFromShadcnPreset,
  DEFAULT_COMPONENTS_STYLE,
} from "./build-template-vars";
export { interpolate } from "./interpolate";
export { mergeFileTrees, type FileTree, scoped } from "./paths";
export { writeTree } from "./fs-writer";
export type {
  GeneratorOptions,
  VirtualDirectory,
  VirtualFile,
  VirtualFileTree,
  VirtualNode,
} from "./types";
export { FileWriteError } from "./file-write-error";
export { GeneratorError } from "./generator-error";
export { VirtualFileSystem, virtualTreeFromFileTree } from "./core/virtual-fs";
export { listKeysForTemplate, mergeTemplateLayers } from "./core/embed-templates";
export {
  LAYERS,
  type LayerDefinition,
  type LayerLayout,
  TEMPLATE_LAYER_STACKS,
  toLayerOutputKey,
} from "./layers/registry";
export {
  applyDependencyCatalog,
  defaultPostProcessors,
  runPostProcessPipeline,
  type FileTreeProcessor,
} from "./processors";
export { EMBEDDED_BY_LAYER, TEMPLATE_COUNT } from "./templates.generated";
