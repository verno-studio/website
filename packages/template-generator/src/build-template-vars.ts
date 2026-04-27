import type { ProjectConfig } from "./config";
import { packageManagerField } from "./catalog/tooling";
import { scoped } from "./paths";

/** Default shadcn `components.json` style until presets wire through. */
export const DEFAULT_COMPONENTS_STYLE = "radix-nova" as const;

export const buildTemplateVarMap = (config: ProjectConfig): Record<string, string> => {
  const dsName = scoped(config.npmScope, "design-system");
  const tsConfigName = scoped(config.npmScope, "typescript-config");
  return {
    componentsStyle: DEFAULT_COMPONENTS_STYLE,
    dsName,
    npmScope: config.npmScope,
    packageManagerField: packageManagerField(config.packageManager),
    projectName: config.projectName,
    tsConfigName,
  };
};
