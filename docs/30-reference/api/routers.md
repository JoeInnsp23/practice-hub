---
title: tRPC Routers Reference
description: Complete API reference for all tRPC routers and procedures
audience: dev
status: complete
generated: HYBRID
---

# tRPC Routers Reference

<!-- BEGIN AI-GENERATED -->
**Total Routers**: {{repo-facts.routers.total}}
**Total Procedures**: {{repo-facts.routers.procedures.total}} ({{repo-facts.routers.procedures.queries}} queries / {{repo-facts.routers.procedures.mutations}} mutations)

**AI Summary**: This section will be auto-updated by docs-maintainer skill based on router changes.
<!-- END AI-GENERATED -->

---

<!-- HUMAN-AUTHORED SECTION -->

This document provides an overview of Practice Hub's APIs, including tRPC procedures, webhook endpoints, and authentication patterns.

## Table of Contents

1. [tRPC API Overview](#trpc-api-overview)
2. [Authentication](#authentication)
3. [Core Routers](#core-routers)
4. [Webhook Endpoints](#webhook-endpoints)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)

---

## tRPC API Overview

Practice Hub uses tRPC for type-safe API calls between client and server. All procedures are fully typed, providing autocomplete and compile-time type checking.

### Base URL

- **Development**: `http://localhost:3000/api/trpc`
- **Production**: `https://app.innspiredaccountancy.com/api/trpc`

### Request Format

tRPC uses HTTP POST with JSON payloads. Requests are batched for efficiency.

```typescript
// Client-side usage (automatic)
import { trpc } from "@/lib/trpc/client";

const clients = await trpc.clients.list.query();
const newClient = await trpc.clients.create.mutate({ name: "John Doe", email: "john@example.com" });
```

### Response Format

```json
{
  "result": {
    "data": { /* query result */ }
  }
}
```

### Error Format

```json
{
  "error": {
    "message": "Unauthorized",
    "code": "UNAUTHORIZED",
    "data": {
      "code": "UNAUTHORIZED",
      "httpStatus": 401
    }
  }
}
```

---

## Authentication

### Public Procedures

No authentication required. Used for health checks and public data.

```typescript
// Example: Public health check
export const healthRouter = router({
  check: publicProcedure.query(() => {
    return { status: "healthy", timestamp: new Date() };
  }),
});
```

### Protected Procedures

Require authenticated user session. Automatically include tenant context.

```typescript
// Authenticated user required
export const clientsRouter = router({
  list: protectedProcedure.query(({ ctx }) => {
    // ctx.session.user contains user info
    // ctx.authContext contains tenant info
    return db.select().from(clients).where(eq(clients.tenantId, ctx.authContext.tenantId));
  }),
});
```

### Admin Procedures

Require authenticated user with admin role.

```typescript
// Admin role required
export const usersRouter = router({
  list: adminProcedure.query(({ ctx }) => {
    // Only admins can access
    return db.select().from(users).where(eq(users.tenantId, ctx.authContext.tenantId));
  }),
});
```

### Context

All procedures have access to:

```typescript
interface Context {
  session: Session | null;  // Better Auth session
  authContext: AuthContext | null;  // Tenant + role info
}

interface AuthContext {
  userId: string;
  tenantId: string;
  organizationName?: string;
  role: string;  // "admin" | "member"
  email: string;
  firstName: string | null;
  lastName: string | null;
}
```

---

## Core Routers

### Clients Router (`clientsRouter`)

**Base**: `/api/trpc/clients`

#### `clients.list` (Query)

List all clients for current tenant.

**Access**: Protected
**Parameters**: None
**Returns**: `Client[]`

```typescript
const clients = await trpc.clients.list.query();
```

#### `clients.getById` (Query)

Get single client by ID.

**Access**: Protected
**Parameters**: `{ id: string }`
**Returns**: `Client | null`

```typescript
const client = await trpc.clients.getById.query({ id: "client-123" });
```

#### `clients.create` (Mutation)

Create new client.

**Access**: Protected
**Parameters**: `CreateClientInput`
**Returns**: `{ success: boolean, client: Client }`

```typescript
const result = await trpc.clients.create.mutate({
  name: "John Doe",
  email: "john@example.com",
  phone: "+44 20 1234 5678",
  companyName: "Acme Ltd",
  // ... more fields
});
```

#### `clients.update` (Mutation)

Update existing client.

**Access**: Protected
**Parameters**: `{ id: string, ...UpdateClientInput }`
**Returns**: `{ success: boolean, client: Client }`

```typescript
const result = await trpc.clients.update.mutate({
  id: "client-123",
  name: "Jane Doe",
  email: "jane@example.com",
});
```

#### `clients.delete` (Mutation)

Delete client (soft delete).

**Access**: Protected
**Parameters**: `{ id: string }`
**Returns**: `{ success: boolean }`

```typescript
await trpc.clients.delete.mutate({ id: "client-123" });
```

---

### Onboarding Router (`onboardingRouter`)

**Base**: `/api/trpc/onboarding`

#### `onboarding.getSession` (Query)

Get onboarding session by ID.

**Access**: Public (uses session ID as auth)
**Parameters**: `{ sessionId: string }`
**Returns**: `OnboardingSession | null`

```typescript
const session = await trpc.onboarding.getSession.query({ sessionId: "session-123" });
```

#### `onboarding.getResponses` (Query)

Get questionnaire responses for session.

**Access**: Public (uses session ID as auth)
**Parameters**: `{ sessionId: string }`
**Returns**: `Record<string, QuestionnaireField>`

```typescript
const responses = await trpc.onboarding.getResponses.query({ sessionId: "session-123" });
```

#### `onboarding.saveResponses` (Mutation)

Save questionnaire responses.

**Access**: Public (uses session ID as auth)
**Parameters**: `{ sessionId: string, responses: Record<string, any> }`
**Returns**: `{ success: boolean }`

```typescript
await trpc.onboarding.saveResponses.mutate({
  sessionId: "session-123",
  responses: {
    firstName: { value: "John", extractedFromAi: true, verifiedByUser: true },
    lastName: { value: "Doe", extractedFromAi: true, verifiedByUser: true },
    // ... more fields
  },
});
```

#### `onboarding.submitQuestionnaire` (Mutation)

Submit completed questionnaire and initiate KYC verification.

**Access**: Public (uses session ID as auth)
**Parameters**: `{ sessionId: string }`
**Returns**: `{ success: boolean, verificationUrl: string }`

```typescript
const result = await trpc.onboarding.submitQuestionnaire.mutate({
  sessionId: "session-123",
});

// Redirect client to result.verificationUrl
window.location.href = result.verificationUrl;
```

---

### Users Router (`usersRouter`)

**Base**: `/api/trpc/users`

#### `users.list` (Query)

List all users in tenant.

**Access**: Admin
**Parameters**: None
**Returns**: `User[]`

```typescript
const users = await trpc.users.list.query();
```

#### `users.create` (Mutation)

Create new user (invite).

**Access**: Admin
**Parameters**: `CreateUserInput`
**Returns**: `{ success: boolean, user: User }`

```typescript
await trpc.users.create.mutate({
  email: "newuser@example.com",
  firstName: "New",
  lastName: "User",
  role: "member",
});
```

#### `users.updateRole` (Mutation)

Update user role.

**Access**: Admin
**Parameters**: `{ userId: string, role: string }`
**Returns**: `{ success: boolean }`

```typescript
await trpc.users.updateRole.mutate({
  userId: "user-123",
  role: "admin",
});
```

---

### Portal Router (`portalRouter`)

**Base**: `/api/trpc/portal`

#### `portal.getLinks` (Query)

Get portal links for category.

**Access**: Protected
**Parameters**: `{ categoryId?: string }`
**Returns**: `PortalLink[]`

```typescript
const links = await trpc.portal.getLinks.query({ categoryId: "cat-123" });
```

#### `portal.getCategories` (Query)

Get all portal categories.

**Access**: Protected
**Parameters**: None
**Returns**: `PortalCategory[]`

```typescript
const categories = await trpc.portal.getCategories.query();
```

---

## Webhook Endpoints

### LEM Verify Webhook

**Endpoint**: `POST /api/webhooks/lemverify`

**Purpose**: Receive KYC verification status updates from LEM Verify.

**Authentication**: HMAC-SHA256 signature in `x-lemverify-signature` header

**Payload Example**:
```json
{
  "id": "verification-123",
  "clientRef": "client-456",
  "status": "completed",
  "outcome": "pass",
  "documentVerification": {
    "verified": true,
    "documentType": "passport",
    "extractedData": {
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1990-01-15",
      "documentNumber": "123456789"
    }
  },
  "facematch": {
    "result": "pass",
    "score": 95
  },
  "liveness": {
    "result": "pass",
    "score": 98
  },
  "amlScreening": {
    "status": "clear",
    "pepMatch": false,
    "sanctionsMatch": false,
    "watchlistMatch": false,
    "adverseMediaMatch": false
  },
  "updatedAt": "2025-10-10T12:00:00Z"
}
```

**Response**:
- `200 OK`: Webhook processed successfully
- `401 Unauthorized`: Invalid signature
- `400 Bad Request`: Invalid payload
- `500 Internal Server Error`: Processing error

**Security**:
```typescript
// Signature verification
const signature = request.headers.get("x-lemverify-signature");
const body = await request.text();
const expectedSignature = crypto
  .createHmac("sha256", process.env.LEMVERIFY_WEBHOOK_SECRET!)
  .update(body)
  .digest("hex");

if (signature !== expectedSignature) {
  return Response.json({ error: "Invalid signature" }, { status: 401 });
}
```

### DocuSeal Webhook

**Endpoint**: `POST /api/webhooks/docuseal`

**Purpose**: Receive e-signature status updates from DocuSeal.

**Authentication**: HMAC signature in `x-docuseal-signature` header

**Payload Example**:
```json
{
  "event": "submission.completed",
  "data": {
    "id": "submission-123",
    "documentId": "doc-456",
    "status": "completed",
    "signedAt": "2025-10-10T12:00:00Z"
  }
}
```

**Response**: Same as LEM Verify webhook

---

## Error Handling

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | User not authenticated |
| `FORBIDDEN` | 403 | User lacks required permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `BAD_REQUEST` | 400 | Invalid input data |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |
| `CONFLICT` | 409 | Resource already exists |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |

### Error Response Structure

```typescript
interface TRPCError {
  message: string;  // Human-readable error message
  code: string;     // Error code (from table above)
  data: {
    code: string;
    httpStatus: number;
    path?: string;  // tRPC procedure path
    stack?: string; // Stack trace (development only)
  };
}
```

### Error Handling Example

```typescript
try {
  const client = await trpc.clients.getById.query({ id: "invalid-id" });
} catch (error) {
  if (error.data?.code === "NOT_FOUND") {
    console.error("Client not found");
  } else if (error.data?.code === "UNAUTHORIZED") {
    router.push("/sign-in");
  } else {
    console.error("Unexpected error:", error.message);
  }
}
```

---

## Rate Limiting

### Default Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Authentication endpoints | 10 requests | 15 minutes per IP |
| Document upload | 20 requests | 1 hour per IP |
| Webhook endpoints | 100 requests | 1 minute per IP |
| General API | 1000 requests | 1 hour per user |

### Rate Limit Response

**HTTP Status**: `429 Too Many Requests`

**Headers**:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1699999999
Retry-After: 900
```

**Response Body**:
```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfter": 900
}
```

### Implementation Example

```typescript
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  const rateLimit = checkRateLimit(ip, {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
  });

  if (!rateLimit.success) {
    return Response.json(
      { error: "Too many requests", retryAfter: rateLimit.resetTime },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rateLimit.resetTime?.toString() || "",
          "Retry-After": Math.ceil((rateLimit.resetTime! - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  // Process request...
}
```

---

## API Versioning

Currently, Practice Hub does not use API versioning as the tRPC API is internal (not public). Any breaking changes require coordinated client/server deployment.

**Future Considerations**:
- If exposing public API, use versioning (e.g., `/api/v1/trpc`)
- Maintain backwards compatibility for at least 6 months
- Deprecation warnings in responses

---

## Testing APIs

### Development Environment

```typescript
// Set up test client
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/app/server/root";

const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:3000/api/trpc",
      headers: {
        // Include session cookie if testing protected endpoints
        cookie: "session=...",
      },
    }),
  ],
});

// Test query
const clients = await client.clients.list.query();
console.log(clients);
```

### Using curl (Webhooks)

```bash
# Test LEM Verify webhook (with signature)
PAYLOAD='{"id":"test-123","status":"completed","outcome":"pass"}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$LEMVERIFY_WEBHOOK_SECRET" | cut -d' ' -f2)

curl -X POST http://localhost:3000/api/webhooks/lemverify \
  -H "Content-Type: application/json" \
  -H "x-lemverify-signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

---

## Further Reading

- [System Architecture](./SYSTEM_ARCHITECTURE.md) - How APIs fit into overall architecture
- [Operational Runbooks](./operations/RUNBOOKS.md) - Troubleshooting API issues
- [tRPC Documentation](https://trpc.io/) - Official tRPC docs
- [Better Auth Documentation](https://www.better-auth.com/) - Authentication patterns

---

**Document Version**: 1.0
**Last Updated**: 2025-10-10
**Maintained By**: Development Team

**Feedback**: For API additions or changes, please contact dev@innspiredaccountancy.com
