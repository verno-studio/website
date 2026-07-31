---
"@vernostudio/cli": patch
"@vernostudio/template-generator": patch
---

Harden the Ultracite integration against upstream drift. `verno update` no longer writes config files importing `ultracite/presets/*` — subpaths that stopped resolving in Ultracite 7.8 — and instead delegates regeneration to `ultracite init`, so the emitted config always matches the installed Ultracite. Configs using the current `ultracite/oxlint/*` / `ultracite/oxfmt` layout are now recognized as canonical, and old `ultracite/presets/*` configs are flagged as outdated and regenerated. The CLI also stops executing `ultracite@latest`: the executed version is pinned to the dependency catalog (`^7.8.0`), which is now the single source for the expected version everywhere, and new contract tests fail CI if a future Ultracite version adds or removes framework presets Verno does not map.
