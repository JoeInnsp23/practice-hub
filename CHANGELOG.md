# Changelog

All notable changes to Practice Hub will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added - Practice Hub Redesign (Phase 2)
- **Company Announcements System**: Multi-tenant announcement management with priority levels (info/warning/critical), schedule windows, and pin-to-top functionality
- **Admin Announcements Page**: Complete CRUD interface with icon picker, color customization, and status toggling
- **Urgent Tasks Widget**: Server-computed widget showing top 5 urgent tasks (high priority or due within 5 days) with client names and due date formatting
- **Need Help Card**: Support contact widget with email, phone, and live chat options
- **Two-Column Layout**: Redesigned Practice Hub main page with left column (welcome, approvals, navigation) and right column (announcements, tasks, help)
- **Hub Color Theming**: Advanced CSS variable system with derived color shades (`--hub-color-400/500/600`) and gradient rail decorations
- **Enhanced CardInteractive**: Animated gradient left rail on hover, integrated with hub color system
- **Role-Based Widgets**: Admin-only gating for pending approvals widget using session router

### Added - Testing Infrastructure
- Announcements router tests: CRUD, schedule window filtering, multi-tenant isolation, pin/active toggling
- Tasks router tests: getTopUrgentTasks with priority filtering, due date ordering, user-scoped results
- Integration tests for announcement priority badges and client name joins
- Vitest test coverage for new widget components

### Changed - UI/UX Improvements
- Updated AppCard component to use CardInteractive for consistency
- Removed sidebar references from Practice Hub layout (full-width content)
- Enhanced glass-card design system with interactive hover states
- Improved announcement display with icon mapping and color theming

### Technical
- Added session router for client-side role access (eliminates prop drilling)
- Server-side urgent tasks computation for performance optimization
- Schedule window filtering with nullable date handling (startsAt/endsAt)
- Pin-first ordering with composite database index (tenantId, isPinned, createdAt)
- Admin-only procedures for announcement management operations

### Documentation
- Complete environment variables reference (`ENVIRONMENT_VARIABLES.md`)
- Complete database schema documentation (`DATABASE_SCHEMA.md`)
- Complete API reference documentation
- Complete production readiness documentation (deployment, monitoring, backup)
- Complete system architecture documentation

---

## [1.0.0] - 2025-10-10

### Added - KYC/AML Onboarding System
- **LEM Verify Integration**: UK MLR 2017 compliant identity verification (£1/verification)
- **AI Document Extraction**: Google Gemini 2.0 Flash extracts data from ID documents
- **5-Category Questionnaire**: Comprehensive AML onboarding with AI pre-fill
- **AML Screening**: PEP, sanctions, watchlist, and adverse media checks via LexisNexis
- **Auto-Approval**: Automatic client approval for clean verifications
- **Manual Review Queue**: Admin dashboard for reviewing flagged verifications
- **Lead-to-Client Conversion**: Automatic conversion upon KYC approval with portal access
- **Webhook Integration**: Real-time status updates from LEM Verify with HMAC signature verification
- **Email Notifications**: Automated status updates via Resend
- **Activity Logging**: Complete audit trail for compliance

### Added - Admin Features
- KYC review dashboard with manual approval/rejection workflow
- Re-verification flow for failed or flagged checks
- Detailed verification reports with AML screening results
- Portal access blocking until onboarding approved

### Added - Security Enhancements
- Rate limiting on webhook endpoints (100 requests/minute)
- HMAC-SHA256 webhook signature verification
- Secure document storage with S3 pre-signed URLs
- IP address and user agent logging for audit trail
- Protected client portal routes (blocked during onboarding)

### Added - Testing Infrastructure
- Vitest testing framework with 58 tests passing in <3 seconds
- Unit tests for configuration, caching, rate limiting, S3 utilities
- API route tests for webhook handlers (signature verification, validation, error handling)
- Service mocks for LEM Verify, S3, Resend
- Test coverage reporting with 70%+ thresholds

### Added - Documentation
- Comprehensive production readiness documentation suite:
  - Deployment checklist with environment-specific configurations
  - Operational runbooks for daily tasks, troubleshooting, emergencies
  - Monitoring strategy with 40+ metrics and alert rules
  - Backup and disaster recovery procedures (RTO: 4 hours, RPO: 1 hour)
  - System architecture diagrams and data flow documentation
  - API reference with tRPC procedures and webhook specifications

### Changed
- Migrated from ComplyCube to LEM Verify for cost reduction (£1 vs £5/verification)
- Updated client status workflow to include `onboarding` state
- Enhanced `onboarding_sessions` table with approval workflow fields
- Replaced `aml_checks` table with `kyc_verifications` table (LEM Verify)

### Fixed
- Document type validation for UK-specific AML requirements (passport, driving_licence)
- Email notification error handling for failed sends
- TypeScript type errors in onboarding components
- Portal access control during onboarding process

---

## [0.9.0] - 2025-10-08

