# Current App Feature Inventory

**Source**: `/root/projects/practice-hub/` (Next.js 15 monorepo)
**Date**: 2025-10-27
**Architecture**: Next.js 15 App Router + tRPC + PostgreSQL + Drizzle ORM + Better Auth

---

## Overview

The current Practice Hub is a **unified Next.js 15 monorepo** with multi-tenant architecture:
- **Framework**: Next.js 15.1.6 with Turbopack + App Router
- **API Layer**: tRPC v11 with type-safe procedures
- **Database**: PostgreSQL + Drizzle ORM v0.38.3
- **Auth**: Better Auth (email/password + OAuth)
- **Multi-Tenancy**: Dual isolation (`tenantId` + `clientId` for portal)
- **UI**: shadcn/ui + Tailwind CSS v4
- **Notifications**: react-hot-toast
- **Testing**: Vitest + Playwright

---

## CLIENT HUB

### Module Metadata
- **Base Path**: `/client-hub`
- **Routes**: 19 pages
- **Purpose**: Core practice management (staff-facing)
- **Layout**: Global header + sidebar with glass-card design system

### Routes

| ID | Route | File | Purpose | Match Score |
|----|-------|------|---------|-------------|
| `CH/HOME` | `/client-hub` | `app/client-hub/page.tsx` | Client Hub dashboard | N/A (new) |
| `CH/CLIENTS` | `/client-hub/clients` | `app/client-hub/clients/page.tsx` | Client list management | 100/100 |
| `CH/CLIENT_DETAIL` | `/client-hub/clients/[id]` | `app/client-hub/clients/[id]/page.tsx` | Individual client detail | 100/100 |
| `CH/TASKS` | `/client-hub/tasks` | `app/client-hub/tasks/page.tsx` | Task list with filters + bulk ops | 100/100 |
| `CH/TASK_DETAIL` | `/client-hub/tasks/[id]` | `app/client-hub/tasks/[id]/page.tsx` | Task detail, workflow, notes | 100/100 |
| `CH/INVOICES` | `/client-hub/invoices` | `app/client-hub/invoices/page.tsx` | Invoice management + Xero sync | 100/100 |
| `CH/INVOICE_DETAIL` | `/client-hub/invoices/[id]` | `app/client-hub/invoices/[id]/page.tsx` | Individual invoice detail | 100/100 |
| `CH/DOCUMENTS` | `/client-hub/documents` | `app/client-hub/documents/page.tsx` | Document storage + signatures | 100/100 |
| `CH/TIME_TRACKING` | `/client-hub/time-tracking` | `app/client-hub/time-tracking/page.tsx` | Time entry logging | 100/100 |
| `CH/TIME` | `/client-hub/time` | `app/client-hub/time/page.tsx` | Staff time management | N/A (new) |
| `CH/TIME_APPROVALS` | `/client-hub/time/approvals` | `app/client-hub/time/approvals/page.tsx` | Timesheet approval workflow | 100/100 |
| `CH/LEAVE` | `/client-hub/leave` | `app/client-hub/leave/page.tsx` | Leave/annual time management | N/A (new) |
| `CH/LEAVE_CALENDAR` | `/client-hub/leave/calendar` | `app/client-hub/leave/calendar/page.tsx` | Leave calendar view | N/A (new) |
| `CH/WORKFLOWS` | `/client-hub/workflows` | `app/client-hub/workflows/page.tsx` | Workflow management | 100/100 |
| `CH/SERVICES` | `/client-hub/services` | `app/client-hub/services/page.tsx` | Service catalog | 100/100 |
| `CH/COMPLIANCE` | `/client-hub/compliance` | `app/client-hub/compliance/page.tsx` | Compliance tracking | 100/100 |
| `CH/REPORTS` | `/client-hub/reports` | `app/client-hub/reports/page.tsx` | Reporting + analytics | 100/100 |
| `CH/SETTINGS` | `/client-hub/settings` | `app/client-hub/settings/page.tsx` | Client Hub settings | 100/100 |
| `CH/TASK_TEMPLATES` | `/client-hub/settings/task-templates` | `app/client-hub/settings/task-templates/page.tsx` | Task template config (Story 3.2) | N/A (new) |

---

## PROPOSAL HUB

### Module Metadata
- **Base Path**: `/proposal-hub`
- **Routes**: 16 pages
- **Purpose**: Sales pipeline and proposal management
- **Features**: Pricing calculator, DocuSeal integration, version history

