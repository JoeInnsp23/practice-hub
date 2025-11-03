# Known Issues

**Last Updated:** 2025-10-24
**Maintainer:** Development Team

This document tracks known issues, cosmetic warnings, and technical limitations in Practice Hub.

---

## 🟡 Microsoft OAuth Warning in Tests (Cosmetic)

**Symptom:**
```
[Better Auth]: Social provider microsoft is missing clientId or clientSecret
```

**Status:** ⚠️ **FALSE POSITIVE** - Credentials ARE present in environment

**Root Cause:** Better Auth validates environment variables at module load time during test execution, possibly in a different context where env vars aren't available.

**Impact:**
- ✅ **NONE** - Tests pass successfully
- ✅ OAuth functional in development and production
- ⚠️ Cosmetic warning in test output

**Verification:**
- ✅ Credentials present in `.env.local:10-11`:
  - `MICROSOFT_CLIENT_ID`
  - `MICROSOFT_CLIENT_SECRET`
- ✅ Microsoft OAuth sign-in works in all environments
- ✅ No functional impact on application

**Resolution:** Not needed - this is a test environment artifact only.

**Related Files:**
- `lib/auth.ts:51-57` - Microsoft OAuth configuration
- `.env.local:10-11` - OAuth credentials

---

## 📝 Service Import: Hardcoded pricingModel (Limitation)

**Issue:** Service CSV imports always set `pricingModel: "turnover"`

**Status:** 📋 **KNOWN LIMITATION** - Documented behavior

**Details:**
- Not exposed in CSV import schema
- Users must update via UI after import if different pricing model needed
- Affects: `/api/import/services` endpoint

**Root Cause:**
- Complexity of exposing pricing model selection in CSV format
- Business logic validation requirements
- Intentional simplification for bulk import

**Workaround:**
1. Import services via CSV
2. Navigate to Admin → Services
3. Edit individual services to change pricing model

**Future Enhancement:**
- Consider adding `pricing_model` column to CSV schema in Epic 6
- Requires validation logic for model-specific fields

**Related Files:**
- `app/api/import/services/route.ts:159` - Hardcoded value
- `lib/validators/csv-import.ts:179-198` - Service import schema

**Documentation:**
- `/docs/stories/epic-5/story-1-service-import-templates.md` - Import functionality
- `/docs/api/import-services.md` - API reference (if exists)

---

## 🟡 Sentry Turbopack Warnings (Cosmetic)

**Symptom:**
```
Package import-in-the-middle can't be external
The request import-in-the-middle matches serverExternalPackages (or the default list).
The request could not be resolved by Node.js from the project directory.
...
Package require-in-the-middle can't be external
The request require-in-the-middle matches serverExternalPackages (or the default list).
...
```

**Status:** ⚠️ **COSMETIC WARNING** - Build succeeds, zero functional impact

**Root Cause:**
- Turbopack cannot resolve Sentry's OpenTelemetry instrumentation dependencies (`import-in-the-middle` and `require-in-the-middle`) as external packages
- These are transitive dependencies of `@sentry/nextjs` via `@opentelemetry/instrumentation`
- Known upstream issue with Next.js 15 + Turbopack + Sentry integration

**Impact:**
- ✅ **NONE** - Sentry error tracking fully functional in all environments
- ✅ Build completes successfully (warnings do not block compilation)
- ⚠️ Cosmetic noise in build output (~15-30 warning lines)

**Verification:**
- ✅ Sentry error tracking works in development and production
- ✅ Build exits with success code (0)
- ✅ No runtime errors or broken functionality

