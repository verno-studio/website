import { env } from "@/env";
import { telemetryBodySchema } from "@/lib/telemetry-schema";
import type { PostHog } from "posthog-node";
import type { NextRequest } from "next/server";
import { after, NextResponse } from "next/server";

const MAX_BODY_BYTES = 64 * 1024;

let client: PostHog | null = null;

const getClient = async (): Promise<PostHog> => {
  if (!client) {
    const { PostHog } = await import("posthog-node");
    client = new PostHog(env.NEXT_PUBLIC_POSTHOG_TOKEN, {
      host: env.NEXT_PUBLIC_POSTHOG_HOST,
    });
  }
  return client;
};

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = telemetryBodySchema.safeParse(parsedBody);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { data: body } = result;

  // email/name (legacy fields) are intentionally discarded here — the route
  // never relays caller-supplied identity claims to PostHog's identify.
  after(async () => {
    try {
      const posthog = await getClient();
      posthog.capture({
        distinctId: body.distinctId,
        event: body.event,
        properties: body.properties,
      });
      await posthog.flush();
    } catch {
      // silent — analytics must never surface errors
    }
  });

  return new NextResponse(null, { status: 204 });
};
