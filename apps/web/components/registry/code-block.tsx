"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";

const COLLAPSE_AFTER = 24;

interface CodeBlockProps {
  readonly children: ReactNode;
  /** Geist calls this the filename. Absent means the block has no header. */
  readonly filename?: string;
  readonly lines?: number;
  /**
   * Off by default, unlike Geist's `hideLineNumbers`. Geist renders standalone
   * samples; this also renders every fence in the prose, and those are
   * fragments. Numbering a fragment 1, 2, 3 claims it starts at the top of a
   * file, which is usually a lie. A block that really is a whole file asks.
   */
  readonly lineNumbers?: boolean;
  readonly className?: string;
  readonly style?: CSSProperties;
}

export const CodeBlock = ({
  children,
  filename,
  lines,
  lineNumbers = false,
  className,
  style,
}: CodeBlockProps) => {
  const ref = useRef<HTMLPreElement>(null);
  const [code, setCode] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setCode(ref.current?.textContent ?? "");
  }, []);

  const collapsible = Boolean(lines && lines > COLLAPSE_AFTER);
  const collapsed = collapsible && !open;

  return (
    <figure className="relative my-8 w-full overflow-hidden rounded-xl bg-background-100 shadow-(--ds-shadow-border)">
      {filename ? (
        <figcaption className="flex items-center justify-between gap-2 border-gray-alpha-400 border-b bg-gray-100 py-1.5 pr-1.5 pl-3">
          <span className="truncate font-mono text-gray-900 text-xs">{filename}</span>
          <CopyButton aria-label="Copy code" className="size-7" value={code} />
        </figcaption>
      ) : (
        // With no header to sit in, the control floats over the code. It keeps
        // its own background so it never has code running underneath it.
        <CopyButton
          aria-label="Copy code"
          className="absolute inset-e-2 top-2 z-10 size-7 bg-background-100 shadow-(--ds-shadow-border)"
          value={code}
        />
      )}

      <div className={cn("relative", collapsed && "max-h-112 overflow-hidden")}>
        <pre
          className={cn(
            "overflow-x-auto p-3 text-gray-900 text-sm leading-relaxed no-scrollbar",
            lineNumbers && "line-numbers",
            !filename && "pe-12",
            className,
          )}
          ref={ref}
          style={style}
        >
          {children}
        </pre>
        {collapsed ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background-100 to-transparent"
          />
        ) : null}
      </div>

      {collapsible ? (
        <div className="border-gray-alpha-400 border-t">
          <button
            aria-expanded={open}
            className="w-full cursor-pointer bg-gray-100 py-2 text-center font-medium text-gray-900 text-xs transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-focus [@media(hover:hover)_and_(pointer:fine)]:hover:text-gray-1000"
            onClick={() => setOpen((current) => !current)}
            type="button"
          >
            {open ? "Show less" : `Show all ${lines} lines`}
          </button>
        </div>
      ) : null}
    </figure>
  );
};
