---
"@vernostudio/cli": patch
---

Scaffold a theme provider that only imports what the project is guaranteed to
have. It wrapped children in `TooltipProvider` and rendered a `<Toaster />`,
both from `@/components/ui/*` — files that do not exist until `shadcn add` has
written them, so anything that skipped or interrupted that step left the app
failing to compile on its own provider. It now imports `next-themes` and
nothing else, with a comment on where to add the other two back.

`sonner` leaves the dependency catalog with them: `shadcn add sonner` installs
its own copy, so pre-installing it only pinned a version nothing imported.
