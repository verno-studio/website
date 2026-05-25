import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets";
import { z } from "zod";

export const env = createEnv({
  extends: [vercel()],
  server: {
    POSTHOG_API_KEY: z.string().startsWith("phc_").optional(),
  },
  client: {
    NEXT_PUBLIC_GITHUB_REPO: z.string().optional(),
    NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_GITHUB_REPO: process.env.NEXT_PUBLIC_GITHUB_REPO,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
  },
});
