---
"@vernostudio/cli": patch
---

Fix three usage-flow issues found by walking the CLI end to end: project names are now validated (letters, numbers, hyphens) on the positional and `-y` paths too, instead of only when the wizard prompts — previously `verno create "bad name" -y` exited 0 and scaffolded a project with an npm-invalid `package.json` name; the `init --dry-run` plan now lists the turborepo restructure before dependency install, matching the real execution order; and the two dead `vernostudio.dev/docs/*` links printed after `init` now point at https://www.ultracite.ai and https://verno-studio.vercel.app.
