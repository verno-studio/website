"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";

interface CodeSurfaceProps {
  readonly children: ReactNode;
  /** Shown in the header bar: a file path, or the file the snippet lands in. */
  readonly name?: string;
  /** Shiki puts its theme classes and CSS variables on the `pre` it emits. */
  readonly className?: string;
  readonly style?: CSSProperties;
}

/**
 * The copy value is read off the rendered `<pre>` rather than passed in: a
 * highlighted block arrives as spans, not as a string.
 */
export const CodeSurface = ({ children, name, className, style }: CodeSurfaceProps) => {
  const ref = useRef<HTMLPreElement>(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    setCode(ref.current?.textContent ?? "");
  }, []);

  return (
    <figure className="my-8 w-full overflow-hidden rounded-xl bg-background-100 shadow-(--ds-shadow-border)">
      <figcaption className="flex items-center justify-between gap-2 border-gray-alpha-400 border-b bg-gray-100 py-1.5 pr-1.5 pl-3">
        <span className="truncate font-mono text-gray-900 text-xs">{name}</span>
        <CopyButton aria-label="Copy code" className="size-7" value={code} />
      </figcaption>
      <pre
        className={cn(
          "overflow-x-auto p-3 text-gray-900 text-sm leading-relaxed no-scrollbar",
          className,
        )}
        ref={ref}
        style={style}
      >
        {children}
      </pre>
    </figure>
  );
};
