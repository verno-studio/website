import type { ReactNode } from "react";

import type { RegistryItem } from "@/lib/registry-schema";

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

export const themeThumbnail = (item: RegistryItem): ReactNode => {
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
