import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { RegistryItem } from "@/lib/registry-schema";
import { registryItemSchema } from "@/lib/registry-schema";

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

  return items.toSorted((a, b) => a.name.localeCompare(b.name));
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

const displayTitle = (item: RegistryItem) => item.title ?? item.name;

const paginationEntry = (item: RegistryItem | undefined) =>
  item ? { href: `/components/${item.name}`, title: displayTitle(item) } : undefined;

export const getRegistrySiblings = (name: string) => {
  const items = getRegistryItems();
  const index = items.findIndex((item) => item.name === name);

  // The ends of the list have no sibling, and the index is already one click
  // away up in the back link. Leave the slot empty rather than filling it.
  return {
    next: paginationEntry(items[index + 1]),
    previous: paginationEntry(items[index - 1]),
  };
};

const registryNamespace = "@vernostudio";

export const installCommand = (name: string) =>
  `bunx shadcn@latest add ${registryNamespace}/${name}`;

export const installUrlCommand = (name: string) =>
  `bunx shadcn@latest add https://verno-studio.vercel.app/r/${name}.json`;

export interface RegistryItemSummary {
  name: string;
  title: string;
  description: string;
  searchText: string;
}

export const getRegistryItemSummary = (item: RegistryItem): RegistryItemSummary => {
  const title = displayTitle(item);
  const description = item.description ?? "";

  return {
    description,
    name: item.name,
    searchText: `${item.name} ${title} ${description}`.toLowerCase(),
    title,
  };
};
