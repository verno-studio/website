"use client";

import { CornerUpLeftIcon, LinkIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { CopyButton } from "@/components/copy-button";

interface NavigationProps {
  readonly href?: string;
  readonly label?: string;
}

export const Navigation = ({ href = "/", label = "Home" }: NavigationProps) => {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Page"
      className="mb-4 flex min-h-9 w-full select-none items-center justify-between gap-2 @sm:mb-12"
    >
      <Link
        aria-label={label}
        className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-900 no-underline transition-[transform,background-color,color] duration-200 ease-out after:absolute after:-inset-0.5 after:content-[''] hover:bg-gray-200 hover:text-gray-1000 active:scale-[0.96]"
        href={href}
      >
        <CornerUpLeftIcon aria-hidden className="size-4.5" />
      </Link>
      <CopyButton
        aria-label="Copy link to this page"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-900 no-underline transition-[transform,background-color,color] duration-200 ease-out hover:bg-gray-200 hover:text-gray-1000 active:scale-[0.96]"
        icon={LinkIcon}
        value={() => `${window.location.origin}${pathname}`}
      />
    </nav>
  );
};
