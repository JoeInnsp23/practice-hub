# Code Style Guide

**Last Updated**: 2025-10-10
**Version**: 1.0

This guide defines code style standards for Practice Hub. Following these standards ensures consistent, readable, and maintainable code across the project.

---

## Table of Contents

1. [General Principles](#general-principles)
2. [TypeScript Standards](#typescript-standards)
3. [React and Next.js Patterns](#react-and-nextjs-patterns)
4. [Naming Conventions](#naming-conventions)
5. [File Organization](#file-organization)
6. [Component Structure](#component-structure)
7. [Functions and Variables](#functions-and-variables)
8. [Comments and Documentation](#comments-and-documentation)
9. [Error Handling](#error-handling)
10. [Database Patterns](#database-patterns)
11. [Testing Patterns](#testing-patterns)
12. [Import Organization](#import-organization)
13. [Biome Configuration](#biome-configuration)

---

## General Principles

### Code Readability

**Priority**: Code is read more than it's written. Optimize for readability.

**Guidelines**:
- ✅ Write self-documenting code with clear names
- ✅ Keep functions small and focused (< 50 lines)
- ✅ Use early returns to reduce nesting
- ✅ Extract complex logic into named functions
- ✅ Add comments only when code alone is unclear

**Good**:
```typescript
function calculateProposalPrice(input: PricingInput): number {
  if (!input.basePrice) return 0;

  const complexityMultiplier = getComplexityMultiplier(input.complexity);
  const industryMultiplier = getIndustryMultiplier(input.industry);

  return input.basePrice * complexityMultiplier * industryMultiplier;
}
```

**Bad**:
```typescript
function calc(i: any): number {
  // Calculate price
  return i.bp * (i.c === "avg" ? 1.25 : 1.0) * (i.i === "const" ? 1.2 : 1.0);
}
```

### DRY (Don't Repeat Yourself)

**Avoid duplication**: Extract repeated code into reusable functions or components.

**Good**:
```typescript
// Reusable function
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

// Use everywhere
const price1 = formatCurrency(1500);
const price2 = formatCurrency(2500);
```

**Bad**:
```typescript
// Repeated code
const price1 = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
}).format(1500);

const price2 = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
}).format(2500);
```

### KISS (Keep It Simple, Stupid)

**Prefer simplicity**: Choose the simplest solution that solves the problem.

**Good**:
```typescript
function isActive(status: string): boolean {
  return status === "active";
}
```

**Bad**:
```typescript
function isActive(status: string): boolean {
  const activeStatuses = ["active"];
  return activeStatuses.includes(status) ? true : false;
}
```

---

## TypeScript Standards

### Strict Mode

**Always use strict mode**: Configured in `tsconfig.json`.

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### Type Annotations

**When to annotate**:
- ✅ Function parameters (always)
- ✅ Function return types (always)
- ✅ Complex variables (when type inference is unclear)
- ❌ Simple variables (let type inference work)

**Good**:
```typescript
// Function parameters and return type annotated
function calculatePrice(basePrice: number, multiplier: number): number {
  const total = basePrice * multiplier;  // Type inferred
  return total;
}

// Complex variable annotated
const config: PricingConfig = {
  complexityMultipliers: { clean: 1.0, average: 1.25 },
  industryMultipliers: { construction: 1.2, retail: 1.1 },
};
```

**Bad**:
```typescript
// Missing type annotations
function calculatePrice(basePrice, multiplier) {
  return basePrice * multiplier;
}

// Unnecessary annotation
const total: number = 100;  // Type obvious from value
```

### Avoid `any`

**Never use `any`**: Use proper types or `unknown` if truly dynamic.

**Good**:
```typescript
// Proper type
interface ApiResponse {
  data: Client[];
  total: number;
}

function handleResponse(response: ApiResponse): void {
  console.log(response.data);
}

// Unknown for truly dynamic data
function parseJson(json: string): unknown {
  return JSON.parse(json);
}
```

**Bad**:
```typescript
// Using any
function handleResponse(response: any): void {
  console.log(response.data);  // No type safety
}
```

### Interfaces vs Types

**Prefer interfaces** for object shapes:
```typescript
// Good: Interface for object shape
interface Client {
  id: string;
  name: string;
  email: string;
}
```

**Use types** for unions, intersections, or aliases:
```typescript
// Good: Type for union
type Status = "active" | "inactive" | "archived";

// Good: Type for intersection
type ClientWithMetadata = Client & {
  createdAt: Date;
  updatedAt: Date;
};

// Good: Type alias
type UserId = string;
```

### Enums vs Union Types

**Prefer union types** over enums:

**Good**:
```typescript
// Union type
type ClientStatus = "active" | "inactive" | "archived";

const status: ClientStatus = "active";
```

**Acceptable**:
```typescript
// Enum (only if need reverse mapping)
enum HttpStatus {
  OK = 200,
  BadRequest = 400,
  NotFound = 404,
}
```

### Null vs Undefined

**Prefer `null`** for intentional absence:
```typescript
// Good: null for "no account manager assigned"
interface Client {
  accountManagerId: string | null;
}

// Bad: undefined
interface Client {
  accountManagerId?: string;  // Optional field
}
```

**Use `undefined`** for optional parameters:
```typescript
// Good: Optional parameter
function fetchClients(limit?: number): Client[] {
  const actualLimit = limit ?? 10;  // Default to 10
  // ...
}
```

---

## React and Next.js Patterns

### Server Components (Default)

**Default to Server Components** (React 19 pattern):

```typescript
// app/clients/page.tsx - Server Component (no "use client")
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function ClientsPage() {
  const authContext = await getAuthContext();
  if (!authContext) redirect("/sign-in");

  // Fetch data on server
  const clientList = await db
    .select()
    .from(clients)
    .where(eq(clients.tenantId, authContext.tenantId));

  return <ClientsList clients={clientList} />;
}
```

**Use Client Components** only when needed:
- User interactions (forms, buttons)
- Client state (useState, useReducer)
- Browser APIs (localStorage, window)
- React hooks (useEffect, useCallback)

```typescript
// components/ClientsList.tsx - Client Component
"use client";  // ← Required for client components

import { useState } from "react";

export function ClientsList({ clients }: { clients: Client[] }) {
  const [search, setSearch] = useState("");

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} />
      {filtered.map((c) => <ClientCard key={c.id} client={c} />)}
    </div>
  );
}
```

### Component Props

**Define prop types** with interfaces:

```typescript
// Good: Explicit interface
interface ClientCardProps {
  client: Client;
  onEdit?: (id: string) => void;
  className?: string;
}

export function ClientCard({ client, onEdit, className }: ClientCardProps) {
  return (
    <div className={className}>
      <h3>{client.name}</h3>
      {onEdit && <Button onClick={() => onEdit(client.id)}>Edit</Button>}
    </div>
  );
}
```

**Destructure props** in function signature:

**Good**:
```typescript
export function ClientCard({ client, onEdit }: ClientCardProps) {
  // Use client.name, onEdit directly
}
```

**Bad**:
```typescript
export function ClientCard(props: ClientCardProps) {
  // Use props.client.name, props.onEdit
}
```

### Hooks Rules

**Custom hooks** start with `use`:

```typescript
// Good: Custom hook
function useClientSearch(clients: Client[]) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => clients.filter((c) => c.name.includes(search)),
    [clients, search]
  );

  return { search, setSearch, filtered };
}
```

**Hook dependencies**: Always specify dependencies correctly:

**Good**:
```typescript
useEffect(() => {
  fetchClients(tenantId);
}, [tenantId]);  // Correct dependency
```

**Bad**:
```typescript
useEffect(() => {
  fetchClients(tenantId);
}, []);  // Missing dependency
```

### Async Components

**Next.js 15** supports async Server Components:

```typescript
// Good: Async Server Component
export default async function ClientsPage() {
  const clients = await db.select().from(clientsTable);
  return <ClientsList clients={clients} />;
}
```

### Error Boundaries

**Use error.tsx** for error handling:

```typescript
// app/clients/error.tsx
"use client";

export default function ClientsError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

---

## Naming Conventions

### General Rules

**Use descriptive names**: Names should clearly indicate purpose.

**Good**:
```typescript
const accountManagerId = "user-123";
const isClientActive = status === "active";
const fetchClients = async () => { ... };
```

**Bad**:
```typescript
const amId = "user-123";
const flag = status === "active";
const getData = async () => { ... };
```

### Case Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Files** | kebab-case | `client-list.tsx` |
| **Components** | PascalCase | `ClientList` |
| **Functions** | camelCase | `fetchClients` |
| **Variables** | camelCase | `clientName` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_CLIENTS` |
| **Types/Interfaces** | PascalCase | `Client`, `ClientStatus` |
| **Database tables** | snake_case | `clients`, `client_contacts` |
| **tRPC routers** | camelCase | `clientsRouter` |

### Booleans

**Prefix with `is`, `has`, `should`, `can`**:

**Good**:
```typescript
const isActive = true;
const hasPermission = false;
const shouldFetch = true;
const canEdit = false;
```

**Bad**:
```typescript
const active = true;
const permission = false;
```

### Event Handlers

**Prefix with `on` or `handle`**:

**Good**:
```typescript
// Props (on-)
<Button onClick={onSubmit} />

// Component implementation (handle-)
function ClientForm() {
  const handleSubmit = (data: ClientData) => { ... };
  return <form onSubmit={handleSubmit} />;
}
```

### Arrays

**Use plural names**:

**Good**:
```typescript
const clients = await fetchClients();
const userIds = users.map((u) => u.id);
```

**Bad**:
```typescript
const clientList = await fetchClients();
const userIdArray = users.map((u) => u.id);
```

### Constants

**Use UPPER_SNAKE_CASE** for true constants:

```typescript
const MAX_CLIENTS_PER_PAGE = 50;
const API_BASE_URL = "https://api.example.com";
const DEFAULT_TIMEOUT_MS = 5000;
```

---

## File Organization

### File Naming

**Components**: PascalCase with `.tsx` extension
```
ClientCard.tsx
ClientsList.tsx
GlobalHeader.tsx
```

**Utilities**: camelCase with `.ts` extension
```
formatCurrency.ts
calculatePrice.ts
auth.ts
```

**Test files**: Same name with `.test.ts` suffix
```
ClientCard.test.tsx
formatCurrency.test.ts
```

### Directory Structure

**Group by feature**, not by type:

**Good**:
```
app/
├── client-hub/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── clients/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   └── components/
│       ├── ClientCard.tsx
│       └── ClientsList.tsx
```

**Bad**:
```
app/
├── layouts/
│   └── client-hub-layout.tsx
├── pages/
│   ├── clients.tsx
│   └── client-detail.tsx
└── components/
    ├── client-card.tsx
    └── clients-list.tsx
```

### Index Files

**Avoid `index.ts` exports** (except for `ui/` components):

**Good**:
```typescript
// Import directly
import { ClientCard } from "@/components/client-hub/ClientCard";
```

**Bad**:
```typescript
// components/client-hub/index.ts
export { ClientCard } from "./ClientCard";
export { ClientsList } from "./ClientsList";

// Import from index
import { ClientCard } from "@/components/client-hub";
```

**Exception**: shadcn/ui components use index:
```typescript
// components/ui/index.ts
export * from "./button";
export * from "./card";
```

---

## Component Structure

### Component Template

**Standard structure**:

```typescript
// 1. Imports (external, internal, types)
import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Client } from "@/lib/db/schema";

// 2. Types/Interfaces
interface ClientCardProps {
  client: Client;
  onEdit?: (id: string) => void;
}

// 3. Component
export function ClientCard({ client, onEdit }: ClientCardProps) {
  // 3a. Hooks
  const [isExpanded, setIsExpanded] = useState(false);

  // 3b. Derived state
  const displayName = client.name.toUpperCase();

  // 3c. Event handlers
  const handleEdit = () => {
    onEdit?.(client.id);
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  // 3d. Early returns
  if (!client) return null;

  // 3e. Render
  return (
    <Card>
      <CardHeader>
        <h3>{displayName}</h3>
        <Button onClick={handleToggle}>Toggle</Button>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <p>{client.email}</p>
          <Button onClick={handleEdit}>Edit</Button>
        </CardContent>
      )}
    </Card>
  );
}
```

### Component Size

**Keep components small**: < 150 lines

**Extract logic** when component grows:
```typescript
// Extract complex logic
function useClientData(clientId: string) {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchClient(clientId).then(setClient).finally(() => setIsLoading(false));
  }, [clientId]);

  return { client, isLoading };
}

// Use in component
export function ClientDetail({ clientId }: { clientId: string }) {
  const { client, isLoading } = useClientData(clientId);

  if (isLoading) return <Spinner />;
  if (!client) return <NotFound />;

  return <div>{client.name}</div>;
}
```

---

## Functions and Variables

### Function Declaration

**Use function declarations** for top-level functions:

**Good**:
```typescript
function calculatePrice(basePrice: number): number {
  return basePrice * 1.2;
}
```

**Use arrow functions** for callbacks and short functions:

**Good**:
```typescript
const doubled = numbers.map((n) => n * 2);
const handleClick = () => console.log("clicked");
```

### Function Parameters

**Limit parameters**: Max 3-4 parameters. Use object for more:

**Good**:
```typescript
// Object parameter
interface PricingInput {
  basePrice: number;
  complexity: string;
  industry: string;
  discounts: string[];
}

function calculatePrice(input: PricingInput): number {
  // ...
}
```

**Bad**:
```typescript
// Too many parameters
function calculatePrice(
  basePrice: number,
  complexity: string,
  industry: string,
  discount1: string,
  discount2: string,
  discount3: string,
): number {
  // ...
}
```

### Default Parameters

**Use default parameters** instead of `||`:

**Good**:
```typescript
function fetchClients(limit = 10): Promise<Client[]> {
  // ...
}
```

**Bad**:
```typescript
function fetchClients(limit: number): Promise<Client[]> {
  const actualLimit = limit || 10;
  // ...
}
```

### Arrow Functions

**Use arrow functions** for short callbacks:

**Good**:
```typescript
const doubled = numbers.map((n) => n * 2);
const isActive = (status: string) => status === "active";
```

**Don't use arrow functions** for top-level functions (harder to debug):

**Bad**:
```typescript
const calculatePrice = (basePrice: number): number => {
  // Long function body...
  return price;
};
```

---

## Comments and Documentation

### When to Comment

**Comment**:
- ✅ Complex algorithms (explain why, not what)
- ✅ Business logic (explain business rules)
- ✅ Workarounds (explain why workaround needed)
- ✅ TODOs (with issue number)

**Don't comment**:
- ❌ Obvious code (let code speak for itself)
- ❌ What code does (should be clear from names)

**Good**:
```typescript
// Calculate price with UK VAT rate (20%)
// Source: https://www.gov.uk/vat-rates
const totalWithVat = subtotal * 1.2;

// WORKAROUND: LEM Verify API sometimes returns 500 on valid requests
// Retry once before failing. Remove when API fixed.
// Issue: #456
if (response.status === 500) {
  return retry(request);
}
```

**Bad**:
```typescript
// Set price to 100
const price = 100;

// Loop through clients
for (const client of clients) {
  // ...
}
```

### JSDoc Comments

**Use JSDoc** for public APIs:

```typescript
/**
 * Calculate proposal price with complexity and industry multipliers.
 *
 * @param input - Pricing input parameters
 * @param input.basePrice - Base price before multipliers (£)
 * @param input.complexity - Complexity level (clean, average, complex, disaster)
 * @param input.industry - Industry type (affects multiplier)
 * @returns Final price after all multipliers applied (£)
 *
 * @example
 * ```typescript
 * const price = calculatePrice({
 *   basePrice: 1000,
 *   complexity: "average",
 *   industry: "construction"
 * });
 * // Returns: 1500 (1000 * 1.25 * 1.2)
 * ```
 */
export function calculatePrice(input: PricingInput): number {
  // ...
}
```

### TODOs

**Format**: `// TODO(issue-number): Description`

```typescript
// TODO(#123): Add caching for frequently accessed clients
// TODO(#456): Refactor this function when API v2 releases
// TODO(#789): Add error handling for edge case X
```

---

## Error Handling

### Try-Catch

**Catch specific errors**:

**Good**:
```typescript
try {
  const client = await fetchClient(id);
  return client;
} catch (error) {
  if (error instanceof NotFoundError) {
    return null;
  }
  if (error instanceof ValidationError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
    });
  }
  // Re-throw unknown errors
  throw error;
}
```

**Bad**:
```typescript
try {
  const client = await fetchClient(id);
  return client;
} catch (error) {
  // Swallow all errors
  return null;
}
```

### Error Messages

**Be descriptive**:

**Good**:
```typescript
throw new Error(`Client with ID ${id} not found in tenant ${tenantId}`);
throw new ValidationError("Email must be valid format");
```

**Bad**:
```typescript
throw new Error("Error");
throw new Error("Invalid input");
```

### Null Checks

**Use early returns**:

**Good**:
```typescript
function updateClient(client: Client | null, data: ClientData): Client {
  if (!client) {
    throw new Error("Client not found");
  }

  // Continue with update logic
  return { ...client, ...data };
}
```

**Bad**:
```typescript
function updateClient(client: Client | null, data: ClientData): Client {
  if (client) {
    return { ...client, ...data };
  } else {
    throw new Error("Client not found");
  }
}
```

---

## Database Patterns

### Query Structure

**Use Drizzle query builder**:

```typescript
import { db } from "@/lib/db";
import { clients, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// SELECT with WHERE and ORDER BY
const activeClients = await db
  .select()
  .from(clients)
  .where(
    and(
      eq(clients.tenantId, tenantId),
      eq(clients.status, "active")
    )
  )
  .orderBy(desc(clients.createdAt));

// JOIN
const clientsWithManagers = await db
  .select({
    clientId: clients.id,
    clientName: clients.name,
    managerName: users.name,
  })
  .from(clients)
  .leftJoin(users, eq(clients.accountManagerId, users.id))
  .where(eq(clients.tenantId, tenantId));
```

### Always Filter by Tenant

**CRITICAL**: All queries must filter by `tenantId`:

**Good**:
```typescript
const clients = await db
  .select()
  .from(clientsTable)
  .where(
    and(
      eq(clientsTable.tenantId, ctx.authContext.tenantId),  // ✅
      eq(clientsTable.status, "active")
    )
  );
```

**Bad**:
```typescript
const clients = await db
  .select()
  .from(clientsTable)
  .where(eq(clientsTable.status, "active"));  // ❌ Missing tenantId
```

### Transactions

**Use transactions** for multi-step operations:

```typescript
await db.transaction(async (tx) => {
  // Step 1: Create client
  const [client] = await tx.insert(clients).values(clientData).returning();

  // Step 2: Create contact
  await tx.insert(clientContacts).values({
    clientId: client.id,
    ...contactData,
  });

  // Step 3: Log activity
  await tx.insert(activityLogs).values({
    entityType: "client",
    entityId: client.id,
    action: "create",
  });
});
```

---

## Testing Patterns

### Test Structure

**Use AAA pattern**: Arrange, Act, Assert

```typescript
import { describe, it, expect, beforeEach } from "vitest";

describe("calculatePrice", () => {
  it("applies complexity multiplier correctly", () => {
    // Arrange
    const input = {
      basePrice: 1000,
      complexity: "average",
      industry: "standard",
    };

    // Act
    const result = calculatePrice(input);

    // Assert
    expect(result).toBe(1250);
  });
});
```

### Test Names

**Use descriptive names**:

**Good**:
```typescript
it("returns null when client not found");
it("applies 25% discount for volume orders");
it("throws error when tenant ID is invalid");
```

**Bad**:
```typescript
it("works");
it("test case 1");
it("should return correct value");
```

### Mocking

**Mock external dependencies**:

```typescript
import { vi } from "vitest";
import { fetchClient } from "@/lib/api";

// Mock module
vi.mock("@/lib/api", () => ({
  fetchClient: vi.fn(),
}));

// Test
it("handles API error gracefully", async () => {
  // Arrange
  vi.mocked(fetchClient).mockRejectedValue(new Error("API error"));

  // Act
  const result = await getClientData("client-123");

  // Assert
  expect(result).toBeNull();
});
```

---

## Import Organization

### Import Order

**Group imports** in this order:

```typescript
// 1. External packages
import { useState, useEffect } from "react";
import { z } from "zod";
import { eq } from "drizzle-orm";

// 2. Internal modules (absolute imports)
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { formatCurrency } from "@/lib/utils";

// 3. Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClientCard } from "@/components/client-hub/ClientCard";

// 4. Types
import type { Client } from "@/lib/db/schema";
import type { PricingInput } from "@/lib/types";
```

### Path Aliases

**Use `@/` alias** for absolute imports:

**Good**:
```typescript
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
```

**Bad**:
```typescript
import { db } from "../../lib/db";
import { Button } from "../../../components/ui/button";
```

---

## Biome Configuration

Practice Hub uses **Biome** for linting and formatting.

### Configuration

See `biome.json`:
```json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  }
}
```

### Commands

```bash
# Format code
pnpm lint

# Check without fixing
pnpm biome check

# Format specific file
pnpm biome format --write src/file.ts
```

### Editor Integration

**VS Code**: Install Biome extension
- Extension ID: `biomejs.biome`
- Format on save: Enabled

---

## Questions?

If you have questions about code style:
1. Check this guide first
2. Review existing codebase for examples
3. Ask in `#practice-hub-dev` Slack channel
4. Submit PR to update this guide

**Happy coding! 🚀**

---

**Last Updated**: 2025-10-10
**Maintained By**: Development Team
**Next Review**: 2026-01-10
