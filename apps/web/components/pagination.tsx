import Link from "next/link";

import { ChevronRightIcon } from "@/components/icons/chevron-right";
import { cn } from "@/lib/utils";

interface PaginationEntry {
  readonly href: string;
  readonly title: string;
}

interface PaginationProps {
  readonly previous?: PaginationEntry;
  readonly next?: PaginationEntry;
}

interface PaginationLinkProps extends PaginationEntry {
  readonly direction: "previous" | "next";
}

const PaginationLink = ({ href, title, direction }: PaginationLinkProps) => {
  const isNext = direction === "next";

  return (
    <Link
      aria-label={`Go to ${direction} page: ${title}`}
      className={cn(
        "group flex max-w-40 select-none flex-col gap-1 text-sm no-underline @sm:max-w-80",
        isNext ? "ms-auto items-end text-end" : "items-start",
      )}
      href={href}
    >
      <span
        className={cn(
          "flex items-center gap-1 font-medium text-gray-900 transition-colors duration-200 ease-out [@media(hover:hover)_and_(pointer:fine)]:group-hover:text-gray-1000",
          // The chevron leads the way back and follows the way on, so the
          // previous label reads in reverse rather than carrying its own icon.
          !isNext && "flex-row-reverse",
        )}
      >
        {isNext ? "Next" : "Previous"}
        <ChevronRightIcon className={cn("size-4", !isNext && "rotate-180")} />
      </span>
      <span className="w-full truncate font-medium text-gray-1000">{title}</span>
    </Link>
  );
};

/**
 * Sequential navigation between sibling pages. Either end of a sequence drops
 * its slot rather than showing a dead one, so the remaining link keeps its own
 * side of the row.
 */
export const Pagination = ({ previous, next }: PaginationProps) => {
  if (!(previous || next)) {
    return null;
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex w-full items-center gap-4 border-gray-alpha-400 border-t pt-12"
    >
      {previous ? <PaginationLink direction="previous" {...previous} /> : null}
      {next ? <PaginationLink direction="next" {...next} /> : null}
    </nav>
  );
};
