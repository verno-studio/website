import { isMonorepo } from "../config";
import type { ProjectConfig } from "../config";
import type { VirtualFileSystem } from "../core/virtual-fs";

/** The shadcn scaffolding is embedded unconditionally; drop it when shadcn is off. */
export const pruneShadcnUiFiles = (vfs: VirtualFileSystem, config: ProjectConfig): void => {
  if (config.ui === "shadcn") {
    return;
  }

  const appPrefix = isMonorepo(config) ? "apps/web/" : "";
  vfs.deleteFile(`${appPrefix}components/providers/client.tsx`);
  vfs.deleteFile(`${appPrefix}lib/fonts.ts`);
  vfs.deleteFile(`${appPrefix}lib/utils.ts`);
};
