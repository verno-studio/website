import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import packageJson from "../package.json";

const TELEMETRY_URL = "https://verno-studio.vercel.app/api/telemetry";
const TELEMETRY_TIMEOUT = 2000;
const ANON_ID_PATH = path.join(homedir(), ".config", "verno", "anonymous-id");

export const isTelemetryEnabled = (): boolean =>
  process.env["DO_NOT_TRACK"] !== "1" && process.env["VERNO_TELEMETRY_DISABLED"] !== "1";

const getAnonymousId = (): string => {
  try {
    return readFileSync(ANON_ID_PATH, "utf-8").trim();
  } catch {
    const id = randomUUID();
    try {
      mkdirSync(path.join(homedir(), ".config", "verno"), { recursive: true });
      writeFileSync(ANON_ID_PATH, id, "utf-8");
    } catch {
      // read-only fs — use the id for this run only
    }
    return id;
  }
};

export const trackEvent = async (
  event: string,
  properties: Record<string, unknown> = {},
): Promise<void> => {
  if (!isTelemetryEnabled()) {
    return;
  }
  try {
    const distinctId = getAnonymousId();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TELEMETRY_TIMEOUT);
    try {
      await fetch(TELEMETRY_URL, {
        body: JSON.stringify({
          distinctId,
          event,
          properties: {
            ...properties,
            cli_version: packageJson.version,
            node_version: process.version,
            platform: process.platform,
          },
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    // silent — analytics must never break the CLI
  }
};

const STACK_TRACE_MAX_LENGTH = 4000;

export const redactStack = (stack: string | undefined): string | undefined => {
  if (!stack) {
    return undefined;
  }
  const home = homedir();
  return stack.split(home).join("~").slice(0, STACK_TRACE_MAX_LENGTH);
};

export const trackException = async (error: unknown): Promise<void> => {
  const message = error instanceof Error ? error.message : String(error);
  const type = error instanceof Error ? error.name : "UnknownError";
  const stack = error instanceof Error ? error.stack : undefined;
  await trackEvent("$exception", {
    $exception_message: message,
    $exception_stack_trace_raw: redactStack(stack),
    $exception_type: type,
  });
};
