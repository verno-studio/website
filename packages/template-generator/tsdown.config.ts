import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.ts", "src/fs-writer.ts", "src/template-reader.ts"],
  format: ["esm"],
  outDir: "dist",
});
