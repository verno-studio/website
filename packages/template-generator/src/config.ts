export type TemplateId = "next-app" | "next-turborepo";

export type PackageManager = "bun" | "pnpm" | "npm";

export interface ProjectConfig {
  readonly projectName: string;
  readonly template: TemplateId;
  readonly packageManager: PackageManager;
  readonly npmScope: string;
  readonly shadcnPreset?: string;
}

export const defaultNpmScopeFromProjectName = (projectName: string): string => {
  const slug = projectName
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-|-$/g, "");
  if (slug.length > 0) {
    return slug;
  }
  return "app";
};
