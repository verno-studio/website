import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    inlineCss: true,
  },

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        hostname: "*.netlify.app",
        pathname: "/preview.png",
        protocol: "https",
      },
    ],
  },
};

export default createMDX()(nextConfig);
