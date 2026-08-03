# @vernostudio/cli

## 0.2.1

### Patch Changes

- 21c0cd5: Scaffold `cn` from `cnfast` instead of composing `clsx` with `tailwind-merge`.
  It is a drop-in with the same signature and the same Tailwind conflict
  resolution, so generated `lib/utils.ts` is now a single re-export and the app
  carries one dependency where it used to carry two. Verified against this repo's
  own class strings: 9223 comparisons across every literal in the codebase, their
  pairings, and the object, array and conditional forms, with no output
  difference.
- 1fd6005: Enable `useTypeScriptCli` in the scaffolded Next config. The generator already
  pins `typescript@^7`, but TypeScript 7 has no JS compiler API, so without that
  flag a generated project builds with no type checking at all. `@types/node`
  also moves to `^26` to match the version every package in this repo uses.

## 0.2.0

### Minor Changes

- 5f8d2df: Stop scaffolding a `packages/design-system` workspace. It existed to hold the
  global stylesheet and the three helpers that go with it — `cn`, the fonts, the
  theme provider — but a package earns its keep by being shared, and in a
  generated project nothing else imported it. Those files now land in the app,
  which is where the single-app layout already put them, so both layouts produce
  the same shape.

  `components.json` moves with them: `apps/web/components.json` in a Turborepo
  project, the project root otherwise. shadcn resolves it from its own working
  directory and never searches downward, so `verno create` now points the CLI at
  the app rather than at a package.

  `design-system` is gone from `--packages`, the create prompt, and the manifest.
  `verno doctor` still recognises the old location, so projects generated before
  this release keep reporting clean.

  What used to justify the package is now the registry: the palette lives at
  `@vernostudio/theme`, and every generated project ships pointed at it.

### Patch Changes

- 463bc3f: Write the current base layer into a generated project's `app/globals.css`. The
  CLI restores this block after `shadcn init` rewrites the stylesheet, and its
  copy had fallen behind the template — because the CLI writes last, the stale
  version was the one projects actually got. Selection colour, the `html`
  font-feature and text-rendering setup, placeholder colour and focus rings all
  now match the template. A contract test keeps the two from drifting again.
- 463bc3f: Stop writing the Verno base layer into projects that have nothing to support it.
  The layer `@apply`s `border-border`, `bg-background` and friends, which come from
  the design-system package or from `shadcn init`. With `--ui none` outside a
  monorepo neither runs, and `@apply` on a missing utility fails the whole build —
  so the generated project did not compile. That combination now gets a bare
  `@import "tailwindcss";` to style however it likes, and `verno update` / `doctor`
  report the layer as not applicable there instead of proposing a fix that would
  break the build.
- 7c342a9: Fix three usage-flow issues found by walking the CLI end to end: project names are now validated (letters, numbers, hyphens) on the positional and `-y` paths too, instead of only when the wizard prompts — previously `verno create "bad name" -y` exited 0 and scaffolded a project with an npm-invalid `package.json` name; the `init --dry-run` plan now lists the turborepo restructure before dependency install, matching the real execution order; and the two dead `vernostudio.dev/docs/*` links printed after `init` now point at https://www.ultracite.ai and https://verno-studio.vercel.app.
- 0d59d45: Fix three silently ignored flags: `--no-install` and `--no-git` are now honored by `create` and `init` (Commander exposes them as `install`/`git`), and `init --addon` is renamed to `--addons` (matching `create`) with a hidden `--addon` back-compat alias. Adds parse-level wiring tests so option-wiring regressions are caught.
- 463bc3f: Scaffold the design system's `globals.css` from the Geist scale. Generated
  projects keep the same shadcn token contract — `--primary`,
  `--muted-foreground`, `--ring` and the rest are all still exported, so
  `shadcn add` behaves exactly as before — but each value now resolves to a step
  on the Geist scale instead of a hand-picked literal. New projects inherit
  Verno's palette out of the box.