### Routes

| ID | Route | File | Purpose | Match Score |
|----|-------|------|---------|-------------|
| `PH/HOME` | `/proposal-hub` | `app/proposal-hub/page.tsx` | Proposal Hub dashboard | 100/100 |
| `PH/PROPOSALS` | `/proposal-hub/proposals` | `app/proposal-hub/proposals/page.tsx` | Proposal list with filtering | 100/100 |
| `PH/PROPOSAL_DETAIL` | `/proposal-hub/proposals/[id]` | `app/proposal-hub/proposals/[id]/page.tsx` | Proposal detail + editing | 100/100 |
| `PH/PIPELINE_PROPOSALS` | `/proposal-hub/proposals/pipeline` | `app/proposal-hub/proposals/pipeline/page.tsx` | Proposal pipeline/Kanban | 100/100 |
| `PH/PIPELINE` | `/proposal-hub/pipeline` | `app/proposal-hub/pipeline/page.tsx` | Sales pipeline management | 100/100 |
| `PH/LEADS` | `/proposal-hub/leads` | `app/proposal-hub/leads/page.tsx` | Lead management | 100/100 |
| `PH/LEAD_NEW` | `/proposal-hub/leads/new` | `app/proposal-hub/leads/new/page.tsx` | Create new lead form | 100/100 |
| `PH/LEAD_DETAIL` | `/proposal-hub/leads/[id]` | `app/proposal-hub/leads/[id]/page.tsx` | Lead detail + conversion | 100/100 |
| `PH/CALCULATOR` | `/proposal-hub/calculator` | `app/proposal-hub/calculator/page.tsx` | Dynamic pricing calculator | N/A (new) |
| `PH/ONBOARDING` | `/proposal-hub/onboarding` | `app/proposal-hub/onboarding/page.tsx` | Client onboarding checklists | N/A (new) |
| `PH/ONBOARDING_SESSION` | `/proposal-hub/onboarding/[id]` | `app/proposal-hub/onboarding/[id]/page.tsx` | Onboarding session tracking | N/A (new) |
| `PH/ANALYTICS` | `/proposal-hub/analytics` | `app/proposal-hub/analytics/page.tsx` | Proposal metrics + analytics | 100/100 |
| `PH/ANALYTICS_PRICING` | `/proposal-hub/analytics/pricing` | `app/proposal-hub/analytics/pricing/page.tsx` | Pricing model performance | N/A (new) |
| `PH/REPORTS` | `/proposal-hub/reports` | `app/proposal-hub/reports/page.tsx` | Proposal reporting | N/A (new) |
| `PH/ADMIN_TEMPLATES` | `/proposal-hub/admin/templates` | `app/proposal-hub/admin/templates/page.tsx` | Proposal template admin | N/A (new) |
| `PH/ADMIN_PRICING` | `/proposal-hub/admin/pricing` | `app/proposal-hub/admin/pricing/page.tsx` | Pricing config + models | N/A (new) |

---

## tRPC API ROUTERS

### Tasks Router
**File**: `app/server/routers/tasks.ts`
**Procedures**: 30+ (queries + mutations)

