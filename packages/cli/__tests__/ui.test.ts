import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { formatVernoBanner, renderVernoTitle, VERNO_TITLE_SIMPLE } from "../src/ui";

describe("formatVernoBanner", () => {
  let originalIsTTY: boolean | undefined;
  let originalNoColor: string | undefined;

  beforeEach(() => {
    originalIsTTY = process.stdout.isTTY;
    originalNoColor = process.env.NO_COLOR;
  });

  afterEach(() => {
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: originalIsTTY,
    });
    if (originalNoColor === undefined) {
      delete process.env.NO_COLOR;
    } else {
      process.env.NO_COLOR = originalNoColor;
    }
  });

  test("returns plain text when stdout is not a TTY", () => {
    Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: false });
    delete process.env.NO_COLOR;
    expect(formatVernoBanner(false)).toBe("verno");
  });

  test("returns plain text when plain output is requested", () => {
    Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: true });
    delete process.env.NO_COLOR;
    expect(formatVernoBanner(true)).toBe("verno");
  });

  test("returns plain text when NO_COLOR is set", () => {
    Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: true });
    process.env.NO_COLOR = "1";
    expect(formatVernoBanner(false)).toBe("verno");
  });

  test("returns colored multiline banner when TTY and color is allowed", () => {
    Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: true });
    delete process.env.NO_COLOR;
    const out = formatVernoBanner(false);
    expect(out).not.toBe("verno");
    expect(out).toContain("███████");
    expect(out.startsWith("\u001B[38;2;255;81;20m")).toBe(true);
  });
});

describe("renderVernoTitle", () => {
  let originalIsTTY: boolean | undefined;
  let originalNoColor: string | undefined;
  let originalColumns: number | undefined;
  let originalWrite: typeof process.stdout.write;
  const chunks: string[] = [];

  beforeEach(() => {
    originalIsTTY = process.stdout.isTTY;
    originalNoColor = process.env.NO_COLOR;
    originalColumns = process.stdout.columns;
    originalWrite = process.stdout.write.bind(process.stdout);
    chunks.length = 0;
    process.stdout.write = (chunk: string | Uint8Array) => {
      chunks.push(typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk));
      return true;
    };
  });

  afterEach(() => {
    process.stdout.write = originalWrite;
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: originalIsTTY,
    });
    if (originalColumns === undefined) {
      delete (process.stdout as { columns?: number }).columns;
    } else {
      Object.defineProperty(process.stdout, "columns", {
        configurable: true,
        value: originalColumns,
      });
    }
    if (originalNoColor === undefined) {
      delete process.env.NO_COLOR;
    } else {
      process.env.NO_COLOR = originalNoColor;
    }
  });

  test("writes nothing when color banner is disabled", () => {
    Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: false });
    delete process.env.NO_COLOR;
    Object.defineProperty(process.stdout, "columns", { configurable: true, value: 120 });
    renderVernoTitle(false);
    expect(chunks).toEqual([]);
  });

  test("writes full banner when the terminal is wide enough", () => {
    Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: true });
    delete process.env.NO_COLOR;
    Object.defineProperty(process.stdout, "columns", { configurable: true, value: 120 });
    renderVernoTitle(false);
    const out = chunks.join("");
    expect(out).toContain("███████");
    expect(out).toContain("██║   ██║");
  });

  test("writes a one-line title when the terminal is too narrow", () => {
    Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: true });
    delete process.env.NO_COLOR;
    Object.defineProperty(process.stdout, "columns", { configurable: true, value: 40 });
    renderVernoTitle(false);
    const out = chunks.join("");
    expect(out).toContain(VERNO_TITLE_SIMPLE);
    expect(out).not.toContain("██║   ██║");
  });
});
