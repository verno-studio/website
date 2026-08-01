import { cn } from "../lib/utils";
import type { ComponentProps } from "react";

export const ProseLink = ({ href, children, className, ...props }: ComponentProps<"a">) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={cn(
      "text-gray-900 underline decoration-gray-900/50 underline-offset-2 decoration-1 transition-[color,text-decoration-color] [@media(hover:hover)_and_(pointer:fine)]:hover:text-gray-1000 [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-gray-1000",
      className,
    )}
    {...props}
  >
    {children}
  </a>
);
