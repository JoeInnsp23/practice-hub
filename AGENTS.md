# Repository Guidelines

## Project Structure & Module Organization
Practice Hub is a Next.js App Router project. Route groups and feature domains live in `app/`, e.g. `app/admin`, `app/client-hub`, and `app/practice-hub`. Shared UI and feature components sit under `components/`, while cross-cutting hooks and utilities are in `hooks/` and `lib/`. Database schemas, migrations, and Drizzle metadata live in `drizzle/`, and seed utilities keep to `scripts/`. Static assets such as logos and icons should land in `public/`. Use `docs/` for longer-form product or workflow references.

## Build, Test, and Development Commands
Run `pnpm install` once, then use `pnpm dev` for a local server with Turbopack. Ship-ready bundles come from `pnpm build`; confirm production behaviour via `pnpm start`. Style and type safety are enforced with `pnpm lint` (Biome) and `pnpm format` if you need to rewrite files. Postgres services start with `pnpm db:up` and stop with `pnpm db:down`. Apply schema updates using `pnpm db:generate` followed by `pnpm db:migrate`, and seed demo content with `pnpm db:seed`.

## Coding Style & Naming Conventions
Prefer TypeScript throughout; keep files within feature folders (`app/practice-hub/tasks/page.tsx`). Follow Biome defaults: two-space indentation, double quotes, trailing commas, and semicolons. Export React components in PascalCase (`PracticeHubPage`), hooks in camelCase (`useWorkflowDraft`), and constants in UPPER_SNAKE_CASE. Local UI components belong in `components/ui` and should expose named exports.

## Testing Guidelines
Automated tests are not wired up yet; plan new coverage alongside changes. Place unit tests next to the code under a `__tests__` folder or a `.test.ts(x)` suffix, and name cases after the scenario you are verifying. Always run `pnpm lint` before pushing, and document any manual verification steps in the pull request until a test suite exists.

## Commit & Pull Request Guidelines
Commit messages follow a concise, imperative format (for example, `Add workflow task validation`). Scope commits narrowly around one concern. Every pull request should describe the change, outline setup steps (e.g., migrations, seeds), link tracking issues when available, and attach screenshots or Looms for UI-facing updates.

## Environment Notes
Application secrets load from `.env.local`; never commit env files. When working on data flows, reset your local database with `pnpm db:seed:clear` before reseeding.