### Added - Performance & Testing
- Vitest testing framework integration
- 42 unit tests for utilities and services
- 16 API route tests for webhooks
- In-memory caching with TTL for frequently accessed data
- Rate limiting implementation for critical endpoints
- Configuration validation with environment variable checking

### Added - Security Hardening
- Webhook signature verification with HMAC-SHA256
- IP-based rate limiting (configurable limits per endpoint)
- Secure S3 key extraction utilities
- Audit logging for all sensitive operations

### Improved
- Database query optimization with view utilization
- S3 URL parsing and validation
- Error handling in webhook processors
- Test documentation and coverage reporting

---

## [0.8.0] - 2025-10-06

### Added - Admin KYC Review
- Admin KYC review dashboard at `/admin/kyc-review`
- Manual approval/rejection workflow for flagged verifications
- Detailed verification reports with document data, biometrics, AML results
- Re-verification flow for rejected or failed checks
- Activity logging for all admin actions (approval, rejection, re-verification)

### Added - Email Notifications
- Resend email integration for transactional emails
- Approval notification emails to clients
- Rejection notification emails with re-verification instructions
- Email templates with consistent branding

### Changed
- Enhanced `kyc_verifications` table with approval workflow fields
- Updated onboarding flow to include admin approval step
- Improved error handling for LEM Verify API failures

### Fixed
- TypeScript compilation errors in admin components
- tRPC procedure return types for KYC operations
- Email template rendering issues

---

## [0.7.0] - 2025-10-04

### Added - Client Portal
- Separate client portal authentication system
- `client_portal_users`, `client_portal_access`, `client_portal_invitations` tables
- Client portal invitation workflow
- Multi-client access for users managing multiple entities
- Role-based access control (viewer, editor, admin)
- Session management for external clients
- Onboarding interface for clients at `/client-portal/onboarding`

### Added - E-Signature Integration
- DocuSeal integration for legally compliant e-signatures
- UK Simple Electronic Signature (SES) compliance
- `proposal_signatures` table with audit trail
- Signature workflow with email notifications
- Document hash verification (SHA-256)
- IP address and user agent logging
- Signing capacity and company information capture

### Changed
- Enhanced `proposals` table with DocuSeal fields
- Updated proposal workflow to include e-signature step

### Fixed
- Authentication redirect issues in client portal
- E-signature auth bug with session management
- TypeScript errors in signature components

---

## [0.6.0] - 2025-10-02

### Added - Analytics & Reporting
- **Comprehensive Dashboard** with charts and KPIs:
  - Revenue trends (monthly)
  - Client growth chart
  - Task completion chart
  - Top clients by revenue
  - Overdue tasks widget
  - Upcoming compliance widget
- **Pricing Analytics Page** at `/proposal-hub/analytics`:
  - Model A vs Model B comparison charts
  - Service popularity and revenue analysis
  - Monthly proposal trends
  - Conversion rate tracking
  - Average deal size by industry
- **Reports Page** at `/proposal-hub/reports`:
  - Proposal report with filters (status, date range, pricing model)
  - Lead report with conversion tracking
  - CSV export functionality
  - Date range filters
  - Status filters

### Added - Analytics Infrastructure
- `analyticsRouter` tRPC router
- Recharts library for data visualization
- CSV export utilities
- Dashboard KPI view aggregation

---

## [0.5.0] - 2025-09-28

### Added - Pipeline & CRM
- **Kanban Pipeline** at `/proposal-hub/pipeline`:
  - Drag-and-drop deal cards between stages
  - Deal value tracking
  - Days in stage calculation
  - Stage-specific deal counts
  - Date range filters
  - Value range filters
- **Activity Timeline** on proposal detail pages:
  - Activity logging for all proposal actions
  - Date/time, duration, and outcome tracking
  - Activity type categorization (call, email, meeting, etc.)
  - Activity creation dialog

### Added - Pipeline Features
- Lead status enum: `new`, `contacted`, `qualified`, `proposal_sent`, `negotiating`, `converted`, `lost`
- Pipeline statistics: total deals, total value, average deal size
- Activity tracking with duration and outcome fields

---

## [0.4.0] - 2025-09-25

### Added - Lead Management
- **Leads Table** at `/proposal-hub/leads`:
  - Lead creation and editing
  - Lead status tracking
  - Assignment to staff members
  - Qualification scoring
  - Source tracking (referral, website, cold call, etc.)
  - Interested services tracking
- **Lead Detail Page** at `/proposal-hub/leads/[id]`:
  - Lead overview with contact information
  - Company details
  - Lead qualification data
  - Conversion tracking
- **Lead-to-Proposal Conversion**:
  - Create proposal from lead
  - Auto-populate proposal with lead data

### Added - Database Schema
- `leads` table with comprehensive lead tracking
- Lead status enum
- Lead assignment to users

---

## [0.3.0] - 2025-09-22

### Added - Proposal System
- **Proposal Calculator** at `/proposal-hub/calculator`:
  - 28 service components across 7 categories
  - 138+ pricing rules with turnover/transaction bands
  - Complexity multipliers (Model A & B)
  - Industry-specific pricing
  - Discount rules (volume, rush, new client)
  - Real-time price calculations
