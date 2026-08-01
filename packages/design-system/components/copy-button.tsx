"use client";

import { useCallback, useEffect, useState } from "react";
import type { ComponentProps } from "react";

import { Check } from "./icons/check";
import { Copy } from "./icons/copy";
import { cn } from "../lib/utils";

interface CopyButtonProps extends Omit<ComponentProps<"button">, "onClick"> {
  readonly value: string;
}

export const CopyButton = ({ value, className, ...props }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // clipboard not available
    }
  }, [value]);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = setTimeout(() => {
      setCopied(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "relative size-9 flex items-center justify-center rounded-md bg-background-100 hover:bg-gray-100 text-gray-900 hover:text-gray-1000 cursor-pointer",
        "active:scale-[0.96] transition-[transform,background-color,color] duration-150 ease-out",
        // Hit area extended to 40x40px
        "after:absolute after:-inset-0.5 after:content-['']",
        className,
      )}
      aria-label="Copy to clipboard"
      {...props}
    >
      <Copy
        aria-hidden
        className={cn(
          "size-4 transition-all duration-200 ease-out",
          copied ? "opacity-0 scale-[0.6] blur-xs" : "opacity-100 scale-100 blur-0",
        )}
      />
      <Check
        aria-hidden
        className={cn(
          "absolute inset-0 size-4 m-auto transition-all duration-200 ease-out",
          copied ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-[0.6] blur-xs",
        )}
      />

      <span aria-live="polite" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </button>
  );
};
