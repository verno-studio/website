import { cn } from "@vernostudio/design-system/lib/utils";
import Link from "next/link";

const NotFound = () => (
  <div className="flex min-h-[40dvh] flex-col items-center justify-center gap-6">
    <div className="flex flex-col gap-2 text-center">
      <h1 className="font-medium text-gray-1000">Page not found</h1>
      <p className="text-pretty text-gray-900">
        This page doesn&apos;t exist. It may have been moved or deleted.
      </p>
    </div>
    <Link
      className={cn(
        "rounded-full bg-background-100 px-4 py-1.5 font-medium text-gray-1000 no-underline ring-1 ring-gray-alpha-400 ring-inset",
        "active:scale-[0.96] transition-[transform,background-color] duration-150 ease-out",
        "[@media(hover:hover)_and_(pointer:fine)]:hover:bg-gray-100",
      )}
      href="/"
    >
      Return home
    </Link>
  </div>
);

export default NotFound;
