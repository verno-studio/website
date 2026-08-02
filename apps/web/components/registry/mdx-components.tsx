import { ProseLink } from "@/components/prose-link";
import type { ComponentProps } from "react";

/**
 * The site's own type styles, not fumadocs-ui's. Only `fumadocs-mdx` and
 * `fumadocs-core` are installed — nothing ships a stylesheet, so every element
 * an MDX file can produce is mapped here or inherits from `app/globals.css`.
 */
export const mdxComponents = {
  a: (props: ComponentProps<"a">) => <ProseLink {...props} />,
  h2: (props: ComponentProps<"h2">) => <h2 className="font-medium text-gray-1000" {...props} />,
  h3: (props: ComponentProps<"h3">) => <h3 className="font-medium text-gray-1000" {...props} />,
  p: (props: ComponentProps<"p">) => <p className="text-gray-900 text-pretty" {...props} />,
  pre: (props: ComponentProps<"pre">) => (
    <pre
      className="overflow-x-auto material-large px-4 py-4 text-gray-900 text-sm leading-relaxed no-scrollbar"
      {...props}
    />
  ),
};
