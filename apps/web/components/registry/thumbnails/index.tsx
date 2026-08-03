import type { ReactNode } from "react";

import { fileTreeThumbnail } from "@/components/registry/thumbnails/file-tree";
import { jsonViewThumbnail } from "@/components/registry/thumbnails/json-view";
import { themeThumbnail } from "@/components/registry/thumbnails/theme";
import type { RegistryItem } from "@/lib/registry-schema";

/**
 * One drawing per item, keyed by registry name. The signature stays uniform so
 * the lookup does not have to branch, but a thumbnail that needs nothing from
 * the item is free to declare no parameters.
 */
const thumbnails: Record<string, (item: RegistryItem) => ReactNode> = {
  "file-tree": fileTreeThumbnail,
  "json-view": jsonViewThumbnail,
  theme: themeThumbnail,
};

export const getThumbnail = (item: RegistryItem): ReactNode =>
  thumbnails[item.name]?.(item) ?? null;
