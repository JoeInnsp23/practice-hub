---
title: "Coding Standards & Conventions"
category: "architecture"
subcategory: "development"
purpose: "Comprehensive coding standards and best practices for Practice Hub development"
audience: ["ai-agent", "developer"]
prerequisites: ["tech-stack.md", "source-tree.md"]
related: ["design-system.md", "api-design.md"]
last_updated: "2025-10-21"
version: "1.0"
status: "current"
owner: "architecture-team"
tags: ["coding-standards", "best-practices", "conventions", "patterns"]
---

# Coding Standards & Conventions

**Quick Summary**: This document defines coding standards, patterns, and best practices for Practice Hub development. All code must follow these conventions for consistency, maintainability, and AI agent compatibility.

**Last Updated**: 2025-10-21 | **Version**: 1.0 | **Status**: Current

**Authority**: These standards supplement the critical rules in `CLAUDE.md`. When conflicts arise, `CLAUDE.md` takes precedence.

---

## What This Document Covers

- TypeScript conventions
- React patterns (Server/Client components)
- tRPC API patterns
- Database query patterns
- UI component standards
- Error handling and logging
- Testing practices
- File organization
- Import conventions

---

## Critical Rules (from CLAUDE.md)

These rules are **MANDATORY** and override any conflicting patterns:

1. ✅ **Always use shadcn/ui components first** - Check for existing components before creating custom ones
2. ✅ **Use react-hot-toast for notifications** - No other toast libraries
3. ✅ **Always commit when todo list complete** - Git commit after task completion
4. ✅ **Light/dark theme alignment** - Consistent theming across all modules
5. ❌ **Never run pnpm dev** - User runs dev server manually
6. ✅ **Follow Critical Design Elements** - Glass-card design system (see Design System section)
7. ✅ **Use docker v2 commands** - Always use docker v2 syntax
8. ✅ **Always read entire files** - Review full context before changes
9. ❌ **Never use quick fixes** - Complete fixes only, including schema updates
10. ❌ **Database is in dev - NO MIGRATIONS** - Update `lib/db/schema.ts` directly
11. ✅ **Update seed data after schema changes** - Immediately update `scripts/seed.ts`
12. ✅ **CRITICAL: Database Reset Procedure** - Always use `pnpm db:reset` (never manual commands)
13. ✅ **Use Practice Hub Skills** - Invoke skills via Skill tool, not directly
14. ✅ **Error Tracking & Logging Policy** - Use Sentry, not console.error (see Error Handling section)

---

## TypeScript Conventions

### Strict Mode

**Requirement**: All TypeScript must compile in strict mode.

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

**Guidelines**:
- ❌ Never use `any` - use `unknown` if type is truly unknown
- ✅ Prefer interfaces over type aliases for object shapes
- ✅ Use explicit return types for exported functions
- ✅ Prefer `const` over `let`, never use `var`

---

### Type Definitions

**Interface Naming**:
```typescript
// ✅ CORRECT
interface AuthContext {
  userId: string;
  tenantId: string;
  role: string;
}

interface ClientFormData {
  name: string;
  email: string;
}

// ❌ WRONG
interface IAuthContext { } // Don't use "I" prefix
interface authContext { }  // Don't use camelCase
```

**Type Aliases for Unions**:
```typescript
// ✅ CORRECT
type ClientStatus = "prospect" | "onboarding" | "active" | "inactive";
type UserRole = "admin" | "accountant" | "member";

// Use for complex unions
type ID = string | number;
```

**Generic Types**:
```typescript
// ✅ CORRECT - Descriptive generic names
type ApiResponse<TData> = {
  data: TData;
  error: string | null;
};

// ❌ WRONG - Single letter generics (except standard cases)
type ApiResponse<T> = { ... }; // Use only for simple utilities
```

---

### Null Safety

**Always handle null/undefined**:
```typescript
// ✅ CORRECT
const userName = authContext?.firstName ?? "Unknown";
if (client) {
  console.log(client.name);
}

// ❌ WRONG
const userName = authContext!.firstName; // Never use non-null assertion
```

---

## React Patterns

### Server vs. Client Components

