import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  deps: {
    alwaysBundle: ["@vernostudio/template-generator"],
    onlyBundle: ["better-result", "handlebars", "source-map"],
  },
  dts: true,
  entry: ["src/index.ts"],
  format: ["esm"],
  outDir: "dist",
  outputOptions: {
    banner: "#!/usr/bin/env node",
  },
  shims: true,
});
