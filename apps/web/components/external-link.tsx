import { cn } from "@verno/design-system/lib/utils";
import type { ComponentProps } from "react";

export const ExternalLink = ({ href, children, className, ...props }: ComponentProps<"a">) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={cn(
      "text-muted-foreground underline decoration-muted-foreground/50 underline-offset-2 decoration-1 transition-[color,text-decoration-color] [@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-foreground",
      className,
    )}
    {...props}
  >
    {children}
  </a>
);
