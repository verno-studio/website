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
export { buildTemplateVarMap, DEFAULT_COMPONENTS_STYLE } from "./build-template-vars";
export { interpolate } from "./interpolate";
export { mergeFileTrees, type FileTree, scoped } from "./paths";
export { writeTree } from "./fs-writer";
export type { GenerateResult } from "./types";
export { GeneratorError } from "./types";
export { VirtualFileSystem } from "./core/virtual-fs";
