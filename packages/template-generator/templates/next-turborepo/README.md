# {{projectName}}

Turborepo + Next.js (Verno `next-turborepo`).

Packages: `{{dsName}}`, `{{tsConfigName}}`.

Post-create (if skipped during `verno create`): `shadcn` and `ultracite` via `@verno/cli`.

To switch the shadcn design-system preset later, from the repo root:

`cd packages/design-system && <package runner> shadcn@latest apply --preset <code>`

Example (pnpm): `cd packages/design-system && pnpm dlx shadcn@latest apply --preset <code>`
