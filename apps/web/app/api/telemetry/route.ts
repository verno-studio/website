import { PostHog } from "posthog-node";
import { z } from "zod";

import { env } from "@/env";

const bodySchema = z.object({
  distinctId: z.string(),
  email: z.email().optional(),
  event: z.string(),
  name: z.string().optional(),
  properties: z.record(z.string(), z.unknown()).optional().default({}),
});

export async function POST(request: Request) {
  if (!env.POSTHOG_API_KEY) {
    return new Response(null, { status: 204 });
  }

  const result = bodySchema.safeParse(await request.json());
  if (!result.success) {
    return new Response(null, { status: 400 });
  }

  const { data: body } = result;

  try {
    const client = new PostHog(env.POSTHOG_API_KEY, {
      flushAt: 1,
      flushInterval: 0,
      host: "https://us.i.posthog.com",
    });

    if (body.email) {
      client.identify({
        distinctId: body.distinctId,
        properties: { email: body.email, name: body.name },
      });
    }

    client.capture({
      distinctId: body.distinctId,
      event: body.event,
      properties: body.properties,
    });

    await client.shutdown();
  } catch {
    // silent — analytics must never surface errors
  }

  return new Response(null, { status: 204 });
}
