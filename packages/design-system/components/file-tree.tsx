"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const Chevron = ({ open }: { readonly open: boolean }) => (
  <svg
    aria-hidden="true"
    className={cn(
      "size-4 shrink-0 text-gray-700 transition-transform duration-150 ease-out motion-reduce:transition-none",
      open && "rotate-90",
    )}
    fill="none"
    viewBox="0 0 16 16"
  >
    <path
      clipRule="evenodd"
      d="M6.75 3.94L7.28 4.47L10.1 7.29C10.49 7.68 10.49 8.32 10.1 8.71L7.28 11.53L6.75 12.06L5.69 11L6.22 10.47L8.69 8L6.22 5.53L5.69 5L6.75 3.94Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const FOLDER_OPEN =
  "M1.5 3.5C1.5 2.95 1.95 2.5 2.5 2.5H6.09C6.36 2.5 6.61 2.61 6.8 2.79L8 4H12.5C13.05 4 13.5 4.45 13.5 5V5.5H4.5C4.06 5.5 3.67 5.79 3.55 6.21L2.2 11H2C1.72 11 1.5 10.78 1.5 10.5V3.5ZM3.5 12.5L4.86 7.71C4.92 7.5 5.11 7.36 5.33 7.36H14.2C14.53 7.36 14.77 7.68 14.68 8L13.5 12.14C13.38 12.56 12.99 12.85 12.55 12.85H3.5V12.5Z";

const FOLDER_SHUT =
  "M1.5 3.5C1.5 2.95 1.95 2.5 2.5 2.5H6.09C6.36 2.5 6.61 2.61 6.8 2.79L8 4H13C13.55 4 14 4.45 14 5V12C14 12.55 13.55 13 13 13H2.5C1.95 13 1.5 12.55 1.5 12V3.5Z";

/**
 * A cross-fade, not a path morph. `d` only interpolates between paths that
 * share a command sequence, and the open folder is two subpaths where the shut
 * one is a single outline. Both glyphs stay in the DOM and trade places, which
 * is what the copy button does elsewhere in this system.
 */
const SWAP =
  "absolute inset-0 size-4 transition-[opacity,scale,filter] duration-200 ease-out motion-reduce:transition-none";
const SHOWN = "scale-100 opacity-100 blur-0";
const HIDDEN = "scale-[0.6] opacity-0 blur-xs";

const FolderGlyph = ({ open }: { readonly open: boolean }) => (
  <span aria-hidden="true" className="relative inline-flex size-4 shrink-0 text-gray-700">
    <svg className={cn(SWAP, open ? HIDDEN : SHOWN)} fill="none" viewBox="0 0 16 16">
      <path d={FOLDER_SHUT} fill="currentColor" />
    </svg>
    <svg className={cn(SWAP, open ? SHOWN : HIDDEN)} fill="none" viewBox="0 0 16 16">
      <path d={FOLDER_OPEN} fill="currentColor" />
    </svg>
  </span>
);

const FileGlyph = () => (
  <svg aria-hidden="true" className="size-4 shrink-0 text-gray-700" fill="none" viewBox="0 0 16 16">
    <path
      clipRule="evenodd"
      d="M3.5 2C3.5 1.72 3.72 1.5 4 1.5H9.25L13 5.25V14C13 14.28 12.78 14.5 12.5 14.5H4C3.72 14.5 3.5 14.28 3.5 14V2ZM9 2.75V5.5H11.75L9 2.75Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

/** Every row is the same height and the same target, folder or file. */
const ROW =
  "flex min-h-7 w-full items-center gap-1.5 rounded-sm py-1 pe-2 ps-1 text-start text-gray-1000";

const INTERACTIVE =
  "cursor-pointer focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-gray-1000 focus-visible:-outline-offset-2 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-gray-100";

interface FileTreeProps {
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * A directory listing built from nested disclosures rather than `role="tree"`.
 * A role is a promise: `tree` commits to the full APG keyboard model, roving
 * tabindex and arrow navigation included, which earns its cost on a payload of
 * hundreds of rows and not on a listing of ten. A native button already answers
 * to Enter and Space, reports its own state, and needs nothing explained.
 */
export const FileTree = ({ children, className }: FileTreeProps) => (
  <ul
    className={cn(
      "m-0 w-full list-none p-0 font-mono text-gray-1000 text-sm [font-variant-ligatures:none]",
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
    <li className="m-0 list-none p-0">
      <button
        aria-controls={children ? id : undefined}
        aria-expanded={open}
        className={cn(ROW, INTERACTIVE)}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Chevron open={open} />
        <FolderGlyph open={open} />
        <span className="truncate">{name}</span>
      </button>
      {/*
        Hidden rather than unmounted, so a folder opened deep in the tree is
        still open when its parent is collapsed and opened again.

        The row pads 4px then draws a 16px chevron, so its centre sits 12px in.
        The guide line lands exactly there and the branch hangs off it.
      */}
      {children ? (
        <ul
          className="m-0 list-none border-gray-200 border-s ps-2 [margin-inline-start:0.75rem]"
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
  <li className="m-0 list-none p-0">
    {href ? (
      <a className={cn(ROW, INTERACTIVE, "no-underline")} href={href}>
        {/* The chevron column is empty here so names line up with folder names. */}
        <span aria-hidden="true" className="size-4 shrink-0" />
        <FileGlyph />
        <span className="truncate">{name}</span>
      </a>
    ) : (
      <span className={ROW}>
        <span aria-hidden="true" className="size-4 shrink-0" />
        <FileGlyph />
        <span className="truncate">{name}</span>
      </span>
    )}
  </li>
);
