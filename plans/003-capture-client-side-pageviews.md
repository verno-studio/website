# 003 — Capture pageviews on client-side navigation

- **Status**: TODO
- **Commit**: 7672258
- **Severity**: MEDIUM
- **Category**: Bugs & correctness
- **Rule**: Beyond the scan
- **Estimated scope**: 1 file, 1 line

## Problem

`apps/web/components/providers/posthog.tsx` initialises PostHog without the
`defaults` option:

    // apps/web/components/providers/posthog.tsx:10-16 — current
    useEffect(() => {
      posthog.init(env.NEXT_PUBLIC_POSTHOG_TOKEN, {
        api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
        capture_exceptions: true,
        person_profiles: "identified_only",
      });
    }, []);

The installed `@posthog/types` documents the consequence exactly
(`node_modules/.bun/@posthog+types@1.399.0/node_modules/@posthog/types/dist/posthog-config.d.ts:1036-1044`):

    /**
     * Determines whether PostHog should capture pageview events automatically.
     * Can be:
     * - `true`: Capture regular pageviews (default)
     * - `false`: Don't capture any pageviews
     * - `'history_change'`: Capture pageviews on the initial page load and on
     *   history API changes (pushState, replaceState, popstate)
     *
     * @default true (or `'history_change'` when `defaults` is `'2025-05-24'` or later)
     */
    capture_pageview: boolean | 'history_change';

With `defaults` unset, `capture_pageview` is `true` — initial document load only.
Every client-side App Router navigation therefore emits **no** `$pageview`:

- `apps/web/components/header.tsx:5` — the `Verno Studio` link back to `/`
- `apps/web/components/footer.tsx:14-19` — the `updates` link, present on every page
- `apps/web/components/updates-index.tsx:60` — every release link into `/updates/[slug]`

That is the entire internal navigation graph of the site. `/updates` and every
release page only register when someone hard-loads them.

`capture_pageleave` defaults to `'if_capture_pageview'`
(`posthog-config.d.ts:1050`), so it inherits the same fix.

## Target

    // apps/web/components/providers/posthog.tsx:10-16 — target
    useEffect(() => {
      posthog.init(env.NEXT_PUBLIC_POSTHOG_TOKEN, {
        api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
        capture_exceptions: true,
        defaults: "2025-05-24",
        person_profiles: "identified_only",
      });
    }, []);

`"2025-05-24"` is the earliest `defaults` value that enables
`capture_pageview: 'history_change'`. It is deliberately not the newest available
value — later ones (`"2025-11-30"`, `"2026-01-30"`, `"2026-05-30"`,
`"2026-06-25"`) also change rageclick, session recording, storage splitting and
URL-hash behaviour, which is out of scope here.

## Repo conventions to follow

- Config object keys are alphabetically sorted (the lint preset enforces it), so
  `defaults` sits between `capture_exceptions` and `person_profiles` — exactly
  where the Target block puts it.
- Do not restructure the `useEffect`; the empty dependency array is correct for a
  one-time SDK init.
- Run `bun run format` after editing rather than hand-sorting.

## Steps

1. Add the single line `defaults: "2025-05-24",` to the `posthog.init` options in
   `apps/web/components/providers/posthog.tsx`, in the position shown above.
2. Change nothing else in the file.
3. Run `bun run format`, then re-read the diff and remove unrelated churn.

## Boundaries

- Do NOT set `capture_pageview` directly. Going through `defaults` is what
  PostHog versions its behaviour changes against.
- Do NOT bump `defaults` to a newer date — that pulls in unrelated behaviour
  changes listed above.
- Do NOT add a manual `usePathname()` + `posthog.capture("$pageview")` effect.
  That is the pre-`history_change` workaround and would double-count once
  `defaults` is set.
- Do NOT change `capture_exceptions` or `person_profiles`.
- STOP if the init block no longer matches the "current" excerpt above.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --verbose --scope changed` — score stays at 100.
  - `bun run typecheck` — confirms `"2025-05-24"` is a valid `ConfigDefaults`
    value for the installed `posthog-js`.
  - `bun run lint`, `bun run test`.
- **Behavior check**:
  1. `bun run dev`, load `/` with DevTools → Network filtered to the PostHog
     host. Confirm one `$pageview`.
  2. Click **updates** in the footer — a client-side navigation, no document
     request. Confirm a **second** `$pageview` fires with the `/updates` URL.
  3. Click into any release, then press the browser Back button. Confirm a
     `$pageview` for each.
  4. Confirm no duplicate `$pageview` for the same URL on the initial load.
- **Done when**: each in-app navigation produces exactly one `$pageview`, back /
  forward included, with no duplicates on first load.
