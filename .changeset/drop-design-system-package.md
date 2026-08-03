---
"@vernostudio/cli": minor
---

Stop scaffolding a `packages/design-system` workspace. It existed to hold the
global stylesheet and the three helpers that go with it — `cn`, the fonts, the
theme provider — but a package earns its keep by being shared, and in a
generated project nothing else imported it. Those files now land in the app,
which is where the single-app layout already put them, so both layouts produce
the same shape.

`components.json` moves with them: `apps/web/components.json` in a Turborepo
project, the project root otherwise. shadcn resolves it from its own working
directory and never searches downward, so `verno create` now points the CLI at
the app rather than at a package.

`design-system` is gone from `--packages`, the create prompt, and the manifest.
`verno doctor` still recognises the old location, so projects generated before
this release keep reporting clean.

What used to justify the package is now the registry: the palette lives at
`@vernostudio/theme`, and every generated project ships pointed at it.
