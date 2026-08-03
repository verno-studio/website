# @vernostudio/template-generator

## 0.1.4

### Patch Changes

- d9b8d8a: Harden the Ultracite integration against upstream drift. `verno update` no longer writes config files importing `ultracite/presets/*` — subpaths that stopped resolving in Ultracite 7.8 — and instead delegates regeneration to `ultracite init`, so the emitted config always matches the installed Ultracite. Configs using the current `ultracite/oxlint/*` / `ultracite/oxfmt` layout are now recognized as canonical, and old `ultracite/presets/*` configs are flagged as outdated and regenerated. The CLI also stops executing `ultracite@latest`: the executed version is pinned to the dependency catalog (`^7.8.0`), which is now the single source for the expected version everywhere, and new contract tests fail CI if a future Ultracite version adds or removes framework presets Verno does not map. `--frameworks` now accepts ids Verno does not know: known ids are still checked up front, unknown ones pass through to `ultracite init` with a warning, so frameworks Ultracite adds within the pinned range work from the flag on day one.

## 0.1.3

### Patch Changes

- 6c21a96: Refresh generated project README with a minimal ASCII structure tree, scoped links, and a package-manager-aware dev command

## 0.1.2

### Patch Changes

- ce5d91c: Generated Next.js projects no longer include `noEmit` in `tsconfig.json`. Typecheck still uses `tsgo --noEmit` via the package script.

## 0.1.1

### Patch Changes

- edd8acb: Unify shadcn initialization across all project types (Single App and Turborepo) to use `shadcn apply` with a pre-scaffolded `components.json`. This fixes framework detection issues in custom packages by using a temporary configuration file during execution.

## 0.1.0

### Minor Changes

- 50a97f9: Add templates for Verno Studio projects including Next.js and Turborepo project generation.
