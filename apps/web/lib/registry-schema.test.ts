import { describe, expect, test } from "bun:test";

import { registryItemSchema } from "@/lib/registry-schema";

describe("registryItemSchema", () => {
  test("parses a built item and keeps the inlined file content the docs render", () => {
    const result = registryItemSchema.safeParse({
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      description: "A button that copies a string.",
      files: [
        {
          content: "export const CopyButton = () => null;\n",
          path: "components/copy-button.tsx",
          type: "registry:ui",
        },
      ],
      name: "copy-button",
      registryDependencies: ["https://verno-studio.vercel.app/r/utils.json"],
      title: "Copy Button",
      type: "registry:ui",
    });

    expect(result.success).toBe(true);
    expect(result.data?.files[0]?.content).toContain("CopyButton");
  });

  test("parses a theme item, which carries css variables and no files", () => {
    const result = registryItemSchema.safeParse({
      cssVars: {
        dark: { background: "oklch(0 0 0)" },
        light: { background: "oklch(1 0 0)" },
        theme: { "color-background": "var(--background)" },
      },
      name: "theme",
      type: "registry:theme",
    });

    expect(result.success).toBe(true);
    // `files` is absent on a theme item; the docs iterate it unconditionally.
    expect(result.data?.files).toEqual([]);
  });

  test("rejects an item with no name, so a malformed file cannot become a route", () => {
    const result = registryItemSchema.safeParse({ type: "registry:ui" });

    expect(result.success).toBe(false);
  });
});
