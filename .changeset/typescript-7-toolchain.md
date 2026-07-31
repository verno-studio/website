---
"@vernostudio/cli": patch
---

Build the CLI with the TypeScript 7 toolchain. The published package no longer ships an unused empty `dist/index.d.mts` stub (the CLI exposes a binary, not a typed API); runtime behavior is unchanged.
