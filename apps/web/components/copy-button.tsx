"use client";

import { useCallback, useEffect, useState } from "react";
import type { ComponentProps, ComponentType, SVGProps } from "react";

import { CheckIcon } from "@/components/icons/check";
import { CopyIcon } from "@/components/icons/copy";
import { cn } from "@/lib/utils";

interface CopyButtonProps extends Omit<ComponentProps<"button">, "onClick" | "value"> {
  readonly value: string | (() => string);
  readonly onCopy?: () => void;
  readonly icon?: ComponentType<SVGProps<SVGSVGElement>>;
}

export const CopyButton = ({
  value,
  onCopy,
  className,
  icon: Icon = CopyIcon,
  ...props
}: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(typeof value === "function" ? value() : value);
      setCopied(true);
      onCopy?.();
    } catch {
      // clipboard not available
    }
  }, [value, onCopy]);

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
      <Icon
        aria-hidden
        className={cn(
          "size-4 transition-[opacity,scale,filter] duration-200 ease-out",
          copied ? "opacity-0 scale-[0.6] blur-xs" : "opacity-100 scale-100 blur-0",
        )}
      />
      <CheckIcon
        aria-hidden
        className={cn(
          "absolute inset-0 size-4 m-auto transition-[opacity,scale,filter] duration-200 ease-out",
          copied ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-[0.6] blur-xs",
        )}
      />

      <span aria-live="polite" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </button>
  );
};
