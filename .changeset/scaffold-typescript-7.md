---
"@vernostudio/cli": patch
---

Enable `useTypeScriptCli` in the scaffolded Next config. The generator already
pins `typescript@^7`, but TypeScript 7 has no JS compiler API, so without that
flag a generated project builds with no type checking at all. `@types/node`
also moves to `^26` to match the version every package in this repo uses.
