"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";
import type { PropsWithChildren } from "react";
import { env } from "@/env";

export const PHProvider = ({ children }: PropsWithChildren) => {
  useEffect(() => {
    posthog.init(env.NEXT_PUBLIC_POSTHOG_TOKEN, {
      api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
      capture_exceptions: true,
      person_profiles: "identified_only",
    });
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
};
