---
"@vernostudio/cli": patch
"@vernostudio/template-generator": patch
---

Unify shadcn initialization across all project types (Single App and Turborepo) to use `shadcn apply` with a pre-scaffolded `components.json`. This fixes framework detection issues in custom packages by using a temporary configuration file during execution.
