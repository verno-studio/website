"use client";

import { useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

interface JsonViewProps {
  /** The value to render. Pass the object or array itself, never a JSON string. */
  readonly data: unknown;
  /** 0 collapses everything, 1 opens the first level. Deeper values open further. */
  readonly defaultExpandDepth?: number;
  /** Only while a search is active; `null` the rest of the time. */
  readonly highlightPattern?: RegExp | null;
  readonly className?: string;
}

interface JsonNode {
  readonly id: string;
  readonly label: string | null;
  readonly value: unknown;
  readonly depth: number;
  readonly children: readonly JsonNode[] | null;
}

const REGEXP_SPECIAL = /[.*+?^${}()|[\]\\]/gu;

/** Every metacharacter here is a syntax character, so `\x` stays legal under `u`. */
const escapeRegExp = (value: string) => value.replace(REGEXP_SPECIAL, "\\$&");

/**
 * Builds the pattern `JsonView` highlights with. Terms are matched literally, so
 * a search for `a.b` cannot turn into a wildcard.
 */
export const makeJsonViewHighlightPattern = (terms: readonly string[]): RegExp | null => {
  const cleaned = terms.flatMap((term) => {
    const trimmed = term.trim();

    return trimmed ? [trimmed] : [];
  });

  if (cleaned.length === 0) {
    return null;
  }

  return new RegExp(cleaned.map(escapeRegExp).join("|"), "giu");
};

const isContainer = (value: unknown): value is Record<string, unknown> | unknown[] =>
  typeof value === "object" && value !== null;

const entriesOf = (value: Record<string, unknown> | unknown[]): [string, unknown][] =>
  Array.isArray(value) ? value.map((item, index) => [String(index), item]) : Object.entries(value);

const buildNode = (value: unknown, id: string, label: string | null, depth: number): JsonNode => {
  if (!isContainer(value)) {
    return { children: null, depth, id, label, value };
  }

  const entries = entriesOf(value);

  return {
    // An empty object has nothing to disclose, so it stays a leaf rather than
    // an expandable node whose group would be empty.
    children:
      entries.length === 0
        ? null
        : entries.map(([key, child]) => buildNode(child, `${id}.${key}`, key, depth + 1)),
    depth,
    id,
    label,
    value,
  };
};

const collectExpanded = (node: JsonNode, maxDepth: number, into: Set<string>): Set<string> => {
  if (node.children && node.depth < maxDepth) {
    into.add(node.id);

    for (const child of node.children) {
      collectExpanded(child, maxDepth, into);
    }
  }

  return into;
};

const flatten = (node: JsonNode, expanded: ReadonlySet<string>, into: JsonNode[]): JsonNode[] => {
  into.push(node);

  if (node.children && expanded.has(node.id)) {
    for (const child of node.children) {
      flatten(child, expanded, into);
    }
  }

  return into;
};

const bracketsOf = (value: unknown) =>
  Array.isArray(value) ? (["[", "]"] as const) : (["{", "}"] as const);

const toneOf = (value: unknown) => {
  if (typeof value === "string") {
    return "text-json-string";
  }
  if (typeof value === "number") {
    return "text-json-number";
  }
  if (typeof value === "boolean") {
    return "text-json-boolean";
  }
  return "text-gray-900";
};

const printValue = (value: unknown) =>
  typeof value === "string" ? JSON.stringify(value) : String(value);

const countLabel = (count: number) => (count === 1 ? "1 item" : `${count} items`);

const describe = (node: JsonNode) => {
  const name = node.label ?? "JSON";

  if (!node.children) {
    return isContainer(node.value)
      ? `${name}: empty ${Array.isArray(node.value) ? "array" : "object"}`
      : `${name}: ${printValue(node.value)}`;
  }

  const kind = Array.isArray(node.value) ? "array" : "object";

  return `${name}: ${kind}, ${countLabel(node.children.length)}`;
};

/** Wraps every match in a `<mark>` so a search can point at what it found. */
const Highlight = ({
  text,
  pattern,
}: {
  readonly text: string;
  readonly pattern?: RegExp | null;
}) => {
  if (!pattern) {
    return text;
  }

  const global = pattern.global ? pattern : new RegExp(pattern.source, `${pattern.flags}g`);
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(global)) {
    const at = match.index;

    // A pattern that can match nothing would otherwise loop forever.
    if (match[0].length === 0) {
      continue;
    }

    if (at > cursor) {
      parts.push(text.slice(cursor, at));
    }

    parts.push(
      <mark className="rounded-xs bg-json-highlight text-json-highlight-foreground" key={at}>
        {match[0]}
      </mark>,
    );
    cursor = at + match[0].length;
  }

  if (parts.length === 0) {
    return text;
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
};

const Chevron = ({ open }: { readonly open: boolean }) => (
  <svg
    aria-hidden="true"
    className={cn(
      "size-4 shrink-0 transition-transform duration-150 ease-out motion-reduce:transition-none",
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

export const JsonView = ({
  data,
  defaultExpandDepth = 1,
  highlightPattern = null,
  className,
}: JsonViewProps) => {
  const root = useMemo(() => buildNode(data, "$", null, 0), [data]);
  const [expanded, setExpanded] = useState(() =>
    collectExpanded(root, defaultExpandDepth, new Set<string>()),
  );
  const [activeId, setActiveId] = useState(root.id);
  // Built once. `useRef(new Map())` would allocate a Map on every render and
  // throw it away, since only the first argument is ever kept.
  const nodesRef = useRef<Map<string, HTMLDivElement> | null>(null);
  nodesRef.current ??= new Map();
  const nodes = nodesRef.current;

  const visible = useMemo(() => flatten(root, expanded, []), [root, expanded]);
  // A collapse can strip the focused node out of the tree; without this the
  // roving tabindex would land on nothing and the whole tree would leave the
  // tab order.
  const active = visible.some((node) => node.id === activeId) ? activeId : root.id;

  const toggle = (node: JsonNode, open?: boolean) => {
    if (!node.children) {
      return;
    }

    setExpanded((current) => {
      const next = new Set(current);
      const shouldOpen = open ?? !next.has(node.id);

      if (shouldOpen) {
        next.add(node.id);
      } else {
        next.delete(node.id);
      }

      return next;
    });
  };

  const focus = (id: string) => {
    setActiveId(id);
    nodes.get(id)?.focus();
  };

  // The node comes from the row the key was pressed on, not from state. Reading
  // `active` here meant the handler bound in the previous render answered with
  // the previously focused node, so the first arrow after a move was eaten.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>, node: JsonNode) => {
    const index = visible.findIndex((entry) => entry.id === node.id);

    if (index === -1) {
      return;
    }

    // Every treeitem carries this handler, so an unclaimed keystroke would run
    // again on each ancestor on the way up. That is harmless for a move, but a
    // toggle would flip straight back.
    const claim = () => {
      event.preventDefault();
      event.stopPropagation();
    };

    const step = (to: number) => {
      const target = visible[to];

      if (target) {
        claim();
        focus(target.id);
      }
    };

    switch (event.key) {
      case "ArrowDown": {
        step(index + 1);
        break;
      }
      case "ArrowUp": {
        step(index - 1);
        break;
      }
      case "ArrowRight": {
        claim();
        // APG: the first press opens the node, the second walks into it, so a
        // node never expands and loses focus in the same keystroke.
        if (node.children && !expanded.has(node.id)) {
          toggle(node, true);
        } else if (node.children) {
          step(index + 1);
        }
        break;
      }
      case "ArrowLeft": {
        claim();
        if (node.children && expanded.has(node.id)) {
          toggle(node, false);
        } else {
          for (let at = index - 1; at >= 0; at -= 1) {
            const candidate = visible[at];

            if (candidate && candidate.depth < node.depth) {
              focus(candidate.id);
              break;
            }
          }
        }
        break;
      }
      case "Home": {
        step(0);
        break;
      }
      case "End": {
        step(visible.length - 1);
        break;
      }
      case "Enter":
      case " ": {
        if (node.children) {
          claim();
          toggle(node);
        }
        break;
      }
      default: {
        break;
      }
    }
  };

  const renderNode = (node: JsonNode, position: number, size: number) => {
    const open = Boolean(node.children) && expanded.has(node.id);
    const [openBracket, closeBracket] = bracketsOf(node.value);
    const container = isContainer(node.value);

    return (
      <div
        aria-expanded={node.children ? open : undefined}
        aria-label={describe(node)}
        aria-level={node.depth + 1}
        aria-posinset={position}
        aria-setsize={size}
        // Indent by depth, not by position: `first:` would match the first
        // child of every group and flatten one row at each level.
        className={cn("group outline-none", node.depth > 0 && "ps-4")}
        key={node.id}
        onClick={(event) => {
          // The treeitem box wraps its own subtree, so without this a click on
          // a child would toggle every ancestor on the way up.
          event.stopPropagation();
          toggle(node);
        }}
        onFocus={() => setActiveId(node.id)}
        onKeyDown={(event) => onKeyDown(event, node)}
        ref={(element) => {
          if (element) {
            nodes.set(node.id, element);
          } else {
            nodes.delete(node.id);
          }
        }}
        role="treeitem"
        tabIndex={node.id === active ? 0 : -1}
      >
        <div
          className={cn(
            "flex min-h-6 items-start gap-1 rounded-sm py-0.5",
            "group-focus-visible:outline-2 group-focus-visible:outline-gray-1000 group-focus-visible:outline-offset-1",
            node.children &&
              "cursor-pointer touch-manipulation [@media(hover:hover)_and_(pointer:fine)]:hover:bg-gray-100",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "flex size-4 shrink-0 translate-y-0.5 items-center justify-center text-gray-700",
              !node.children && "invisible",
            )}
          >
            <Chevron open={open} />
          </span>
          <span className="min-w-0 wrap-anywhere">
            {node.label === null ? null : (
              <span className="text-json-key">
                <Highlight pattern={highlightPattern} text={node.label} />
                <span className="text-gray-1000">: </span>
              </span>
            )}
            {container ? (
              <span className="text-gray-1000">
                {openBracket}
                {node.children && !open ? <span className="text-gray-900">…</span> : null}
                {node.children && open ? null : closeBracket}
              </span>
            ) : (
              <span className={toneOf(node.value)}>
                <Highlight pattern={highlightPattern} text={printValue(node.value)} />
              </span>
            )}
          </span>
        </div>

        {node.children && open ? (
          <>
            {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a tree's child list is role="group" per the ARIA APG; the suggested tags all carry the wrong semantics here */}
            <div className="m-0 p-0" role="group">
              {node.children.map((child, index) =>
                renderNode(child, index + 1, node.children?.length ?? 0),
              )}
            </div>
            <div aria-hidden="true" className="min-h-6 py-0.5 ps-5 text-gray-1000">
              {closeBracket}
            </div>
          </>
        ) : null}
      </div>
    );
  };

  return (
    <div
      aria-label="JSON"
      className={cn(
        "w-full font-mono text-xs/5 text-gray-1000 [font-variant-ligatures:none]",
        className,
      )}
      role="tree"
      // The tree is reached through whichever treeitem currently holds the
      // roving 0, so the container itself stays out of the tab order.
      tabIndex={-1}
    >
      {renderNode(root, 1, 1)}
    </div>
  );
};
