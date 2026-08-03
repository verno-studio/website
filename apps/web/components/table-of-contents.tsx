"use client";

import type { TOCItemType } from "fumadocs-core/toc";
import { MenuIcon } from "@/components/icons/menu";
import { Fragment, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const READING_LINE = 96;

interface TableOfContentsProps {
  readonly items: TOCItemType[];
}

export const TableOfContents = ({ items }: TableOfContentsProps) => {
  const [activeUrl, setActiveUrl] = useState(items[0]?.url ?? "");

  useEffect(() => {
    let frame = 0;

    const sync = () => {
      frame = 0;

      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1) {
        setActiveUrl(items.at(-1)?.url ?? "");
        return;
      }

      let current = items[0]?.url ?? "";

      for (const item of items) {
        const heading = document.querySelector(`#${CSS.escape(item.url.slice(1))}`);

        if (heading && heading.getBoundingClientRect().top <= READING_LINE) {
          current = item.url;
        }
      }

      setActiveUrl(current);
    };

    const schedule = () => {
      if (frame === 0) {
        frame = requestAnimationFrame(sync);
      }
    };

    sync();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [items]);

  return (
    <nav
      aria-label="Table of contents"
      className="fixed top-16 @sm:top-32 left-12 hidden w-80 select-none 2xl:block"
    >
      <div className="mb-6 flex items-center gap-2">
        <MenuIcon aria-hidden className="size-4 text-gray-1000" />
        <span className="font-[450] text-[13px] text-gray-1000">Table of contents</span>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item, index) => {
          const active = item.url === activeUrl;

          return (
            <Fragment key={item.url}>
              {index > 0 ? (
                <div aria-hidden className="contents">
                  <span className="h-px w-3 bg-gray-alpha-500" />
                  <span className="h-px w-3 bg-gray-alpha-500" />
                </div>
              ) : null}
              <a
                aria-current={active ? "location" : undefined}
                className={cn(
                  "group relative flex h-px items-center gap-2.5 no-underline outline-none",
                  // The row itself is a hairline. This is the box a pointer can
                  // hit, and the one a focus ring should trace: an outline on
                  // the link would cut straight through the middle of its text.
                  "before:absolute before:-inset-y-3.5 before:inset-x-0 before:rounded-md before:content-['']",
                  "focus-visible:before:outline-2 focus-visible:before:outline-focus",
                  item.depth > 2 && "ml-3",
                )}
                href={item.url}
              >
                <span
                  className={cn(
                    "h-px shrink-0 transition-[width,background-color] duration-200 ease-out",
                    active ? "w-8 bg-gray-1000" : "w-5 bg-gray-alpha-500",
                  )}
                />
                <span
                  className={cn(
                    "truncate font-[450] text-[13px] transition-colors duration-200 ease-out",
                    active
                      ? "text-gray-1000"
                      : "text-gray-900 [@media(hover:hover)_and_(pointer:fine)]:group-hover:text-gray-1000",
                  )}
                >
                  {item.title}
                </span>
              </a>
            </Fragment>
          );
        })}
      </div>
    </nav>
  );
};
