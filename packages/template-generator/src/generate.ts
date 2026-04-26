import type { ProjectConfig } from "./config";
import { applyDependencyCatalog } from "./processors/apply-catalog";
import { buildNextAppTree } from "./templates/next-app";
import { buildNextTurborepoTree } from "./templates/next-turborepo";
import { writeFileTree } from "./write";

export const generateProject = async (
  config: ProjectConfig,
): Promise<{ readonly filesWritten: readonly string[] }> => {
  const base =
    config.template === "next-app" ? buildNextAppTree(config) : buildNextTurborepoTree(config);
  const tree = applyDependencyCatalog(base, config);
  const filesWritten = await writeFileTree(config.projectDir, tree);
  return { filesWritten };
};
