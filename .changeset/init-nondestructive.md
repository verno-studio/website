---
"@vernostudio/cli": patch
---

`verno init` is now non-destructive on existing projects: it preserves the root `start` script, no longer overwrites an existing `turbo.json` or `apps/web/package.json` (warns and skips instead), generates a self-contained `turbo.json` (removing the broken `@vernostudio/turborepo-utils` extends reference), and leaves a real `vite.config.ts` untouched during the shadcn bootstrap.
