import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The same trick as the json-view chip, one level up: at 44px what has to read
 * is nesting. A row is a glyph plus a name bar, and the guide line is what makes
 * the indent look deliberate rather than ragged.
 */
const FILE_ROWS = [
  { id: "root", indent: "ps-0", name: "w-4", tone: "bg-gray-1000" },
  { id: "child-a", indent: "ps-1.5", name: "w-3.5", tone: "bg-gray-700" },
  { id: "child-b", indent: "ps-1.5", name: "w-2.5", tone: "bg-gray-700" },
  { id: "leaf", indent: "ps-3", name: "w-2", tone: "bg-gray-500" },
  { id: "sibling", indent: "ps-0", name: "w-3", tone: "bg-gray-1000" },
] as const;

export const fileTreeThumbnail = (): ReactNode => (
  <div className="flex h-full w-full flex-col justify-center gap-1 px-1.5">
    {FILE_ROWS.map((row) => (
      <div className={cn("flex items-center gap-1", row.indent)} key={row.id}>
        <span className={cn("size-1 shrink-0 rounded-xs", row.tone)} />
        <span className={cn("h-0.75 rounded-full", row.name, row.tone)} />
      </div>
    ))}
  </div>
);
