---
"@vernostudio/cli": patch
---

Typecheck generated projects with TypeScript 7 instead of the native preview.
The preview package existed to provide `tsgo` while the native compiler was
still separate; TypeScript 7 is that compiler, so the scaffolded script is
`tsc --noEmit` again and `@typescript/native-preview` is gone from the
dependency catalog.
