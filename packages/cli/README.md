# Verno Studio CLI

One command from zero to a **Next.js** app with optional **Turborepo**, workspace **packages**, **shadcn/ui**, and **Ultracite** — wired through the official CLIs.

![Package Downloads](https://shieldcn.dev/npm/dy/@vernostudio/cli)
![Package Version](https://shieldcn.dev/npm/v/@vernostudio/cli)
![Package License](https://shieldcn.dev/github/license/verno-studio/website)

## Quick Start

```bash
verno create
```

From the published package:

```bash
bun x @vernostudio/cli create
```

## What you get

### Instant project scaffolding from templates

Spin up a new project from the stack this repo ships. Pick add-ons, answer prompts, or pass **`--yes`**.

| Mode                   | What you get                                                                                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js app**        | Single-app layout: Next.js + TypeScript, scoped as `@<scope>/…`                                                                                     |
| **Turborepo**          | Monorepo root with `apps/web` and optional `packages/*`                                                                                             |
| **Workspace packages** | `typescript-config` and/or `design-system` (when Turborepo is on; interactive default is both)                                                      |
| **shadcn**             | `shadcn init` (preset `nova` by default) + `shadcn add --all` — app root, or `packages/design-system` when that package exists                      |
| **Ultracite**          | `ultracite init` with linter **`oxlint`**, **`biome`**, or **`eslint`** and frameworks such as **`react`**, **`next`** (`--linter`, `--frameworks`) |

### Non-interactive and dry runs

- **`-y` / `--yes`** — no prompts; project name is required (e.g. `verno create my-app -y`).
- **`--dry-run`** — prints the plan (stack, install, shadcn, Ultracite, git) without writing files or hooks.
- Project names may contain **letters, numbers, and hyphens** only — the name becomes the directory and the npm package name.

### After create

The CLI can install deps, run shadcn and Ultracite, then **`git init`** with an initial Verno Studio commit. **`.verno/manifest.json`** records generation metadata that `verno doctor` and `verno update` use later.

## Commands

### `verno create [project-name]`

```sh
verno create [project-name] [flags]

Arguments:
  [project-name]             Project directory (required with -y, --yes;
                             letters, numbers, and hyphens only)

Mode:
  -y, --yes                  Non-interactive (requires project name)
  --dry-run                  Print plan only; no files or hooks

Frontend:
  --frontend <id>            next (default)

Add-ons:
  --addons <list>            Comma-separated: turborepo, ultracite

Workspace (with turborepo):
  --packages <list>          Comma-separated: typescript-config, design-system
                             (requires turborepo; with -y, defaults to both if omitted)

Tooling:
  -p, --package-manager <pm> bun | pnpm | npm (default with -y: bun)

UI & shadcn:
  --ui <mode>                shadcn | none
  --shadcn-preset <name>     Preset for shadcn init (default: nova)
  --skip-shadcn              Skip shadcn bootstrap

Ultracite:
  --linter <id>              biome | oxlint | eslint (needs ultracite in --addons; -y defaults oxlint)
  --frameworks <list>        react, next, solid, vue, ... (needs ultracite; -y defaults react,next).
                             Ids Verno does not recognize are passed through to
                             `ultracite init` with a warning, so new Ultracite
                             presets work without waiting for a CLI release.
  --skip-ultracite           Skip ultracite add-on and ultracite init

Install & git:
  --no-install               Skip dependency install
  --no-git                   Skip git init
```

### `verno init`

Add Verno add-ons to an **existing** project. Selecting `turborepo` on a single-app project restructures it into a monorepo layout (`apps/web/`, `packages/`) — existing `turbo.json` or `apps/web/package.json` files are never overwritten, and your scripts are preserved.

```sh
verno init [flags]

  --addons <list>            Comma-separated: turborepo, ultracite
  --ui <mode>                shadcn | none
  --shadcn-preset <name>     shadcn preset (e.g. nova)
  --linter <id>              biome | oxlint | eslint (ultracite add-on)
  --frameworks <list>        Ultracite preset extends (unknown ids pass through)
  -p, --package-manager <pm> bun | pnpm | npm
  -y, --yes                  Non-interactive mode
  --dry-run                  Print the plan without writing files
  --no-install               Skip dependency install
  --skip-shadcn              Skip shadcn bootstrap
  --skip-ultracite           Skip ultracite add-on
```

### `verno doctor`

Audit a Verno project's health: package manager and lockfile consistency, `.verno/manifest.json`, shadcn config, workspace layout, and Ultracite setup.

```sh
verno doctor [flags]

  --fix                      Attempt to fix autofixable issues
  -y, --yes                  Apply fixes without prompting
  -p, --package-manager <pm> Override package manager for dependency operations
```

### `verno update`

Bring a generated project up to date with the current CLI: manifest version, Ultracite dependency and config files (regenerated via `ultracite init`, so they always match the installed Ultracite), and the Verno base CSS layer. Customized config files are detected and left untouched.

```sh
verno update [flags]

  --dry-run                  Preview changes without applying them
  -y, --yes                  Apply updates without prompting
  --no-install               Skip dependency install
  -p, --package-manager <pm> Override package manager for dependency operations
```

### Global

```sh
  -v, --version              Show CLI version
  -h, --help                 Show help (verno --help; verno <command> --help for command flags)
```

## Telemetry

The CLI collects **anonymous** usage data: which command ran, the options chosen (add-ons, linter, package manager), CLI version, Node version, and platform. The identifier is a random UUID stored at `~/.config/verno/anonymous-id` — no git identity, email, or file contents are collected, and error reports have home-directory paths redacted.

Opt out any time:

```bash
DO_NOT_TRACK=1            # or
VERNO_TELEMETRY_DISABLED=1
```