**Upstream Status:**
- GitHub Issue [#15070](https://github.com/getsentry/sentry-javascript/issues/15070): "Figure out a way to silence the import/require-in-the-middle warnings for Turbopack" - **Closed as "not planned"** by Sentry team
- GitHub Issue [#15456](https://github.com/getsentry/sentry-javascript/issues/15456): "Next 15 upgrade causes external warning with require-in-the-middle" - **Closed as "completed"** (marked as duplicate)
- Sentry v9+ changed instrumentation mode but warnings persist with Turbopack

**Resolution:** Not needed - this is a known limitation of Turbopack's strict external package resolution with OpenTelemetry instrumentation. Safe to ignore.

**Alternative Workarounds (Not Recommended):**
1. **pnpm hoisting** (Sentry docs suggest): Add to `.npmrc`:
   ```ini
   public-hoist-pattern[]=*import-in-the-middle*
   public-hoist-pattern[]=*require-in-the-middle*
   ```
   ⚠️ May cause other dependency issues; no guarantee it silences warnings

2. **Install as direct dependencies**: `pnpm add import-in-the-middle require-in-the-middle`
   ⚠️ Doesn't resolve underlying functionality; just masks warnings

**Recommendation:** Ignore warnings - no action required.

**Related Files:**
- `sentry.client.config.ts` - Sentry client configuration
- `sentry.server.config.ts` - Sentry server configuration
- `sentry.edge.config.ts` - Sentry edge runtime configuration

---

## Change Log

| Date | Issue | Action | By |
|------|-------|--------|-----|
| 2025-10-24 | Sentry Turbopack warnings | Documented as cosmetic warning | Dev Team |
| 2025-10-24 | Microsoft OAuth warning | Documented as false positive | Dev Team |
| 2025-10-24 | pricingModel limitation | Documented as known limitation | Dev Team |

---

**Questions or New Issues?**
- Report new issues via GitHub Issues
- Update this document when resolving known issues
- Include: symptom, impact, workaround, and related files
# Developer Troubleshooting Guide

**Last Updated**: 2025-10-10
**Version**: 1.0

This guide helps developers troubleshoot common issues in Practice Hub development. If you encounter an issue not covered here, please update this document with your solution.

---

## Table of Contents

1. [General Debugging Approach](#general-debugging-approach)
2. [Environment Setup Issues](#environment-setup-issues)
3. [Database Issues](#database-issues)
4. [Authentication Issues](#authentication-issues)
5. [API and tRPC Issues](#api-and-trpc-issues)
6. [Build and Compilation Issues](#build-and-compilation-issues)
7. [Docker Issues](#docker-issues)
8. [Testing Issues](#testing-issues)
9. [Performance Issues](#performance-issues)
10. [UI and Styling Issues](#ui-and-styling-issues)
11. [Debugging Tools and Techniques](#debugging-tools-and-techniques)
12. [Getting Help](#getting-help)

---

## General Debugging Approach

### The Scientific Method

When debugging:
1. **Reproduce**: Can you consistently reproduce the issue?
2. **Isolate**: What's the minimal code that causes the issue?
3. **Hypothesize**: What do you think is causing it?
4. **Test**: Test your hypothesis
5. **Fix**: Apply the fix
6. **Verify**: Confirm the issue is resolved

### Quick Fixes to Try First

Before deep debugging:
```bash
# 1. Restart dev server
# Kill server (Ctrl+C) and restart
pnpm dev

# 2. Clear Next.js cache
rm -rf .next
pnpm dev

# 3. Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 4. Reset database
pnpm db:reset

# 5. Restart Docker services
docker compose down
docker compose up -d
```

---

## Environment Setup Issues

### Issue: `pnpm install` fails

**Error**:
```
ERR_PNPM_OUTDATED_LOCKFILE Cannot install with "frozen-lockfile"
```

**Solution**:
```bash
# Update lockfile
pnpm install --no-frozen-lockfile
```

---

### Issue: Environment variables not loading

**Error**: Variables undefined at runtime

**Causes**:
1. `.env.local` doesn't exist
2. Variable name doesn't start with `NEXT_PUBLIC_` (for client-side)
3. Dev server wasn't restarted after adding variable

**Solutions**:

**Check file exists**:
```bash
ls -la .env.local
# If not exists, copy from template:
cp .env.example .env.local
```

**Client-side variables**: Must start with `NEXT_PUBLIC_`:
```bash
# Server-side (works in API routes, Server Components)
DATABASE_URL="..."

# Client-side (works in Client Components)
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"
```

**Restart dev server** after editing `.env.local`:
```bash
# Kill and restart
pnpm dev
```

---

### Issue: `openssl` command not found

**Error**: Can't generate `BETTER_AUTH_SECRET`

**Solution**:

**macOS/Linux**:
```bash
openssl rand -base64 32
```

**Windows (PowerShell)**:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Alternative**: Use online generator (https://generate-secret.vercel.app/32)

---

## Database Issues

### Issue: `ECONNREFUSED localhost:5432`

**Error**: Cannot connect to PostgreSQL

**Cause**: Docker not running or PostgreSQL container stopped

**Solutions**:

**Check Docker is running**:
```bash
docker ps
# Should show practice-hub-db container
```

**If no containers listed**:
```bash
# Start Docker Desktop (GUI)
# OR start services:
docker compose up -d

# Verify:
docker ps | grep practice-hub-db
```

**If container exists but still fails**:
```bash
# Check port 5432 not in use by another process
lsof -i :5432

# If something else using port, kill it:
kill -9 <PID>

# Restart Docker
docker compose restart db
```

---

### Issue: `relation "table_name" does not exist`

**Error**: Query references table that doesn't exist

**Cause**: Database schema out of sync with code

**Solution**:
```bash
# Reset database (drops, recreates, seeds)
pnpm db:reset

# Verify tables exist:
docker exec -it practice-hub-db psql -U postgres -d practice_hub -c "\dt"
```

---

### Issue: `column "field_name" does not exist`

**Error**: Query references column that doesn't exist

**Cause**: Schema changed but database not updated

**Solution**:
```bash
# Reset database
pnpm db:reset

# If issue persists, check schema file:
# 1. Open lib/db/schema.ts
# 2. Verify column exists in table definition
# 3. Verify column name matches (camelCase in code, snake_case in DB)
```

---

### Issue: Foreign key constraint violation

**Error**:
```
insert or update on table "clients" violates foreign key constraint
```

**Cause**: Referencing non-existent ID (e.g., tenantId that doesn't exist)

**Solution**:

**Check referenced record exists**:
```typescript
// Before:
await db.insert(clients).values({
  name: "ABC Ltd",
  tenantId: "non-existent-id",  // ❌ Doesn't exist
});

// After: Get valid tenantId first
const authContext = await getAuthContext();
await db.insert(clients).values({
  name: "ABC Ltd",
  tenantId: authContext.tenantId,  // ✅ Valid
});
```

---

### Issue: Database migrations not applying

**Error**: Views don't exist after `pnpm db:reset`

**Cause**: SQL files in `drizzle/` not executed

**Solution**:

**Check SQL files exist**:
```bash
ls drizzle/*.sql
# Should see: 0001_create_*.sql, 0002_create_*.sql, etc.
```

**Manually apply migrations**:
```bash
# Run all SQL files
for file in drizzle/*.sql; do
  docker exec -i practice-hub-db psql -U postgres -d practice_hub < "$file"
done

# Verify views exist:
docker exec -it practice-hub-db psql -U postgres -d practice_hub -c "SELECT * FROM pg_views WHERE schemaname = 'public';"
```

---

## Authentication Issues

### Issue: `authContext` is `null`

**Error**: `getAuthContext()` returns `null` despite being signed in

**Causes**:
1. User in Better Auth but not in `users` table
2. Better Auth session expired
3. Middleware not allowing request through

**Solution**:

**Check session exists**:
```typescript
// In Server Component or API route
const session = await auth.api.getSession({ headers: await headers() });
console.log("Session:", session);

// If null: User not authenticated
// If exists: User authenticated, check users table
```

**Check users table**:
```bash
# Check if user exists in users table
docker exec -it practice-hub-db psql -U postgres -d practice_hub -c "SELECT id, email, tenant_id FROM users WHERE email = 'your@email.com';"

# If no rows: User in Better Auth but not in users table
# Solution: Run seed script or manually insert
pnpm db:reset
```

**Check middleware**:
```typescript
// middleware.ts - ensure route not in publicPaths
const publicPaths = ["/", "/sign-in", "/sign-up"];

// If your route should be public, add it:
const publicPaths = ["/", "/sign-in", "/sign-up", "/your-route"];
```

---

### Issue: Redirect loop on sign-in

**Error**: Browser redirects back and forth between `/sign-in` and `/`

**Cause**: Middleware redirects to `/sign-in`, sign-in page redirects to `/`

**Solution**:

**Check middleware config**:
```typescript
// middleware.ts
const publicPaths = ["/", "/sign-in", "/sign-up"];

// Ensure /sign-in is public:
if (publicPaths.some((path) => pathname === path)) {
  return NextResponse.next();  // Don't require auth
}
```

**Check sign-in page**:
```typescript
// app/(auth)/sign-in/page.tsx
"use client";

export default function SignInPage() {
  const { data: session } = useSession();

  // If already signed in, redirect to home
  useEffect(() => {
    if (session) {
      router.push("/");
    }
  }, [session]);

  // ...
}
```

---

### Issue: Microsoft OAuth not working

**Error**: OAuth redirect fails or returns error

**Solutions**:

**Check environment variables**:
```bash
# .env.local
MICROSOFT_CLIENT_ID="your-client-id"
MICROSOFT_CLIENT_SECRET="your-client-secret"
MICROSOFT_TENANT_ID="common"  # or specific tenant ID
```

**Check redirect URI**:
- Azure portal: Must match exactly (http://localhost:3000/api/auth/callback/microsoft)
- Case-sensitive
- No trailing slash

**Check Better Auth config**:
```typescript
// lib/auth.ts
export const auth = betterAuth({
  socialProviders: {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID || "common",
    },
  },
});
```

---

## API and tRPC Issues

### Issue: `Property 'routerName' does not exist on type 'TRPCClient'`

**Error**: TypeScript doesn't recognize new tRPC router

**Cause**: TypeScript server cache out of date

**Solution**:

**VS Code**:
```
1. Cmd+Shift+P (or Ctrl+Shift+P on Windows)
2. Type: "TypeScript: Restart TS Server"
3. Press Enter
```

**Alternative**: Restart dev server:
```bash
# Kill and restart
pnpm dev
```

---

### Issue: tRPC mutation returns `UNAUTHORIZED`

**Error**: `TRPCError: UNAUTHORIZED`

**Cause**: User not authenticated or missing session

**Solution**:

**Check procedure protection**:
```typescript
// If using protectedProcedure, user must be signed in
export const clientsRouter = router({
  create: protectedProcedure  // ← Requires auth
    .input(...)
    .mutation(async ({ ctx }) => {
      // ctx.authContext available
    }),
});
```

**Client-side**: Ensure user is signed in:
```typescript
"use client";
import { useSession } from "@/lib/auth-client";

export function CreateClientButton() {
  const { data: session } = useSession();

  if (!session) {
    return <div>Sign in to create clients</div>;
  }

  return <Button onClick={() => createMutation.mutate(...)}>Create</Button>;
}
```

---

### Issue: tRPC returns wrong data type

**Error**: Expected `Client[]` but got `undefined`

**Cause**: Query not returning data correctly

**Solution**:

**Check query**:
```typescript
// Bad: Forgot .returning()
const [client] = await db.insert(clients).values(data);
// client is undefined!

// Good: Use .returning()
const [client] = await db.insert(clients).values(data).returning();
// client is the inserted record
```

**Check query hook**:
```typescript
// Check data exists before using
const { data: clients, isLoading } = trpc.clients.list.useQuery();

if (isLoading) return <div>Loading...</div>;
if (!clients) return <div>No data</div>;  // ✅ Check

return <div>{clients.map(...)}</div>;
```

---

## Build and Compilation Issues

### Issue: TypeScript errors on build

**Error**: `pnpm build` fails with type errors

**Solutions**:

**Check types manually**:
```bash
# Run type checker without building
pnpm tsc
```

**Common issues**:

**1. Missing type annotations**:
```typescript
// Bad
function calculate(price) {  // ❌ Implicit any
  return price * 1.2;
}

// Good
function calculate(price: number): number {  // ✅
  return price * 1.2;
}
```

**2. Null/undefined not handled**:
```typescript
// Bad
const client = await fetchClient(id);
console.log(client.name);  // ❌ client might be null

// Good
const client = await fetchClient(id);
if (!client) return null;
console.log(client.name);  // ✅ Null checked
```

---

### Issue: `Module not found` errors

**Error**:
```
Module not found: Can't resolve '@/lib/db/schema'
```

**Causes**:
1. File doesn't exist
2. Path alias not configured
3. File extension missing

**Solutions**:

**Check file exists**:
```bash
ls lib/db/schema.ts
# If not exists, create it
```

**Check path aliases** (tsconfig.json):
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Restart dev server**:
```bash
pnpm dev
```

---

## Docker Issues

### Issue: Docker Desktop not starting

**Error**: Docker daemon not running

**Solutions**:

**macOS**:
```bash
# Restart Docker Desktop app
open -a Docker

# Wait for Docker icon to show "running" status
```

**Linux**:
```bash
sudo systemctl start docker
sudo systemctl status docker
```

**Windows**:
- Open Docker Desktop from Start Menu
- Wait for "Docker Desktop is running" notification

---

### Issue: Port already in use

**Error**:
```
Error starting userland proxy: listen tcp4 0.0.0.0:5432: bind: address already in use
```

**Cause**: Another process using the port

**Solution**:

**Find process using port**:
```bash
# macOS/Linux
lsof -i :5432

# Example output:
# COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
# postgres  1234 user  7u  IPv4  0x... 0t0  TCP *:postgresql (LISTEN)
```

**Kill process**:
```bash
kill -9 1234  # Replace with actual PID
```

**Or change port** in docker-compose.yml:
```yaml
services:
  db:
    ports:
      - "5433:5432"  # Use 5433 instead
```

**Update DATABASE_URL**:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/practice_hub"
```

---

### Issue: Container keeps restarting

**Error**: `docker ps` shows container constantly restarting

**Solution**:

**Check logs**:
```bash
docker logs practice-hub-db

# Or follow logs in real-time:
docker logs -f practice-hub-db
```

**Common issues**:

**1. Invalid password**: Check docker-compose.yml password matches DATABASE_URL

**2. Volume permission issue**:
```bash
# Remove volume and recreate
docker compose down -v
docker compose up -d
```

---

## Testing Issues

### Issue: Tests fail with database errors

**Error**: `relation does not exist` in tests

**Cause**: Test database not set up correctly

**Solution**:

**Use in-memory database for tests** (better-sqlite3):
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ["./tests/setup.ts"],
  },
});

// tests/setup.ts
import { beforeEach } from "vitest";
import { db } from "@/lib/db";

beforeEach(async () => {
  // Reset database before each test
  await db.delete(clients);
  await db.delete(users);
  // ...
});
```

---

### Issue: Tests timeout

**Error**: `Test timed out after 5000ms`

**Cause**: Async operation not completing

**Solution**:

**Increase timeout**:
```typescript
it("fetches large dataset", async () => {
  const data = await fetchHugeDataset();
  expect(data).toBeDefined();
}, 10000);  // 10 second timeout
```

**Check for missing await**:
```typescript
// Bad
it("creates client", () => {
  const client = db.insert(clients).values(data);  // ❌ Missing await
  expect(client).toBeDefined();
});

// Good
it("creates client", async () => {
  const client = await db.insert(clients).values(data);  // ✅
  expect(client).toBeDefined();
});
```

---

## Performance Issues

### Issue: Slow page load

**Symptoms**: Page takes > 3 seconds to load

**Causes**:
1. Too many database queries
2. No caching
3. Large data returned
4. N+1 query problem

**Solutions**:

**1. Check number of queries**:
```typescript
// Bad: N+1 query (1 query for clients, N queries for managers)
const clients = await db.select().from(clientsTable);
for (const client of clients) {
  client.manager = await db.select().from(users)
    .where(eq(users.id, client.accountManagerId))
    .limit(1);
}

// Good: Single query with JOIN
const clients = await db
  .select({
    id: clientsTable.id,
    name: clientsTable.name,
    managerName: users.name,
  })
  .from(clientsTable)
  .leftJoin(users, eq(clientsTable.accountManagerId, users.id));
```

**2. Use database views**:
```typescript
// Instead of joining every time, use pre-computed view
const clients = await db.select().from(clientDetailsView);
// clientDetailsView has manager info pre-joined
```

**3. Add pagination**:
```typescript
// Bad: Return all 10,000 clients
const clients = await db.select().from(clientsTable);

// Good: Return 50 per page
const clients = await db.select().from(clientsTable)
  .limit(50)
  .offset(page * 50);
```

---

### Issue: Large bundle size

**Symptoms**: Slow initial page load

**Solution**:

**Check bundle size**:
```bash
pnpm build

# Look for large files in output:
# Route: /client-hub/clients [10.2 MB]  ← Too large!
```

**Fix**:

**1. Dynamic imports** for large components:
```typescript
// Before: Imported eagerly
import { HeavyChart } from "@/components/charts/HeavyChart";

// After: Lazy loaded
const HeavyChart = dynamic(() => import("@/components/charts/HeavyChart"), {
  loading: () => <div>Loading chart...</div>,
});
```

**2. Remove unused dependencies**:
```bash
# Find unused dependencies
npx depcheck

# Remove unused packages
pnpm remove unused-package
```

---

## UI and Styling Issues

### Issue: Tailwind classes not applying

**Symptoms**: Class in code but no styles in browser

**Causes**:
1. Class name typo
2. Tailwind not scanning file
3. Class conflicts

**Solutions**:

**1. Check class name**:
```typescript
// Common typos:
className="bg-primary"  // ✅ Correct
className="background-primary"  // ❌ Wrong
```

**2. Check file is scanned** (tailwind.config.ts):
```typescript
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",  // ← Add if needed
  ],
};
```

**3. Check for conflicts**:
```typescript
// Bad: Conflicting classes
className="text-red-500 text-blue-500"  // Blue wins (last class)

// Good: Conditional classes
className={isError ? "text-red-500" : "text-blue-500"}
```

---

### Issue: Dark mode not working

**Symptoms**: Dark mode toggle doesn't change styles

**Solution**:

**Check dark mode classes**:
```typescript
// Light and dark mode
className="bg-white dark:bg-slate-900 text-black dark:text-white"
```

**Check ThemeProvider** (if using next-themes):
```typescript
// app/layout.tsx
import { ThemeProvider } from "next-themes";

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## Debugging Tools and Techniques

### Browser DevTools

**React DevTools**:
- Install extension: https://react.dev/learn/react-developer-tools
- Inspect component props and state
- Profile performance

**Network Tab**:
- Monitor API requests
- Check request/response payloads
- Find slow requests

**Console**:
```typescript
// Debug variables
console.log("Client:", client);

// Debug with context
console.log({ client, user, tenantId });

// Conditional logging
if (process.env.NODE_ENV === "development") {
  console.log("Debug info:", data);
}
```

### Database Debugging

**Query logging** (enabled in dev):
```typescript
// lib/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";

export const db = drizzle(connection, {
  logger: process.env.NODE_ENV === "development",  // Log queries
});
```

**Direct database access**:
```bash
# Connect to database
docker exec -it practice-hub-db psql -U postgres -d practice_hub

# Run queries
practice_hub=# SELECT * FROM clients LIMIT 10;
practice_hub=# \dt  -- List tables
practice_hub=# \d clients  -- Describe clients table
```

### VS Code Debugging

**Launch configuration** (.vscode/launch.json):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev"
    }
  ]
}
```

**Set breakpoints**: Click left of line number, run debugger (F5)

---

## Getting Help

### Before Asking for Help

**1. Try basic troubleshooting**:
- Clear cache, restart dev server
- Check logs for errors
- Search this document

**2. Gather information**:
- What were you trying to do?
- What did you expect to happen?
- What actually happened?
- Error messages (full stack trace)
- Steps to reproduce

**3. Search existing resources**:
- This troubleshooting guide
- [FAQ](docs/user-guides/FAQ.md)
- GitHub issues
- Stack Overflow

### Where to Ask

**Internal team**:
- Slack: `#practice-hub-dev`
- Tag: `@tech-lead` for urgent issues

**External contributors**:
- GitHub Discussions
- GitHub Issues (for bugs)

### How to Ask

**Good question**:
```
I'm trying to create a new client via the tRPC router, but getting
"UNAUTHORIZED" error even though I'm signed in.

Steps to reproduce:
1. Sign in as admin@demo.com
2. Navigate to /client-hub/clients
3. Click "Create Client"
4. Fill form and submit
5. Error: "UNAUTHORIZED"

Code:
```typescript
const createMutation = trpc.clients.create.useMutation();
```

Error:
```
TRPCError: UNAUTHORIZED at ...
```

Expected: Client created successfully
Actual: Error thrown

Environment:
- OS: macOS 13.5
- Node: v20.10.0
- Browser: Chrome 118
```

**Bad question**:
```
It doesn't work. Help?
```

---

## Contributing to This Guide

Found a solution to an issue not covered here? Please add it!

**Steps**:
1. Add section to appropriate category
2. Use format: Issue → Cause → Solution
3. Include code examples
4. Submit PR

**Template**:
```markdown
### Issue: [Short description]

**Error**: [Error message if applicable]

**Cause**: [Why this happens]

**Solution**:

[Step-by-step solution with code examples]
```

---

**Last Updated**: 2025-10-10
**Maintained By**: Development Team
**Next Review**: 2026-01-10
