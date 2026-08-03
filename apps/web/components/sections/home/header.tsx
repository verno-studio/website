import Link from "next/link";

export const Header = () => (
  <header className="flex flex-col items-start mb-4 @sm:mb-12">
    <h1 className="font-medium">
      <Link href="/" className="inline-block no-underline">
        Verno Studio
      </Link>
    </h1>
    <span className="text-gray-900 font-medium">
      A design system for building beautiful and accessible web applications.
    </span>
  </header>
);
