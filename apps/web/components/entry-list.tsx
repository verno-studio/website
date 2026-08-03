import Link from "next/link";
import type { ReactNode } from "react";

export interface EntryListItem {
  readonly href: string;
  readonly title: ReactNode;
  readonly description: string;
  readonly preview?: ReactNode;
}

interface EntryListProps {
  readonly title: string;
  readonly href: string;
  readonly items: readonly EntryListItem[];
}

const PagePreview = () => (
  <div className="flex w-full flex-col items-start gap-1 px-1 pt-4">
    <span className="h-0.75 w-3/4 rounded-full bg-gray-400" />
    <span className="h-0.75 w-full rounded-full bg-gray-400" />
    <span className="h-0.75 w-1/2 rounded-full bg-gray-400" />
  </div>
);

export const EntryRow = ({ href, title, description, preview }: EntryListItem) => (
  <Link
    className="group -mx-2 flex items-center gap-4 rounded-[17px] p-2 no-underline transition-colors duration-200 ease-out hover:bg-gray-100"
    href={href}
  >
    <div className="shrink-0 rounded-[9px] p-0.75 shadow-(--ds-shadow-border)">
      <div className="flex h-13 w-11 select-none items-center justify-center overflow-hidden rounded-md bg-background-100 shadow-(--ds-shadow-border)">
        {preview ?? <PagePreview />}
      </div>
    </div>
    <div className="flex min-w-0 flex-col">
      <span className="truncate font-medium text-gray-1000">{title}</span>
      <span className="truncate text-gray-900">{description}</span>
    </div>
  </Link>
);

export const EntryList = ({ title, href, items }: EntryListProps) => (
  <section className="flex flex-col gap-3">
    <h2 className="font-medium text-gray-1000">
      <Link
        className="no-underline transition-colors duration-200 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:text-gray-900"
        href={href}
      >
        {title}
      </Link>
    </h2>
    <div className="grid grid-cols-1 gap-2">
      {items.map((item) => (
        <EntryRow key={item.href} {...item} />
      ))}
    </div>
  </section>
);
