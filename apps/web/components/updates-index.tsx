"use client";

import { SearchIcon } from "lucide-react";
import { useId, useMemo, useState } from "react";

import { EntryRow } from "@/components/entry-list";
import { releaseToEntry } from "@/components/release-entry";
import type { ReleaseSummary } from "@/lib/changelog";

interface UpdatesIndexProps {
  releases: ReleaseSummary[];
}

export const UpdatesIndex = ({ releases }: UpdatesIndexProps) => {
  const [query, setQuery] = useState("");
  const inputId = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return releases;
    }
    return releases.filter(
      ({ version, searchText }) =>
        version.toLowerCase().includes(q) ||
        `v${version}`.toLowerCase().includes(q) ||
        searchText.includes(q),
    );
  }, [releases, query]);

  return (
    <section className="flex flex-col gap-6">
      <label className="sr-only" htmlFor={inputId}>
        Search updates by version or content
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
          placeholder={`Search ${releases.length} ${releases.length === 1 ? "update" : "updates"} by version or content...`}
          type="search"
          value={query}
        />
      </div>

      {/* `output` carries an implicit role="status" and aria-live="polite".
          Always mounted so assistive tech observes a content change on an
          existing region, not a node insertion. */}
      <output className="sr-only">
        {query
          ? `${filtered.length} ${filtered.length === 1 ? "update" : "updates"} match ${query}`
          : ""}
      </output>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 px-4 py-8 text-center">
          <p className="text-gray-900">No updates match &ldquo;{query}&rdquo;.</p>
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
          {filtered.map((release) => (
            <EntryRow key={release.slug} {...releaseToEntry(release)} />
          ))}
        </div>
      )}
    </section>
  );
};
