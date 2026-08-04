"use client";

import { CheckIcon, LinkIcon } from "lucide-react";

import { useCopy } from "@/lib/use-copy";
import { cn } from "@/lib/utils";

interface HeadingAnchorProps {
  readonly id: string;
}

export const HeadingAnchor = ({ id }: HeadingAnchorProps) => {
  const { copied, copy } = useCopy(
    () => `${window.location.origin}${window.location.pathname}#${id}`,
  );

  return (
    <button
      aria-label="Copy link to section"
      className={cn(
        "-left-7 -translate-y-1/2 absolute top-1/2 hidden size-6 cursor-pointer items-center justify-center text-gray-900 transition-opacity duration-200 ease-out md:flex",
        // A tap raises neither hover nor focus-visible, so without the copied
        // case the icon would swap behind an invisible control.
        copied
          ? "opacity-100"
          : "opacity-0 focus-visible:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100",
      )}
      onClick={copy}
      type="button"
    >
      <LinkIcon
        aria-hidden
        className={cn(
          "size-4 transition-[opacity,scale,filter] duration-200 ease-out",
          copied ? "scale-[0.6] opacity-0 blur-xs" : "scale-100 opacity-100 blur-0",
        )}
      />
      <CheckIcon
        aria-hidden
        className={cn(
          "absolute inset-0 m-auto size-4 transition-[opacity,scale,filter] duration-200 ease-out",
          copied ? "scale-100 opacity-100 blur-0" : "scale-[0.6] opacity-0 blur-xs",
        )}
      />
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied link to clipboard" : ""}
      </span>
    </button>
  );
};