| ID | Procedure | Type | Input | Permission | Match Score |
|----|-----------|------|-------|------------|-------------|
| `TASKS/LIST` | `list` | query | Search, filters | protected | 100/100 |
| `TASKS/GET_BY_ID` | `getById` | query | UUID | protected | 100/100 |
| `TASKS/CREATE` | `create` | mutation | Full task schema | protected | 100/100 |
| `TASKS/UPDATE` | `update` | mutation | Partial task | protected | 100/100 |
| `TASKS/DELETE` | `delete` | mutation | UUID | protected | 100/100 |
| `TASKS/UPDATE_STATUS` | `updateStatus` | mutation | ID + status enum | protected | 100/100 |
| `TASKS/ASSIGN_WORKFLOW` | `assignWorkflow` | mutation | taskId + workflowId | protected | N/A (new) |
| `TASKS/GET_WORKFLOW` | `getWorkflowInstance` | query | taskId | protected | N/A (new) |
| `TASKS/UPDATE_CHECKLIST` | `updateChecklistItem` | mutation | taskId, stageId, itemId, completed | protected | 100/100 |
| `TASKS/BULK_STATUS` | `bulkUpdateStatus` | mutation | taskIds[] + status | protected | N/A (new) |
| `TASKS/BULK_ASSIGN` | `bulkAssign` | mutation | taskIds[] + assigneeId | protected | N/A (new) |
| `TASKS/BULK_DELETE` | `bulkDelete` | mutation | taskIds[] | protected | N/A (new) |
| `TASKS/CREATE_NOTE` | `createNote` | mutation | taskId, note, isInternal, mentionedUsers | protected | N/A (new) |
| `TASKS/GET_NOTES` | `getNotes` | query | taskId, limit, offset | protected | N/A (new) |
| `TASKS/UPDATE_NOTE` | `updateNote` | mutation | noteId, note | protected | N/A (new) |
| `TASKS/DELETE_NOTE` | `deleteNote` | mutation | noteId (soft delete) | protected | N/A (new) |
| `TASKS/GET_NOTE_COUNT` | `getNoteCount` | query | taskId | protected | N/A (new) |
| `TASKS/MENTIONABLE_USERS` | `getMentionableUsers` | query | query string | protected | N/A (new) |
| `TASKS/REASSIGN` | `reassign` | mutation | taskId, toUserId, type, reason | protected | 100/100 |
| `TASKS/BULK_REASSIGN` | `bulkReassign` | mutation | taskIds[], toUserId, type, reason | protected | 100/100 |
| `TASKS/ASSIGNMENT_HISTORY` | `getAssignmentHistory` | query | taskId | protected | 100/100 |
| `TASKS/GENERATE_FROM_TEMPLATE` | `generateFromTemplate` | mutation | templateId, clientId, serviceId, activationDate | protected | N/A (Story 3.2) |
| `TASKS/PREVIEW_GENERATION` | `previewGeneration` | query | serviceId, clientId, activationDate | protected | N/A (Story 3.2) |
| `TASKS/GENERATE_RECURRING` | `generateRecurringTask` | mutation | templateId, clientId, serviceId, startDate | protected | N/A (Story 3.2) |
| `TASKS/GENERATE_BULK` | `generateBulk` | mutation | serviceId, clientIds[] | protected | N/A (Story 3.2) |

**Key Features**:
- Uses `task_details_view` PostgreSQL view for optimized queries
- Auto-generates next recurring task on completion
- Workflow email triggers on checklist updates (FR32: AC3)
- Task assignment history with notification preferences
- Internal notes with user mentions and soft delete

---

### Proposals Router
**File**: `app/server/routers/proposals.ts`
**Procedures**: 25+ (queries + mutations)

| ID | Procedure | Type | Input | Permission | Match Score |
|----|-----------|------|-------|------------|-------------|
| `PROPOSALS/LIST` | `list` | query | clientId?, status?, salesStage?, search | protected | 100/100 |
| `PROPOSALS/LIST_BY_STAGE` | `listByStage` | query | stages[], assignedToId?, dateRange?, value range | protected | N/A (new) |
| `PROPOSALS/GET_BY_ID` | `getById` | query | UUID | protected | 100/100 |
| `PROPOSALS/CREATE` | `create` | mutation | Full proposal + services[] | protected | 100/100 |
| `PROPOSALS/CREATE_FROM_LEAD` | `createFromLead` | mutation | leadId | protected | N/A (new) |
| `PROPOSALS/UPDATE` | `update` | mutation | id, partial proposal | protected | 100/100 |
| `PROPOSALS/UPDATE_SALES_STAGE` | `updateSalesStage` | mutation | id, salesStage enum | protected | N/A (new) |
| `PROPOSALS/DELETE` | `delete` | mutation | UUID (archives) | protected | 100/100 |
| `PROPOSALS/SEND` | `send` | mutation | id, validUntil | protected | N/A (DocuSeal) |
| `PROPOSALS/TRACK_VIEW` | `trackView` | mutation | UUID | protected | N/A (new) |
| `PROPOSALS/ADD_SIGNATURE` | `addSignature` | mutation | proposalId, signerName, email, signature, IP | protected | N/A (deprecated) |
| `PROPOSALS/GET_STATS` | `getStats` | query | - | protected | 100/100 |
| `PROPOSALS/GENERATE_PDF` | `generatePdf` | mutation | UUID | protected | N/A (new) |
| `PROPOSALS/CREATE_VERSION` | `createVersion` | mutation | proposalId, changeDescription | protected | N/A (new) |
| `PROPOSALS/UPDATE_WITH_VERSION` | `updateWithVersion` | mutation | id, changeDescription, data | protected | N/A (new) |
| `PROPOSALS/GET_VERSION_HISTORY` | `getVersionHistory` | query | proposalId | protected | N/A (new) |
| `PROPOSALS/GET_VERSION_BY_ID` | `getVersionById` | query | versionId | protected | N/A (new) |
| `PROPOSALS/GET_FOR_SIGNATURE` | `getProposalForSignature` | query | UUID | **public** (rate limited 20/10s) | N/A (DocuSeal) |
| `PROPOSALS/SUBMIT_SIGNATURE` | `submitSignature` | mutation | proposalId, signer data | **public** (rate limited 5/10s) | N/A (DocuSeal) |
| `PROPOSALS/GET_SIGNED_PDF_URL` | `getSignedPdfUrl` | query | proposalId, ttlSeconds? | protected | N/A (new) |

