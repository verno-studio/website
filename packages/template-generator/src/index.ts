export {
  type AddonId,
  ADDON_IDS,
  assertValidProjectConfig,
  type CodeQualityId,
  CODE_QUALITY_IDS,
  type FrontendId,
  FRONTENDS,
  type PackageId,
  PACKAGE_IDS,
  type PackageManager,
  type ProjectConfig,
  type UiMode,
  defaultNpmScopeFromProjectName,
  hasAddon,
  hasDesignSystem,
  hasPackage,
  hasTypescriptConfigPackage,
  InvalidProjectConfigError,
  isMonorepo,
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
  buildHandlebarsContext,
  componentsStyleFromShadcnPreset,
  DEFAULT_COMPONENTS_STYLE,
  type HandlebarsTemplateContext,
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
export { listKeysForProjectConfig, mergeTemplateLayers } from "./core/embed-templates";
export {
  LAYERS,
  type LayerDefinition,
  type LayerLayout,
  resolveLayerStack,
  stripHbsExtension,
  toLayerOutputKey,
} from "./layers/registry";
export {
  applyDependencyCatalog,
  defaultPostProcessors,
  runPostProcessPipeline,
  type FileTreeProcessor,
} from "./processors";
export { EMBEDDED_BY_LAYER, TEMPLATE_COUNT } from "./templates.generated";
