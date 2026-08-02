import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { type RegistryItem, registryItemSchema } from "@/lib/registry-schema";

// The same JSON `shadcn add` downloads. Reading the built output rather than the
// source tree is the point: the code shown on a component's page is the code the
// install writes, byte for byte, so the docs cannot describe something the
// registry does not ship.
const candidateDirs = [
  path.join(process.cwd(), "public", "r"),
  path.join(process.cwd(), "apps", "web", "public", "r"),
];

const readRegistryDir = (): { dir: string; files: string[] } => {
  for (const dir of candidateDirs) {
    try {
      const files = readdirSync(dir).filter((file) => file.endsWith(".json"));
      if (files.length > 0) {
        return { dir, files };
      }
    } catch {
      // try next
    }
  }
  throw new Error(
    "No built registry found. Run `bun run registry:build` to generate apps/web/public/r.",
  );
};

const readItems = (): RegistryItem[] => {
  const { dir, files } = readRegistryDir();
  const items: RegistryItem[] = [];

  for (const file of files) {
    const parsed = registryItemSchema.safeParse(
      JSON.parse(readFileSync(path.join(dir, file), "utf-8")),
    );
    // `shadcn build` may drop an index alongside the items; anything that is not
    // shaped like an item is not one, and is skipped rather than crashing docs.
    if (parsed.success) {
      items.push(parsed.data);
    }
  }

  return items.sort((a, b) => a.name.localeCompare(b.name));
};

let cached: RegistryItem[] | null = null;

export const getRegistryItems = (): RegistryItem[] => {
  if (!cached) {
    cached = readItems();
  }
  return cached;
};

export const getRegistryItem = (name: string): RegistryItem | undefined =>
  getRegistryItems().find((item) => item.name === name);

export const registryNamespace = "@vernostudio";

export const installCommand = (name: string) =>
  `bunx shadcn@latest add ${registryNamespace}/${name}`;

export const installUrlCommand = (name: string) =>
  `bunx shadcn@latest add https://verno-studio.vercel.app/r/${name}.json`;

export interface RegistryItemSummary {
  name: string;
  title: string;
  description: string;
  fileCount: number;
  searchText: string;
}

export const getRegistryItemSummary = (item: RegistryItem): RegistryItemSummary => {
  const title = item.title ?? item.name;
  const description = item.description ?? "";

  return {
    description,
    fileCount: item.files.length,
    name: item.name,
    searchText: `${item.name} ${title} ${description}`.toLowerCase(),
    title,
  };
};
