---
"@vernostudio/cli": patch
---

Fix three silently ignored flags: `--no-install` and `--no-git` are now honored by `create` and `init` (Commander exposes them as `install`/`git`), and `init --addon` is renamed to `--addons` (matching `create`) with a hidden `--addon` back-compat alias. Adds parse-level wiring tests so option-wiring regressions are caught.
