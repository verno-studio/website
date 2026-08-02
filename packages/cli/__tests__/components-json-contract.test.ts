import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getRegistries, TOOLING } from "@vernostudio/template-generator";
import { ensureComponentsJsonRegistriesContent } from "../src/components-json";

const templatePath = (...segments: string[]): string =>
  path.join(import.meta.dir, "..", "..", "template-generator", "templates", ...segments);

const TEMPLATES = [
  templatePath("packages", "design-system", "components.json"),
  templatePath("frontends", "next", "components.json"),
];

describe("components.json registries contract", () => {
  test("both scaffolded configs already point at the registry", () => {
    for (const file of TEMPLATES) {
      const config = JSON.parse(readFileSync(file, "utf-8"));
      expect(config.registries[TOOLING.registryNamespace]).toBe(TOOLING.registryUrl);
    }
  });

  test("restores the namespace shadcn apply stripped", () => {
    const stripped = JSON.stringify({ registries: {}, style: "radix-nova" }, null, 2);

    const restored = JSON.parse(ensureComponentsJsonRegistriesContent(stripped));

    expect(restored.registries).toEqual(getRegistries());
    expect(restored.style).toBe("radix-nova");
  });

  test("adds the block when shadcn dropped the key entirely", () => {
    const restored = JSON.parse(ensureComponentsJsonRegistriesContent('{"tsx": true}'));

    expect(restored.registries).toEqual(getRegistries());
  });

  test("leaves a repointed namespace alone", () => {
    const forked = JSON.stringify(
      { registries: { [TOOLING.registryNamespace]: "https://example.test/r/{name}.json" } },
      null,
      2,
    );

    expect(ensureComponentsJsonRegistriesContent(forked)).toBe(forked);
  });

  test("keeps registries a user added of their own", () => {
    const withOther = JSON.stringify({ registries: { "@acme": "https://acme.test/{name}.json" } });

    const restored = JSON.parse(ensureComponentsJsonRegistriesContent(withOther));

    expect(restored.registries["@acme"]).toBe("https://acme.test/{name}.json");
    expect(restored.registries[TOOLING.registryNamespace]).toBe(TOOLING.registryUrl);
  });
});
