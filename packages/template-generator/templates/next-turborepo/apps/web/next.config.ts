import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { formats: ["image/avif", "image/webp"] },
  transpilePackages: ["{{dsName}}"],
};

export default nextConfig;
