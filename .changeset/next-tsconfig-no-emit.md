---
"@vernostudio/template-generator": patch
---

Generated Next.js projects no longer include `noEmit` in `tsconfig.json`. Typecheck still uses `tsgo --noEmit` via the package script.
