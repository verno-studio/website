import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import packageJson from "../package.json";

const TELEMETRY_URL = "https://verno-studio.vercel.app/api/telemetry";
const GIT_EXEC_OPTIONS = { encoding: "utf-8" as const, stdio: "pipe" as const };
const ANON_ID_PATH = join(homedir(), ".config", "verno", "anonymous-id");

export const isTelemetryEnabled = (): boolean =>
  process.env["DO_NOT_TRACK"] !== "1" && process.env["VERNO_TELEMETRY_DISABLED"] !== "1";

interface GitIdentity {
  distinctId: string;
  email?: string;
  name?: string;
}

const getAnonymousId = (): string => {
  try {
    return readFileSync(ANON_ID_PATH, "utf-8").trim();
  } catch {
    const id = randomUUID();
    try {
      mkdirSync(join(homedir(), ".config", "verno"), { recursive: true });
      writeFileSync(ANON_ID_PATH, id, "utf-8");
    } catch {
      // read-only fs — use the id for this run only
    }
    return id;
  }
};

const getGitIdentity = (): GitIdentity => {
  try {
    const email = execSync("git config user.email", GIT_EXEC_OPTIONS).trim();
    if (email) {
      const name = execSync("git config user.name", GIT_EXEC_OPTIONS).trim();
      return { distinctId: email, email, name: name || undefined };
    }
  } catch {
    // git not available or not configured
  }
  return { distinctId: getAnonymousId() };
};

export const trackEvent = async (
  event: string,
  properties: Record<string, unknown> = {},
): Promise<void> => {
  if (!isTelemetryEnabled()) {
    return;
  }
  try {
    const { distinctId, name, email } = getGitIdentity();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    try {
      await fetch(TELEMETRY_URL, {
        body: JSON.stringify({
          distinctId,
          email,
          event,
          name,
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
