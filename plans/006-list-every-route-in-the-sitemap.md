# 006 — List every route in the sitemap

- **Status**: DONE
- **Commit**: 7672258
- **Severity**: LOW
- **Category**: Maintainability & architecture
- **Rule**: Beyond the scan
- **Estimated scope**: 1 file, ~20 lines

## Problem

`apps/web/app/sitemap.ts` advertises exactly one URL:

    // apps/web/app/sitemap.ts:4-11 — current
    const sitemap = (): MetadataRoute.Sitemap => [
      {
        changeFrequency: "monthly",
        lastModified: new Date(),
        priority: 1,
        url,
      },
    ];

The site has more routes than that, and they are already fully enumerable at
build time:

- `/updates` — a real page (`apps/web/app/updates/page.tsx`) with its own
  canonical (`:7`) and metadata.
- `/updates/[slug]` — statically generated, one page per release. The slug list
  is already produced by `generateStaticParams`
  (`apps/web/app/updates/[slug]/page.tsx:11`), which calls
  `getChangelog().map(({ slug }) => ({ slug }))`. Each declares its own canonical
  at `:25`.

`apps/web/app/robots.ts:11` points crawlers at this sitemap, so every release
page is currently reachable only by following links, not by declaration.

Separately, `lastModified: new Date()` evaluates at build time, so the sitemap
claims the homepage changed on **every** deploy regardless of whether anything on
it did. A `lastModified` that always moves is worse than none — crawlers learn to
distrust it.

## Target

    // apps/web/app/sitemap.ts — target (whole file)
    import type { MetadataRoute } from "next";
    import { getChangelog } from "@/lib/changelog";
    import { url } from "@/lib/url";

    const sitemap = (): MetadataRoute.Sitemap => [
      {
        changeFrequency: "monthly",
        priority: 1,
        url,
      },
      {
        changeFrequency: "weekly",
        priority: 0.8,
        url: new URL("/updates", url).toString(),
      },
      ...getChangelog().map(({ slug }) => ({
        changeFrequency: "yearly" as const,
        priority: 0.5,
        url: new URL(`/updates/${slug}`, url).toString(),
      })),
    ];

    export default sitemap;

`lastModified` is dropped rather than faked. `changeFrequency` carries the intent
instead: the homepage is edited occasionally, `/updates` gains an entry per
release, and a published release page never changes again.

## Repo conventions to follow

- **Exemplar to imitate: `apps/web/app/robots.ts:11`** — absolute URLs are built
  with `new URL(path, url).href`. `apps/web/app/layout.tsx:39` uses
  `.toString()`. Either is fine; be consistent within the file.
- `url` is the origin string exported from `apps/web/lib/url.ts:6`.
- `getChangelog` is already imported this way by
  `apps/web/app/updates/page.tsx:4` and `apps/web/app/updates/[slug]/page.tsx:5`
  — it is a synchronous, memoised read (`lib/changelog.ts:339-344`), so calling
  it here costs nothing extra.
- Object keys are sorted alphabetically by the lint preset. Run `bun run format`
  rather than hand-sorting.

## Steps

1. Replace `apps/web/app/sitemap.ts` with the Target block above.
2. Run `bun run format`, then re-read the diff and remove unrelated churn.

## Boundaries

- Do NOT change `apps/web/app/robots.ts`.
- Do NOT add `lastModified` back with a fabricated date. If a real per-release
  date is wanted later, it needs a real source (git commit date or a date in the
  changelog) — that is a separate change, out of scope here.
- Do NOT change how slugs are generated (`versionToSlug` at
  `lib/changelog.ts:40`); read them from `getChangelog()`.
- Do NOT add a dependency.
- STOP if `sitemap.ts` no longer matches the "current" excerpt above.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --verbose --scope changed` — score stays at 100.
  - `bun run typecheck` — in particular the `changeFrequency: "yearly" as const`
    assertion is required for the spread to satisfy `MetadataRoute.Sitemap`;
    without it TypeScript widens it to `string`.
  - `bun run lint`, `bun run test`.
- **Behavior check**:
  1. `bun run dev`, open `http://localhost:3000/sitemap.xml`.
  2. Confirm it lists `/`, `/updates`, and one `<url>` per release, and that the
     release count matches the number of `## ` version headings in
     `packages/cli/CHANGELOG.md`.
  3. Confirm every `<loc>` is an absolute URL on the right origin and that
     visiting a couple of the release URLs returns a page rather than a 404.
  4. Build twice and confirm the sitemap output is byte-identical between runs
     (this is what dropping `new Date()` buys).
- **Done when**: every statically generated route appears exactly once, all URLs
  resolve, the output is stable across builds, and all mechanical checks pass.
