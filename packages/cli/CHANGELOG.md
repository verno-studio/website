# @vernostudio/cli

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
