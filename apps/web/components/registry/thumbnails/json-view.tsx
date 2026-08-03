import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Indent plus two bars per row. At 44px there is no room for a glyph, so the
 * thing that has to survive is what separates this component from a page of
 * text: rows that step in, and a key that is coloured differently from its
 * value. The tones are the item's own tokens, so the chip previews the palette.
 */
const JSON_ROWS = [
  { id: "root", indent: "ps-0", key: "w-2.5", tone: "", value: null },
  { id: "string", indent: "ps-1.5", key: "w-2", tone: "bg-json-string", value: "w-3" },
  { id: "number", indent: "ps-1.5", key: "w-2.5", tone: "bg-json-number", value: "w-1.5" },
  { id: "boolean", indent: "ps-3", key: "w-1.5", tone: "bg-json-boolean", value: "w-2" },
  { id: "nested", indent: "ps-1.5", key: "w-2", tone: "bg-json-string", value: "w-2.5" },
] as const;

export const jsonViewThumbnail = (): ReactNode => (
  <div className="flex h-full w-full flex-col justify-center gap-1 px-1">
    {JSON_ROWS.map((row) => (
      <div className={cn("flex items-center gap-1", row.indent)} key={row.id}>
        <span className={cn("h-0.75 rounded-full bg-json-key", row.key)} />
        {row.value ? <span className={cn("h-0.75 rounded-full", row.value, row.tone)} /> : null}
      </div>
    ))}
  </div>
);
