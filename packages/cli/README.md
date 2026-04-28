# @verno/cli

Scaffold **composable Next.js** projects (optional **Turborepo**, workspace **packages**, **Ultracite**), then run **shadcn** and **Ultracite** using their official CLIs.

Routing uses [**Commander**](https://github.com/tj/commander.js). Interactive `create` uses [**Clack** (`@clack/prompts`)](https://www.clack.cc/) for prompts; pass **`-y` / `--yes`** for a non-interactive, flag-driven flow (CI and scripts).

## Build (tsdown)

The published binary is the Rolldown/ESM bundle in **`dist/index.mjs`** (shebang `node`). Build before relying on the `verno` entry from this package (for example in CI or `bunx verno` from the workspace link):

```bash
cd packages/cli && bun run build
```

- **No build:** you can still run the TypeScript source with Bun: `bun packages/cli/src/index.ts create …`
- **After build:** `bunx verno` (from the monorepo root) or `node packages/cli/dist/index.mjs create …`

## Usage (from the monorepo)

```bash
bun packages/cli/src/index.ts create
bun packages/cli/src/index.ts create my-app -y --addons ultracite
bun packages/cli/src/index.ts create my-monorepo -y --addons turborepo,ultracite
```

After `bun run build` in `packages/cli`:

```bash
node packages/cli/dist/index.mjs create my-app -y --addons ultracite
```

## Common flags

- `-y, --yes` — skip prompts; require project name when used
- `--frontend` — `next` (default)
- `--addons` — comma-separated: `turborepo`, `ultracite`
- `--packages` — comma-separated workspace packages when using turborepo: `typescript-config`, `design-system` (defaults to both when `--packages` is omitted)
- `--code-quality` — `biome` | `oxlint-oxfmt` | `eslint-prettier` (with **ultracite**; default with `-y`: `oxlint-oxfmt`)
- `-p, --package-manager` — `bun` | `pnpm` | `npm`
- `--ui shadcn|none` — run shadcn after install (default: shadcn)
- `--shadcn-preset` — e.g. `nova` (default: `nova`)
- `--no-install` — skip package install
- `--skip-shadcn` / `--skip-ultracite` — skip shadcn or omit ultracite (and its init)
- `--no-git` — skip `git init`
- `--dry-run` — print the plan only (no files written, no hooks)

## Flow

1. Write template files (see `@verno/template-generator`).
2. `install` (unless `--no-install`).
3. `shadcn` bootstrap (unless `--ui none` or `--skip-shadcn`): app root, or `packages/design-system` when that workspace package exists.
4. `ultracite` init (when **ultracite** is in `--addons` and not `--skip-ultracite`).
5. `git init` (unless `--no-git`).
