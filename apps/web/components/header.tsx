import Link from "next/link";

const links = [
  { href: "/components", label: "Components" },
  { href: "/updates", label: "Updates" },
];

export const Header = () => (
  <header className="flex flex-col items-start gap-2">
    <div className="flex w-full flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
      <Link href="/" className="inline-block font-medium no-underline">
        Verno Studio
      </Link>
      <nav className="flex items-center gap-4">
        {links.map(({ href, label }) => (
          <Link
            className="text-gray-900 no-underline transition-colors duration-200 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:text-gray-1000"
            href={href}
            key={href}
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
    <span className="text-gray-900 font-medium">
      A design system for building beautiful and accessible web applications.
    </span>
  </header>
);
