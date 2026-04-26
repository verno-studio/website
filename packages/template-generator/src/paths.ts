import { join } from "node:path";

export const scoped = (scope: string, name: string): string => `@${scope}/${name}`;

export type FileTree = Readonly<Record<string, string>>;

export const mergeFileTrees = (base: FileTree, ...rest: FileTree[]): FileTree => {
  const out: Record<string, string> = { ...base };
  for (const t of rest) {
    Object.assign(out, t);
  }
  return out;
};

export const resolveUnderRoot = (root: string, relativePosix: string): string =>
  join(root, ...relativePosix.split("/").filter((s) => s.length > 0));
