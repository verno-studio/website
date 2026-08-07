import type { EntryListItem } from "@/components/entry-list";
import type { ReleaseSummary } from "@/lib/changelog";

/** One release rendered as an EntryRow, shared by the homepage and /updates. */
export const releaseToEntry = ({
  slug,
  version,
  headline,
  itemCount,
}: ReleaseSummary): EntryListItem => ({
  description: headline || `${itemCount} ${itemCount === 1 ? "change" : "changes"}`,
  href: `/updates/${slug}`,
  title: <span className="font-mono">v{version}</span>,
});
