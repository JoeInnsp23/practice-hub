# Database Schema Documentation

Complete reference for Practice Hub's PostgreSQL database schema.

---

## Table of Contents

1. [Overview](#overview)
2. [Database Design Principles](#database-design-principles)
3. [Table Categories](#table-categories)
4. [Core Authentication & Tenancy](#core-authentication--tenancy)
5. [CRM Tables](#crm-tables)
6. [Operations Tables](#operations-tables)
7. [Financial Tables](#financial-tables)
8. [Proposal & Pricing System](#proposal--pricing-system)
9. [Onboarding & KYC System](#onboarding--kyc-system)
10. [Client Portal System](#client-portal-system)
11. [Portal Management](#portal-management)
12. [Support Tables](#support-tables)
13. [Database Views](#database-views)
14. [Enums Reference](#enums-reference)
15. [Indexes & Performance](#indexes--performance)
16. [Multi-Tenancy Patterns](#multi-tenancy-patterns)
17. [Sample Queries](#sample-queries)

---

## Overview

Practice Hub uses PostgreSQL 14+ with Drizzle ORM for schema management. The database implements a **multi-tenant architecture** where all tenant data is isolated via `tenantId` foreign keys.

### Key Statistics

- **50+ Tables**: Core entities, integrations, and support tables
- **15+ Enums**: Type-safe status values and categories
- **8 Views**: Pre-joined data for dashboards and reports
- **Multi-Tenancy**: All tables reference `tenants.id` for data isolation
- **Better Auth**: Integrated authentication with staff and client portals

### Schema Location

- **Schema Definition**: `lib/db/schema.ts`
- **Migrations**: `drizzle/` directory
- **Seed Data**: `scripts/seed.ts`

---

## Database Design Principles

### 1. Multi-Tenancy

All tenant-specific data includes a `tenantId` column:

```typescript
tenantId: text("tenant_id")
  .references(() => tenants.id, { onDelete: "cascade" })
  .notNull()
```

**Cascade deletion** ensures all tenant data is removed when a tenant is deleted.

### 2. UUID Primary Keys

Most tables use UUIDs for security and distributed systems compatibility:

```typescript
id: uuid("id").defaultRandom().primaryKey()
```

**Exception**: Better Auth tables and `users` table use text IDs for compatibility.

### 3. Timestamps

All tables include audit timestamps:

```typescript
createdAt: timestamp("created_at").defaultNow().notNull()
updatedAt: timestamp("updated_at")
  .defaultNow()
  .$onUpdate(() => new Date())
  .notNull()
```

### 4. Soft Deletes

Most tables use status fields or `isActive` flags instead of hard deletes:

```typescript
isActive: boolean("is_active").default(true).notNull()
status: clientStatusEnum("status").default("active").notNull()
```

### 5. JSONB Metadata

Flexible metadata storage for extensibility:

```typescript
metadata: jsonb("metadata") // Store custom fields without schema changes
```

### 6. Denormalization

Strategic denormalization for performance:
- User names cached in activity logs
- Client names in task/invoice views
- Snapshot data in proposal services

---

## Table Categories

Tables are organized into logical groups:

| Category | Tables | Purpose |
|----------|--------|---------|
| **Core** | 7 tables | Authentication, tenancy, users |
| **CRM** | 6 tables | Clients, contacts, directors, PSCs |
| **Operations** | 8 tables | Tasks, time tracking, documents, workflows |
| **Financial** | 4 tables | Invoices, services, pricing |
| **Proposals** | 8 tables | Leads, proposals, pricing system |
| **Onboarding** | 5 tables | KYC/AML, questionnaires |
| **Client Portal** | 5 tables | External client access |
| **Portal** | 4 tables | Link management, categories |
| **Support** | 6 tables | Permissions, activity logs, feedback |
| **Views** | 8 views | Pre-joined data for performance |

---

## Core Authentication & Tenancy

### `tenants`

Organization/practice information for multi-tenancy.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | text | Primary key (text for Better Auth compatibility) |
| `name` | text | Organization name |
| `slug` | text | Unique URL-friendly identifier |
| `metadata` | jsonb | Pricing config, tenant-specific settings |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Unique index on `slug`

**Usage**:
```sql
-- Get tenant by slug
SELECT * FROM tenants WHERE slug = 'innspired-accountancy';
```

---

### `users`

Staff users with Better Auth integration.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | text | Primary key (Better Auth compatible) |
| `tenantId` | text | Foreign key to `tenants` |
| `email` | text | Unique email address |
| `emailVerified` | boolean | Email verification status |
| `name` | text | Display name |
| `firstName` | varchar(100) | First name |
| `lastName` | varchar(100) | Last name |
| `image` | text | Profile image URL |
| `role` | varchar(50) | Role: admin, accountant, member |
| `status` | varchar(20) | Status: pending, active, inactive |
| `isActive` | boolean | Active status |
| `hourlyRate` | decimal(10,2) | Default hourly billing rate |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Unique index on `(tenantId, email)`
- Index on `role`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)

**Multi-Tenancy**:
Users belong to one tenant. Email uniqueness enforced per tenant, allowing same email across different organizations.

---

### `session`

Better Auth session table.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | text | Primary key |
| `expiresAt` | timestamp | Session expiration |
| `token` | text | Session token (unique) |
| `userId` | text | Foreign key to `users.id` |
| `ipAddress` | text | Client IP address |
| `userAgent` | text | Browser user agent |
| `activeOrganizationId` | text | Better Auth organization plugin |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Foreign Keys**:
- `userId` → `users.id` (cascade delete)

---

### `account`

Better Auth OAuth accounts table.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | text | Primary key |
| `accountId` | text | OAuth provider account ID |
| `providerId` | text | Provider: microsoft, google, etc. |
| `userId` | text | Foreign key to `users.id` |
| `accessToken` | text | OAuth access token |
| `refreshToken` | text | OAuth refresh token |
| `idToken` | text | OAuth ID token |
| `accessTokenExpiresAt` | timestamp | Token expiration |
| `refreshTokenExpiresAt` | timestamp | Refresh token expiration |
| `scope` | text | OAuth scopes |
| `password` | text | Hashed password (for email/password auth) |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Foreign Keys**:
- `userId` → `users.id` (cascade delete)

**Usage**:
- Stores both OAuth provider accounts and email/password credentials
- Microsoft OAuth: stores `accessToken` and `refreshToken`
- Email/password: stores bcrypt-hashed `password`

---

### `verification`

Better Auth email/phone verification tokens.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | text | Primary key |
| `identifier` | text | Email or phone number |
| `value` | text | Verification code |
| `expiresAt` | timestamp | Token expiration |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

---

### `invitations`

Staff user invitations from admins.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `email` | text | Invitee email address |
| `role` | varchar(50) | Role: admin, accountant, member |
| `token` | text | Unique invitation token |
| `invitedBy` | text | Foreign key to `users.id` (inviter) |
| `customMessage` | text | Optional personalized message |
| `status` | varchar(20) | Status: pending, accepted, expired, cancelled |
| `expiresAt` | timestamp | Invitation expiration |
| `acceptedAt` | timestamp | Acceptance timestamp |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Unique index on `token`
- Index on `(email, tenantId)`
- Index on `status`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `invitedBy` → `users.id`

---

### `feedback`

User feedback and issue reporting.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `userId` | varchar(255) | User ID (denormalized) |
| `userEmail` | varchar(255) | User email (denormalized) |
| `userName` | varchar(255) | User name (denormalized) |
| `userRole` | varchar(50) | User role |
| `type` | varchar(50) | Type: issue, feature_request, general |
| `title` | varchar(255) | Feedback title |
| `description` | text | Detailed description |
| `category` | varchar(50) | Category: ui, performance, functionality, data |
| `pageUrl` | varchar(500) | Page where feedback was submitted |
| `userAgent` | text | Browser user agent |
| `consoleLogs` | text | Captured console output |
| `screenshot` | text | Base64 encoded screenshot |
| `status` | varchar(50) | Status: new, in_progress, resolved, wont_fix |
| `priority` | varchar(20) | Priority: low, medium, high, critical |
| `assignedTo` | varchar(255) | Assigned staff user |
| `adminNotes` | text | Internal notes |
| `resolution` | text | Resolution description |
| `resolvedAt` | timestamp | Resolution timestamp |
| `resolvedBy` | varchar(255) | Resolver user ID |
| `metadata` | jsonb | Additional structured data |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Index on `(tenantId, status)`
- Index on `userId`
- Index on `(type, status)`
- Index on `createdAt`

---

## CRM Tables

### `clients`

Main client/customer records.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `clientCode` | varchar(50) | Unique client code (e.g., "CLI001") |
| `name` | varchar(255) | Client name |
| `type` | enum | Client type: individual, company, limited_company, sole_trader, partnership, llp, trust, charity, other |
| `status` | enum | Status: prospect, onboarding, active, inactive, archived |
| `email` | varchar(255) | Primary email |
| `phone` | varchar(50) | Primary phone |
| `website` | varchar(255) | Website URL |
| `vatNumber` | varchar(50) | VAT registration number |
| `registrationNumber` | varchar(50) | Companies House registration |
| `addressLine1` | varchar(255) | Address line 1 |
| `addressLine2` | varchar(255) | Address line 2 |
| `city` | varchar(100) | City |
| `state` | varchar(100) | State/county |
| `postalCode` | varchar(20) | Postal/ZIP code |
| `country` | varchar(100) | Country |
| `accountManagerId` | text | Foreign key to `users.id` |
| `parentClientId` | uuid | Parent client (for group structures) |
| `incorporationDate` | date | Company incorporation date |
| `yearEnd` | varchar(10) | Financial year end (MM-DD format) |
| `notes` | text | Internal notes |
| `healthScore` | integer | Client health score (0-100) |
| `metadata` | jsonb | Additional custom fields |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |
| `createdBy` | text | Foreign key to `users.id` (creator) |

**Indexes**:
- Unique index on `(tenantId, clientCode)`
- Index on `name`
- Index on `status`
- Index on `accountManagerId`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `accountManagerId` → `users.id` (set null)
- `createdBy` → `users.id`

**Multi-Tenancy**:
`clientCode` is unique per tenant, allowing code reuse across organizations.

---

### `client_contacts`

Contact persons for clients (many-to-one).

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `clientId` | uuid | Foreign key to `clients` |
| `isPrimary` | boolean | Primary contact flag |
| `title` | varchar(50) | Title: Mr, Mrs, Dr, etc. |
| `firstName` | varchar(100) | First name |
| `middleName` | varchar(100) | Middle name |
| `lastName` | varchar(100) | Last name |
| `email` | varchar(255) | Email address |
| `phone` | varchar(50) | Phone number |
| `mobile` | varchar(50) | Mobile number |
| `jobTitle` | varchar(100) | Job title |
| `position` | varchar(100) | Position in company |
| `department` | varchar(100) | Department |
| `addressLine1` | varchar(255) | Address line 1 |
| `addressLine2` | varchar(255) | Address line 2 |
| `city` | varchar(100) | City |
| `region` | varchar(100) | Region/state |
| `postalCode` | varchar(20) | Postal code |
| `country` | varchar(100) | Country |
| `notes` | text | Contact-specific notes |
| `isActive` | boolean | Active status |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Index on `clientId`
- Index on `(clientId, isPrimary)`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `clientId` → `clients.id` (cascade delete)

---

### `client_directors`

Company directors (from Companies House or manual entry).

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `clientId` | uuid | Foreign key to `clients` |
| `name` | varchar(255) | Director name |
| `officerRole` | varchar(100) | Role: director, secretary, etc. |
| `appointedOn` | date | Appointment date |
| `resignedOn` | date | Resignation date |
| `isActive` | boolean | Currently active |
| `nationality` | varchar(100) | Nationality |
| `occupation` | varchar(100) | Occupation |
| `dateOfBirth` | varchar(20) | Month and year only (from Companies House) |
| `address` | text | Service address |
| `metadata` | jsonb | Additional Companies House data |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Index on `clientId`
- Index on `isActive`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `clientId` → `clients.id` (cascade delete)

---

### `client_pscs`

Persons with Significant Control (from Companies House).

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `clientId` | uuid | Foreign key to `clients` |
| `name` | varchar(255) | PSC name |
| `kind` | varchar(100) | Kind: individual-person-with-significant-control, corporate-entity-person-with-significant-control |
| `notifiedOn` | date | Notification date |
| `ceasedOn` | date | Cessation date |
| `isActive` | boolean | Currently active |
| `nationality` | varchar(100) | Nationality |
| `dateOfBirth` | varchar(20) | Month and year only |
| `naturesOfControl` | jsonb | Array of control types |
| `address` | text | Service address |
| `metadata` | jsonb | Additional Companies House data |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Index on `clientId`
- Index on `isActive`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `clientId` → `clients.id` (cascade delete)

---

### `services`

Service catalog (legacy - use `service_components` for new features).

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `code` | varchar(50) | Service code |
| `name` | varchar(255) | Service name |
| `description` | text | Service description |
| `category` | varchar(100) | Service category |
| `defaultRate` | decimal(10,2) | Default hourly rate |
| `price` | decimal(10,2) | Alias for defaultRate |
| `priceType` | enum | Price type: hourly, fixed, retainer, project, percentage |
| `duration` | integer | Duration in minutes |
| `tags` | jsonb | Tags array |
| `isActive` | boolean | Active status |
| `metadata` | jsonb | Additional data |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Unique index on `(tenantId, code)`
- Index on `category`

**Note**: This table is being phased out in favor of `service_components` which supports the new pricing calculator.

---

### `client_services`

Client-to-service assignments (many-to-many).

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `clientId` | uuid | Foreign key to `clients` |
| `serviceComponentId` | uuid | Foreign key to `service_components` |
| `customRate` | decimal(10,2) | Custom rate override |
| `startDate` | date | Service start date |
| `endDate` | date | Service end date |
| `isActive` | boolean | Active status |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Unique index on `(clientId, serviceComponentId)`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `clientId` → `clients.id` (cascade delete)
- `serviceComponentId` → `service_components.id` (cascade delete)

---

## Operations Tables

### `tasks`

Task management and tracking.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `title` | varchar(255) | Task title |
| `description` | text | Task description |
| `status` | enum | Status: pending, in_progress, review, completed, cancelled, blocked, records_received, queries_sent, queries_received |
| `priority` | enum | Priority: low, medium, high, urgent, critical |
| `clientId` | uuid | Foreign key to `clients` |
| `assignedToId` | text | Foreign key to `users.id` (assignee) |
| `reviewerId` | text | Foreign key to `users.id` (reviewer) |
| `createdById` | text | Foreign key to `users.id` (creator) |
| `dueDate` | timestamp | Due date |
| `targetDate` | timestamp | Target completion date |
| `completedAt` | timestamp | Completion timestamp |
| `estimatedHours` | decimal(5,2) | Estimated hours |
| `actualHours` | decimal(5,2) | Actual hours spent |
| `progress` | integer | Progress percentage (0-100) |
| `taskType` | varchar(100) | Task type |
| `category` | varchar(100) | Task category |
| `tags` | jsonb | Tags array |
| `parentTaskId` | uuid | Parent task (for subtasks) |
| `workflowId` | uuid | Associated workflow |
| `isRecurring` | boolean | Recurring task flag |
| `recurringPattern` | jsonb | Recurrence pattern |
| `metadata` | jsonb | Additional data |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Index on `assignedToId`
- Index on `reviewerId`
- Index on `clientId`
- Index on `status`
- Index on `dueDate`
- Index on `parentTaskId`
- Index on `progress`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `clientId` → `clients.id` (set null)
- `assignedToId` → `users.id` (set null)
- `reviewerId` → `users.id` (set null)
- `createdById` → `users.id` (set null)

---

### `time_entries`

Time tracking for billing and timesheet management.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `userId` | text | Foreign key to `users.id` |
| `clientId` | uuid | Foreign key to `clients` |
| `taskId` | uuid | Foreign key to `tasks` |
| `serviceComponentId` | uuid | Foreign key to `service_components` |
| `date` | date | Entry date |
| `startTime` | varchar(8) | Start time (HH:MM:SS) |
| `endTime` | varchar(8) | End time (HH:MM:SS) |
| `hours` | decimal(5,2) | Hours logged |
| `workType` | enum | Work type: work, admin, training, meeting, business_development, research, holiday, sick, time_off_in_lieu |
| `billable` | boolean | Billable to client |
| `billed` | boolean | Already billed |
| `rate` | decimal(10,2) | Hourly rate |
| `amount` | decimal(10,2) | Total amount (hours × rate) |
| `invoiceId` | uuid | Associated invoice |
| `description` | text | Work description |
| `notes` | text | Internal notes |
| `status` | enum | Status: draft, submitted, approved, rejected |
| `submittedAt` | timestamp | Submission timestamp |
| `approvedById` | text | Foreign key to `users.id` (approver) |
| `approvedAt` | timestamp | Approval timestamp |
| `metadata` | jsonb | Additional data |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Index on `(userId, date)`
- Index on `clientId`
- Index on `taskId`
- Index on `(billable, billed)`
- Index on `status`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `userId` → `users.id` (cascade delete)
- `clientId` → `clients.id` (set null)
- `taskId` → `tasks.id` (set null)
- `serviceComponentId` → `service_components.id` (set null)
- `approvedById` → `users.id` (set null)

---

### `documents`

Document storage with folder structure.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `name` | varchar(255) | Document/folder name |
| `type` | enum | Type: file, folder |
| `mimeType` | varchar(100) | MIME type (for files) |
| `size` | integer | File size in bytes |
| `url` | text | S3 URL |
| `thumbnailUrl` | text | Thumbnail URL |
| `parentId` | uuid | Parent folder ID |
| `path` | text | Full path for quick lookups |
| `clientId` | uuid | Foreign key to `clients` |
| `taskId` | uuid | Foreign key to `tasks` |
| `description` | text | Document description |
| `tags` | jsonb | Tags array |
| `version` | integer | Version number |
| `isArchived` | boolean | Archived status |
| `isPublic` | boolean | Public access flag |
| `shareToken` | varchar(100) | Share token for public links |
| `shareExpiresAt` | timestamp | Share link expiration |
| `uploadedById` | text | Foreign key to `users.id` (uploader) |
| `metadata` | jsonb | Additional data |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Index on `parentId`
- Index on `clientId`
- Index on `taskId`
- Index on `path`
- Index on `shareToken`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `clientId` → `clients.id` (cascade delete)
- `taskId` → `tasks.id` (cascade delete)
- `uploadedById` → `users.id` (set null)

---

### `workflows`

Workflow templates and automations.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `name` | varchar(255) | Workflow name |
| `description` | text | Workflow description |
| `type` | varchar(50) | Type: task_template, automation, approval |
| `trigger` | varchar(100) | Trigger: manual, schedule, event |
| `isActive` | boolean | Active status |
| `estimatedDays` | integer | Estimated duration in days |
| `serviceComponentId` | uuid | Foreign key to `service_components` |
| `config` | jsonb | Workflow configuration |
| `conditions` | jsonb | Trigger conditions |
| `actions` | jsonb | Actions to perform |
| `metadata` | jsonb | Additional data |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |
| `createdById` | text | Foreign key to `users.id` (creator) |

**Indexes**:
- Index on `type`
- Index on `isActive`
- Index on `serviceComponentId`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `serviceComponentId` → `service_components.id` (set null)
- `createdById` → `users.id` (set null)

---

### `workflow_stages`

Stages within workflows.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `workflowId` | uuid | Foreign key to `workflows` |
| `name` | varchar(255) | Stage name |
| `description` | text | Stage description |
| `stageOrder` | integer | Order in workflow |
| `isRequired` | boolean | Required stage flag |
| `estimatedHours` | decimal(5,2) | Estimated hours |
| `checklistItems` | jsonb | Checklist items array |
| `autoComplete` | boolean | Auto-complete when checklist done |
| `requiresApproval` | boolean | Approval required flag |
| `metadata` | jsonb | Additional data |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Index on `workflowId`
- Index on `(workflowId, stageOrder)`

**Foreign Keys**:
- `workflowId` → `workflows.id` (cascade delete)

---

### `task_workflow_instances`

Active workflow instances for tasks.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `taskId` | uuid | Foreign key to `tasks` |
| `workflowId` | uuid | Foreign key to `workflows` |
| `currentStageId` | uuid | Foreign key to `workflow_stages` |
| `status` | varchar(50) | Status: active, paused, completed, cancelled |
| `stageProgress` | jsonb | Stage completion tracking |
| `startedAt` | timestamp | Start timestamp |
| `completedAt` | timestamp | Completion timestamp |
| `pausedAt` | timestamp | Pause timestamp |
| `metadata` | jsonb | Additional data |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Unique index on `taskId`
- Index on `workflowId`
- Index on `status`

**Foreign Keys**:
- `taskId` → `tasks.id` (cascade delete)
- `workflowId` → `workflows.id` (cascade delete)
- `currentStageId` → `workflow_stages.id` (set null)

---

### `compliance`

Compliance tracking and deadlines.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `title` | varchar(255) | Compliance title |
| `type` | varchar(100) | Type: VAT Return, Annual Accounts, CT600, etc. |
| `description` | text | Description |
| `clientId` | uuid | Foreign key to `clients` |
| `assignedToId` | text | Foreign key to `users.id` (assignee) |
| `dueDate` | timestamp | Due date |
| `completedDate` | timestamp | Completion date |
| `reminderDate` | timestamp | Reminder date |
| `status` | enum | Status: pending, in_progress, completed, overdue |
| `priority` | enum | Priority: low, medium, high, urgent |
| `notes` | text | Notes |
| `attachments` | jsonb | Attachment URLs/IDs |
| `metadata` | jsonb | Additional data |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |
| `createdById` | text | Foreign key to `users.id` (creator) |

**Indexes**:
- Index on `clientId`
- Index on `assignedToId`
- Index on `status`
- Index on `dueDate`
- Index on `type`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `clientId` → `clients.id` (cascade delete)
- `assignedToId` → `users.id` (set null)
- `createdById` → `users.id` (set null)

---

## Financial Tables

### `invoices`

Client invoicing.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `invoiceNumber` | varchar(50) | Unique invoice number |
| `clientId` | uuid | Foreign key to `clients` |
| `issueDate` | date | Invoice issue date |
| `dueDate` | date | Payment due date |
| `paidDate` | date | Payment date |
| `subtotal` | decimal(10,2) | Subtotal before tax |
| `taxRate` | decimal(5,2) | Tax rate percentage |
| `taxAmount` | decimal(10,2) | Tax amount |
| `discount` | decimal(10,2) | Discount amount |
| `total` | decimal(10,2) | Total amount |
| `amountPaid` | decimal(10,2) | Amount paid |
| `status` | enum | Status: draft, sent, paid, overdue, cancelled |
| `currency` | varchar(3) | Currency code (default: GBP) |
| `notes` | text | Invoice notes |
| `terms` | text | Payment terms |
| `purchaseOrderNumber` | varchar(100) | PO number |
| `metadata` | jsonb | Additional data |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |
| `createdById` | text | Foreign key to `users.id` (creator) |

**Indexes**:
- Unique index on `(tenantId, invoiceNumber)`
- Index on `clientId`
- Index on `status`
- Index on `dueDate`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `clientId` → `clients.id` (restrict delete)
- `createdById` → `users.id` (set null)

---

### `invoice_items`

Line items for invoices.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `invoiceId` | uuid | Foreign key to `invoices` |
| `description` | text | Item description |
| `quantity` | decimal(10,2) | Quantity |
| `rate` | decimal(10,2) | Unit rate |
| `amount` | decimal(10,2) | Total amount (quantity × rate) |
| `timeEntryId` | uuid | Foreign key to `time_entries` |
| `serviceComponentId` | uuid | Foreign key to `service_components` |
| `sortOrder` | integer | Display order |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Index on `invoiceId`

**Foreign Keys**:
- `invoiceId` → `invoices.id` (cascade delete)
- `timeEntryId` → `time_entries.id` (set null)
- `serviceComponentId` → `service_components.id` (set null)

---

## Proposal & Pricing System

### `service_components`

Master catalog of services for pricing calculator (28 services).

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `code` | varchar(50) | Service code (e.g., 'COMP_ACCOUNTS', 'BOOK_BASIC') |
| `name` | varchar(255) | Service name |
| `category` | enum | Category: compliance, vat, bookkeeping, payroll, management, secretarial, tax_planning, addon |
| `description` | text | Service description |
| `pricingModel` | enum | Model: turnover, transaction, both, fixed |
| `basePrice` | decimal(10,2) | Base price |
| `price` | decimal(10,2) | Alias for basePrice |
| `priceType` | enum | Type: hourly, fixed, retainer, project, percentage |
| `defaultRate` | decimal(10,2) | Default rate |
| `duration` | integer | Duration in minutes |
| `supportsComplexity` | boolean | Complexity multiplier support |
| `tags` | jsonb | Tags array |
| `isActive` | boolean | Active status |
| `metadata` | jsonb | Additional data |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Unique index on `(tenantId, code)`
- Index on `category`
- Index on `isActive`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)

**Examples**:
```sql
-- Get all compliance services
SELECT * FROM service_components WHERE category = 'compliance' AND is_active = true;

-- Get bookkeeping services that support complexity
SELECT * FROM service_components
WHERE category = 'bookkeeping' AND supports_complexity = true;
```

---

### `pricing_rules`

Pricing rules for service components (138+ rules).

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `componentId` | uuid | Foreign key to `service_components` |
| `ruleType` | enum | Type: turnover_band, transaction_band, employee_band, per_unit, fixed |
| `minValue` | decimal(15,2) | Band minimum value |
| `maxValue` | decimal(15,2) | Band maximum value |
| `price` | decimal(10,2) | Price for this band |
| `complexityLevel` | varchar(50) | Complexity: clean, average, complex, disaster |
| `metadata` | jsonb | Additional rule config |
| `isActive` | boolean | Active status |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Index on `componentId`
- Index on `ruleType`
- Index on `isActive`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `componentId` → `service_components.id` (cascade delete)

**Example**:
```sql
-- Get pricing rules for bookkeeping based on turnover
SELECT pr.*, sc.name
FROM pricing_rules pr
JOIN service_components sc ON pr.component_id = sc.id
WHERE sc.code = 'BOOK_BASIC' AND pr.rule_type = 'turnover_band'
ORDER BY pr.min_value;
```

---

### `leads`

Prospect/lead management.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `firstName` | varchar(100) | First name |
| `lastName` | varchar(100) | Last name |
| `email` | varchar(255) | Email address |
| `phone` | varchar(50) | Phone number |
| `mobile` | varchar(50) | Mobile number |
| `companyName` | varchar(255) | Company name |
| `position` | varchar(100) | Position/title |
| `website` | varchar(255) | Website |
| `status` | enum | Status: new, contacted, qualified, proposal_sent, negotiating, converted, lost |
| `source` | varchar(100) | Lead source: referral, website, cold_call, etc. |
| `industry` | varchar(100) | Industry |
| `estimatedTurnover` | decimal(15,2) | Estimated annual turnover |
| `estimatedEmployees` | integer | Estimated employee count |
| `qualificationScore` | integer | Qualification score (1-10) |
| `interestedServices` | jsonb | Array of service codes |
| `notes` | text | Lead notes |
| `lastContactedAt` | timestamp | Last contact timestamp |
| `nextFollowUpAt` | timestamp | Next follow-up date |
| `assignedToId` | text | Foreign key to `users.id` (assignee) |
| `convertedToClientId` | uuid | Foreign key to `clients` (if converted) |
| `convertedAt` | timestamp | Conversion timestamp |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |
| `createdBy` | text | Foreign key to `users.id` (creator) |

**Indexes**:
- Index on `tenantId`
- Index on `status`
- Index on `email`
- Index on `assignedToId`
- Index on `createdAt`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `assignedToId` → `users.id` (set null)
- `convertedToClientId` → `clients.id` (set null)
- `createdBy` → `users.id` (set null)

---

### `proposals`

Proposal records with pricing calculations.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `leadId` | uuid | Foreign key to `leads` |
| `quoteId` | uuid | Future: quotes table reference |
| `clientId` | uuid | Foreign key to `clients` |
| `proposalNumber` | varchar(50) | Unique proposal number |
| `title` | varchar(255) | Proposal title |
| `status` | enum | Status: draft, sent, viewed, signed, rejected, expired |
| `turnover` | varchar(100) | Business turnover |
| `industry` | varchar(100) | Industry |
| `monthlyTransactions` | integer | Monthly transaction count |
| `pricingModelUsed` | varchar(10) | Pricing model: 'A' or 'B' |
| `monthlyTotal` | decimal(10,2) | Monthly total |
| `annualTotal` | decimal(10,2) | Annual total |
| `pdfUrl` | text | Generated PDF URL (S3) |
| `signedPdfUrl` | text | Signed PDF URL |
| `docusealTemplateId` | text | DocuSeal template ID |
| `docusealSubmissionId` | text | DocuSeal submission ID |
| `docusealSignedPdfUrl` | text | DocuSeal signed PDF URL |
| `documentHash` | text | SHA-256 hash of signed PDF |
| `templateId` | uuid | Template reference |
| `customTerms` | text | Custom terms |
| `termsAndConditions` | text | T&Cs |
| `notes` | text | Internal notes |
| `validUntil` | timestamp | Proposal validity |
| `version` | integer | Version number |
| `metadata` | jsonb | Discounts, custom fields |
| `createdAt` | timestamp | Creation timestamp |
| `sentAt` | timestamp | Sent timestamp |
| `viewedAt` | timestamp | Viewed timestamp |
| `signedAt` | timestamp | Signed timestamp |
| `expiresAt` | timestamp | Expiration timestamp |
| `updatedAt` | timestamp | Last update timestamp |
| `createdById` | text | Foreign key to `users.id` (creator) |

**Indexes**:
- Index on `tenantId`
- Index on `leadId`
- Index on `clientId`
- Index on `status`
- Index on `createdAt`
- Unique index on `(tenantId, proposalNumber)`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `leadId` → `leads.id` (set null)
- `clientId` → `clients.id` (set null)
- `createdById` → `users.id` (set null)

---

### `proposal_services`

Individual services within proposals (denormalized snapshot).

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `proposalId` | uuid | Foreign key to `proposals` |
| `componentCode` | varchar(50) | Service component code (snapshot) |
| `componentName` | varchar(255) | Service name (snapshot) |
| `calculation` | text | Calculation description |
| `price` | varchar(50) | Price (stored as string) |
| `config` | jsonb | Service config (complexity, employees, etc.) |
| `sortOrder` | integer | Display order |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Index on `proposalId`
- Index on `componentCode`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `proposalId` → `proposals.id` (cascade delete)

**Note**: This table stores a snapshot of services at proposal creation time, preserving historical pricing even if service definitions change.

---

### `client_transaction_data`

Transaction volume data for pricing calculations.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `leadId` | uuid | Foreign key to `leads` |
| `clientId` | uuid | Foreign key to `clients` |
| `monthlyTransactions` | integer | Monthly transaction count |
| `dataSource` | enum | Source: xero, manual, estimated |
| `xeroDataJson` | jsonb | Raw Xero data |
| `lastUpdated` | timestamp | Last update timestamp |
| `createdAt` | timestamp | Creation timestamp |

**Indexes**:
- Index on `tenantId`
- Index on `clientId`
- Index on `leadId`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `leadId` → `leads.id` (set null)
- `clientId` → `clients.id` (cascade delete)

---

### `proposal_signatures`

E-signature tracking (DocuSeal integration).

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `proposalId` | uuid | Foreign key to `proposals` |
| `docusealSubmissionId` | text | DocuSeal submission ID (unique) |
| `signatureType` | varchar(50) | Type: electronic, wet_ink |
| `signatureMethod` | varchar(50) | Method: docuseal, canvas (legacy) |
| `signerEmail` | varchar(255) | Signer email |
| `signerName` | varchar(255) | Signer name |
| `signingCapacity` | varchar(100) | Capacity: Director, Authorized Signatory |
| `companyInfo` | jsonb | Company verification data |
| `auditTrail` | jsonb | Full audit metadata (UK SES compliance) |
| `documentHash` | text | SHA-256 of signed PDF |
| `signatureData` | text | Base64 for legacy, DocuSeal ID for new |
| `signedAt` | timestamp | Signature timestamp |
| `viewedAt` | timestamp | First view timestamp |
| `ipAddress` | varchar(45) | Signer IP address |
| `userAgent` | text | Signer browser/device |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Index on `proposalId`
- Index on `docusealSubmissionId`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `proposalId` → `proposals.id` (cascade delete)

---

## Onboarding & KYC System

### `onboarding_sessions`

Onboarding progress tracking for each client.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `clientId` | uuid | Foreign key to `clients` |
| `startDate` | timestamp | Onboarding start date |
| `targetCompletionDate` | timestamp | Target completion date |
| `actualCompletionDate` | timestamp | Actual completion date |
| `status` | enum | Status: not_started, in_progress, pending_questionnaire, pending_approval, approved, rejected, completed |
| `priority` | enum | Priority: low, medium, high |
| `assignedToId` | text | Foreign key to `users.id` (assignee) |
| `progress` | integer | Progress percentage (0-100) |
| `notes` | text | Session notes |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Index on `tenantId`
- Index on `clientId`
- Index on `status`
- Index on `assignedToId`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `clientId` → `clients.id` (cascade delete)
- `assignedToId` → `users.id` (set null)

**Workflow**:
1. `not_started` → Session created but client not invited yet
2. `in_progress` → Client working on questionnaire
3. `pending_questionnaire` → Documents uploaded, awaiting questionnaire completion
4. `pending_approval` → KYC check completed, awaiting staff approval
5. `approved` → Onboarding approved, client has full access
6. `rejected` → Onboarding rejected
7. `completed` → Fully completed

---

### `onboarding_tasks`

Individual checklist items for onboarding sessions.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `sessionId` | uuid | Foreign key to `onboarding_sessions` |
| `taskName` | varchar(255) | Task name |
| `description` | text | Task description |
| `required` | boolean | Required task flag |
| `sequence` | integer | Order of task |
| `days` | integer | Days offset from start |
| `dueDate` | timestamp | Due date |
| `completionDate` | timestamp | Completion timestamp |
| `done` | boolean | Completion status |
| `notes` | text | Task notes |
| `assignedToId` | text | Foreign key to `users.id` (assignee) |
| `progressWeight` | integer | Weight for progress calculation (1-10) |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Index on `sessionId`
- Index on `(sessionId, sequence)`
- Index on `assignedToId`
- Index on `done`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `sessionId` → `onboarding_sessions.id` (cascade delete)
- `assignedToId` → `users.id` (set null)

---

### `onboarding_responses`

Questionnaire responses from AML onboarding.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `onboardingSessionId` | uuid | Foreign key to `onboarding_sessions` |
| `questionKey` | varchar(255) | Question key (e.g., "company_name", "directors") |
| `answerValue` | jsonb | Answer (flexible JSON storage) |
| `extractedFromAi` | boolean | AI pre-filled flag |
| `verifiedByUser` | boolean | User confirmed flag |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Index on `tenantId`
- Index on `onboardingSessionId`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `onboardingSessionId` → `onboarding_sessions.id` (cascade delete)

**Structure**:
Each response stores a structured field object:
```json
{
  "value": "John Doe",
  "extractedFromAi": true,
  "verifiedByUser": true
}
```

---

### `aml_checks`

Legacy AML checks (ComplyCube - deprecated).

**Note**: This table is deprecated. New implementations use `kyc_verifications` with LEM Verify.

---

### `kyc_verifications`

KYC/AML verifications via LEM Verify (£1/verification, UK MLR 2017 compliant).

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `clientId` | uuid | Foreign key to `clients` |
| `onboardingSessionId` | uuid | Foreign key to `onboarding_sessions` |
| `lemverifyId` | varchar(255) | LEM Verify verification ID |
| `clientRef` | varchar(255) | Our reference (client ID) |
| `status` | varchar(50) | Status: completed, pending, failed |
| `outcome` | varchar(50) | Outcome: pass, fail, refer |
| `documentType` | varchar(50) | Document type: passport, driving_licence |
| `documentVerified` | boolean | Document verification result |
| `documentData` | jsonb | Extracted document data |
| `facematchResult` | varchar(50) | Facematch result: pass, fail |
| `facematchScore` | decimal(5,2) | Facematch score (0-100) |
| `livenessResult` | varchar(50) | Liveness result: pass, fail |
| `livenessScore` | decimal(5,2) | Liveness score (0-100) |
| `amlResult` | jsonb | Full AML check response (LexisNexis) |
| `amlStatus` | varchar(50) | AML status: clear, match, pep |
| `pepMatch` | boolean | PEP match flag |
| `sanctionsMatch` | boolean | Sanctions match flag |
| `watchlistMatch` | boolean | Watchlist match flag |
| `adverseMediaMatch` | boolean | Adverse media match flag |
| `reportUrl` | text | PDF report URL |
| `documentsUrl` | jsonb | Uploaded document URLs |
| `approvedBy` | text | Foreign key to `users.id` (approver) |
| `approvedAt` | timestamp | Approval timestamp |
| `rejectionReason` | text | Rejection reason |
| `metadata` | jsonb | Full LEM Verify response |
| `createdAt` | timestamp | Creation timestamp |
| `completedAt` | timestamp | Completion timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Index on `tenantId`
- Index on `clientId`
- Index on `onboardingSessionId`
- Index on `status`
- Index on `lemverifyId`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `clientId` → `clients.id` (cascade delete)
- `onboardingSessionId` → `onboarding_sessions.id` (cascade delete)
- `approvedBy` → `users.id`

**Auto-Approval Logic**:
A verification is auto-approved if:
- `outcome` = 'pass'
- `documentVerified` = true
- `facematchResult` = 'pass'
- `livenessResult` = 'pass'
- `amlStatus` = 'clear'
- All match flags (`pepMatch`, `sanctionsMatch`, etc.) = false

Otherwise, flagged for manual review.

---

## Client Portal System

Separate authentication system for external client access.

### `client_portal_users`

External client accounts (separate from staff `users` table).

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | text | Primary key (Better Auth user ID) |
| `tenantId` | text | Foreign key to `tenants` |
| `email` | text | Email address |
| `firstName` | varchar(100) | First name |
| `lastName` | varchar(100) | Last name |
| `phone` | varchar(50) | Phone number |
| `status` | varchar(20) | Status: active, suspended, invited |
| `lastLoginAt` | timestamp | Last login timestamp |
| `invitedBy` | text | Foreign key to `users.id` (staff inviter) |
| `invitedAt` | timestamp | Invitation timestamp |
| `acceptedAt` | timestamp | Acceptance timestamp |
| `metadata` | jsonb | Custom fields, preferences |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Index on `email`
- Index on `tenantId`

**Foreign Keys**:
- `tenantId` → `tenants.id`
- `invitedBy` → `users.id`

---

### `client_portal_access`

Links portal users to clients (many-to-many).

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `portalUserId` | text | Foreign key to `client_portal_users` |
| `clientId` | uuid | Foreign key to `clients` |
| `role` | varchar(50) | Role: viewer, editor, admin |
| `grantedBy` | text | Foreign key to `users.id` (staff granter) |
| `grantedAt` | timestamp | Grant timestamp |
| `expiresAt` | timestamp | Optional expiration |
| `isActive` | boolean | Active status |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Unique index on `(portalUserId, clientId)`
- Index on `clientId`
- Index on `tenantId`

**Foreign Keys**:
- `tenantId` → `tenants.id`
- `portalUserId` → `client_portal_users.id` (cascade delete)
- `clientId` → `clients.id` (cascade delete)
- `grantedBy` → `users.id`

**Use Case**: Enables users who manage multiple entities (e.g., accountants) to access multiple client records.

---

### `client_portal_invitations`

Invitation workflow for client portal access.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `email` | text | Invitee email |
| `firstName` | varchar(100) | First name |
| `lastName` | varchar(100) | Last name |
| `clientIds` | jsonb | Array of client UUIDs to grant access to |
| `role` | varchar(50) | Role: viewer, editor, admin |
| `token` | text | Unique invitation token |
| `invitedBy` | text | Foreign key to `users.id` (staff inviter) |
| `status` | varchar(20) | Status: pending, accepted, expired, revoked |
| `sentAt` | timestamp | Sent timestamp |
| `expiresAt` | timestamp | Expiration timestamp (7 days default) |
| `acceptedAt` | timestamp | Acceptance timestamp |
| `revokedAt` | timestamp | Revocation timestamp |
| `revokedBy` | text | Foreign key to `users.id` (staff revoker) |
| `metadata` | jsonb | Custom message, etc. |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Index on `email`
- Unique index on `token`
- Index on `status`
- Index on `tenantId`

**Foreign Keys**:
- `tenantId` → `tenants.id`
- `invitedBy` → `users.id`
- `revokedBy` → `users.id`

---

### Client Portal Better Auth Tables

**`client_portal_session`**, **`client_portal_account`**, **`client_portal_verification`**

Mirror structure of staff auth tables but for client portal authentication.

See [Core Authentication & Tenancy](#core-authentication--tenancy) for column details.

---

## Portal Management

### `portal_categories`

Categories for organizing portal links.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `name` | varchar(100) | Category name |
| `description` | text | Category description |
| `iconName` | varchar(50) | Lucide icon name |
| `colorHex` | varchar(7) | Hex color code |
| `sortOrder` | integer | Display order |
| `isActive` | boolean | Active status |
| `createdById` | text | Foreign key to `users.id` (creator) |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Index on `tenantId`
- Index on `sortOrder`
- Index on `isActive`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `createdById` → `users.id` (set null)

---

### `portal_links`

Individual portal links/apps.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `categoryId` | uuid | Foreign key to `portal_categories` |
| `title` | varchar(200) | Link title |
| `description` | text | Link description |
| `url` | text | Link URL |
| `isInternal` | boolean | Internal vs external link |
| `iconName` | varchar(50) | Lucide icon name |
| `sortOrder` | integer | Display order |
| `isActive` | boolean | Active status |
| `targetBlank` | boolean | Open in new tab |
| `requiresAuth` | boolean | Authentication required |
| `allowedRoles` | jsonb | Array of roles that can see this link |
| `createdById` | text | Foreign key to `users.id` (creator) |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Index on `tenantId`
- Index on `categoryId`
- Index on `sortOrder`
- Index on `isActive`
- Index on `isInternal`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `categoryId` → `portal_categories.id` (cascade delete)
- `createdById` → `users.id` (set null)

---

### `user_favorites`

User favorites for portal links.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `userId` | text | Foreign key to `users.id` |
| `linkId` | uuid | Foreign key to `portal_links` |
| `createdAt` | timestamp | Creation timestamp |

**Indexes**:
- Unique index on `(userId, linkId)`
- Index on `userId`
- Index on `linkId`

**Foreign Keys**:
- `userId` → `users.id` (cascade delete)
- `linkId` → `portal_links.id` (cascade delete)

---

## Support Tables

### `activity_logs`

Audit trail for all entity changes.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `entityType` | varchar(50) | Entity type: task, client, invoice, etc. |
| `entityId` | uuid | Entity ID |
| `action` | varchar(50) | Action: created, updated, deleted, status_changed, etc. |
| `description` | text | Human-readable description |
| `userId` | text | Foreign key to `users.id` (actor) |
| `userName` | varchar(255) | User name (denormalized) |
| `oldValues` | jsonb | Previous state |
| `newValues` | jsonb | New state |
| `ipAddress` | varchar(45) | Actor IP address |
| `userAgent` | text | Actor browser/device |
| `metadata` | jsonb | Additional context |
| `createdAt` | timestamp | Creation timestamp |

**Indexes**:
- Index on `(entityType, entityId)`
- Index on `userId`
- Index on `createdAt`
- Index on `(tenantId, entityType, entityId)`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `userId` → `users.id` (set null)

**Retention**: 7 years for compliance (accounting requirements).

---

### `user_permissions`

Granular user permissions (overrides role defaults).

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `userId` | text | Foreign key to `users.id` |
| `module` | varchar(50) | Module: clients, tasks, invoices, proposals, etc. |
| `canView` | boolean | View permission |
| `canCreate` | boolean | Create permission |
| `canEdit` | boolean | Edit permission |
| `canDelete` | boolean | Delete permission |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Unique index on `(userId, module)`
- Index on `tenantId`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)
- `userId` → `users.id` (cascade delete)

---

### `role_permissions`

Default role-based permissions.

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenantId` | text | Foreign key to `tenants` |
| `role` | varchar(50) | Role: admin, org:admin, user, viewer |
| `module` | varchar(50) | Module: clients, tasks, invoices, proposals, etc. |
| `canView` | boolean | View permission |
| `canCreate` | boolean | Create permission |
| `canEdit` | boolean | Edit permission |
| `canDelete` | boolean | Delete permission |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes**:
- Unique index on `(tenantId, role, module)`

**Foreign Keys**:
- `tenantId` → `tenants.id` (cascade delete)

---

## Database Views

Views are created via custom SQL migrations (`drizzle/*.sql`) and marked with `.existing()` in Drizzle schema.

### `dashboard_kpi_view`

Aggregated metrics for dashboard.

**Columns**:
- `tenantId` - Tenant ID
- `totalRevenue` - Total invoiced revenue
- `collectedRevenue` - Paid revenue
- `outstandingRevenue` - Unpaid revenue
- `activeClients` - Active client count
- `newClients30d` - New clients last 30 days
- `pendingTasks` - Pending task count
- `inProgressTasks` - In-progress task count
- `completedTasks30d` - Completed tasks last 30 days
- `overdueTasks` - Overdue task count
- `totalHours30d` - Total hours last 30 days
- `billableHours30d` - Billable hours last 30 days
- `upcomingCompliance30d` - Compliance items due in 30 days
- `overdueCompliance` - Overdue compliance items

**Usage**:
```sql
SELECT * FROM dashboard_kpi_view WHERE tenant_id = 'tenant-123';
```

---

### `activity_feed_view`

Activity logs with entity names and user info.

**Columns**:
- All `activity_logs` columns
- `entityName` - Name of entity (client name, task title, etc.)
- `userDisplayName` - User's full name
- `userEmail` - User's email

**Usage**:
```sql
-- Get recent activity for a client
SELECT * FROM activity_feed_view
WHERE tenant_id = 'tenant-123' AND entity_type = 'client' AND entity_id = 'client-456'
ORDER BY created_at DESC LIMIT 20;
```

---

### `task_details_view`

Tasks with client and assignee names.

**Columns**:
- All `tasks` columns
- `clientName` - Client name
- `clientCode` - Client code
- `assigneeName` - Assignee full name
- `assigneeEmail` - Assignee email
- `reviewerName` - Reviewer full name
- `reviewerEmail` - Reviewer email
- `creatorName` - Creator full name
- `workflowName` - Workflow name
- `parentTaskTitle` - Parent task title

**Usage**:
```sql
-- Get all tasks for a user with client details
SELECT * FROM task_details_view
WHERE tenant_id = 'tenant-123' AND assigned_to_id = 'user-789'
ORDER BY due_date;
```

---

### `client_details_view`

Clients with account manager information.

**Columns**:
- All `clients` columns
- `accountManagerFirstName` - Account manager first name
- `accountManagerLastName` - Account manager last name
- `accountManagerName` - Account manager full name
- `accountManagerEmail` - Account manager email

**Usage**:
```sql
-- Get active clients with manager info
SELECT * FROM client_details_view
WHERE tenant_id = 'tenant-123' AND status = 'active'
ORDER BY name;
```

---

### `compliance_details_view`

Compliance items with client and assignee info.

**Columns**:
- All `compliance` columns
- `clientName` - Client name
- `clientCode` - Client code
- `assigneeName` - Assignee full name
- `assigneeEmail` - Assignee email
- `creatorName` - Creator full name
- `isOverdue` - Calculated overdue flag

**Usage**:
```sql
-- Get overdue compliance items
SELECT * FROM compliance_details_view
WHERE tenant_id = 'tenant-123' AND is_overdue = true
ORDER BY due_date;
```

---

### `time_entries_view`

Time entries with user, client, and task names.

**Columns**:
- All `time_entries` columns
- `userName` - User full name
- `userEmail` - User email
- `clientName` - Client name
- `clientCode` - Client code
- `taskTitle` - Task title
- `serviceName` - Service name
- `serviceCode` - Service code
- `approverName` - Approver full name

**Usage**:
```sql
-- Get unbilled time entries
SELECT * FROM time_entries_view
WHERE tenant_id = 'tenant-123' AND billable = true AND billed = false
ORDER BY date DESC;
```

---

### `invoice_details_view`

Invoices with client information.

**Columns**:
- All `invoices` columns
- `clientName` - Client name
- `clientCode` - Client code
- `clientEmail` - Client email
- `clientVatNumber` - Client VAT number
- `clientAddressLine1` - Client address line 1
- `clientAddressLine2` - Client address line 2
- `clientCity` - Client city
- `clientPostalCode` - Client postal code
- `clientCountry` - Client country
- `createdByName` - Creator full name
- `balanceDue` - Calculated balance (total - amountPaid)

**Usage**:
```sql
-- Get overdue invoices with client details
SELECT * FROM invoice_details_view
WHERE tenant_id = 'tenant-123' AND status = 'overdue'
ORDER BY due_date;
```

---

## Enums Reference

### Client Enums

```typescript
client_type: individual | company | limited_company | sole_trader | partnership | llp | trust | charity | other
client_status: prospect | onboarding | active | inactive | archived
```

### Task Enums

```typescript
task_status: pending | in_progress | review | completed | cancelled | blocked | records_received | queries_sent | queries_received
task_priority: low | medium | high | urgent | critical
```

### Document Enums

```typescript
document_type: file | folder
```

### Invoice Enums

```typescript
invoice_status: draft | sent | paid | overdue | cancelled
```

### Time Entry Enums

```typescript
work_type: work | admin | training | meeting | business_development | research | holiday | sick | time_off_in_lieu
time_entry_status: draft | submitted | approved | rejected
```

### Compliance Enums

```typescript
compliance_status: pending | in_progress | completed | overdue
compliance_priority: low | medium | high | urgent
```

### Service Enums

```typescript
service_price_type: hourly | fixed | retainer | project | percentage
service_component_category: compliance | vat | bookkeeping | payroll | management | secretarial | tax_planning | addon
pricing_model: turnover | transaction | both | fixed
pricing_rule_type: turnover_band | transaction_band | employee_band | per_unit | fixed
```

### Proposal Enums

```typescript
lead_status: new | contacted | qualified | proposal_sent | negotiating | converted | lost
proposal_status: draft | sent | viewed | signed | rejected | expired
transaction_data_source: xero | manual | estimated
```

### Onboarding Enums

```typescript
onboarding_status: not_started | in_progress | pending_questionnaire | pending_approval | approved | rejected | completed
onboarding_priority: low | medium | high
```

---

## Indexes & Performance

### Composite Indexes

Optimized for common query patterns:

```sql
-- Client lookups by tenant and code
CREATE UNIQUE INDEX idx_tenant_client_code ON clients (tenant_id, client_code);

-- Service component lookups
CREATE UNIQUE INDEX idx_service_component_code ON service_components (tenant_id, code);

-- Time entry queries by user and date
CREATE INDEX idx_time_entry_user_date ON time_entries (user_id, date);

-- Activity log queries
CREATE INDEX idx_activity_tenant_entity ON activity_logs (tenant_id, entity_type, entity_id);
```

### Covering Indexes

Some indexes include additional columns for index-only scans:

```sql
-- User email lookup with role
CREATE UNIQUE INDEX idx_tenant_email ON users (tenant_id, email) INCLUDE (role);
```

### Partial Indexes

Indexes on filtered subsets for common queries:

```sql
-- Active clients only
CREATE INDEX idx_active_clients ON clients (tenant_id) WHERE status = 'active';

-- Unbilled time entries
CREATE INDEX idx_unbilled_time ON time_entries (tenant_id, client_id)
WHERE billable = true AND billed = false;
```

---

## Multi-Tenancy Patterns

### Data Isolation

All tenant-specific tables include `tenantId`:

```sql
-- CORRECT: Always filter by tenant_id
SELECT * FROM clients WHERE tenant_id = 'tenant-123' AND status = 'active';

-- INCORRECT: Never query without tenant_id
SELECT * FROM clients WHERE status = 'active'; -- ❌ Leaks data across tenants
```

### Cascade Deletion

When a tenant is deleted, all related data is automatically removed:

```typescript
tenantId: text("tenant_id")
  .references(() => tenants.id, { onDelete: "cascade" })
  .notNull()
```

### Row-Level Security (Future)

PostgreSQL RLS can be added for additional security:

```sql
-- Example RLS policy (not currently implemented)
CREATE POLICY tenant_isolation ON clients
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::text);
```

---

## Sample Queries

### Get Client with Recent Activity

```sql
SELECT
  c.*,
  (SELECT json_agg(a.* ORDER BY a.created_at DESC)
   FROM activity_feed_view a
   WHERE a.entity_type = 'client' AND a.entity_id = c.id
   LIMIT 10) as recent_activity
FROM client_details_view c
WHERE c.tenant_id = 'tenant-123' AND c.id = 'client-456';
```

### Get Dashboard KPIs

```sql
SELECT * FROM dashboard_kpi_view WHERE tenant_id = 'tenant-123';
```

### Get Unbilled Hours by Client

```sql
SELECT
  client_name,
  client_code,
  SUM(hours) as total_hours,
  SUM(amount) as total_amount
FROM time_entries_view
WHERE tenant_id = 'tenant-123'
  AND billable = true
  AND billed = false
GROUP BY client_name, client_code
ORDER BY total_amount DESC;
```

### Get Overdue Compliance Items

```sql
SELECT
  client_name,
  title,
  type,
  due_date,
  CURRENT_DATE - due_date::date as days_overdue,
  assignee_name
FROM compliance_details_view
WHERE tenant_id = 'tenant-123'
  AND is_overdue = true
ORDER BY due_date;
```

### Get Proposal Conversion Rate

```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'signed') * 100.0 / NULLIF(COUNT(*), 0) as conversion_rate,
  COUNT(*) as total_proposals,
  COUNT(*) FILTER (WHERE status = 'signed') as signed_proposals
FROM proposals
WHERE tenant_id = 'tenant-123'
  AND created_at >= CURRENT_DATE - INTERVAL '90 days';
```

### Get Client Onboarding Progress

```sql
SELECT
  c.name as client_name,
  os.status,
  os.progress,
  COUNT(ot.id) as total_tasks,
  COUNT(ot.id) FILTER (WHERE ot.done = true) as completed_tasks,
  (SELECT COUNT(*) FROM kyc_verifications kv
   WHERE kv.onboarding_session_id = os.id) as kyc_checks
FROM onboarding_sessions os
JOIN clients c ON os.client_id = c.id
LEFT JOIN onboarding_tasks ot ON os.id = ot.session_id
WHERE os.tenant_id = 'tenant-123' AND os.status != 'completed'
GROUP BY c.id, c.name, os.id, os.status, os.progress
ORDER BY os.created_at DESC;
```

### Get KYC Verifications Requiring Review

```sql
SELECT
  c.name as client_name,
  kv.lemverify_id,
  kv.status,
  kv.outcome,
  kv.pep_match,
  kv.sanctions_match,
  kv.watchlist_match,
  kv.adverse_media_match,
  kv.created_at
FROM kyc_verifications kv
JOIN clients c ON kv.client_id = c.id
WHERE kv.tenant_id = 'tenant-123'
  AND kv.status = 'completed'
  AND kv.approved_at IS NULL
  AND (kv.outcome != 'pass' OR kv.aml_status != 'clear')
ORDER BY kv.created_at DESC;
```

---

## Schema Evolution

### Migration Strategy

Practice Hub is in active development. Schema changes follow this process:

1. **Update `lib/db/schema.ts`** - Modify table definitions
2. **Update `scripts/seed.ts`** - Match seed data to new schema
3. **Run `pnpm db:reset`** - Drop, recreate, and seed database
4. **Update Views (if needed)** - Modify SQL in `drizzle/*.sql` migrations

**IMPORTANT**: No migrations are created during development. The database is dropped and recreated frequently.

### Production Migration

When moving to production:
1. Generate migrations: `pnpm drizzle-kit generate`
2. Review generated SQL in `drizzle/` directory
3. Apply migrations: `pnpm drizzle-kit push` (or custom migration runner)
4. Never use `pnpm db:reset` in production

---

## Further Reading

- **[API Reference](/docs/API_REFERENCE.md)** - tRPC procedures and webhooks
- **[System Architecture](/docs/SYSTEM_ARCHITECTURE.md)** - High-level architecture
- **[CLAUDE.md](/CLAUDE.md)** - Development guidelines and multi-tenancy patterns
- **[Drizzle ORM Docs](https://orm.drizzle.team/docs)** - ORM documentation

---

**Document Version**: 1.0
**Last Updated**: 2025-10-10
**Maintained By**: Development Team

**Feedback**: For schema questions or proposed changes, contact dev@innspiredaccountancy.com
