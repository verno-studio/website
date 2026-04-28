import type { ProjectConfig } from "../config";
import { hasAddon, isMonorepo } from "../config";

/** `stack-root`: files land at repo root. `preserve-path`: under `<layerId>/` (e.g. packages). */
export type LayerLayout = "preserve-path" | "stack-root";

export interface LayerDefinition {
  readonly id: string;
  readonly layout: LayerLayout;
}

/**
 * Every directory under `templates/` that should be embedded.
 * Merge order for a given project is defined by {@link resolveLayerStack}.
 */
export const LAYERS: readonly LayerDefinition[] = [
  { id: "shared", layout: "stack-root" },
  { id: "frontends/next", layout: "stack-root" },
  { id: "addons/turborepo", layout: "stack-root" },
  { id: "packages/design-system", layout: "preserve-path" },
  { id: "packages/typescript-config", layout: "preserve-path" },
] as const;

const layerById = new Map(LAYERS.map((l) => [l.id, l]));

/**
 * Strips a single trailing `.hbs` from the relative path (e.g. `README.md.hbs` → `README.md`).
 */
export const stripHbsExtension = (rel: string): string =>
  rel.endsWith(".hbs") ? rel.slice(0, -4) : rel;

export const toLayerOutputKey = (layerId: string, fileRel: string): string => {
  const def = layerById.get(layerId);
  if (def === undefined) {
    throw new Error(
      `Unknown template layer "${layerId}". Register it in LAYERS (src/layers/registry.ts).`,
    );
  }
  const normalized = stripHbsExtension(fileRel.split("\\").join("/"));
  const rel = normalized;
  return def.layout === "preserve-path" ? `${layerId}/${rel}` : rel;
};

/** Layer ids merged in order; later layers win on path clashes. */
export const resolveLayerStack = (config: ProjectConfig): readonly string[] => {
  const out: string[] = ["shared", "frontends/next"];
  if (hasAddon(config, "turborepo")) {
    out.push("addons/turborepo");
  }
  if (isMonorepo(config)) {
    if (config.packages.includes("typescript-config")) {
      out.push("packages/typescript-config");
    }
    if (config.packages.includes("design-system")) {
      out.push("packages/design-system");
    }
  }
  return out;
};
