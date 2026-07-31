---
"@vernostudio/cli": patch
---

Telemetry is now anonymous by default: the CLI no longer collects git email/name (a persisted random UUID is the only distinct ID), exception stack traces are redacted (home directory replaced with `~`) and capped at 4000 characters, and telemetry is sent after the final command output so it never delays completion. The opt-out remains `DO_NOT_TRACK=1` or `VERNO_TELEMETRY_DISABLED=1`.
