"use client";

import {
  JsonView,
  makeJsonViewHighlightPattern,
} from "@vernostudio/design-system/components/json-view";
import { useId, useMemo, useState } from "react";

// The component describing itself: every value type a tree has to render, and
// nothing a reader of this site has to take on faith.
const PAYLOAD = {
  accessibility: {
    contrast: { floor: 60, measured: 78, scale: "APCA Lc" },
    keyboard: "aria-apg-tree",
    reducedMotion: true,
    role: "tree",
  },
  breakpoints: [375, 768, 1280],
  component: {
    dependencies: [],
    name: "json-view",
    registry: "@vernostudio",
    status: "stable",
    title: "JSON View",
  },
  deprecatedBy: null,
  tokens: {
    boolean: "oklch(0.517 0.109 76.46)",
    key: "oklch(0.522 0.212 1.01)",
    number: "oklch(0.515 0.193 258.23)",
    string: "oklch(0.5 0.09 181.95)",
  },
};

export const Default = () => <JsonView data={PAYLOAD} />;

export const Collapsed = () => <JsonView data={PAYLOAD} defaultExpandDepth={0} />;

export const Deep = () => <JsonView data={PAYLOAD} defaultExpandDepth={3} />;

export const Searchable = () => {
  const inputId = useId();
  const [query, setQuery] = useState("oklch");
  const pattern = useMemo(() => makeJsonViewHighlightPattern(query.split(/\s+/u)), [query]);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="font-medium text-gray-1000 text-xs" htmlFor={inputId}>
          Filter
        </label>
        <input
          className="w-full rounded-md bg-background-100 px-3 py-2 text-base text-gray-1000 shadow-(--ds-shadow-border) placeholder:text-gray-700 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-focus sm:text-sm"
          id={inputId}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="oklch tree"
          type="search"
          value={query}
        />
      </div>
      <JsonView data={PAYLOAD} defaultExpandDepth={3} highlightPattern={pattern} />
    </div>
  );
};
