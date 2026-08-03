"use client";

import { SearchIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useMemo, useState } from "react";

import { EntryRow } from "@/components/entry-list";
import type { RegistryItemSummary } from "@/lib/registry";

export interface RegistryIndexItem extends RegistryItemSummary {
  readonly preview: ReactNode;
}

interface RegistryIndexProps {
  items: RegistryIndexItem[];
}

export const RegistryIndex = ({ items }: RegistryIndexProps) => {
  const [query, setQuery] = useState("");
  const inputId = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return items;
    }
    return items.filter(({ searchText }) => searchText.includes(q));
  }, [items, query]);

  return (
    <section className="flex flex-col gap-6">
      <label className="sr-only" htmlFor={inputId}>
        Search components by name or description
      </label>
      <div className="relative">
        <SearchIcon
          aria-hidden
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-900"
        />
        <input
          autoComplete="off"
          className="w-full material-base bg-transparent py-2.5 pr-3 pl-9 placeholder:text-gray-900 transition-colors duration-200 ease-out"
          id={inputId}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${items.length} ${items.length === 1 ? "component" : "components"}...`}
          type="search"
          value={query}
        />
      </div>

      <output className="sr-only">
        {query
          ? `${filtered.length} ${filtered.length === 1 ? "component" : "components"} match ${query}`
          : ""}
      </output>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 px-4 py-8 text-center">
          <p className="text-gray-900">No components match &ldquo;{query}&rdquo;.</p>
          <button
            className="rounded-full bg-background-100 px-4 py-1.5 font-medium text-gray-1000 ring-1 ring-gray-alpha-400 ring-inset cursor-pointer transition-[transform,background-color] duration-150 ease-out active:scale-[0.96] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-gray-100"
            onClick={() => setQuery("")}
            type="button"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {filtered.map(({ name, title, description, preview }) => (
            <EntryRow
              description={description}
              href={`/components/${name}`}
              key={name}
              preview={preview}
              title={title}
            />
          ))}
        </div>
      )}
    </section>
  );
};