**Key Features**:
- **DocuSeal Integration**: Creates templates, submissions, handles webhooks
- **Version History**: Automatic snapshots on `updateWithVersion`
- **Lead Conversion**: `createFromLead` auto-populates fields
- **Public Signing**: Rate-limited public procedures for signing page
- **Email Automation**: Resend integration for invitations/confirmations
- **S3 Presigned URLs**: Secure PDF access with time limits

---

### Clients Router
**File**: `app/server/routers/clients.ts`
**Procedures**: 20+

| ID | Procedure | Type | Purpose | Match Score |
|----|-----------|------|---------|-------------|
| `CLIENTS/LIST` | `list` | query | Filter by search, type, status | 100/100 |
| `CLIENTS/GET_BY_ID` | `getById` | query | Single client detail | 100/100 |
| `CLIENTS/CREATE` | `create` | mutation | Full client schema + primaryContact | 100/100 |
| `CLIENTS/UPDATE` | `update` | mutation | Partial client update | 100/100 |
| `CLIENTS/DELETE` | `delete` | mutation | Archive (soft delete) | 100/100 |
| `CLIENTS/GET_SERVICES` | `getClientServices` | query | Client-service mappings | 100/100 |
| `CLIENTS/GET_CONTACTS` | `getClientContacts` | query | Client contact list | 100/100 |
| `CLIENTS/GET_DIRECTORS` | `getClientDirectors` | query | Companies House directors | N/A (new) |
| `CLIENTS/GET_PSCS` | `getClientPSCs` | query | Persons with Significant Control | N/A (new) |
| `CLIENTS/UPDATE_CONTACT` | `updateContact` | mutation | Contact details | 100/100 |
| `CLIENTS/LOOKUP_COMPANIES_HOUSE` | `lookupCompaniesHouse` | query | Company number → data | N/A (new) |
| `CLIENTS/VALIDATE_VAT` | `validateVAT` | mutation | VAT number → HMRC validation | N/A (new) |
| `CLIENTS/PREVIEW_IMPORT` | `previewImport` | mutation | CSV content → dry-run | N/A (new) |
| `CLIENTS/IMPORT_CLIENTS` | `importClients` | mutation | CSV → bulk insert with transaction | N/A (new) |
| `CLIENTS/BULK_UPDATE_STATUS` | `bulkUpdateStatus` | mutation | clientIds[] + status | N/A (new) |
| `CLIENTS/BULK_ASSIGN_MANAGER` | `bulkAssignManager` | mutation | clientIds[] + managerId | N/A (new) |
| `CLIENTS/BULK_DELETE` | `bulkDelete` | mutation | clientIds[] (hard delete) | N/A (new) |

**Key Features**:
- **Companies House Integration**: Automated director/PSC lookup with caching (5 min)
- **VAT Validation**: HMRC API integration
- **CSV Import**: Transaction-safe bulk import with preview
- **Bulk Operations**: Status, manager assignment, delete

---

### Other Routers (45+ Total)

