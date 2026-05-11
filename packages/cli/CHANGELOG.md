# @vernostudio/cli

## 0.1.2

### Patch Changes

- edd8acb: Unify shadcn initialization across all project types (Single App and Turborepo) to use `shadcn apply` with a pre-scaffolded `components.json`. This fixes framework detection issues in custom packages by using a temporary configuration file during execution.

## 0.1.1

### Patch Changes

- 8d9d7c8: Remove `@vernostudio/template-generator` from published runtime dependencies. It remains bundled at build time; `@vernostudio/template-generator` stays a devDependency for local development.

## 0.1.0

### Minor Changes

- d25d31a: Add the create command for scaffolding Verno projects, including Next.js and Turborepo project generation.

### Patch Changes

- Updated dependencies [50a97f9]
  - @vernostudio/template-generator@0.1.0