**Default to Server Components** (Next.js 15 App Router):
```typescript
// ✅ CORRECT - Server Component (default)
// app/client-hub/page.tsx
import { getAuthContext } from "@/lib/auth";

export default async function ClientHubPage() {
  const authContext = await getAuthContext();
  // Direct database access, async operations
  return <ClientHubDashboard />;
}
```

**Use Client Components only when required**:
```typescript
// ✅ CORRECT - Client Component (interactivity)
"use client";
import { useState } from "react";
import { toast } from "react-hot-toast";

export function ClientModal() {
  const [isOpen, setIsOpen] = useState(false);
  // Interactive UI, browser APIs, React hooks
}
```

**When to use "use client"**:
- ✅ Interactive UI (onClick, onChange, forms)
- ✅ React hooks (useState, useEffect, useContext)
- ✅ Browser APIs (localStorage, window, navigator)
- ✅ Event listeners
- ✅ Third-party interactive libraries

**When to use Server Components**:
- ✅ Data fetching
- ✅ Direct database access
- ✅ Authentication checks
- ✅ Static content
- ✅ SEO-critical content

---

### Component Structure

**Functional Components Only**:
```typescript
// ✅ CORRECT
export function ClientCard({ client }: { client: Client }) {
  return <Card>...</Card>;
}

// ❌ WRONG
export const ClientCard: React.FC<Props> = ({ client }) => { }; // Don't use React.FC
class ClientCard extends React.Component { } // No class components
```

**Props Interface**:
```typescript
// ✅ CORRECT - Inline for simple components
export function Button({ children, variant }: {
  children: React.ReactNode;
  variant?: "default" | "outline";
}) {
  return <button>{children}</button>;
}

// ✅ CORRECT - Separate interface for complex components
interface ClientWizardProps {
  clientId?: string;
  onComplete: (client: Client) => void;
  initialData?: Partial<Client>;
}

export function ClientWizard({ clientId, onComplete, initialData }: ClientWizardProps) {
  // ...
}
```

**Component Organization**:
```typescript
// 1. Imports (grouped and organized)
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/components/ui";
import { trpc } from "@/lib/trpc/client";

// 2. Type definitions
interface Props { }

// 3. Component
export function MyComponent(props: Props) {
  // 3a. Hooks (top of function, never conditional)
  const router = useRouter();
  const [state, setState] = useState();
  const mutation = trpc.clients.create.useMutation();

  // 3b. Effects
  useEffect(() => { }, []);

  // 3c. Event handlers
  const handleSubmit = () => { };

  // 3d. Render
  return <div>...</div>;
}

// 4. Sub-components (if needed)
function SubComponent() { }
```

---

### Hooks Usage

**Rules of Hooks**:
```typescript
// ✅ CORRECT
function MyComponent() {
  const [count, setCount] = useState(0);
  const { data } = trpc.clients.list.useQuery();

  return <div>{count}</div>;
}

// ❌ WRONG - Conditional hooks
function MyComponent({ showData }) {
  if (showData) {
    const { data } = trpc.clients.list.useQuery(); // ❌ Never conditional
  }
}

// ❌ WRONG - Hooks in loops
function MyComponent({ items }) {
  items.forEach(item => {
    const [state] = useState(); // ❌ Never in loops
  });
}
```

**Custom Hooks**:
```typescript
// ✅ CORRECT - use-* naming
// lib/hooks/use-debounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

---

## tRPC API Patterns

### Router Structure

**Standard Router Pattern**:
```typescript
// app/server/routers/clients.ts
import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const clientsRouter = router({
  // Query pattern
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(["active", "inactive"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Always filter by tenantId for multi-tenancy
      const results = await db
        .select()
        .from(clients)
        .where(
          and(
            eq(clients.tenantId, tenantId),
            input.status ? eq(clients.status, input.status) : undefined
          )
        );

      return { clients: results };
    }),

  // Mutation pattern
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx.authContext;

      const [newClient] = await db
        .insert(clients)
        .values({
          id: crypto.randomUUID(),
          tenantId, // Always include tenantId
          createdBy: userId,
          ...input,
        })
        .returning();

      return { client: newClient };
    }),
});
```

**Procedure Types**:
```typescript
// Public (no auth required)
export const healthRouter = router({
  ping: publicProcedure.query(() => ({ status: "ok" })),
});

