"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";

// Relative, not the `@/components` alias: this file and its icons land in the
// same directory in a consumer's project and in this repo, and the alias only
// resolves in one of them.
import { Chevron, FileGlyph, FolderGlyph } from "./file-tree-icons";

import { cn } from "@/lib/utils";

interface FileTreeProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export const FileTree = ({ children, className }: FileTreeProps) => (
  <ul
    className={cn(
      "m-0 flex w-full list-none flex-col gap-0 p-0 font-mono text-gray-1000 text-sm [font-variant-ligatures:none]",
      className,
    )}
  >
    {children}
  </ul>
);

interface FolderProps {
  readonly name: string;
  /** Open on mount. Use it for the path you want the reader to look at. */
  readonly defaultOpen?: boolean;
  readonly children?: ReactNode;
}

export const Folder = ({ name, defaultOpen = false, children }: FolderProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <li>
      <button
        aria-controls={children ? id : undefined}
        aria-expanded={open}
        className="flex min-h-7 w-full cursor-pointer items-center gap-1.5 rounded-sm py-1 pe-2 ps-1 text-start text-gray-1000 focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-gray-1000 focus-visible:outline-solid [@media(hover:hover)_and_(pointer:fine)]:hover:bg-gray-100"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Chevron open={open} />
        <FolderGlyph open={open} />
        <span className="truncate" title={name}>
          {name}
        </span>
      </button>
      {children ? (
        <ul
          className="m-0 flex list-none flex-col gap-0 border-gray-200 border-s ps-2 ms-3"
          hidden={!open}
          id={id}
        >
          {children}
        </ul>
      ) : null}
    </li>
  );
};

interface FileProps {
  readonly name: string;
  /** Makes the row a link. Without it the name is text, with nothing to activate. */
  readonly href?: string;
}

export const File = ({ name, href }: FileProps) => (
  <li>
    {href ? (
      <a
        className="flex min-h-7 w-full cursor-pointer items-center gap-1.5 rounded-sm py-1 pe-2 ps-1 text-start text-gray-1000 no-underline focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-gray-1000 focus-visible:outline-solid [@media(hover:hover)_and_(pointer:fine)]:hover:bg-gray-100"
        href={href}
      >
        <span aria-hidden="true" className="size-4 shrink-0" />
        <FileGlyph />
        <span className="truncate" title={name}>
          {name}
        </span>
      </a>
    ) : (
      <span className="flex min-h-7 w-full items-center gap-1.5 rounded-sm py-1 pe-2 ps-1 text-start text-gray-1000">
        <span aria-hidden="true" className="size-4 shrink-0" />
        <FileGlyph />
        <span className="truncate" title={name}>
          {name}
        </span>
      </span>
    )}
  </li>
);
