"use client";

import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useState } from "react";

import type { RegistryItemSummary } from "@/lib/registry";

interface RegistryIndexProps {
  items: RegistryItemSummary[];
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
          placeholder={`Search ${items.length} components...`}
          type="search"
          value={query}
        />
      </div>

      {/* `output` carries an implicit role="status" and aria-live="polite".
          Always mounted so assistive tech observes a content change on an
          existing region, not a node insertion. */}
      <output className="sr-only">
        {query
          ? `${filtered.length} ${filtered.length === 1 ? "component" : "components"} match ${query}`
          : ""}
      </output>

      {filtered.length === 0 ? (
        <p className="px-4 py-8 text-center text-gray-900">
          No components match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map(({ name, title, description, fileCount }) => (
            <Link
              className="group flex flex-col gap-1 material-large px-4 pt-3 pb-4 shadow-(--ds-shadow-border) transition-shadow duration-200 ease-out hover:shadow-(--ds-shadow-border-medium)"
              href={`/components/${name}`}
              key={name}
            >
              <span className="flex w-full items-center justify-between gap-2 font-medium">
                <span className="flex-1 text-gray-1000">{title}</span>
                {fileCount > 0 ? (
                  <span className="shrink-0 font-normal text-gray-900 text-xs">
                    {fileCount} {fileCount === 1 ? "file" : "files"}
                  </span>
                ) : null}
              </span>
              <span className="text-gray-900 leading-relaxed">{description}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};
