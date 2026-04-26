# @verno/template-generator

Pure file-tree generator for Verno CLI templates (`next-app`, `next-turborepo`). No shadcn or Ultracite runs here — the CLI runs those after scaffold.

## API

```ts
import { generateProject } from "@verno/template-generator";

await generateProject({
  projectName: "my-app",
  projectDir: "/abs/path/my-app",
  template: "next-app",
  packageManager: "bun",
  npmScope: "myapp",
});
```

`npmScope` is used for internal package names (e.g. `@myapp/design-system`).

## Tests

```bash
bun test
```
