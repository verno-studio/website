import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets";
import { z } from "zod";

export const env = createEnv({
  extends: [vercel()],
  server: {
    POSTHOG_API_KEY: z.string().startsWith("phc_").optional(),
  },
  runtimeEnv: {
    POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
  },
});
