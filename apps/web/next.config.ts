import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true,
    // TypeScript 7 has no JS compiler API; run the project-local tsc CLI for
    // build-time type checking. https://nextjs.org/docs/app/api-reference/config/typescript
    useTypeScriptCli: true,
  },

  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
