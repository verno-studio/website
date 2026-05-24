---
"@vernostudio/cli": patch
---

Add usage tracking with PostHog for core CLI commands and show an opt-out notice on startup. Telemetry collects git identity (email and name) when available, falling back to a persistent anonymous UUID. Opt out by setting `DO_NOT_TRACK=1` or `VERNO_TELEMETRY_DISABLED=1`.
