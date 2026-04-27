# @verno/template-generator

Virtual file-tree generator for Verno CLI templates. Template sources live under [`templates/`](templates/); embedded maps in [`src/templates.generated.ts`](src/templates.generated.ts) are produced by `bun run generate:templates` (do not edit by hand).

Layout follows a Better T Stack–style **layered** model: `shared/`, stack roots (`next-app/`, `next-turborepo/`), and package slices `packages/design-system/` and `packages/typescript-config/` (Verno names; analogous to UI + config packages elsewhere).

### Extending (new slices, auth, database)

1. **Layers** — Edit [`src/layers/registry.ts`](src/layers/registry.ts):
   - Add a `LayerDefinition` to `LAYERS` (`stack-root` for files merged to the repo root, `preserve-path` for `packages/...` or other prefixed trees).
   - Add the layer id to `TEMPLATE_LAYER_STACKS` for each `TemplateId` that should include it (order matters: later entries win on path clashes).
2. **On disk** — Create `templates/<layerId>/` with the files to embed.
3. **Regenerate** — `bun run generate:templates` (the script reads `LAYERS` and `toLayerOutputKey` from the registry).
4. **Post-processing** — For dependency or config rewrites, add a `(tree, config) => tree` function and append it to `defaultPostProcessors` in [`src/processors/index.ts`](src/processors/index.ts) (see `runPostProcessPipeline`).

## API

```ts
import { generate, writeTree } from "@verno/template-generator";

const tree = generate({
  config: {
    projectName: "my-app",
    template: "next-app",
    packageManager: "bun",
    npmScope: "myapp",
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
