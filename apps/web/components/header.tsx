"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@vernostudio/design-system/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/updates", label: "Updates" },
];

const isActiveHref = (href: string, pathname: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);

export const Header = () => {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between gap-3">
      <Link
        href="/"
        className="text-medium inline-block font-medium no-underline font-serif text-2xl"
      >
        Verno Studio
      </Link>
      <nav aria-label="Primary" className="flex items-center gap-4 text-sm">
        {navItems.map(({ href, label }) => {
          const active = isActiveHref(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "transition-colors duration-200 ease-out hover:text-foreground",
                active ? "text-foreground" : "text-muted-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
};