// Protected (staff authentication)
export const clientsRouter = router({
  list: protectedProcedure.query(({ ctx }) => {
    // ctx.authContext available
  }),
});

// Admin only
export const usersRouter = router({
  delete: adminProcedure
    .input(z.string())
    .mutation(({ ctx, input }) => {
      // ctx.authContext.role === "admin"
    }),
});

// Client portal
export const portalRouter = router({
  getProposals: clientPortalProcedure.query(({ ctx }) => {
    // ctx.clientPortalAuthContext available
  }),
});
```

---

### Input Validation

**Always use Zod for input validation**:
```typescript
// ✅ CORRECT
const updateClientInput = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone").optional(),
  status: z.enum(["active", "inactive", "onboarding"]),
});

.input(updateClientInput)

// ❌ WRONG - No validation
.input(z.any()) // Never use z.any()
.mutation(({ input }) => {
  // No type safety
});
```

**Complex Validation**:
```typescript
// ✅ CORRECT - Refinements for complex validation
const proposalInput = z.object({
  clientId: z.string().uuid(),
  services: z.array(z.object({
    serviceId: z.string(),
    quantity: z.number().min(1),
  })).min(1, "At least one service required"),
  validUntil: z.string().datetime(),
}).refine(
  (data) => new Date(data.validUntil) > new Date(),
  { message: "Valid until must be in the future" }
);
```

---

### Multi-Tenant Query Patterns

**ALWAYS filter by tenantId**:
```typescript
// ✅ CORRECT
const clients = await db
  .select()
  .from(clientsTable)
  .where(eq(clientsTable.tenantId, ctx.authContext.tenantId));

// ❌ WRONG - Missing tenant filter (security vulnerability)
const clients = await db.select().from(clientsTable);
```

**Client Portal (dual isolation)**:
```typescript
// ✅ CORRECT - Both tenantId and clientId
const proposals = await db
  .select()
  .from(proposalsTable)
  .where(
    and(
      eq(proposalsTable.tenantId, ctx.clientPortalAuthContext.tenantId),
      eq(proposalsTable.clientId, ctx.clientPortalAuthContext.clientId)
    )
  );
```

---

### Error Handling in tRPC

**Use TRPCError for expected errors**:
```typescript
// ✅ CORRECT
import { TRPCError } from "@trpc/server";

delete: protectedProcedure
  .input(z.string())
  .mutation(async ({ ctx, input: id }) => {
    const [client] = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.id, id),
          eq(clients.tenantId, ctx.authContext.tenantId)
        )
      );

    if (!client) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Client not found",
      });
    }

    // Check for dependencies
    const hasInvoices = await db.query.invoices.findFirst({
      where: eq(invoices.clientId, id),
    });

    if (hasInvoices) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Cannot delete client with existing invoices",
      });
    }

    await db.delete(clients).where(eq(clients.id, id));

    return { success: true };
  }),
```

**Error Codes**:
- `BAD_REQUEST` - Invalid input
- `UNAUTHORIZED` - No authentication
- `FORBIDDEN` - No permission
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Duplicate resource
- `PRECONDITION_FAILED` - Business rule violation
- `INTERNAL_SERVER_ERROR` - Unexpected error
- `TOO_MANY_REQUESTS` - Rate limit exceeded

---

## Database Query Patterns

### Drizzle ORM Conventions

**Select Queries**:
```typescript
// ✅ CORRECT - Explicit select
const clients = await db
  .select({
    id: clientsTable.id,
    name: clientsTable.name,
    email: clientsTable.email,
  })
  .from(clientsTable)
  .where(eq(clientsTable.tenantId, tenantId));

// ✅ CORRECT - Full row
const clients = await db
  .select()
  .from(clientsTable)
  .where(eq(clientsTable.tenantId, tenantId));
