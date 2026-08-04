import { defineConfig, defineDocs } from "fumadocs-mdx/config";

import { codeThemes } from "./lib/code-theme";

export const components = defineDocs({
  dir: "content/components",
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: { themes: codeThemes },
  },
});
