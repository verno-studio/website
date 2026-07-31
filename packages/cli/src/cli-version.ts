import { readFileSync } from "node:fs";
import path from "node:path";

export const readCliPackageVersion = (): string => {
  try {
    const pkgPath = path.join(import.meta.dirname, "..", "package.json");
    const parsed = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version?: string };
    return parsed.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
};