**Additional Routers**:
- `workflows.ts` - Workflow CRUD, versioning, stage management
- `leads.ts` - Lead management, qualification, conversion
- `onboarding.ts` - Client onboarding session tracking
- `invoices.ts` - Invoice CRUD, Xero sync, billing
- `documents.ts` - Document storage, signatures, sharing
- `timesheet-submissions.ts` - Timesheet approval workflow
- `timesheets.ts` - Time entry tracking
- `toil.ts` - TOIL accrual and expiry
- `leave.ts` - Leave management
- `workTypes.ts` - Work type configuration
- `workingPatterns.ts` - Working pattern definitions
- `calendar.ts` - Calendar views
- `notifications.ts` - Notification system
- `messages.ts` - Internal messaging
- `email-templates.ts` - Email template management
- `compliance.ts` - Compliance tracking
- `departments.ts` - Department management
- `users.ts` - User management
- `settings.ts` - Settings and preferences
- `staff-statistics.ts` - Staff analytics
- `activities.ts` - Activity logging
- `reports.ts` - Reporting
- `legal.ts` - Legal page management
- `transactionData.ts` - Transaction data handling
- `invitations.ts` - User invitations
- `admin-kyc.ts` - KYC admin operations
- `services.ts` - Service management
- `proposalTemplates.ts` - Proposal templates
- `clientPortal.ts` - Client portal access
- `clientPortalAdmin.ts` - Client portal admin
- `analytics.ts` - Proposal analytics
- `pricing.ts` - Pricing model logic
- `pricingAdmin.ts` - Pricing admin operations
- `companies-house.ts` - Companies House integration
- `task-generation.ts` - Task template generation (Story 3.2)
- `taskTemplates.ts` - Task template CRUD (Story 3.2)

---

## DATABASE SCHEMA (Drizzle ORM)

### Core Tables

**clients** (`.../lib/db/schema.ts:598`):
- `id` (uuid PK), `tenantId` (text FK), `clientCode` (unique per tenant)
- `name`, `type` (enum: individual|company|limited_company|...), `status` (enum: prospect|onboarding|active|...)
- `email`, `phone`, `website`, `vatNumber`, `registrationNumber`
- `vatValidationStatus` (valid|invalid|pending), `vatValidatedAt`
- Address fields, `accountManagerId`, `incorporationDate`, `yearEnd`
- Xero: `xeroContactId`, `xeroSyncStatus`, `xeroLastSyncedAt`
- `healthScore` (0-100), `metadata` (jsonb)

**tasks** (`.../lib/db/schema.ts:927`):
- `id` (uuid PK), `tenantId`, `title`, `description`
- `status` (enum: pending|in_progress|review|completed|cancelled|blocked|records_received|queries_sent|queries_received)
- `priority` (enum: low|medium|high|urgent|critical)
- `clientId`, `assignedToId`, `preparerId`, `reviewerId`, `createdById`
- `periodEndDate`, `dueDate`, `targetDate`, `completedAt`
- `estimatedHours`, `actualHours`, `progress` (0-100)
- `taskType`, `category`, `tags` (jsonb), `parentTaskId`
- `workflowId`, `isRecurring`, `recurringFrequency`, `recurringDayOfMonth`
- **Story 3.2 fields**: `serviceId`, `autoGenerated`, `templateId`, `generatedAt`

**task_notes** (`.../lib/db/schema.ts:1012`):
- `id`, `taskId`, `userId` (author), `note`, `isInternal`
- `mentionedUsers` (text[]), `deletedAt` (soft delete)

**task_templates** (`.../lib/db/schema.ts:1048`):
- `id`, `tenantId`, `serviceId` (one template per service)
- `namePattern` (e.g., "Prepare {service_name} for {client_name}")
- `descriptionPattern`, `estimatedHours`, `priority`, `taskType`
- `dueDateOffsetDays`, `dueDateOffsetMonths`
- `isRecurring`, `recurringFrequency`, `recurringDayOfMonth`
- `isActive`

**task_workflow_instances** (`.../lib/db/schema.ts`):
- `id`, `taskId`, `workflowId`, `workflowVersionId`
- `version`, `stagesSnapshot` (jsonb), `currentStageId`
- `status` (active|completed|paused), `stageProgress` (jsonb)

**proposals** (`.../lib/db/schema.ts`):
- `id`, `tenantId`, `leadId`, `clientId`, `proposalNumber` (auto PROP-XXXX)
- `title`, `status` (draft|sent|viewed|signed|rejected|expired)
- `salesStage` (enquiry|qualified|proposal_sent|follow_up|won|lost|dormant)
- `pricingModelUsed`, `version`, `monthlyTotal`, `annualTotal`
- `turnover`, `industry`, `monthlyTransactions`
- `notes`, `termsAndConditions`, `customTerms`
- `validUntil`, `sentAt`, `viewedAt`, `signedAt`
- `pdfUrl`, `signedPdfKey` (S3), `signedPdfUrlExpiresAt`, `documentHash`
- **DocuSeal**: `docusealTemplateId`, `docusealSubmissionId`
- `createdById`, `assignedToId`

