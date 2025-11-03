# Agents Guide (AI alignment)

- Purpose: concise standards for AI tools; `CLAUDE.md` holds detailed guidance.

- UI components: Use shared components first; create custom components only when a shared component cannot meet the need.
- Notifications: Use `react-hot-toast` for user-facing notifications.
- Commit cadence: Commit after the current TODO list is complete; otherwise after any logical change, 2+ files changed, >30 LOC changed, file add/remove, when lint/tests pass, or every 15 minutes. Use conventional commits `type(scope): summary` with bullets of key changes. For DB schema/seed updates, commit immediately after updating schema and seeds (after `pnpm db:reset`).
- Theme: Keep light/dark theme aligned across modules.
- Dev server: Never run `pnpm dev` without explicit user permission.
- Docker: Use Docker Compose v2 (`docker compose ...`).
- File edits: Read the entire file before editing. For very large files (>800 lines), read imports, related functions/classes, and surrounding context before changes.
- Implementation quality: Full implementation only — no placeholders, TODOs, or temporary workarounds. Include schema/seed updates and add/adjust tests as needed.

- DB policy: Development-mode is schema-first in `lib/db/schema.ts`; update `scripts/seed.ts` and related files (types/validation/views/tests) in unison.
- Seeds after schema: After any schema change, update seeds to match schema (FKs, constraints, tenant/client isolation) and validate with `pnpm db:reset`.
- DB reset: Always use `pnpm db:reset` (single command). Do not run individual DB scripts.
- SQL safety: Use Drizzle helpers (`inArray`, `eq`, `and`, `or`); do not use `= ANY(${array})`; if an array is empty, short-circuit in code; only if strictly necessary, use explicit `ARRAY[...]::type[]` with proper casting.
- Decimals: Forms use numbers; convert numbers to strings at the API/DB boundary; keep decimals as strings in Drizzle; convert for display only and guard with `Number.isFinite`; tests assert strings and round-trip formatting.
- Errors & logging: Use `@sentry/nextjs`; no `console.log/warn/debug` in production; replace `console.error` with `Sentry.captureException` including tags/extra (non-PII, include `tenantId`/`userId` when available); user messaging via `react-hot-toast`; enforce Biome `noConsole`; exceptions limited to webhooks and development-only paths.

- Design standards:
  - Cards: Use shared Card + `glass-card`; do not hand-roll card styles.
  - Tables: Use shared TableContainer; wrap tables in `<div className="glass-table">`; no inline table bg/border styles.
  - Header/Sidebar: Use `GlobalHeader`/`GlobalSidebar`; provide `headerColor`; set `showBackToHome={true}` on non–practice-hub modules; keep colors aligned; no bespoke variants.
  - Layout background: Apply `min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800` at the top-level layout container.
  - Design tokens: Use classes/tokens from `globals.css` via shared components (e.g., `.glass-card`, `.glass-subtle`, `.glass-table`); extend tokens instead of inline `bg-*`, `border`, `shadow`.
  - Module colors: Use shared tokens (Client Hub `#3b82f6`, Admin `#f97316`, Practice Hub primary); no inline hex.
  - Checklists: Use shared `ChecklistItem` with completed/unfinished states, toggle interaction, and `h-6 w-6` icons.

- Auth & multi-tenancy: Better Auth middleware (Node runtime) with public paths `/`, `/sign-in`, `/sign-up`; allow `/api/*`; unauthenticated redirects to `/sign-in?from=PATH`. Auth API route uses `toNextJsHandler(auth)` with Node runtime. Use `getAuthContext()`; use protected/admin tRPC procedures; in server components/layouts, `redirect()` on unauthorized. All tables scoped by `tenantId`; client portal tables require `tenantId` + `clientId`.

- Development commands: `pnpm install`, `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm format`, `docker compose up -d`.

BMAD note:
- BMAD rules are available under `.cursor/rules/bmad/` (modules: CORE, BMB, BMM). They remain unchanged.


