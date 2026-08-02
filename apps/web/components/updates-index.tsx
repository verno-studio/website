"use client";

import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useState } from "react";

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
          placeholder={`Search ${releases.length} updates by version or content...`}
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
        <p className="px-4 py-8 text-center text-gray-900">
          No updates match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <ul className="flex list-none flex-col gap-7 @sm:gap-4 pl-0">
          {filtered.map(({ slug, version, itemCount, headline }) => (
            <li key={slug}>
              <Link
                className="flex flex-col gap-2 -mx-3 px-3 @sm:py-3 rounded-md transition-colors duration-200 ease-out hover:bg-gray-100"
                href={`/updates/${slug}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-gray-1000">v{version}</span>
                  <span className="text-xs text-gray-900">
                    {itemCount} {itemCount === 1 ? "change" : "changes"}
                  </span>
                </div>
                {headline ? (
                  <p className="line-clamp-2 text-gray-900 leading-relaxed">{headline}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
