import { defineConfig, defineDocs } from "fumadocs-mdx/config";

/**
 * Long-form prose for a registry item, one file per slug. Everything else on a
 * component's page — install commands, dependencies, tokens, source — is derived
 * from the built registry JSON and is not written by hand, so this collection
 * holds only what a person actually writes.
 */
export const components = defineDocs({
  dir: "content/components",
});

export default defineConfig();
