"use client";

import { cn } from "@/lib/utils";
import posthog from "posthog-js";
import { useEffect } from "react";

interface ErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

const Error = ({ error, reset }: ErrorProps) => {
  useEffect(() => {
    posthog.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[40dvh] flex-col items-center justify-center gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-medium text-gray-1000">Something went wrong</h1>
        <p className="text-pretty text-gray-900">
          An unexpected error occurred and has been reported. Trying again may be enough.
        </p>
      </div>
      <button
        className={cn(
          "rounded-full bg-background-100 px-4 py-1.5 font-medium text-gray-1000 ring-1 ring-gray-alpha-400 ring-inset cursor-pointer",
          "active:scale-[0.96] transition-[transform,background-color] duration-150 ease-out",
          "[@media(hover:hover)_and_(pointer:fine)]:hover:bg-gray-100",
        )}
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </div>
  );
};

export default Error;