**proposal_versions** (`.../lib/db/schema.ts`):
- `id`, `proposalId`, `version`, full proposal snapshot
- `services` (jsonb array), `termsAndConditions`, `customTerms`, `pdfUrl`
- `changeDescription`, `createdById`, `createdByName`

**proposal_signatures** (`.../lib/db/schema.ts`):
- `id`, `proposalId`, `docusealSubmissionId` (UNIQUE)
- `signatureType` (electronic|wet_ink), `signatureMethod` (docuseal|canvas)
- `signerName`, `signerEmail`, `signingCapacity`
- `companyInfo` (jsonb), `auditTrail` (jsonb), `documentHash`
- `ipAddress`, `userAgent`, `viewedAt`, `signedAt`

**documents** (`.../lib/db/schema.ts:1253`):
- `id`, `tenantId`, `name`, `type` (file|folder), `mimeType`, `size`
- `url` (S3), `thumbnailUrl`, `parentId` (folder structure), `path`
- `clientId`, `taskId`, `description`, `tags` (jsonb), `version`
- `isArchived`, `isPublic`, `shareToken`, `shareExpiresAt`
- `uploadedById`, `requiresSignature`, `signatureStatus`
- **DocuSeal**: `docusealSubmissionId`, `docusealTemplateId`
- `signedPdfKey` (S3), `signedPdfUrlExpiresAt`

**invoices** (`.../lib/db/schema.ts:1358`):
- `id`, `tenantId`, `clientId`, `invoiceNumber` (unique per tenant)
- `issueDate`, `dueDate`, `paidDate`
- `subtotal`, `taxRate`, `taxAmount`, `discount`, `total`, `amountPaid`
- `status` (draft|sent|paid|overdue|cancelled), `currency` (default GBP)
- `notes`, `terms`, `purchaseOrderNumber`
- **Xero**: `xeroInvoiceId`, `xeroSyncStatus`, `xeroLastSyncedAt`, `xeroSyncError`
- `createdById`

**services** (`.../lib/db/schema.ts:806`):
- `id`, `tenantId`, `code`, `name`, `category`
- `description`, `pricingModel`, `basePrice`, `price`, `priceType`
- `defaultRate`, `duration`, `supportsComplexity`
- `tags` (jsonb), `isActive`, `metadata` (jsonb)

**workflows** (`.../lib/db/schema.ts:1454`):
- `id`, `tenantId`, `version`, `currentVersionId`
- `name`, `description`, `type` (task_template|automation|approval)
- `trigger` (manual|schedule|event), `isActive`, `estimatedDays`
- `serviceId`, `config`, `conditions`, `actions` (jsonb)

**workflow_stages** (`.../lib/db/schema.ts`):
- `id`, `workflowId`, `name`, `description`, `stageOrder`
- `isRequired`, `estimatedHours`, `autoComplete`, `requiresApproval`
- `checklistItems` (jsonb array)

**user_settings** (`.../lib/db/schema.ts:171`):
- `id`, `userId` (unique), `emailNotifications`, `inAppNotifications`
- `digestEmail` (daily|weekly|never)
- Granular: `notifTaskAssigned`, `notifTaskMention`, `notifTaskReassigned`, `notifDeadlineApproaching`, `notifApprovalNeeded`, `notifClientMessage`
- `theme`, `language`, `timezone`

---

## INTEGRATIONS

### DocuSeal E-Signature

**Client**: `lib/docuseal/client.ts`
- `createTemplate(name, fields)` - Create signing template
- `createSubmission(template_id, submitters, metadata)` - Send signing request
- `getSubmission(submissionId)` - Get submission status
- `downloadSignedPdf(submissionId)` - Download signed PDF
- `getEmbedUrl(submissionId, email)` - Embedded signing URL

**Webhook Handler**: `app/api/webhooks/docuseal/route.ts:132-461`
- **Signature Verification**: HMAC-SHA256 with `x-docuseal-signature` header
- **Replay Protection**: 300-second window on `x-docuseal-timestamp`
- **Rate Limiting**: Tenant (10 req/s), Submission (1 req/s)
- **Idempotency**: Checks `docusealSubmissionId` uniqueness
- **Events**: `submission.completed`, `submission.declined`, `submission.expired`
- **Side Effects**: Updates proposal status, creates signatures, sends emails, logs activities

