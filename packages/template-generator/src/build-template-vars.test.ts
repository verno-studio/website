import { describe, expect, test } from "bun:test";
import { componentsStyleFromShadcnPreset, DEFAULT_COMPONENTS_STYLE } from "./build-template-vars";

describe("componentsStyleFromShadcnPreset", () => {
  test("maps known named presets", () => {
    expect(componentsStyleFromShadcnPreset("lyra")).toBe("radix-lyra");
    expect(componentsStyleFromShadcnPreset("Lyra")).toBe("radix-lyra");
    expect(componentsStyleFromShadcnPreset("nova")).toBe("radix-nova");
  });

  test("returns default for preset codes and unknown strings", () => {
    expect(componentsStyleFromShadcnPreset("a2r6bw")).toBe(DEFAULT_COMPONENTS_STYLE);
    expect(componentsStyleFromShadcnPreset("unknown-xyz")).toBe(DEFAULT_COMPONENTS_STYLE);
  });

  test("passes through radix- prefix", () => {
    expect(componentsStyleFromShadcnPreset("radix-custom")).toBe("radix-custom");
  });
});
