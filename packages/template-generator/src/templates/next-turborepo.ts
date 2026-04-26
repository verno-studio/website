import type { ProjectConfig } from "../config";
import { scoped } from "../paths";
import { editorConfig, gitignoreContent, packageManagerField } from "../shared-root";
import type { FileTree } from "../paths";
import { designSystemGlobalsCss } from "./design-system-globals";
import { packageJsonString } from "./strings";

const DEFAULT_SHADCN_STYLE_PLACEHOLDER = "radix-nova";

export const buildNextTurborepoTree = (config: ProjectConfig): FileTree => {
  const { projectName, packageManager, npmScope } = config;
  const dsName = scoped(npmScope, "design-system");
  const tsConfigName = scoped(npmScope, "typescript-config");
  const componentsStyle = DEFAULT_SHADCN_STYLE_PLACEHOLDER;

  const rootPkg: Record<string, unknown> = {
    devDependencies: {},
    engines: { node: ">=18" },
    name: projectName,
    packageManager: packageManagerField(packageManager),
    private: true,
    scripts: {
      build: "turbo run build",
      dev: "turbo run dev",
      format: "ultracite fix",
      lint: "ultracite check",
      typecheck: "turbo run typecheck",
    },
    type: "module",
    workspaces: ["apps/*", "packages/*"],
  };

  return {
    ".editorconfig": editorConfig,
    ".gitignore": gitignoreContent,
    "README.md": `# ${projectName}

Turborepo + Next.js (template: next-turborepo). Internal packages: \`${dsName}\`, \`${tsConfigName}\`.
Post-create: \`shadcn\` and \`ultracite\` from @verno/cli.
`,
    "apps/web/app/globals.css": `@import "tailwindcss";
@import "${dsName}/styles/globals.css";
`,
    "apps/web/app/layout.tsx": `import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

const title = "${projectName}";

export const metadata: Metadata = { title, description: "Next.js app" };

const RootLayout = ({ children }: { readonly children: ReactNode }) => (
  <html lang="en" suppressHydrationWarning>
    <body className="antialiased min-h-dvh">
      {children}
    </body>
  </html>
);

export default RootLayout;
`,

    "apps/web/app/page.tsx": `const Home = () => (
  <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-4 px-4 py-16">
    <h1 className="text-3xl font-semibold tracking-tight">${projectName}</h1>
    <p className="text-neutral-600">Edit <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-sm dark:bg-neutral-800">app/page.tsx</code> to get started.</p>
  </main>
);

export default Home;
`,
    "apps/web/next-env.d.ts": `/// <reference types="next" />
/// <reference types="next/image-types/global" />
`,
    "apps/web/next.config.ts": `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["${dsName}"],
  images: { formats: ["image/avif", "image/webp"] },
};

export default nextConfig;
`,
    "apps/web/package.json": packageJsonString({
      dependencies: {
        [dsName]: "workspace:*",
      },
      devDependencies: {},
      name: "web",
      private: true,
      scripts: {
        build: "next build",
        dev: "next dev --port 3000",
        start: "next start",
        typecheck: "tsc --noEmit",
      },
      type: "module",
      version: "0.1.0",
    }),

    "apps/web/postcss.config.mjs": `const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
`,

    "apps/web/tsconfig.json": `{
  "extends": "../../packages/typescript-config/nextjs.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@${npmScope}/*": ["../../packages/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
`,

    "package.json": packageJsonString(rootPkg),

    "packages/design-system/components.json": `{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "${componentsStyle}",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "${dsName}/components",
    "utils": "${dsName}/lib/utils",
    "ui": "${dsName}/components/ui",
    "lib": "${dsName}/lib",
    "hooks": "${dsName}/hooks"
  },
  "menuColor": "default",
  "menuAccent": "subtle",
  "registries": {}
}
`,

    "packages/design-system/lib/utils.ts": `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
`,

    "packages/design-system/package.json": packageJsonString({
      dependencies: {},
      devDependencies: {},
      name: dsName,
      peerDependencies: {},
      private: true,
      scripts: { typecheck: "tsc --noEmit" },
      sideEffects: false,
      type: "module",
      version: "0.0.0",
    }),

    "packages/design-system/src/index.ts": `export { cn } from "../lib/utils";
`,

    "packages/design-system/styles/globals.css": designSystemGlobalsCss,

    "packages/design-system/tsconfig.json": `{
  "extends": "../typescript-config/react-library.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "${dsName}/*": ["./*"]
    }
  },
  "include": [
    "components/**/*.ts",
    "components/**/*.tsx",
    "lib/**/*.ts",
    "hooks/**/*.ts",
    "src/**/*.ts",
    "src/**/*.tsx"
  ],
  "exclude": ["node_modules"]
}
`,

    "packages/typescript-config/base.json": `{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "strictNullChecks": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true
  },
  "exclude": ["node_modules"]
}
`,

    "packages/typescript-config/nextjs.json": `{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }]
  }
}
`,

    "packages/typescript-config/package.json": packageJsonString({
      files: ["base.json", "nextjs.json", "react-library.json"],
      license: "MIT",
      name: tsConfigName,
      private: true,
      version: "0.0.0",
    }),

    "packages/typescript-config/react-library.json": `{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": { "jsx": "react-jsx" }
}
`,

    "turbo.json": `{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "typecheck": { "dependsOn": ["^typecheck"] },
    "dev": { "cache": false, "persistent": true }
  }
}
`,
  };
};
