# @verno/template-generator

File-tree generator for Verno CLI templates (`next-app`, `next-turborepo`). Templates live in `templates/`; `src/templates.generated.ts` is built by `bun run generate:templates` (not edited by hand). The CLI runs shadcn and Ultracite after scaffold.

## API

```ts
import { generate, writeTree } from "@verno/template-generator";

const { tree, fileCount } = generate({
  projectName: "my-app",
  projectDir: "/abs/path/my-app",
  template: "next-app",
  packageManager: "bun",
  npmScope: "myapp",
});

await writeTree("/abs/path/my-app", tree);
```

`npmScope` is used for internal package names (e.g. `@myapp/design-system`).

## Development

Regenerate the template registry when files under `templates/` change, then typecheck and test:

```bash
bun run generate:templates
bun run typecheck
bun test
```

## Tests

```bash
bun test
```
