import { ProseLink } from "@/components/prose-link";
import type { ComponentProps } from "react";

/**
 * The site's own type styles, not fumadocs-ui's. Only `fumadocs-mdx` and
 * `fumadocs-core` are installed — nothing ships a stylesheet, so every element
 * an MDX file can produce is mapped here or inherits from `app/globals.css`.
 *
 * Children are nested rather than spread: a heading whose content arrives
 * through `{...props}` reads as empty to both the linter and a screen reader.
 */
export const mdxComponents = {
  a: ({ children, ...props }: ComponentProps<"a">) => <ProseLink {...props}>{children}</ProseLink>,
  h2: ({ children, ...props }: ComponentProps<"h2">) => (
    <h2 className="font-medium text-gray-1000" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: ComponentProps<"h3">) => (
    <h3 className="font-medium text-gray-1000" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }: ComponentProps<"p">) => (
    <p className="text-gray-900 text-pretty" {...props}>
      {children}
    </p>
  ),
  pre: ({ children, ...props }: ComponentProps<"pre">) => (
    <pre
      className="overflow-x-auto material-large px-4 py-4 text-gray-900 text-sm leading-relaxed no-scrollbar"
      {...props}
    >
      {children}
    </pre>
  ),
};
