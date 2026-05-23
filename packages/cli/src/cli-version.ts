import { readFileSync } from "node:fs";
import { join } from "node:path";

export const readCliPackageVersion = (): string => {
  try {
    const pkgPath = join(import.meta.dirname, "..", "package.json");
    const parsed = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version?: string };
    return parsed.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
};
