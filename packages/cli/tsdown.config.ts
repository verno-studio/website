import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  deps: {
    alwaysBundle: ["@vernostudio/template-generator"],
    onlyBundle: ["better-result", "handlebars", "source-map"],
  },
  // The CLI ships a binary, not a typed API (exports declare no types), and
  // under TypeScript 7 the dts pass leaks .d.ts files into the bundled
  // template-generator's src/.
  dts: false,
  entry: ["src/index.ts"],
  format: ["esm"],
  outDir: "dist",
  outputOptions: {
    banner: "#!/usr/bin/env node",
  },
  shims: true,
});
