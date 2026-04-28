import { hasDesignSystem, isMonorepo } from "../config";
import type { ProjectConfig } from "../config";
import type { VirtualFileSystem } from "../core/virtual-fs";

/** Template embeds app + design-system copies; drop the branch that does not apply. */
export const pruneShadcnUiFiles = (vfs: VirtualFileSystem, config: ProjectConfig): void => {
  const appPrefix = isMonorepo(config) ? "apps/web/" : "";

  const removeApp = (): void => {
    vfs.deleteFile(`${appPrefix}components/providers/client.tsx`);
    vfs.deleteFile(`${appPrefix}lib/fonts.ts`);
    vfs.deleteFile(`${appPrefix}lib/utils.ts`);
  };

  const removeDesignSystem = (): void => {
    vfs.deleteFile("packages/design-system/components/providers/client.tsx");
    vfs.deleteFile("packages/design-system/lib/fonts.ts");
  };

  if (config.ui !== "shadcn") {
    removeApp();
    removeDesignSystem();
    return;
  }

  if (hasDesignSystem(config)) {
    removeApp();
  } else {
    removeDesignSystem();
  }
};
