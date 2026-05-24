import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bench, group, run } from "mitata";
import {
  detectPackageJson,
  detectShadcn,
  detectUltracite,
  detectMonorepo,
  detectPackageManager,
  detectProjectState,
} from "../src/commands/init/detect";

const makeTmpDir = (files: Record<string, string> = {}): string => {
  const dir = join(tmpdir(), `verno-bench-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    const filePath = join(dir, name);
    mkdirSync(join(filePath, ".."), { recursive: true });
    writeFileSync(filePath, content);
  }
  return dir;
};

const dirs: string[] = [];
const tmpDir = (files: Record<string, string> = {}): string => {
  const dir = makeTmpDir(files);
  dirs.push(dir);
  return dir;
};

const cleanup = () => {
  for (const dir of dirs) {
    try {
      rmSync(dir, { force: true, recursive: true });
    } catch {
      // ignore
    }
  }
};

const emptyDir = tmpDir();
const pkgJsonDir = tmpDir({
  "package.json": JSON.stringify({ name: "test-app", packageManager: "bun@1.0.0" }),
});
const shadcnDir = tmpDir({ "components.json": "{}" });
const ultraciteDir = tmpDir({ "oxlint.config.ts": "import ultracite from 'ultracite';" });
const monorepoDir = tmpDir({ "turbo.json": "{}" });

group("detectPackageJson", () => {
  bench("empty directory", () => {
    detectPackageJson(emptyDir);
  });
  bench("with package.json", () => {
    detectPackageJson(pkgJsonDir);
  });
});

group("detectShadcn", () => {
  bench("no components.json", () => {
    detectShadcn(emptyDir, false);
  });
  bench("with components.json", () => {
    detectShadcn(shadcnDir, false);
  });
});

group("detectUltracite", () => {
  bench("no config files", () => {
    detectUltracite(emptyDir);
  });
  bench("with oxlint.config.ts", () => {
    detectUltracite(ultraciteDir);
  });
});

group("detectMonorepo", () => {
  bench("non-monorepo", () => {
    detectMonorepo(emptyDir);
  });
  bench("with turbo.json", () => {
    detectMonorepo(monorepoDir);
  });
});

group("detectPackageManager", () => {
  bench("no package.json or lockfile", () => {
    detectPackageManager(emptyDir);
  });
  bench("with package.json containing packageManager", () => {
    detectPackageManager(pkgJsonDir);
  });
});

group("detectProjectState", () => {
  bench("empty directory", () => {
    detectProjectState(emptyDir);
  });
  bench("with package.json and turbo.json", () => {
    const fullDir = tmpDir({
      "components.json": "{}",
      "package.json": JSON.stringify({ name: "full-app", packageManager: "bun@1.0.0" }),
      "turbo.json": "{}",
    });
    detectProjectState(fullDir);
  });
});

await run();

cleanup();
