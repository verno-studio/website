import Link from "next/link";

import { cn } from "@/lib/utils";

interface PagerEntry {
  readonly href: string;
  readonly title: string;
}

interface PagerProps {
  readonly previous: PagerEntry;
  readonly next?: PagerEntry;
}

interface PagerItemProps extends PagerEntry {
  readonly direction: "previous" | "next";
}

const PagerItem = ({ href, title, direction }: PagerItemProps) => {
  const isNext = direction === "next";
  const label = isNext ? "Next" : "Previous";

  return (
    <Link
      aria-label={`${label}: ${title}`}
      className={cn(
        "group flex max-w-40 select-none flex-col gap-1 text-sm no-underline @sm:max-w-80",
        isNext ? "items-end text-right" : "items-start",
      )}
      href={href}
    >
      <span className="font-medium text-gray-900 transition-colors duration-200 ease-out group-hover:text-gray-1000">
        {label}
      </span>
      <span className="w-full truncate font-medium text-gray-1000">{title}</span>
    </Link>
  );
};

export const Pager = ({ previous, next }: PagerProps) => (
  <nav
    aria-label="Pagination"
    className="flex w-full items-center justify-between gap-4 border-gray-alpha-400 border-t pt-12"
  >
    <PagerItem direction="previous" {...previous} />
    {next ? <PagerItem direction="next" {...next} /> : <div />}
  </nav>
);
