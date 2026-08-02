"use client";

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
    <div className="flex flex-col gap-4">
      <h1 className="text-balance font-normal font-serif text-3xl text-gray-1000 sm:text-5xl">
        Something went wrong
      </h1>
      <p className="text-gray-900">An unexpected error occurred.</p>
      <button
        className="self-start material-base cursor-pointer px-4 py-2 text-gray-1000 active:scale-[0.97] transition-[transform,background-color] duration-150 ease-out hover:bg-gray-100"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </div>
  );
};

export default Error;
