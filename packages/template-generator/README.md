# @verno/template-generator

Virtual file-tree generator for Verno CLI templates. Template sources live under [`templates/`](templates/); embedded maps in [`src/templates.generated.ts`](src/templates.generated.ts) are produced by `bun run generate:templates` (do not edit by hand).

Layout follows a Better T Stack–style **layered** model driven by composable project config:

- **`shared/`** — common root files (gitignore, editorconfig, README).
- **`frontends/next/`** — the Next.js app (merged to repo root, or to `apps/web/` when the **turborepo** add-on is enabled).
- **`addons/turborepo/`** — monorepo root (`turbo.json`, workspace `package.json`).
- **`packages/typescript-config`** / **`packages/design-system`** — included only when those workspace packages are selected (requires **turborepo**).

File bodies and optional path segments can use **Handlebars** (e.g. `{{projectName}}`, `{{#if turborepo}}…{{/if}}`). Sources may use a `.hbs` suffix; it is stripped in the emitted output path (e.g. `README.md.hbs` → `README.md`).

### Extending (new slices, auth, database)

1. **Layers** — Edit [`src/layers/registry.ts`](src/layers/registry.ts):
   - Add a `LayerDefinition` to `LAYERS` (`stack-root` for files merged to the repo root, `preserve-path` for `packages/...` or other prefixed trees).
   - Include the new layer id from [`resolveLayerStack`](src/layers/registry.ts) when the relevant add-on or package is selected (merge order: later layers win on path clashes).
2. **On disk** — Create `templates/<layerId>/` with the files to embed.
3. **Regenerate** — `bun run generate:templates` (the script reads `LAYERS` and `toLayerOutputKey` from the registry).
4. **Post-processing** — For dependency or config rewrites, add a `(vfs, config) => void` processor and append it to `defaultPostProcessors` in [`src/processors/index.ts`](src/processors/index.ts) (see `runPostProcessPipeline` and `applyDependencyCatalog`).

## API

```ts
import { generate, writeTree } from "@verno/template-generator";

const tree = generate({
  config: {
    projectName: "my-app",
    packageManager: "bun",
    npmScope: "myapp",
    frontend: "next",
    addons: ["ultracite"],
    packages: [],
    ui: "shadcn",
    shadcnPreset: "nova",
  },
}).unwrap();

const writeResult = await writeTree(tree, "/abs/path/my-app");
const paths = writeResult.unwrap();
```

`npmScope` is used for internal package names (e.g. `@myapp/design-system`).

Subpath exports (built output):

- `@verno/template-generator/fs-writer` — `writeTree` only
- `@verno/template-generator/template-reader` — `mergeTemplateLayers`, `EMBEDDED_BY_LAYER`, etc.

## Development

Regenerate embedded layers when files under `templates/` change, then typecheck and test:

```bash
bun run generate:templates
bun run typecheck
bun test
```

Build emits `dist/`:

```bash
bun run build
```

## Tests

```bash
bun test
```
