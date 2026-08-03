import Link from "next/link";
import type { ComponentProps } from "react";

import { HeadingAnchor } from "@/components/heading-anchor";
import { CodeSurface } from "@/components/registry/code-surface";
import { Preview } from "@/components/registry/preview";
import { Dependencies, Install, InstallUrl, Source, Tokens } from "@/components/registry/sections";
import type { RegistryItem } from "@/lib/registry-schema";
import { Divider } from "@/components/devider";

const Anchor = ({ href, children, ...props }: ComponentProps<"a">) =>
  href?.startsWith("/") ? (
    <Link
      className="text-gray-900 underline decoration-1 decoration-gray-900/50 underline-offset-2 transition-[color,text-decoration-color] [@media(hover:hover)_and_(pointer:fine)]:hover:text-gray-1000 [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-gray-1000"
      href={href}
      {...props}
    >
      {children}
    </Link>
  ) : (
    <a
      className="text-gray-900 underline decoration-1 decoration-gray-900/50 underline-offset-2 transition-[color,text-decoration-color] [@media(hover:hover)_and_(pointer:fine)]:hover:text-gray-1000 [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-gray-1000"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
      {...props}
    >
      {children}
    </a>
  );

const proseComponents = {
  Preview,
  a: Anchor,
  h2: ({ children, id, ...props }: ComponentProps<"h2">) => (
    <div className="group relative mt-16 mb-3 w-fit first:mt-0">
      <h2 className="scroll-mt-20 font-medium text-gray-1000" id={id} {...props}>
        {children}
      </h2>
      {id ? <HeadingAnchor id={id} /> : null}
    </div>
  ),
  h3: ({ children, id, ...props }: ComponentProps<"h3">) => (
    <div className="group relative mt-10 mb-2 w-fit">
      <h3 className="scroll-mt-20 font-medium text-gray-1000" id={id} {...props}>
        {children}
      </h3>
      {id ? <HeadingAnchor id={id} /> : null}
    </div>
  ),
  hr: Divider,
  ol: ({ children, ...props }: ComponentProps<"ol">) => (
    <ol className="my-6" {...props}>
      {children}
    </ol>
  ),
  p: ({ children, ...props }: ComponentProps<"p">) => (
    <p className="my-4 text-gray-900 text-pretty" {...props}>
      {children}
    </p>
  ),
  // Shiki hangs theme classes, CSS variables and a fumadocs-ui `icon` off the
  // `pre`. Forward the first two; spreading the icon puts an SVG in an attribute.
  pre: ({ children, className, style, title }: ComponentProps<"pre">) => (
    <CodeSurface className={className} name={title} style={style}>
      {children}
    </CodeSurface>
  ),
  ul: ({ children, ...props }: ComponentProps<"ul">) => (
    <ul className="my-6" {...props}>
      {children}
    </ul>
  ),
};

export const registryComponents = (item: RegistryItem) => ({
  ...proseComponents,
  Dependencies: () => <Dependencies item={item} />,
  Install: () => <Install item={item} />,
  InstallUrl: () => <InstallUrl item={item} />,
  Source: () => <Source item={item} />,
  Tokens: () => <Tokens item={item} />,
});
