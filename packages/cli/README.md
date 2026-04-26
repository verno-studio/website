# @verno/cli

Scaffold **Next.js** and **Turborepo** starters, then run **shadcn** and **Ultracite** using their official CLIs.

Interactive `create` uses [**Clack** (`@clack/prompts`)](https://www.clack.cc/) for prompts; pass **`-y` / `--yes`** for a non-interactive, flag-driven flow (CI and scripts).

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
bun packages/cli/src/index.ts create my-app -y -T next-app
bun packages/cli/src/index.ts create my-monorepo -y -T next-turborepo
```

After `bun run build` in `packages/cli`:

```bash
node packages/cli/dist/index.mjs create my-app -y -T next-app
```

## Common flags

- `-y, --yes` — skip prompts; require project name in argv when used
- `-T, --template` — `next-app` | `next-turborepo`
- `-p, --package-manager` — `bun` | `pnpm` | `npm`
- `--ui shadcn|none` — run shadcn after install (default: shadcn)
- `--shadcn-preset` — e.g. `nova` (default: `nova`)
- `--no-install` — skip package install
- `--skip-shadcn` / `--skip-ultracite` — skip post steps
- `--no-git` — skip `git init`

## Flow

1. Write template files (see `@verno/template-generator`).
2. `install` (unless `--no-install`).
3. `shadcn` bootstrap (unless `--ui none` or `--skip-shadcn`): **`next-app`** runs `shadcn init`; **`next-turborepo`** runs `shadcn add button` in `packages/design-system` (pre-configured like this repo).
4. `ultracite` init (unless `--skip-ultracite`).
5. `git init` (unless `--no-git`).
