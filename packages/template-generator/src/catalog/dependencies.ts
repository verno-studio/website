export const DEPENDENCY_VERSIONS = {
  "@tailwindcss/postcss": "^4.0.0",
  "@types/node": "^25",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "@typescript/native-preview": "^7.0.0-dev.20260427.1",
  "class-variance-authority": "^0.7.1",
  clsx: "^2.1.1",
  next: "^16.2.0",
  oxfmt: "^0.46.0",
  oxlint: "^1.61.0",
  "radix-ui": "^1.4.3",
  react: "^19.0.0",
  "react-dom": "^19.0.0",
  shadcn: "^4.5.0",
  "tailwind-merge": "^3.5.0",
  tailwindcss: "^4.0.0",
  turbo: "^2.9.0",
  "tw-animate-css": "^1.4.0",
  typescript: "^6",
  ultracite: "^7.6.0",
} as const;

export type ManagedDependency = keyof typeof DEPENDENCY_VERSIONS;

export const getDependencyVersion = (name: ManagedDependency): string => {
  const version = DEPENDENCY_VERSIONS[name];
  if (!version) {
    throw new Error(`Missing version in catalog for dependency: ${String(name)}`);
  }
  return version;
};
