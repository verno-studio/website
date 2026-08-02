import type { ReactNode } from "react";

// Keyed by registry item name and resolved at build time. Deliberately a literal
// map rather than a dynamic import of the item's own source: a docs page that
// evaluates strings from a JSON file is a code path nobody wants to audit.
// An item with no entry here renders its source and nothing else, which is the
// right outcome for the ones that have nothing to look at — `utils` is a
// function and `theme-provider` renders its children unchanged.
const swatches = [
  "bg-gray-100",
  "bg-gray-300",
  "bg-gray-500",
  "bg-gray-700",
  "bg-gray-900",
  "bg-gray-1000",
];

const previews: Record<string, ReactNode> = {
  fonts: (
    <div className="flex flex-col gap-2 text-gray-1000">
      <span className="font-sans text-lg">Geist — the reading face</span>
      <span className="font-mono">Geist Mono — 0O1lI for code</span>
      <span className="font-serif italic">Libre Baskerville — for emphasis</span>
    </div>
  ),
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
