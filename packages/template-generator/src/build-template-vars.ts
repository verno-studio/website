import type { ProjectConfig } from "./config";
import { packageManagerField } from "./catalog/tooling";
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

export const buildTemplateVarMap = (config: ProjectConfig): Record<string, string> => {
  const dsName = scoped(config.npmScope, "design-system");
  const tsConfigName = scoped(config.npmScope, "typescript-config");
  return {
    componentsStyle: componentsStyleFromShadcnPreset(config.shadcnPreset),
    dsName,
    npmScope: config.npmScope,
    packageManagerField: packageManagerField(config.packageManager),
    projectName: config.projectName,
    tsConfigName,
  };
};