- **Proposal Management** at `/proposal-hub`:
  - Proposal list with status tracking
  - Proposal detail pages
  - PDF generation with S3 storage
  - Proposal versioning
- **Pricing System**:
  - `service_components` table (28 services)
  - `pricing_rules` table (138+ rules)
  - `proposals` table
  - `proposal_services` table (snapshot storage)
  - Pricing model enums (turnover, transaction, both, fixed)

### Added - PDF Generation
- Proposal PDF generation with custom branding
- S3 storage integration for PDF files
- MinIO local development setup
- PDF download and email delivery

---

## [0.2.0] - 2025-09-18

### Added - Admin Pricing Management
- **Admin Pricing Page** at `/admin/pricing`:
  - Service Components tab with CRUD operations
  - Pricing Rules tab with band validation
  - Configuration tab for multipliers and discounts
  - Search and filter functionality
- **Pricing Configuration**:
  - Create, edit, delete, clone service components
  - Create, edit, delete pricing rules with overlap detection
  - Configure complexity multipliers (Model A & B)
  - Configure industry multipliers
  - Configure discount rules (volume, rush, new client)
  - Export configuration as JSON
  - Reset to system defaults
- **Audit Logging**:
  - Complete activity logs for all pricing changes
  - Admin user tracking
  - Change history with old/new values

### Added - Database Schema
- `service_components` table
- `pricing_rules` table
- Service component category enum
- Pricing model enum
- Pricing rule type enum

---

## [0.1.0] - 2025-09-15

### Added - Authentication & Core Modules
- **Better Auth Integration**:
  - Email/password authentication with bcrypt hashing
  - Microsoft OAuth (personal and work accounts)
  - Session management with 7-day expiration
  - Multi-tenant support with organization context
  - Password reset functionality
- **Multi-Tenancy Architecture**:
  - `tenants` table with unique slugs
  - Tenant-scoped data isolation
  - Custom `getAuthContext()` helper for tenant context
- **Core Modules**:
  - Practice Hub dashboard at `/practice-hub`
  - Client Hub at `/client-hub`
  - Admin Panel at `/admin`
- **CRM System**:
  - `clients` table with comprehensive fields
  - `client_contacts` table
  - `client_directors` table (Companies House integration)
  - `client_pscs` table (Persons with Significant Control)
  - Client status enum: prospect, onboarding, active, inactive, archived
- **Task Management**:
  - `tasks` table with assignment and tracking
  - Task status enum with 9 states
  - Task priority enum (low to critical)
  - Subtask support with `parentTaskId`
- **Time Tracking**:
  - `time_entries` table with billable/billed tracking
  - Work type enum (work, admin, training, holiday, etc.)
  - Time entry status enum (draft, submitted, approved, rejected)
  - Approval workflow
- **Document Management**:
  - `documents` table with folder structure
  - S3 integration for file storage
  - Version control
  - Share token generation for public links
- **Compliance Tracking**:
  - `compliance` table
  - Compliance status and priority enums
  - Deadline tracking with reminders
- **Portal Links**:
  - `portal_categories` table
  - `portal_links` table
  - User favorites
  - Role-based visibility
- **Database Views**:
  - `dashboard_kpi_view` - Aggregated metrics
  - `activity_feed_view` - Activity logs with entity names
  - `task_details_view` - Tasks with client/assignee info
  - `client_details_view` - Clients with account manager info
  - `compliance_details_view` - Compliance with client info
  - `time_entries_view` - Time entries with user/client/task names
  - `invoice_details_view` - Invoices with client details

### Added - Developer Tools
- Drizzle ORM with PostgreSQL
- tRPC for type-safe APIs
- Better Auth for authentication
- Biome for linting and formatting
- TypeScript strict mode
- Docker Compose for local development
- Database seeding with `scripts/seed.ts`

### Added - Documentation
- `CLAUDE.md` with development guidelines
- `README.md` with setup instructions
- Microsoft OAuth setup guide
- Authentication overview
- CSRF protection documentation

---

## [0.0.1] - 2025-09-01

### Added - Initial Setup
- Next.js 15 with App Router and Turbopack
- React 19
- Tailwind CSS v4
- shadcn/ui components
- PostgreSQL database setup
- Drizzle ORM configuration
- Basic project structure
- Environment variable configuration

---

## Version Numbering

Practice Hub follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version (1.0.0): Incompatible API changes or significant feature releases
- **MINOR** version (0.1.0): New functionality in a backwards-compatible manner
- **PATCH** version (0.0.1): Backwards-compatible bug fixes

### Pre-1.0 Development

During pre-1.0 development (0.x.x), breaking changes may occur in minor versions. Version 1.0.0 represents the first production-ready release.

---

## Categories

Changes are grouped by category:

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

---

## Links

- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
- [GitHub Repository](https://github.com/yourusername/practice-hub) *(Update with actual URL)*

---

**Last Updated**: 2025-10-10
**Maintained By**: Development Team