- d9b8d8a: Harden the Ultracite integration against upstream drift. `verno update` no longer writes config files importing `ultracite/presets/*` — subpaths that stopped resolving in Ultracite 7.8 — and instead delegates regeneration to `ultracite init`, so the emitted config always matches the installed Ultracite. Configs using the current `ultracite/oxlint/*` / `ultracite/oxfmt` layout are now recognized as canonical, and old `ultracite/presets/*` configs are flagged as outdated and regenerated. The CLI also stops executing `ultracite@latest`: the executed version is pinned to the dependency catalog (`^7.8.0`), which is now the single source for the expected version everywhere, and new contract tests fail CI if a future Ultracite version adds or removes framework presets Verno does not map. `--frameworks` now accepts ids Verno does not know: known ids are still checked up front, unknown ones pass through to `ultracite init` with a warning, so frameworks Ultracite adds within the pinned range work from the flag on day one.
- 5315045: `verno init` is now non-destructive on existing projects: it preserves the root `start` script, no longer overwrites an existing `turbo.json` or `apps/web/package.json` (warns and skips instead), generates a self-contained `turbo.json` (removing the broken `@vernostudio/turborepo-utils` extends reference), and leaves a real `vite.config.ts` untouched during the shadcn bootstrap.
- 5f8d2df: Scaffold a theme provider that only imports what the project is guaranteed to
  have. It wrapped children in `TooltipProvider` and rendered a `<Toaster />`,
  both from `@/components/ui/*` — files that do not exist until `shadcn add` has
  written them, so anything that skipped or interrupted that step left the app
  failing to compile on its own provider. It now imports `next-themes` and
  nothing else, with a comment on where to add the other two back.

  `sonner` leaves the dependency catalog with them: `shadcn add sonner` installs
  its own copy, so pre-installing it only pinned a version nothing imported.

- 5b9bac5: Telemetry is now anonymous by default: the CLI no longer collects git email/name (a persisted random UUID is the only distinct ID), exception stack traces are redacted (home directory replaced with `~`) and capped at 4000 characters, and telemetry is sent after the final command output so it never delays completion. The opt-out remains `DO_NOT_TRACK=1` or `VERNO_TELEMETRY_DISABLED=1`.
- 5f8d2df: Typecheck generated projects with TypeScript 7 instead of the native preview.
  The preview package existed to provide `tsgo` while the native compiler was
  still separate; TypeScript 7 is that compiler, so the scaffolded script is
  `tsc --noEmit` again and `@typescript/native-preview` is gone from the
  dependency catalog.
- eaaf289: Build the CLI with the TypeScript 7 toolchain. The published package no longer ships an unused empty `dist/index.d.mts` stub (the CLI exposes a binary, not a typed API); runtime behavior is unchanged.
- 5f8d2df: Point scaffolded projects at the Verno Studio component registry. Both
  `components.json` templates now ship a `registries` block for `@vernostudio`, so
  `shadcn add @vernostudio/copy-button` works in a fresh project without any setup.
  Because `shadcn apply` rewrites `components.json` during scaffolding, the block
  is re-applied afterwards — the same treatment the base CSS layer already gets —
  and only namespaces that are missing are added, so a project that repointed
  `@vernostudio` at a fork keeps its own value. `verno doctor` now reports a
  project whose `components.json` has no Verno registry configured.

## 0.1.6

### Patch Changes

- 33f2a3d: Report unexpected errors to PostHog via existing telemetry infra
- 6c21a96: Refresh generated project README with a minimal ASCII structure tree, scoped links, and a package-manager-aware dev command
- fe40a21: Add `--frameworks` support for Ultracite init: interactive multiselect in create/init wizards, `react next` defaults in `-y` mode, and manifest persistence for selected preset extends

## 0.1.5

### Patch Changes

- 95c3d2f: Refactor telemetry tracking to proxy events through the web server, securing the PostHog API key.

## 0.1.4

### Patch Changes

- d3649fa: Add the `doctor` command to audit, verify, and autofix a Verno Studio project's health and configuration.
- c557e5d: Add the `update` command to detect outdated configuration, dependencies, and styles, then apply updates with a diff-like preview.
- 61e2cda: Optimize CLI startup performance by dynamically importing command handlers and options parsers on demand.
- 1b10598: Replace the CLI process runner's direct `execa` dependency with Node.js native `child_process` APIs.
- 32a913e: Add usage tracking with PostHog for core CLI commands and show an opt-out notice on startup. Telemetry collects git identity (email and name) when available, falling back to a persistent anonymous UUID. Opt out by setting `DO_NOT_TRACK=1` or `VERNO_TELEMETRY_DISABLED=1`.

## 0.1.3

### Patch Changes

- d7467b8: Add `verno init` to configure existing projects with optional Turborepo, shadcn, and Ultracite (interactive and `-y` mode)
- 97d1113: Refactor create and init commands to share manifest, post-scaffold, and post-setup pipeline modules (no user-facing behavior change).

## 0.1.2

### Patch Changes

- edd8acb: Unify shadcn initialization across all project types (Single App and Turborepo) to use `shadcn apply` with a pre-scaffolded `components.json`. This fixes framework detection issues in custom packages by using a temporary configuration file during execution.

## 0.1.1

### Patch Changes

- 8d9d7c8: Remove `@vernostudio/template-generator` from published runtime dependencies. It remains bundled at build time; `@vernostudio/template-generator` stays a devDependency for local development.

## 0.1.0

### Minor Changes

- d25d31a: Add the create command for scaffolding Verno projects, including Next.js and Turborepo project generation.

### Patch Changes

- 50a97f9: Update dependencies
