---
"@vernostudio/cli": patch
---

Stop writing the Verno base layer into projects that have nothing to support it.
The layer `@apply`s `border-border`, `bg-background` and friends, which come from
the design-system package or from `shadcn init`. With `--ui none` outside a
monorepo neither runs, and `@apply` on a missing utility fails the whole build —
so the generated project did not compile. That combination now gets a bare
`@import "tailwindcss";` to style however it likes, and `verno update` / `doctor`
report the layer as not applicable there instead of proposing a fix that would
break the build.
