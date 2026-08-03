"use client";

import { CheckIcon, LinkIcon } from "lucide-react";
import type { ReactNode } from "react";

import { useCopy } from "@/lib/use-copy";
import { cn } from "@/lib/utils";

interface HeadingAnchorProps {
  readonly id: string;
  readonly children: ReactNode;
}

export const HeadingAnchor = ({ id, children }: HeadingAnchorProps) => {
  const { copied, copy } = useCopy(
    () => `${window.location.origin}${window.location.pathname}#${id}`,
  );

  return (
    <button
      aria-label="Copy link to section"
      className="group relative cursor-text text-left md:-ml-7 md:cursor-pointer md:pl-7 md:before:absolute md:before:-inset-1 md:before:content-['']"
      onClick={copy}
      type="button"
    >
      <span className="-translate-y-1/2 absolute top-1/2 left-0 hidden size-6 items-center justify-center text-gray-900 opacity-0 transition-opacity duration-200 ease-out group-focus-visible:opacity-100 md:flex [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100">
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
      </span>
      {children}
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied link to clipboard" : ""}
      </span>
    </button>
  );
};
