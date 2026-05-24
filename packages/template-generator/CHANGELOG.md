# @vernostudio/template-generator

## 0.1.2

### Patch Changes

- ce5d91c: Generated Next.js projects no longer include `noEmit` in `tsconfig.json`. Typecheck still uses `tsgo --noEmit` via the package script.

## 0.1.1

### Patch Changes

- edd8acb: Unify shadcn initialization across all project types (Single App and Turborepo) to use `shadcn apply` with a pre-scaffolded `components.json`. This fixes framework detection issues in custom packages by using a temporary configuration file during execution.

## 0.1.0

### Minor Changes

- 50a97f9: Add templates for Verno Studio projects including Next.js and Turborepo project generation.