```

**Joins**:
```typescript
// ✅ CORRECT - Inner join with explicit select
const clientsWithManager = await db
  .select({
    id: clients.id,
    name: clients.name,
    accountManagerName: users.firstName,
    accountManagerEmail: users.email,
  })
  .from(clients)
  .innerJoin(users, eq(clients.accountManagerId, users.id))
  .where(eq(clients.tenantId, tenantId));

// ✅ CORRECT - Left join (nullable)
const clientsWithOptionalManager = await db
  .select({
    id: clients.id,
    name: clients.name,
    accountManagerName: users.firstName, // Can be null
  })
  .from(clients)
  .leftJoin(users, eq(clients.accountManagerId, users.id))
  .where(eq(clients.tenantId, tenantId));
```

**Insert**:
```typescript
// ✅ CORRECT - With returning
const [newClient] = await db
  .insert(clients)
  .values({
    id: crypto.randomUUID(),
    tenantId,
    name: "Client Name",
  })
  .returning();

// ✅ CORRECT - Bulk insert
await db.insert(clients).values([
  { id: crypto.randomUUID(), tenantId, name: "Client 1" },
  { id: crypto.randomUUID(), tenantId, name: "Client 2" },
]);
```

**Update**:
```typescript
// ✅ CORRECT - With tenant check
const [updated] = await db
  .update(clients)
  .set({ name: "New Name" })
  .where(
    and(
      eq(clients.id, clientId),
      eq(clients.tenantId, tenantId) // Security: verify tenant
    )
  )
  .returning();

if (!updated) {
  throw new TRPCError({ code: "NOT_FOUND" });
}
```

**Delete**:
```typescript
// ✅ CORRECT - With tenant check
const [deleted] = await db
  .delete(clients)
  .where(
    and(
      eq(clients.id, clientId),
      eq(clients.tenantId, tenantId)
    )
  )
  .returning();

if (!deleted) {
  throw new TRPCError({ code: "NOT_FOUND" });
}
```

**Transactions**:
```typescript
// ✅ CORRECT - Use db.transaction for multi-step operations
await db.transaction(async (tx) => {
  const [client] = await tx
    .insert(clients)
    .values({ ... })
    .returning();

  await tx.insert(clientContacts).values({
    clientId: client.id,
    ...contactData,
  });
});
```

---

### Query Helpers

**Reusable Queries** (lib/db/queries/):
```typescript
// lib/db/queries/client-queries.ts
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq, and, like } from "drizzle-orm";

export async function getClientsList(
  tenantId: string,
  filters?: { search?: string; status?: string }
) {
  let query = db.select().from(clients).where(eq(clients.tenantId, tenantId));

  if (filters?.search) {
    query = query.where(like(clients.name, `%${filters.search}%`));
  }

  if (filters?.status) {
    query = query.where(eq(clients.status, filters.status));
  }

  return await query;
}
```

---

## UI Component Standards

### Design System (Glass-Card)

**CRITICAL**: Follow glass-card design system (from CLAUDE.md):

```typescript
// ✅ CORRECT - Use glass-card class
import { Card } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Client Details</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>

// ❌ WRONG - Inline styles
<div className="bg-card border rounded-lg">...</div>
```

**Module Colors**:
```typescript
// Client Hub: #3b82f6 (blue)
<GlobalHeader headerColor="#3b82f6" />

// Admin Panel: #f97316 (orange)
<GlobalHeader headerColor="#f97316" />

