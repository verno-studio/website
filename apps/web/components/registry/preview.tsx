import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PreviewProps {
  readonly children: ReactNode;
  readonly caption?: ReactNode;
  readonly align?: "center" | "start";
}

/** Corners stay concentric: 12px frame minus 4px padding is the 8px surface. */
export const Preview = ({ children, caption, align = "center" }: PreviewProps) => (
  <figure className="my-8 w-full overflow-hidden rounded-xl bg-gray-100 p-1 shadow-(--ds-shadow-border)">
    <div
      className={cn(
        "flex min-h-40 w-full rounded-lg bg-background-100 px-4 shadow-(--ds-shadow-border)",
        align === "center" ? "items-center justify-center py-10" : "items-start justify-start py-6",
      )}
    >
      {children}
    </div>
    {caption ? (
      <figcaption className="px-3 pt-2 pb-1 text-gray-900 text-xs">{caption}</figcaption>
    ) : null}
  </figure>
);
