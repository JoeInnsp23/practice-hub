# System Architecture

This document provides a high-level overview of Practice Hub's system architecture, components, data flows, and integration points.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [System Components](#system-components)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Integration Points](#integration-points)
6. [Security Architecture](#security-architecture)
7. [Multi-Tenancy](#multi-tenancy)
8. [Scalability & Performance](#scalability--performance)

---

## Architecture Overview

Practice Hub is a multi-tenant SaaS application built on Next.js 15 with App Router architecture, using PostgreSQL for data storage and integrating with multiple third-party services for KYC/AML compliance, document processing, and communication.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         End Users                            │
│  (Staff: Admins, Members) | (Clients: Portal Access)       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Practice   │  │  Client    │  │  Admin     │            │
│  │    Hub     │  │   Portal   │  │   Panel    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│  ┌─────────────────────────────────────────────────┐       │
│  │          Better Auth (Authentication)           │       │
│  └─────────────────────────────────────────────────┘       │
│  ┌─────────────────────────────────────────────────┐       │
│  │             tRPC API Layer                       │       │
│  └─────────────────────────────────────────────────┘       │
└───────┬──────────────────────────┬──────────────────────────┘
        │                          │
        ▼                          ▼
┌──────────────────┐     ┌──────────────────────────────────┐
│   PostgreSQL     │     │   Third-Party Services           │
│    Database      │     │  ┌──────────────┐               │
│  ┌────────────┐  │     │  │ LEM Verify   │ (KYC/AML)    │
│  │Multi-Tenant│  │     │  │ Google Gemini│ (AI Extract) │
│  │   Tables   │  │     │  │ Resend       │ (Email)      │
│  │ (tenantId) │  │     │  │ Hetzner S3   │ (Storage)    │
│  └────────────┘  │     │  └──────────────┘               │
└──────────────────┘     └──────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router + Turbopack)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui (Radix UI primitives)
- **State Management**: React Query (TanStack Query) + tRPC
- **Forms**: React Hook Form + Zod validation
- **Notifications**: react-hot-toast

### Backend
- **Runtime**: Node.js (via Next.js API routes)
- **API Layer**: tRPC for type-safe APIs
- **Authentication**: Better Auth with email/password + Microsoft OAuth
- **Database**: PostgreSQL 14+ with Drizzle ORM
- **File Storage**: S3-compatible (MinIO local / Hetzner production)
- **Email**: Resend
- **AI**: Google Gemini 2.0 Flash
- **KYC/AML**: LEM Verify

### DevOps & Infrastructure
- **Hosting**: Coolify on Hetzner (or similar)
- **Database**: PostgreSQL (Docker container or managed)
- **Object Storage**: Hetzner S3 or MinIO
- **Monitoring**: Sentry (errors) + UptimeRobot (uptime)
- **Version Control**: Git (GitHub/GitLab)
- **CI/CD**: Platform-native (Coolify/Vercel)

### Code Quality
- **Linting/Formatting**: Biome
- **Testing**: Vitest (unit + API route tests)
- **Type Safety**: TypeScript strict mode

---

## System Components

### 1. Application Layer

#### Practice Hub (Main Dashboard)
- **Route**: `/`
- **Purpose**: Central dashboard for staff
- **Access**: Authenticated users only
- **Features**: Overview, quick actions, navigation

#### Client Hub
- **Route**: `/client-hub`
- **Purpose**: Client relationship management
- **Access**: Staff only (role-based)
- **Features**: Clients list, client details, services, contacts, compliance tracking

#### Admin Panel
- **Route**: `/admin`
- **Access**: Admin role only
- **Features**: User management, KYC review queue, system settings, portal links

#### Client Portal
- **Route**: `/client-portal`
- **Purpose**: External client access
- **Access**: Client users only
- **Features**: Onboarding, document upload, KYC verification, dashboard

### 2. Authentication Layer (Better Auth)

**Features**:
- Email/password authentication with bcrypt
- Microsoft OAuth (personal + work accounts)
- Session management (database-backed)
- CSRF protection
- Multi-tenant user assignment

**Key Files**:
- `lib/auth.ts` - Auth configuration
- `lib/auth-client.ts` - Client-side auth hooks
- `app/api/auth/[...all]/route.ts` - Auth API endpoint
- `middleware.ts` - Route protection

### 3. Data Layer (PostgreSQL + Drizzle ORM)

**Key Tables**:
- **Core**: `tenants`, `users`, `session`, `account`
- **CRM**: `clients`, `leads`, `contacts`
- **KYC**: `kyc_verifications`, `onboarding_sessions`, `onboarding_responses`
- **Operations**: `tasks`, `time_entries`, `workflows`, `invoices`
- **Audit**: `activity_logs`
- **Portal**: `portal_categories`, `portal_links`, `client_portal_users`

**Multi-Tenancy**: All business tables have `tenantId` foreign key for data isolation

**Key Files**:
- `lib/db/schema.ts` - Database schema definitions
- `lib/db/index.ts` - Database client
- `drizzle.config.ts` - Drizzle configuration

### 4. API Layer (tRPC)

**Architecture**:
- Type-safe APIs with full TypeScript support
- Context-based authentication (session + tenant info)
- Middleware for auth, admin checks
- Superjson for data serialization

**Key Routers**:
- `clientsRouter` - Client CRUD operations
- `onboardingRouter` - KYC/AML onboarding flow
- `usersRouter` - User management (admin)
- `portalRouter` - Client portal operations

**Key Files**:
- `app/server/trpc.ts` - tRPC setup, procedures, middleware
- `app/server/context.ts` - Request context (session, auth)
- `app/server/routers/` - All API routers

### 5. External Integrations

#### LEM Verify (KYC/AML)
- **Purpose**: Identity verification + AML screening
- **Integration**: REST API + Webhooks
- **Key Files**: `lib/kyc/lemverify-client.ts`, `app/api/webhooks/lemverify/route.ts`

#### Google Gemini AI (Document Extraction)
- **Purpose**: Extract data from identity documents
- **Integration**: REST API (Gemini 2.0 Flash model)
- **Key Files**: `lib/ai/extract-client-data.ts`, `lib/ai/questionnaire-prefill.ts`

#### Resend (Email)
- **Purpose**: Transactional emails (KYC status, notifications)
- **Integration**: REST API
- **Key Files**: `lib/email/kyc-emails.ts`

#### Hetzner S3 (Object Storage)
- **Purpose**: Store identity documents, generated PDFs
- **Integration**: S3-compatible API
- **Key Files**: `lib/s3/upload.ts`

---

## Data Flow Diagrams

### KYC/AML Onboarding Flow

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Upload identity document (POST /api/onboarding/upload-documents)
       ▼
┌─────────────────────────────────────────┐
│          Next.js API Route              │
│  ┌─────────────────────────────────┐   │
│  │ 1a. Upload to S3                 │──┐│
│  │ 1b. Call Gemini AI to extract    │  ││
│  │     data from document            │◀─┘│
│  │ 1c. Save extracted data to DB    │   │
│  └─────────────────────────────────┘   │
└───────────────┬─────────────────────────┘
                │
                │ 2. Return pre-filled data
                ▼
┌─────────────────────────────────────┐
│  Client reviews and completes       │
│  questionnaire (5 categories)       │
└──────┬──────────────────────────────┘
       │
       │ 3. Submit questionnaire (tRPC: submitQuestionnaire)
       ▼
┌─────────────────────────────────────────┐
│       tRPC Onboarding Router            │
│  ┌─────────────────────────────────┐   │
│  │ 3a. Save responses to DB         │   │
│  │ 3b. Call LEM Verify API to       │──┐│
│  │     create verification           │  ││
│  │ 3c. Store verification URL       │◀─┘│
│  └─────────────────────────────────┘   │
└───────────────┬─────────────────────────┘
                │
                │ 4. Return verification URL
                ▼
┌─────────────────────────────────────┐
│  Client clicks link to LEM Verify   │
│  Completes biometric verification   │
└──────────────────────────────────────┘
                │
                │ 5. LEM Verify sends webhook
                ▼
┌─────────────────────────────────────────────┐
│     Webhook Handler (POST /api/webhooks/   │
│     lemverify)                              │
│  ┌───────────────────────────────────────┐ │
│  │ 5a. Verify HMAC signature             │ │
│  │ 5b. Update kyc_verifications table    │ │
│  │ 5c. Check auto-approval criteria:     │ │
│  │     - outcome = "pass"                 │ │
│  │     - aml_status = "clear"             │ │
│  │ 5d. If eligible: Auto-approve          │ │
│  │     - Update onboarding_sessions       │ │
│  │     - Convert lead to client           │ │
│  │     - Grant portal access              │ │
│  │ 5e. Send email notification            │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Authentication Flow (Better Auth + Microsoft OAuth)

```
┌──────────────┐
│    User      │
│  (Browser)   │
└──────┬───────┘
       │
       │ 1. Click "Sign in with Microsoft"
       ▼
┌──────────────────────────────────────┐
│  Better Auth (lib/auth.ts)           │
│  Redirects to Microsoft OAuth        │
└──────┬───────────────────────────────┘
       │
       │ 2. Microsoft consent screen
       ▼
┌──────────────────────────────────────┐
│     Microsoft Entra ID               │
│  User authenticates with Microsoft   │
└──────┬───────────────────────────────┘
       │
       │ 3. OAuth callback with code
       ▼
┌─────────────────────────────────────────────┐
│   Better Auth Callback                      │
│   (POST /api/auth/callback/microsoft)       │
│  ┌───────────────────────────────────────┐ │
│  │ 3a. Exchange code for tokens          │ │
│  │ 3b. Get user profile from Microsoft   │ │
│  │ 3c. Check if user exists in DB        │ │
│  │ 3d. If not: Redirect to /oauth-setup  │ │
│  │ 3e. If yes: Create session            │ │
│  └───────────────────────────────────────┘ │
└──────┬──────────────────────────────────────┘
       │
       │ 4a. New user: Organization setup
       ▼
┌──────────────────────────────────────┐
│  /oauth-setup page                   │
│  User fills organization details     │
└──────┬───────────────────────────────┘
       │
       │ 4b. Submit (POST /api/oauth-setup)
       ▼
┌─────────────────────────────────────────────┐
│  ┌───────────────────────────────────────┐ │
│  │ 4b1. Create tenant                    │ │
│  │ 4b2. Create user with tenantId        │ │
│  │ 4b3. Link OAuth account               │ │
│  │ 4b4. Create session                   │ │
│  └───────────────────────────────────────┘ │
└──────┬──────────────────────────────────────┘
       │
       │ 5. Redirect to dashboard
       ▼
┌──────────────────────────────────────┐
│     Practice Hub Dashboard           │
│  User authenticated and ready        │
└──────────────────────────────────────┘
```

---

## Integration Points

### Inbound (Webhooks)

| Source | Endpoint | Purpose | Security |
|--------|----------|---------|----------|
| LEM Verify | `/api/webhooks/lemverify` | KYC verification status updates | HMAC-SHA256 signature |
| DocuSeal | `/api/webhooks/docuseal` | E-signature status updates | HMAC signature |

### Outbound (API Calls)

| Service | Purpose | Authentication | Rate Limits |
|---------|---------|----------------|-------------|
| LEM Verify | Create verifications, get status | API Key (Bearer token) | Unknown (monitor usage) |
| Google Gemini | AI document extraction | API Key | 60 requests/minute |
| Resend | Send transactional emails | API Key (Bearer token) | 100 emails/day (free), unlimited (paid) |
| Hetzner S3 | Upload/download documents | Access Key + Secret Key | No explicit limits |
| Microsoft Graph | OAuth user profile | OAuth access token | Varies by endpoint |

---

## Security Architecture

### Authentication & Authorization

**Authentication Methods**:
1. Email/Password (bcrypt hashing, 10 rounds)
2. Microsoft OAuth (OpenID Connect)

**Session Management**:
- Database-backed sessions (Better Auth)
- HTTP-only cookies
- CSRF protection via state parameter

**Authorization Levels**:
- **Admin**: Full system access, user management, KYC approval
- **Member**: Access to practice hub, clients, tasks (tenant-scoped)
- **Client**: Access to client portal only (own data)

**Route Protection**:
- Middleware (`middleware.ts`) enforces authentication
- Server-side role checks in layouts and API routes
- tRPC middleware for protected procedures

### Data Security

**Encryption**:
- **In Transit**: HTTPS/TLS for all connections
- **At Rest**: Database encryption (provider-managed)
- **Secrets**: Environment variables, never in code

**Data Isolation**:
- Multi-tenancy via `tenantId` foreign key
- All queries filtered by tenant
- No cross-tenant data access

**Sensitive Data Handling**:
- PII logged minimally, sanitized in logs
- Documents stored in S3 with access controls
- Activity logs for compliance audit trail

### API Security

**Rate Limiting**:
- Implemented on critical endpoints (login, document upload)
- IP-based tracking
- Configurable thresholds

**Input Validation**:
- Zod schemas for all API inputs
- File type and size validation
- SQL injection prevention (parameterized queries via Drizzle)

**Webhook Security**:
- HMAC signature verification (SHA256)
- Replay attack prevention (timestamp check)
- No sensitive data in webhook payloads

---

## Multi-Tenancy

### Tenant Isolation

**Database Level**:
```sql
-- All business tables have tenantId
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  -- other fields
);

-- All queries filtered by tenant
SELECT * FROM clients WHERE tenant_id = $1;
```

**Application Level**:
```typescript
// Auth context automatically includes tenant
const authContext = await getAuthContext();
// authContext.tenantId always populated

// All tRPC procedures have tenant context
export const clientsRouter = router({
  list: protectedProcedure.query(({ ctx }) => {
    return db
      .select()
      .from(clients)
      .where(eq(clients.tenantId, ctx.authContext.tenantId));
  }),
});
```

**UI Level**:
- Users only see data from their tenant
- No UI elements for cross-tenant operations
- Tenant name displayed in header

### Tenant Management

**Creating a Tenant**:
1. User signs up via OAuth or email
2. Prompted for organization details
3. Tenant record created
4. User assigned to tenant with role
5. Can invite additional users

**User Assignment**:
- Users belong to exactly one tenant
- Roles assigned per user per tenant
- No cross-tenant user access

---

## Scalability & Performance

### Current Capacity

**Expected Load** (MVP/early production):
- Users: < 100 concurrent
- Requests: < 1000 req/minute
- Database: < 10 GB
- S3 Storage: < 100 GB

**Bottlenecks to Monitor**:
- Database connection pool (default: 20)
- AI extraction rate limits (60/min)
- Email sending rate limits (varies by plan)

### Scaling Strategies

**Vertical Scaling** (Increase server resources):
- Upgrade database instance (more CPU/RAM)
- Upgrade application server
- **When**: CPU > 80%, memory > 80%, disk I/O high

**Horizontal Scaling** (Add more servers):
- Multiple Next.js application instances (load balanced)
- Read replicas for database
- CDN for static assets
- **When**: Single server at capacity, need geographic distribution

**Database Optimization**:
- Indexes on frequently queried columns (tenantId, email, status)
- Materialized views for complex reports
- Connection pooling (PgBouncer)
- Query optimization (EXPLAIN ANALYZE)

**Caching**:
- Redis for session data, rate limiting
- CDN for static assets (Cloudflare, Vercel Edge)
- In-memory caching for expensive queries

### Performance Targets

| Metric | Target | Current (Estimate) |
|--------|--------|--------------------|
| Homepage Load Time | < 1s | ~800ms |
| API Response (p95) | < 500ms | ~300ms |
| Database Query (p95) | < 100ms | ~50ms |
| Document Upload | < 5s | ~3s |
| AI Extraction | < 10s | ~5-7s |

---

## Deployment Architecture

### Production Environment (Coolify/Hetzner)

```
┌────────────────────────────────────────────┐
│           Hetzner Cloud                    │
│  ┌──────────────────────────────────────┐ │
│  │  Coolify (Docker-based)              │ │
│  │  ┌────────────┐  ┌────────────────┐ │ │
│  │  │  Next.js   │  │   PostgreSQL   │ │ │
│  │  │    App     │  │   Container    │ │ │
│  │  └────────────┘  └────────────────┘ │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │   Hetzner S3 Object Storage          │ │
│  │   (practice-hub-onboarding bucket)   │ │
│  └──────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

### CI/CD Pipeline

1. Developer pushes code to `main` branch
2. GitHub/GitLab triggers webhook to Coolify
3. Coolify pulls latest code
4. Runs `pnpm build`
5. Creates Docker image
6. Deploys container (zero-downtime rollout)
7. Health check passes
8. Traffic routed to new version

**Rollback**: Revert git commit, trigger redeploy

---

## Further Reading

- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Production deployment steps
- [Operational Runbooks](./operations/RUNBOOKS.md) - Day-to-day operations
- [Monitoring Strategy](./operations/MONITORING.md) - Observability and alerting
- [Backup & Recovery](./operations/BACKUP_RECOVERY.md) - Disaster recovery
- [LEM Verify Integration](./kyc/LEMVERIFY_INTEGRATION.md) - KYC/AML details

---

**Document Version**: 1.0
**Last Updated**: 2025-10-10
**Maintained By**: Development Team
