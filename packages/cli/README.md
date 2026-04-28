# Verno Studio CLI

One command from zero to a **Next.js** app with optional **Turborepo**, workspace **packages**, **shadcn/ui**, and **Ultracite** — wired through the official CLIs.

Routing uses [**Commander**](https://github.com/tj/commander.js). Interactive `create` uses [**Clack** (`@clack/prompts`)](https://www.clack.cc/). Use **`-y` / `--yes`** for a non-interactive, flag-driven flow (CI and scripts).

```bash
verno create
```

From this monorepo (no build):

```bash
bun packages/cli/src/index.ts create
```

## What you get

### Instant project scaffolding from templates

Spin up a new project from the stack this repo ships. Pick add-ons, answer prompts, or pass **`--yes`**.

| Mode                   | What you get                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Next.js app**        | Single-app layout: Next.js + TypeScript, scoped as `@<scope>/…`                                                                |
| **+ Turborepo**        | Monorepo root with `apps/web` and optional `packages/*`                                                                        |
| **Workspace packages** | `typescript-config` and/or `design-system` (when Turborepo is on; interactive default is both)                                 |
| **shadcn**             | `shadcn init` (preset `nova` by default) + `shadcn add --all` — app root, or `packages/design-system` when that package exists |
| **Ultracite**          | `ultracite init` with linter **`oxlint`**, **`biome`**, or **`eslint`** (`ultracite init --linter`)                            |

Templates come from [`@verno/template-generator`](../template-generator/README.md). With **`--ui shadcn`**, the scaffold includes e.g. `components/providers/client` and `lib/fonts` (**`--ui none`** omits them).

### Non-interactive and dry runs

- **`-y` / `--yes`** — no prompts; project name is required (e.g. `verno create my-app -y`).
- **`--dry-run`** — prints the plan (stack, install, shadcn, Ultracite, git) without writing files or hooks.

### After create

The CLI can install deps, run shadcn and Ultracite, then **`git init`** with an initial Verno Studio commit. **`.verno/manifest.json`** records generation metadata.

---

## Installation

This package is **`"private": true`** in the workspace. Use it from the monorepo ([Local development](#local-development)) or `bun link` / workspaces. Global **`npm install -g`** is not part of this repo yet.

---

## Usage

Interactive (name, add-ons, packages, package manager, UI, install, git):

```bash
verno create
# or
bun packages/cli/src/index.ts create
```

Non-interactive Next app + Ultracite (with **`-y`**, omit **`--linter`** to default to **oxlint**):

```bash
verno create my-app -y --addons ultracite
```

Turborepo + Ultracite — non-interactive: if **`--packages`** is omitted with Turborepo, both workspace packages apply by default:

```bash
verno create my-monorepo -y --addons turborepo,ultracite
```

Dry run (plan only):

```bash
verno create my-app --dry-run
```

Skip hooks:

```bash
verno create my-app -y --addons ultracite --no-install --no-git
verno create my-app -y --skip-shadcn
verno create my-app -y --addons ultracite --skip-ultracite
```

After `bun run build` in `packages/cli`:

```bash
node packages/cli/dist/index.mjs create my-app -y --addons ultracite
```

With no argv, **`verno`** prints help and exits successfully.

---

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
  --skip-ultracite           Skip ultracite add-on and ultracite init

Install & git:
  --no-install               Skip dependency install
  --no-git                   Skip git init

Global:
  -v, --version              Show CLI version
  -h, --help                 Show help (verno --help; verno create --help for create flags)
```

**Bin:** `verno`, `@verno/cli`, `vernostudio` (`package.json` **`bin`**).

---

## What happens (flow)

1. **Scaffold** — template files via `@verno/template-generator`.
2. **Install** — skipped with **`--no-install`** or if declined in the wizard.
3. **shadcn** — `init` + `add --all` unless **`--ui none`** or **`--skip-shadcn`**.
4. **globals.css** — Verno appends a base layer under `app/globals.css` or `apps/web/app/globals.css` after shadcn.
5. **Ultracite** — `ultracite init` if the add-on is on and not **`--skip-ultracite`**. Interactive: quiet init, then Ultracite’s TUI. **`-y`**: quiet init only; Ultracite may still prompt for frameworks, editors, or hooks.
6. **Manifest** — **`.verno/manifest.json`**.
7. **Git** — initial commit unless **`--no-git`**.

---

## Generated project commands

Scripts come from the generated `package.json` (single app vs Turborepo root).

**Next app** (standalone uses the project name; monorepo uses `apps/web`):

| Script      | Command                                          |
| ----------- | ------------------------------------------------ |
| `dev`       | `next dev` (with **`--port 3000`** in monorepos) |
| `build`     | `next build`                                     |
| `start`     | `next start`                                     |
| `typecheck` | `next typegen && tsgo --noEmit`                  |

**Turborepo root**:

| Script      | Command               |
| ----------- | --------------------- |
| `dev`       | `turbo run dev`       |
| `build`     | `turbo run build`     |
| `typecheck` | `turbo run typecheck` |

**Design system** (if present): `typecheck` → `tsgo --noEmit`.

Use your package runner (`bun run dev`, `pnpm run dev`, `npm run dev`, etc.).

If Ultracite ran, use the scripts it added (e.g. `bun x ultracite check`, `bun x ultracite fix`) from the generated `package.json`.

---

## Local development

Build (**tsdown**); entry is **`dist/index.mjs`** (shebang `node`):

```bash
cd packages/cli && bun run build
```

- Without build: `bun packages/cli/src/index.ts create …`
- After build: `bunx verno` when linked, or `node packages/cli/dist/index.mjs create …`

`package.json` scripts: `build`, `dev` (watch), `test`, `typecheck`.

---

## License

See the repository root license.
