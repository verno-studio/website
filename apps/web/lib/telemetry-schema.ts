import { z } from "zod";

export const ALLOWED_EVENTS = [
  "create_project",
  "init_project",
  "doctor_run",
  "update_run",
  "$exception",
] as const;

const MAX_PROPERTIES = 40;
// $exception_stack_trace_raw is the longest legitimate value
const MAX_VALUE_LENGTH = 4096;

// Legacy fields (email, name) are from published CLI versions — accepted so
// old clients don't get 400s, but never forwarded anywhere.
export const telemetryBodySchema = z.object({
  distinctId: z.string().min(1).max(200),
  email: z.string().max(320).optional(),
  event: z.enum(ALLOWED_EVENTS),
  name: z.string().max(200).optional(),
  properties: z
    .record(z.string().max(100), z.unknown())
    .optional()
    .default({})
    .refine((p) => Object.keys(p).length <= MAX_PROPERTIES, { message: "Too many properties" })
    .refine(
      (p) => Object.values(p).every((v) => typeof v !== "string" || v.length <= MAX_VALUE_LENGTH),
      { message: "Property value too long" },
    ),
});

export type TelemetryBody = z.infer<typeof telemetryBodySchema>;
