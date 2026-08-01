---
"@vernostudio/cli": patch
---

Write the current base layer into a generated project's `app/globals.css`. The
CLI restores this block after `shadcn init` rewrites the stylesheet, and its
copy had fallen behind the template — because the CLI writes last, the stale
version was the one projects actually got. Selection colour, the `html`
font-feature and text-rendering setup, placeholder colour and focus rings all
now match the template. A contract test keeps the two from drifting again.
