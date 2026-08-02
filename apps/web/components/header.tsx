import Link from "next/link";

export const Header = () => (
  <header className="flex flex-col items-start gap-2">
    <Link href="/" className="inline-block font-medium no-underline">
      Verno Studio
    </Link>
    <span className="text-gray-900 font-medium">
      A design system for building beautiful and accessible web applications.
    </span>
  </header>
);
