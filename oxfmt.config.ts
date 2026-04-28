import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  extends: [ultracite],
  ignorePatterns: [
    "packages/design-system/components/ui",
    "packages/design-system/components/dot-matrix",
    "packages/template-generator/src/templates.generated.ts",
    "packages/template-generator/templates/**/*.hbs",
  ],
});
