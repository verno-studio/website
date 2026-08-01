export const onRequestError = async (
  requestError: { digest: string } & Error,
  request: { path: string; method: string },
  context: { routeType: string },
) => {
  const [{ PostHog }, { env }] = await Promise.all([import("posthog-node"), import("@/env")]);

  const client = new PostHog(env.NEXT_PUBLIC_POSTHOG_TOKEN, {
    flushAt: 1,
    flushInterval: 0,
    host: env.NEXT_PUBLIC_POSTHOG_HOST,
  });

  await client.captureImmediate({
    distinctId: "server",
    event: "$exception",
    properties: {
      $exception_digest: requestError.digest,
      $exception_message: requestError.message,
      $exception_stack_trace_raw: requestError.stack,
      $exception_type: requestError.name,
      $request_method: request.method,
      $request_path: request.path,
      $route_type: context.routeType,
    },
  });

  await client.shutdown();
};
