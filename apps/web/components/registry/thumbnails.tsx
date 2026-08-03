import type { ReactNode } from "react";

import type { RegistryItem } from "@/lib/registry-schema";
import { cn } from "@/lib/utils";

// this small cannot label two modes.
const THUMBNAIL_STEPS = [
  "background-100",
  "gray-100",
  "gray-300",
  "gray-500",
  "gray-700",
  "gray-900",
  "gray-1000",
] as const;

const themeThumbnail = (item: RegistryItem): ReactNode => {
  const light = item.cssVars?.light;

  if (!light) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      {THUMBNAIL_STEPS.map((step) => (
        <div className="flex-1" key={step} style={{ background: light[step] }} />
      ))}
    </div>
  );
};

const JSON_ROWS = [
  { id: "root", indent: "ps-0", key: "w-2.5", tone: "", value: null },
  { id: "string", indent: "ps-1.5", key: "w-2", tone: "bg-json-string", value: "w-3" },
  { id: "number", indent: "ps-1.5", key: "w-2.5", tone: "bg-json-number", value: "w-1.5" },
  { id: "boolean", indent: "ps-3", key: "w-1.5", tone: "bg-json-boolean", value: "w-2" },
  { id: "nested", indent: "ps-1.5", key: "w-2", tone: "bg-json-string", value: "w-2.5" },
] as const;

const jsonViewThumbnail = (): ReactNode => (
  <div className="flex h-full w-full flex-col justify-center gap-1 px-1">
    {JSON_ROWS.map((row) => (
      <div className={cn("flex items-center gap-1", row.indent)} key={row.id}>
        <span className={cn("h-0.75 rounded-full bg-json-key", row.key)} />
        {row.value ? <span className={cn("h-0.75 rounded-full", row.value, row.tone)} /> : null}
      </div>
    ))}
  </div>
);

const thumbnails: Record<string, (item: RegistryItem) => ReactNode> = {
  "json-view": jsonViewThumbnail,
  theme: themeThumbnail,
};

export const getThumbnail = (item: RegistryItem): ReactNode =>
  thumbnails[item.name]?.(item) ?? null;
