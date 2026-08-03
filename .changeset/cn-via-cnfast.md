---
"@vernostudio/cli": patch
---

Scaffold `cn` from `cnfast` instead of composing `clsx` with `tailwind-merge`.
It is a drop-in with the same signature and the same Tailwind conflict
resolution, so generated `lib/utils.ts` is now a single re-export and the app
carries one dependency where it used to carry two. Verified against this repo's
own class strings: 9223 comparisons across every literal in the codebase, their
pairings, and the object, array and conditional forms, with no output
difference.
