---
"@vernostudio/cli": patch
---

Scaffold the design system's `globals.css` from the Geist scale. Generated
projects keep the same shadcn token contract — `--primary`,
`--muted-foreground`, `--ring` and the rest are all still exported, so
`shadcn add` behaves exactly as before — but each value now resolves to a step
on the Geist scale instead of a hand-picked literal. New projects inherit
Verno's palette out of the box.
