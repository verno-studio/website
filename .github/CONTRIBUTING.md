# Contributing to Verno Studio

Thanks for your interest in contributing to Verno Studio. This repository is a Bun-powered Turborepo monorepo for the `verno` CLI, template generation utilities, a shared design system, and a Next.js web app.

## Source Code

The source code is hosted on GitHub at [verno-studio/website](https://github.com/verno-studio/website).

## Project Structure

- `apps/web` - Next.js app that uses React 19 and the shared design system.
- `packages/cli` - `verno` CLI for scaffolding Next.js and Turborepo projects.
- `packages/template-generator` - Template generation logic used by the CLI.
- `packages/design-system` - Shared React 19 design system and shadcn-based UI primitives.
- `packages/typescript-config` - Shared TypeScript configuration for workspaces.

## Getting Started

1. Fork the repository on GitHub.
2. Clone your fork:

   ```sh
   git clone git@github.com:verno-studio/website.git
   cd website
   ```

3. Install dependencies with Bun:

   ```sh
   bun install
   ```

4. Create a branch for your change:

   ```sh
   git checkout -b feature/your-change
   ```

5. Make your changes and add or update tests when behavior changes.
6. Run the relevant checks before opening a pull request.

## Development Commands

Run these commands from the repository root:

- `bun run dev` - Start all workspace development tasks through Turborepo.
- `bun run build` - Build all buildable workspaces.
- `bun run test` - Run workspace test suites.
- `bun run test:coverage` - Run tests with coverage where configured.
- `bun run typecheck` - Run TypeScript checks across workspaces.
- `bun run lint` - Check code quality with Ultracite.
- `bun run format` - Apply Ultracite fixes and formatting.

For package-specific work, use Bun's workspace filters. For example:

```sh
bun --filter verno run dev
bun --filter verno run test
bun --filter @vernostudio/template-generator run test
```

## Code Standards

This project uses [Ultracite](https://ultracite.ai/) for formatting and linting. Prefer existing workspace patterns, keep imports at the top of files, and keep TypeScript explicit where it improves readability.

For React and Next.js code:

- Use function components and React 19 patterns.
- Prefer semantic HTML and accessible controls.
- Use the shared design system instead of duplicating UI primitives.
- Keep client components as small as practical.

For CLI and template-generator code:

- Keep command behavior testable and deterministic.
- Support non-interactive flows where flags already exist.
- Update template tests when generated output changes.

## Changesets

We use [Changesets](https://github.com/changesets/changesets) for release notes and versioning. The current Changesets configuration tracks the `verno` package and ignores the private app/internal packages.

Create a changeset when your change affects released `verno` CLI behavior:

```sh
bun run changeset
```

Choose the version bump that matches the user-facing impact:

- `patch` - Bug fixes and small behavior improvements.
- `minor` - New functionality that remains backward compatible.
- `major` - Breaking changes.

You usually do not need a changeset for internal refactors, tests, CI changes, docs-only updates, or changes limited to ignored private workspaces.

## Pull Request Guidelines

- Keep pull requests focused on one clear change.
- Describe what changed, why it changed, and how it was tested.
- Link related issues when applicable.
- Include screenshots or recordings for visible UI changes.
- Add or update tests for CLI behavior, template output, and other user-facing logic.
- Run `bun run format`, `bun run lint`, `bun run typecheck`, `bun run test`, and `bun run build` as appropriate for your change.
- Add a changeset when released CLI behavior changes.

## Continuous Integration

CI runs on pushes to `main` and on pull requests. The workflow installs dependencies with Bun, builds the repository for lint and typecheck jobs, and runs the configured Ultracite and TypeScript checks.

The release workflow runs on `main`, executes tests and build, then uses Changesets to create a release pull request or publish packages.

## Reporting Issues

Use the GitHub [issue tracker](https://github.com/verno-studio/website/issues) to report bugs or request features.

For bug reports, please include:

- What you expected to happen.
- What actually happened.
- Steps to reproduce the issue.
- Your OS, Bun version, and relevant command output.
- The template or package involved, if applicable.

For feature requests, explain the problem you are trying to solve and any alternatives you considered.

## Code of Conduct

This project follows the [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold it.

Thank you for contributing!