// Practice Hub: Primary theme color
<GlobalHeader />
```

### UI Rules – Brand & Tokens (Practice Hub)

These UI rules make the product feel precise, warm, and easy while keeping a distinctive look across hubs.

- Personality: precise, warm, easy
- Typeface: Outfit (all tiers)
- Surfaces: Hybrid — bordered-flat in product UI; glass reserved for landing/hero and select highlights
- Accents: Use `HUB_COLORS` and `getHubGradient` for module accents; avoid full-bleed brand backgrounds
- Animated border: Keep the existing animated accent rail on interactive cards
- Density: Medium (balanced information density and whitespace)

#### Corner Radius Tokens (authoritative)

Token source of truth:
```60:68:/root/projects/practice-hub/app/globals.css
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --radius: 0.5rem;
```

- Base radius: 0.5rem (8px)
- Derived radii: sm 4px, md 6px, lg 8px, xl 12px
- Standardization for medium-density product UI:
  - Product cards, tables, panels: `--radius-lg` (8px)
  - Landing/marketing highlights: `--radius-xl` (12px)
  - Small controls (badges, chips): `--radius-sm` or `--radius-md`

Implementation notes:
- Prefer CSS variables over hardcoded Tailwind radii when building custom classes
- Core interactive card (`.card-interactive`) uses `--radius-lg` to match medium density

#### Hub Gradient Tokens

Use hub-scoped gradients for consistent lighter/darker accents and soft tints.

```306:325:/root/projects/practice-hub/app/globals.css
  /* Hub gradient utilities */
  .bg-hub-rail {
    background: var(--hub-gradient-rail);
  }

  .bg-hub-cta {
    background: var(--hub-gradient-cta);
    color: #fff;
  }

  .bg-hub-soft {
    background: var(--hub-gradient-soft);
  }

  .text-hub-gradient {
    background: var(--hub-gradient-dim);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
```

Variables (auto-derived from hub color):
```334:354:/root/projects/practice-hub/app/globals.css
[data-hub-root] {
  --hub-color-400: color-mix(in oklch, var(--hub-color) 88%, white 12%);
  --hub-color-500: var(--hub-color);
  --hub-color-600: color-mix(in oklch, var(--hub-color) 90%, black 10%);
  --hub-color-700: color-mix(in oklch, var(--hub-color) 80%, black 20%);
  --hub-soft-50: color-mix(in oklch, var(--hub-color-500) 6%, white 94%);
  --hub-soft-100: color-mix(in oklch, var(--hub-color-500) 12%, white 88%);
  --hub-gradient-rail: linear-gradient(90deg, var(--hub-color-500), var(--hub-color-600));
  --hub-gradient-cta: linear-gradient(90deg, var(--hub-color-500), var(--hub-color-700));
  --hub-gradient-dim: linear-gradient(90deg, var(--hub-color-400), var(--hub-color-500));
  --hub-gradient-soft: linear-gradient(180deg, var(--hub-soft-50), var(--hub-soft-100));
}
```

Usage guidelines:
- Accent rails/badges: `.bg-hub-rail`
- Stronger CTA strips/hero chips: `.bg-hub-cta`
- Soft section backgrounds: `.bg-hub-soft`
- Gradient headings: `.text-hub-gradient`

#### Motion (gentle)

- Duration: 160–220ms (ease-out cubic-bezier(0.2, 0.0, 0, 1))
- Amplitude: low; emphasize clarity over flair
- Respect `prefers-reduced-motion`; disable non-essential transforms

#### Multi-Hub Colors

Use the centralized mapping and gradient utility:
```26:33:/root/projects/practice-hub/lib/utils/hub-colors.ts
export const HUB_COLORS = {
  "client-hub": "#3b82f6", // Blue
  admin: "#f97316", // Orange
  "employee-hub": "#10b981", // Emerald
  "proposal-hub": "#ec4899", // Pink
  "social-hub": "#8b5cf6", // Purple
  "practice-hub": "#2563eb", // Default blue
} as const;
```

Guidelines:
- Use hub color for focus rings, small rails, and indicators; avoid flooding surfaces
- Use `getHubGradient(color)` for the animated accent bar only

### Finalized UI Rules (authoritative)

- Personality: precise, warm, easy
- Typeface: Outfit (all text tiers)
- Surfaces: Hybrid — bordered/flat in product UI; glass used for landing/hero or highlights; keep animated border on interactive elements
- Density: Medium; radii from tokens (`--radius-lg` default for cards/panels)
- Motion: Gentle 160–220ms ease-out; low amplitude; respect reduced motion
- Icons: Duotone with subtle gradient (hub accent fill + base), 1.5px rounded stroke; fall back to outline ≤16px
- Tables: Hairline row dividers with hover highlight (current `TableRow` pattern)
- Buttons: Solid accent (flat) as primary; inherits hub color via `data-hub-root`
- Inputs: Soft filled (neutral background tint), hub-accent focus ring
- Focus: Hub-accent halo; ring derives from hub color
- Header/Sidebar: Follow current pattern (neutral surfaces with hub accent indicators via `GlobalHeader`/`GlobalSidebar`)
- Gradients: Use hub tokens
  - Rails/badges: `.bg-hub-rail`
  - Strong strips/hero chips: `.bg-hub-cta`
  - Soft section backgrounds: `.bg-hub-soft`
  - Gradient text: `.text-hub-gradient`



**Solid Backgrounds (no transparency)**:
```css
/* ✅ CORRECT */
background: rgb(255, 255, 255);
background: rgb(30, 41, 59);

/* ❌ WRONG */
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(10px);
```

**Layout Gradients**:
```typescript
// ✅ CORRECT
<div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800">
  {children}
</div>
```

---

### shadcn/ui Usage

**Always prefer shadcn/ui over custom components**:
```typescript
// ✅ CORRECT
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";

<Button variant="outline" size="sm">Click me</Button>

// ❌ WRONG - Custom button when shadcn exists
<button className="px-4 py-2 rounded">Click me</button>
```

**Available Components** (30+):
- Button, Input, Label, Textarea
- Card, Dialog, AlertDialog, Sheet
- Select, Checkbox, Switch, RadioGroup
- Table, Tabs, Badge, Avatar
- Popover, DropdownMenu, Separator
- Calendar, Progress, Skeleton
- And more in `components/ui/`

---

### Form Patterns

**React Hook Form + Zod**:
```typescript
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

type FormData = z.infer<typeof formSchema>;

export function ClientForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

---

### Checklist Components

**CRITICAL Pattern** (from CLAUDE.md):
```typescript
// ✅ CORRECT - Completed item
<div className="bg-muted/50 border-green-200 dark:border-green-900 border rounded-lg p-4">
  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
  <span className="line-through text-muted-foreground">Task name</span>
</div>

// ✅ CORRECT - Uncompleted item
<div className="border-border border rounded-lg p-4">
  <Circle className="h-6 w-6 text-muted-foreground hover:text-primary flex-shrink-0 transition-colors" />
  <span>Task name</span>
</div>
```

---

## Error Handling & Logging

### Sentry Error Tracking

**CRITICAL** (from CLAUDE.md):

**❌ NEVER use console.error in production**:
```typescript
// ❌ WRONG
try {
  await operation();
} catch (error) {
  console.error("Error:", error); // NOT tracked, leaks to logs
}
```

**✅ ALWAYS use Sentry.captureException**:
```typescript
// ✅ CORRECT
import * as Sentry from "@sentry/nextjs";
import toast from "react-hot-toast";

try {
  await operation();
} catch (error) {
  Sentry.captureException(error, {
    tags: { operation: "create_client" },
    extra: {
      userId: ctx.authContext.userId,
      tenantId: ctx.authContext.tenantId,
    },
  });

  toast.error("Failed to create client");
  throw error; // Re-throw if needed
}
```

**Exceptions where console.error is acceptable**:
1. Webhook handlers (external integrations need visible debugging)
2. API route handlers for webhook signature verification failures
3. Development-only code paths:
   ```typescript
   if (process.env.NODE_ENV === "development") {
     console.error("Dev debug:", error);
   }
   ```

**tRPC Error Tracking**:
```typescript
// ✅ CORRECT - Automatic tracking in tRPC middleware
// app/server/trpc.ts already handles this
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    if (
      error.code !== "UNAUTHORIZED" &&
      error.code !== "FORBIDDEN" &&
      error.cause instanceof Error
    ) {
      captureTRPCError(error.cause, shape.data.path || "unknown");
    }
    return shape;
  },
});
```

---

### Toast Notifications

**CRITICAL**: Use `react-hot-toast` only (from CLAUDE.md):

```typescript
import toast from "react-hot-toast";

// ✅ CORRECT
toast.success("Client created successfully!");
toast.error("Failed to save changes");
toast.loading("Saving...");

// Promise-based
toast.promise(
  saveClient(),
  {
    loading: "Saving...",
    success: "Client saved!",
    error: "Failed to save",
  }
);

// ❌ WRONG - Other libraries
import { useToast } from "some-other-library"; // Don't use
```

---

## Testing Patterns

### Vitest Unit Tests

**File Naming**: `{filename}.test.ts`

**Test Structure**:
```typescript
// lib/cache.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { createCache } from "./cache";

describe("createCache", () => {
  let cache: ReturnType<typeof createCache>;

  beforeEach(() => {
    cache = createCache();
  });

  it("should store and retrieve values", () => {
    cache.set("key", "value");
    expect(cache.get("key")).toBe("value");
  });

  it("should return null for missing keys", () => {
    expect(cache.get("missing")).toBeNull();
  });
});
```

**tRPC Router Tests**:
```typescript
// app/server/routers/clients.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { createCallerFactory } from "@trpc/server";
import { clientsRouter } from "./clients";
import { db } from "@/lib/db";

const createCaller = createCallerFactory(clientsRouter);

describe("clientsRouter", () => {
  it("should list clients for tenant", async () => {
    const ctx = {
      authContext: {
        userId: "user-1",
        tenantId: "tenant-1",
        role: "admin",
      },
    };

    const caller = createCaller(ctx);
    const result = await caller.list({ search: "" });

    expect(result.clients).toBeInstanceOf(Array);
  });
});
```

---

## File Organization

### Import Order

**Standard import order**:
```typescript
// 1. React and Next.js
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// 2. Third-party libraries
import { z } from "zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

// 3. UI components (@/components/ui)
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

// 4. Shared components
import { GlobalHeader } from "@/components/shared/GlobalHeader";

// 5. Feature components
import { ClientCard } from "@/components/client-hub/clients/client-card";

// 6. tRPC and API
import { trpc } from "@/lib/trpc/client";

// 7. Database and lib
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";

// 8. Utilities
import { cn } from "@/lib/utils";

// 9. Types
import type { Client } from "@/lib/db/schema";
```

**Use import path aliases**:
```typescript
// ✅ CORRECT
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

// ❌ WRONG
import { db } from "../../../lib/db";
import { Button } from "../../components/ui/button";
```

---

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| React Components | PascalCase.tsx | `ClientModal.tsx` |
| Pages | page.tsx | `page.tsx`, `layout.tsx` |
| API Routes | route.ts | `route.ts` |
| Utilities | kebab-case.ts | `format-currency.ts` |
| Hooks | use-*.ts | `use-debounce.ts` |
| Types | PascalCase.ts | `ClientTypes.ts` |
| Constants | kebab-case.ts | `work-types.ts` |
| Tests | *.test.ts | `cache.test.ts` |

---

## Database Schema Conventions

### Schema Updates (Development)

**CRITICAL** (from CLAUDE.md):

1. ❌ **NEVER create migration files** during development
2. ✅ **Update `lib/db/schema.ts` directly**
3. ✅ **Update `scripts/seed.ts` immediately after schema changes**
4. ✅ **Always use `pnpm db:reset`** to apply changes

**Workflow**:
```bash
# 1. Update lib/db/schema.ts
# 2. Update scripts/seed.ts
# 3. Reset database
pnpm db:reset  # ONLY use this command
```

---

### Schema Patterns

**Multi-Tenancy**:
```typescript
// ✅ CORRECT - Staff access (tenant isolation)
export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(), // REQUIRED
  name: text("name").notNull(),
  // ...
});

// ✅ CORRECT - Client portal access (dual isolation)
export const clientPortalProposals = pgTable("client_portal_proposals", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .references(() => tenants.id)
    .notNull(), // REQUIRED
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(), // REQUIRED
  // ...
});
```

**Enums**:
```typescript
// ✅ CORRECT - Use pgEnum
export const clientStatusEnum = pgEnum("client_status", [
  "prospect",
  "onboarding",
  "active",
  "inactive",
]);

export const clients = pgTable("clients", {
  status: clientStatusEnum("status").default("onboarding").notNull(),
});
```

**Timestamps**:
```typescript
// ✅ CORRECT - Always include timestamps
createdAt: timestamp("created_at").defaultNow().notNull(),
updatedAt: timestamp("updated_at")
  .defaultNow()
  .$onUpdate(() => new Date())
  .notNull(),
```

---

## Performance Best Practices

### Database Performance

**Use Indexes**:
```typescript
// ✅ CORRECT - Add indexes for frequently queried columns
export const clients = pgTable(
  "clients",
  { /* ... */ },
  (table) => ({
    tenantIdx: index("idx_clients_tenant").on(table.tenantId),
    statusIdx: index("idx_clients_status").on(table.status),
    emailIdx: index("idx_clients_email").on(table.email),
  })
);
```

**Limit Results**:
```typescript
// ✅ CORRECT - Use limit for large datasets
const recentClients = await db
  .select()
  .from(clients)
  .where(eq(clients.tenantId, tenantId))
  .orderBy(desc(clients.createdAt))
  .limit(50);
```

---

### React Performance

**Memoization**:
```typescript
// ✅ CORRECT - Memo for expensive components
import { memo } from "react";

export const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  // Expensive rendering logic
  return <div>...</div>;
});

// ✅ CORRECT - useMemo for expensive calculations
const sortedData = useMemo(
  () => data.sort((a, b) => a.name.localeCompare(b.name)),
  [data]
);

// ✅ CORRECT - useCallback for stable function references
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

---

## Security Best Practices

### Authentication Checks

**Server Components**:
```typescript
// ✅ CORRECT - Check auth in server component
import { getAuthContext } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const authContext = await getAuthContext();

  if (!authContext) {
    redirect("/sign-in");
  }

  // Page content
}
```

**API Routes (tRPC)**:
```typescript
// ✅ CORRECT - Use protectedProcedure
export const router = {
  getData: protectedProcedure.query(({ ctx }) => {
    // ctx.authContext guaranteed to exist
  }),
};
```

---

### Input Sanitization

**Never trust user input**:
```typescript
// ✅ CORRECT - Validate with Zod
const input = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
}).parse(userInput);

