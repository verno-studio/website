export const onRequestError = async (
  error: { digest: string } & Error,
  request: { path: string; method: string },
  context: { routeType: string },
) => {
  const { PostHog } = await import("posthog-node");
  const { env } = await import("@/env");

  const client = new PostHog(env.NEXT_PUBLIC_POSTHOG_TOKEN, {
    flushAt: 1,
    flushInterval: 0,
    host: env.NEXT_PUBLIC_POSTHOG_HOST,
  });

  await client.captureImmediate({
    distinctId: "server",
    event: "$exception",
    properties: {
      $exception_digest: error.digest,
      $exception_message: error.message,
      $exception_stack_trace_raw: error.stack,
      $exception_type: error.name,
      $request_method: request.method,
      $request_path: request.path,
      $route_type: context.routeType,
    },
  });

  await client.shutdown();
};
