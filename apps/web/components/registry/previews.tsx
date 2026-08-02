import type { ReactNode } from "react";

// Keyed by registry item name and resolved at build time. Deliberately a literal
// map rather than a dynamic import of the item's own source: a docs page that
// evaluates strings from a JSON file is a code path nobody wants to audit.
// An item with no entry here renders its docs and nothing else.
const swatches = [
  "bg-gray-100",
  "bg-gray-300",
  "bg-gray-500",
  "bg-gray-700",
  "bg-gray-900",
  "bg-gray-1000",
];

const previews: Record<string, ReactNode> = {
  theme: (
    <div className="flex flex-col gap-3">
      <div className="flex overflow-hidden rounded-md shadow-(--ds-shadow-border)">
        {swatches.map((swatch) => (
          <div className={`size-10 ${swatch}`} key={swatch} />
        ))}
      </div>
      <span className="text-gray-900 text-sm">
        The same scale in light and dark — toggle your system theme.
      </span>
    </div>
  ),
};

export const getPreview = (name: string): ReactNode => previews[name] ?? null;
