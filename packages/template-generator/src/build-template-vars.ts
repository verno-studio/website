import type { ProjectConfig } from "./config";
import { hasAddon, hasDesignSystem, hasTypescriptConfigPackage, isMonorepo } from "./config";
import { devScriptCommand, packageManagerField } from "./catalog/tooling";
import { scoped } from "./paths";

/** Default shadcn `components.json` style when preset is unknown or a preset code. */
export const DEFAULT_COMPONENTS_STYLE = "radix-nova" as const;

const NAMED_PRESET_TO_COMPONENTS_STYLE: Readonly<Record<string, string>> = {
  luma: "radix-luma",
  lyra: "radix-lyra",
  maia: "radix-maia",
  mira: "radix-mira",
  nova: "radix-nova",
  vega: "radix-vega",
};

/**
 * Map CLI/shadcn named presets to `components.json` `style`. Preset codes (e.g. from ui.shadcn.com)
 * are not decoded here — use {@link DEFAULT_COMPONENTS_STYLE} until `shadcn init --preset` runs.
 */
export const componentsStyleFromShadcnPreset = (preset: string | undefined): string => {
  if (preset === undefined || preset.length === 0) {
    return DEFAULT_COMPONENTS_STYLE;
  }
  if (preset.startsWith("radix-")) {
    return preset;
  }
  const mapped = NAMED_PRESET_TO_COMPONENTS_STYLE[preset.toLowerCase()];
  return mapped ?? DEFAULT_COMPONENTS_STYLE;
};

export interface HandlebarsTemplateContext {
  readonly devCommand: string;
  readonly projectName: string;
  readonly npmScope: string;
  readonly packageManagerField: string;
  readonly dsName: string;
  readonly tsConfigName: string;
  readonly componentsStyle: string;
  readonly shadcnPreset: string;
  readonly frontend: string;
  readonly ui: string;
  readonly useShadcn: boolean;
  readonly turborepo: boolean;
  readonly ultracite: boolean;
  readonly hasDesignSystem: boolean;
  readonly hasTypescriptConfigPackage: boolean;
}

/** Values passed to Handlebars for every template file and optional templated paths. */
export const buildHandlebarsContext = (config: ProjectConfig): HandlebarsTemplateContext => {
  const dsName = scoped(config.npmScope, "design-system");
  const tsConfigName = scoped(config.npmScope, "typescript-config");
  return {
    componentsStyle: componentsStyleFromShadcnPreset(config.shadcnPreset),
    devCommand: devScriptCommand(config.packageManager),
    dsName,
    frontend: config.frontend,
    hasDesignSystem: hasDesignSystem(config),
    hasTypescriptConfigPackage: hasTypescriptConfigPackage(config),
    npmScope: config.npmScope,
    packageManagerField: packageManagerField(config.packageManager),
    projectName: config.projectName,
    shadcnPreset: config.shadcnPreset ?? "",
    tsConfigName,
    turborepo: isMonorepo(config),
    ui: config.ui,
    ultracite: hasAddon(config, "ultracite"),
    useShadcn: config.ui === "shadcn",
  };
};