**UK Compliance Fields**: `lib/docuseal/uk-compliance-fields.ts`
- Signature, signer name/email, signing date, capacity, company info
- Authority confirmation, consent to e-signature

**Email Handler**: `lib/docuseal/email-handler.ts`
- `sendSigningInvitation()` - Signing invitation with 30-day expiry
- `sendSignedConfirmation()` - Confirmation with 7-day presigned URL
- `sendTeamSignedNotification()` - Team notification

### Companies House API
**Client**: `lib/integrations/companies-house.ts`
- `lookupCompany(companyNumber)` - Company details
- `getDirectors(companyNumber)` - Director list
- `getPSCs(companyNumber)` - Persons with Significant Control
- **Rate Limiting**: 5 min cache per lookup
- **Caching**: In-memory cache to avoid API limits

### Xero Accounting
**Integration**: `lib/xero/` (inferred from schema fields)
- **OAuth**: Authorization code flow
- **Sync**: Invoice sync, client contact matching
- **Fields**: `xero_contact_id`, `xero_invoice_id`, `xero_status`, `xero_last_sync_at`

### Resend Email
**Usage**: Proposal signing invitations, confirmations, team notifications
**Rate Limiting**: Built-in via Resend API

---

## TEST COVERAGE

**Test Files**: 60+ Vitest test files

**Router Tests** (`__tests__/routers/`):
- `proposals.test.ts` - Proposal CRUD, versioning, signatures
- `clients.test.ts` - Client CRUD, bulk ops, Companies House
- `tasks.test.ts` - Task CRUD, assignment, workflows
- `taskTemplates.test.ts` - Task template system (Story 3.2)
- `task-generation.test.ts` - Task auto-generation (Story 3.2)
- `workflows.test.ts` - Workflow CRUD and state
- `pipeline.test.ts` - Lead-to-proposal pipeline
- `onboarding.test.ts` - Onboarding sessions
- `documents.test.ts` - Document storage + signatures
- `invoices.test.ts` - Invoice CRUD + Xero
- `timesheet-submissions.test.ts` - Timesheet approvals
- `toil.test.ts` - TOIL accrual + expiry
- `leave-toil-integration.test.ts` - Leave + TOIL interaction
- `analytics.test.ts` - Proposal analytics
- `pricing.test.ts` - Pricing model logic
- `staff-statistics.test.ts` - Staff analytics
- `companies-house.test.ts` - Companies House lookups

**Integration Tests** (`__tests__/integration/`):
- `tenant-isolation.test.ts` - Multi-tenant data isolation
- `transaction-isolation.test.ts` - Transaction safety

**Performance Tests** (`__tests__/performance/`):
- `task-generation.perf.test.ts` - Story 3.2 bulk generation
- `staff-statistics.perf.test.ts` - Stats query performance
- `timesheet-approval.perf.test.ts` - Approval workflow perf

**Webhook Tests** (`__tests__/api/webhooks/`):
- `docuseal.test.ts` - Signature verify, rate limit, idempotency, events

**Lib Tests** (`__tests__/lib/`):
- `template-placeholders.test.ts` - Story 3.2 placeholder system
- `working-days.test.ts` - Leave calculation
- `companies-house-client.test.ts` - Companies House API
- `xero/api-client.test.ts` - Xero API integration
- `shouldSendNotification.test.ts` - Notification preferences
- `template-renderer.test.ts` - Email template rendering
- `workflow-triggers.test.ts` - Workflow email rules

**Playwright E2E** (`tests/e2e/`):
- `pipeline.spec.ts` - Proposal pipeline functionality

---

## SUMMARY STATS

| Metric | Count |
|--------|-------|
| **Total Modules** | 5 (client-hub, proposal-hub, client-portal, admin, practice-hub) |
| **Client Hub Routes** | 19 |
| **Proposal Hub Routes** | 16 |
| **tRPC Routers** | 45+ |
| **tRPC Procedures** | 200+ (queries + mutations) |
| **Database Tables** | 50+ |
| **Test Files** | 60+ |
| **Integrations** | 4 (DocuSeal, Companies House, Xero, Resend) |

---

**Next**: See [30-gap-table.md](./30-gap-table.md) for feature-by-feature comparison against legacy.