// ❌ WRONG - Direct use
const name = userInput.name; // No validation
```

---

## Documentation

### Code Comments

**When to comment**:
- ✅ Complex business logic
- ✅ Non-obvious workarounds
- ✅ Important architectural decisions
- ✅ Security-critical code

**When NOT to comment**:
- ❌ Self-explanatory code
- ❌ Obvious variable names
- ❌ Standard patterns

```typescript
// ✅ CORRECT - Explains why, not what
// WORKAROUND: DocuSeal webhook signature verification fails with body-parser
// Must use raw body. See: https://github.com/docuseal/docuseal/issues/123
const rawBody = await request.text();

// ❌ WRONG - States the obvious
// Get client by ID
const client = await getClientById(id);
```

---

### JSDoc for Public APIs

```typescript
// ✅ CORRECT - Document exported functions
/**
 * Calculate lead score based on multiple factors
 * @param lead - Lead object with scoring data
 * @returns Score between 0-100
 */
export function calculateLeadScore(lead: Lead): number {
  // Implementation
}
```

---

## Summary Checklist

**Before submitting code, verify**:

- [ ] TypeScript compiles with no errors (strict mode)
- [ ] All imports use `@/*` aliases
- [ ] Multi-tenant queries include `tenantId` filter
- [ ] Errors use Sentry (not console.error)
- [ ] Toast notifications use react-hot-toast
- [ ] UI uses shadcn/ui components
- [ ] Forms use React Hook Form + Zod
- [ ] Database changes include seed data updates
- [ ] Tests pass (`pnpm test`)
- [ ] Code follows glass-card design system
- [ ] No `any` types
- [ ] No quick fixes or patches

---

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - Critical development rules (AUTHORITY)
- [Tech Stack](tech-stack.md) - Technology inventory
- [Source Tree](source-tree.md) - Directory structure
- [Design System](design-system.md) - Glass-card design patterns
- [API Design](api-design.md) - tRPC patterns
- [Multi-Tenancy](multi-tenancy.md) - Data isolation patterns

---

**For questions or updates, contact the architecture team.**
