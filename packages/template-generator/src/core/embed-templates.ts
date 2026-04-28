import type { ProjectConfig } from "../config";
import { hasAddon } from "../config";
import { EMBEDDED_BY_LAYER } from "../templates.generated";
import { resolveLayerStack } from "../layers/registry";

const embedded = EMBEDDED_BY_LAYER as Record<string, ReadonlyMap<string, string>>;

const appsWebPrefix = (layerId: string, config: ProjectConfig): string =>
  layerId === "frontends/next" && hasAddon(config, "turborepo") ? "apps/web/" : "";

export const mergeTemplateLayers = (config: ProjectConfig): Map<string, string> => {
  const out = new Map<string, string>();
  for (const layer of resolveLayerStack(config)) {
    const chunk = embedded[layer];
    if (chunk === undefined) {
      continue;
    }
    const prefix = appsWebPrefix(layer, config);
    for (const [key, val] of chunk) {
      out.set(`${prefix}${key}`, val);
    }
  }
  return out;
};

export const listKeysForProjectConfig = (config: ProjectConfig): string[] =>
  [...mergeTemplateLayers(config).keys()].toSorted((a, b) => a.localeCompare(b));
