# 001 — Report and recover from route-level errors

- **Status**: TODO
- **Commit**: 7672258
- **Severity**: HIGH
- **Category**: Bugs & correctness
- **Rule**: Beyond the scan
- **Estimated scope**: 1 file, ~25 lines

## Problem

`apps/web/app/error.tsx` is the App Router error boundary for every route segment
under `app/`. Next.js renders it with two props — `error` and `reset` — but the
component declares no props at all, so both are discarded.

    // apps/web/app/error.tsx:1-12 — current
    "use client";

    const Error = () => (
      <div className="flex flex-col gap-4">
        <h1 className="text-balance font-normal font-serif text-3xl text-gray-1000 sm:text-5xl">
          Something went wrong
        </h1>
        <p className="text-gray-900">An unexpected error occurred. Please try refreshing the page.</p>
      </div>
    );

    export default Error;

Two consequences:

1. **No telemetry.** The repo captures errors in two other places and neither
   covers this one. `apps/web/instrumentation.ts:14` captures _server_ request
   errors via `onRequestError`. `apps/web/app/global-error.tsx:13` captures
   errors that escape the root layout. A client render error inside a route
   segment is caught here, and reported nowhere. The `capture_exceptions` flag
   at `apps/web/components/providers/posthog.tsx:13` hooks `window.onerror`
   and `unhandledrejection`; an error caught by a React error boundary does not
   reach either, so it is not a substitute. **Verify this during the behavior
   check rather than assuming it** — see Verification.
2. **No recovery.** `reset()` re-renders the segment without a full page load.
   Without it the copy tells the user to refresh manually, which throws away
   client state and re-downloads the document.

## Target

    // apps/web/app/error.tsx — target
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
            className="self-start material-base cursor-pointer px-4 py-2 text-gray-1000 transition-colors duration-200 ease-out hover:bg-gray-100"
            onClick={reset}
            type="button"
          >
            Try again
          </button>
        </div>
      );
    };

    export default Error;

## Repo conventions to follow

- **Exemplar to imitate: `apps/web/app/global-error.tsx:1-27`.** It is the same
  kind of file and already establishes the pattern this plan copies: a
  `"use client"` directive, a `readonly` props interface,
  `posthog.captureException(error)` in a `useEffect` keyed on `[error]`,
  arrow-function component, default export.
- Import `posthog` as a default import from `posthog-js`, exactly as
  `global-error.tsx:4` does — not `usePostHog()`.
- The `material-base` utility is defined at
  `packages/design-system/styles/material.css:3`. The standard hover transition
  in this repo is `transition-colors duration-200 ease-out` (see
  `apps/web/components/footer.tsx:15` and
  `apps/web/components/updates-index.tsx:61`).
- Object keys and JSX attributes are sorted alphabetically by the lint preset.
  Run `bun run format` after editing rather than hand-sorting.

## Steps

1. Rewrite `apps/web/app/error.tsx` to exactly the Target block above.
2. Do not touch `apps/web/app/global-error.tsx` or `apps/web/instrumentation.ts`.
3. Run `bun run format`, then re-read the diff and remove unrelated churn.

## Boundaries

- Do NOT change the heading copy or the outer `div` classes — only the paragraph
  copy changes (dropping "Please try refreshing the page." because the button now
  provides that affordance).
- Do NOT add a dependency. `posthog-js` is already a dependency of `web`.
- Do NOT introduce `PostHogErrorBoundary` or `setupReactErrorHandler` from
  `posthog-js/react`. They are a different architecture; this plan matches the
  existing `global-error.tsx` convention.
- STOP if `apps/web/app/error.tsx` no longer matches the "current" excerpt above;
  report the drift instead of improvising.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --verbose --scope changed` — score stays at 100 and
    no new diagnostic appears (in particular no `exhaustive-deps`).
  - `bun run typecheck`, `bun run lint`, `bun run test`.
- **Behavior check**:
  1. Add a temporary `throw new Error("error-boundary-smoke-test")` at the top of
     `apps/web/components/story.tsx`'s component body and run `bun run dev`.
  2. Load `/`. Confirm the fallback renders with a **Try again** button.
  3. In DevTools → Network, filter for the PostHog host and confirm an
     `$exception` event is sent with the message `error-boundary-smoke-test`.
     **If an `$exception` was already being sent before this change**, note that
     in the PR description — it means `capture_exceptions` did cover boundary
     errors and only the `reset()` affordance was missing.
  4. Remove the temporary throw, confirm `/` renders normally.
- **Done when**: the fallback reports to PostHog, **Try again** re-renders the
  segment without a full page load, the temporary throw is removed, and all
  mechanical checks pass.
