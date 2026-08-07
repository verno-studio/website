import type { EntryListItem } from "@/components/entry-list";
import type { ReleaseSummary } from "@/lib/changelog";
import { cn } from "@/lib/utils";

// A component tile previews the component. A release has nothing to preview, so
// the tile reports on it instead: body lines track how much shipped, which is
// why a big release reads denser than a one-line patch at a glance.
const BODY_WIDTHS = ["w-full", "w-3/4", "w-5/6", "w-1/2"] as const;
const MIN_BODY_LINES = 2;

const ReleaseThumbnail = ({ itemCount }: { itemCount: number }) => {
  const lines = Math.min(Math.max(itemCount, MIN_BODY_LINES), BODY_WIDTHS.length);

  return (
    <div className="flex w-full flex-col items-start gap-1 px-1 pt-3.5">
      <span className="h-1.25 w-1/2 rounded-full bg-gray-600" />
      {BODY_WIDTHS.slice(0, lines).map((width) => (
        <span className={cn("h-0.75 rounded-full bg-gray-400", width)} key={width} />
      ))}
    </div>
  );
};

/** One release rendered as an EntryRow, shared by the homepage and /updates. */
export const releaseToEntry = ({
  slug,
  version,
  headline,
  itemCount,
}: ReleaseSummary): EntryListItem => ({
  description: headline || `${itemCount} ${itemCount === 1 ? "change" : "changes"}`,
  href: `/updates/${slug}`,
  preview: <ReleaseThumbnail itemCount={itemCount} />,
  title: <span className="font-mono">v{version}</span>,
});
