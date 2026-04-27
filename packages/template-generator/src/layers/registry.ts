import type { TemplateId } from "../config";

/** `stack-root`: files land at repo root. `preserve-path`: under `<layerId>/` (e.g. packages). */
export type LayerLayout = "preserve-path" | "stack-root";

export interface LayerDefinition {
  readonly id: string;
  readonly layout: LayerLayout;
}

export const LAYERS: readonly LayerDefinition[] = [
  { id: "shared", layout: "stack-root" },
  { id: "next-app", layout: "stack-root" },
  { id: "next-turborepo", layout: "stack-root" },
  { id: "packages/design-system", layout: "preserve-path" },
  { id: "packages/typescript-config", layout: "preserve-path" },
] as const;

const layerById = new Map(LAYERS.map((l) => [l.id, l]));

export const toLayerOutputKey = (layerId: string, fileRel: string): string => {
  const def = layerById.get(layerId);
  if (def === undefined) {
    throw new Error(
      `Unknown template layer "${layerId}". Register it in LAYERS (src/layers/registry.ts).`,
    );
  }
  const rel = fileRel.split("\\").join("/");
  return def.layout === "preserve-path" ? `${layerId}/${rel}` : rel;
};

/** Merge order; later layers win on path clashes. */
export const TEMPLATE_LAYER_STACKS: Record<TemplateId, readonly string[]> = {
  "next-app": ["shared", "next-app"],
  "next-turborepo": [
    "shared",
    "packages/typescript-config",
    "packages/design-system",
    "next-turborepo",
  ],
};
