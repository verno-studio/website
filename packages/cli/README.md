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

### After create

The CLI can install deps, run shadcn and Ultracite, then **`git init`** with an initial Verno Studio commit. **`.verno/manifest.json`** records generation metadata.

## All flags

```sh
verno create [project-name] [flags]

Arguments:
  [project-name]             Project directory (required with -y, --yes)

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
  --linter <id>              biome | oxlint | eslint (needs ultracite in --addons; -y defaults to oxlint)
  --frameworks <list>        react, next, solid, vue, ... (needs ultracite; -y defaults react,next)
  --skip-ultracite           Skip ultracite add-on and ultracite init

Install & git:
  --no-install               Skip dependency install
  --no-git                   Skip git init

Global:
  -v, --version              Show CLI version
  -h, --help                 Show help (verno --help; verno create --help for create flags)
```
