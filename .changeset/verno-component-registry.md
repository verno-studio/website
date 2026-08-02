---
"@vernostudio/cli": patch
---

Point scaffolded projects at the Verno Studio component registry. Both
`components.json` templates now ship a `registries` block for `@vernostudio`, so
`shadcn add @vernostudio/copy-button` works in a fresh project without any setup.
Because `shadcn apply` rewrites `components.json` during scaffolding, the block
is re-applied afterwards — the same treatment the base CSS layer already gets —
and only namespaces that are missing are added, so a project that repointed
`@vernostudio` at a fork keeps its own value. `verno doctor` now reports a
project whose `components.json` has no Verno registry configured.
