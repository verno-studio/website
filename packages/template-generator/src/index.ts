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
export { generateProject } from "./generate";
export { mergeFileTrees, type FileTree, scoped } from "./paths";
export { writeFileTree } from "./write";
export { buildNextAppTree } from "./templates/next-app";
export { buildNextTurborepoTree } from "./templates/next-turborepo";
