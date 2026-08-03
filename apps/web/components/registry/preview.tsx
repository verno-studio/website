import type { ReactNode } from "react";

interface PreviewProps {
  readonly children: ReactNode;
  readonly caption?: ReactNode;
}

/** Corners stay concentric: 12px frame minus 4px padding is the 8px surface. */
export const Preview = ({ children, caption }: PreviewProps) => (
  <figure className="my-8 w-full overflow-hidden rounded-xl bg-gray-100 p-1 shadow-(--ds-shadow-border)">
    <div className="flex min-h-40 w-full items-center justify-center rounded-lg bg-background-100 px-4 py-10 shadow-(--ds-shadow-border)">
      {children}
    </div>
    {caption ? (
      <figcaption className="px-3 pt-2 pb-1 text-gray-900 text-xs">{caption}</figcaption>
    ) : null}
  </figure>
);
