# Practice Hub

A modern, multi-tenant practice management platform built with Next.js 15, Better Auth, and PostgreSQL.

## Overview

Practice Hub is a comprehensive practice management system designed for accounting firms and professional services organizations. It provides client management, task tracking, time management, compliance monitoring, and proposal generation capabilities.

## Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router and Turbopack
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui (Radix UI primitives)
- **Forms**: React Hook Form with Zod validation
- **State Management**: React Query (TanStack Query) + tRPC
- **Notifications**: react-hot-toast

### Backend
- **Runtime**: Node.js (via Next.js API routes)
- **API Layer**: tRPC for type-safe APIs
- **Authentication**: Better Auth with email/password + Microsoft OAuth
- **Database**: PostgreSQL 14+ with Drizzle ORM
- **File Storage**: S3-compatible (MinIO local / Hetzner production)

### Integrations
- **KYC/AML**: LEM Verify (£1/verification, UK MLR 2017 compliant)
- **AI**: Google Gemini 2.0 Flash (document extraction)
- **Email**: Resend (transactional emails)
- **E-Signature**: DocuSeal (document signing)
- **Object Storage**: Hetzner S3 or MinIO

### DevOps & Quality
- **Code Quality**: Biome for linting and formatting
- **Testing**: Vitest (58 tests passing in <3 seconds)
- **Type Safety**: TypeScript strict mode
- **Version Control**: Git
- **Monitoring**: Sentry (errors) + UptimeRobot (uptime)

## Features

### Authentication & Multi-Tenancy
- ✅ Email/password authentication with bcrypt hashing
- ✅ Microsoft OAuth (personal and work accounts)
- ✅ Multi-tenant architecture with organization management
- ✅ Role-based access control (Admin, Member, Client)
- ✅ Session management with Better Auth
- ✅ Secure CSRF protection
- ✅ Password reset and account management

### KYC/AML Compliance ⭐ NEW
- ✅ **LEM Verify Integration**: UK MLR 2017 compliant identity verification
- ✅ **AI Document Extraction**: Google Gemini 2.0 Flash extracts data from ID documents
- ✅ **Automated Questionnaire**: 5-category onboarding questionnaire with AI pre-fill
- ✅ **AML Screening**: PEP, sanctions, watchlist, and adverse media checks
- ✅ **Auto-Approval**: Automatic client approval for clean verifications
- ✅ **Manual Review Queue**: Admin dashboard for reviewing flagged verifications
- ✅ **Lead-to-Client Conversion**: Automatic conversion upon KYC approval
- ✅ **Webhook Integration**: Real-time status updates from LEM Verify
- ✅ **Activity Logging**: Complete audit trail for compliance
- ✅ **Email Notifications**: Automated status updates via Resend

### Core Modules
- **Practice Hub**: Main dashboard and overview with quick actions
- **Client Hub**: Complete CRM with clients, contacts, services, compliance tracking
- **Proposal Hub**: Lead management, proposal generation, comprehensive pricing calculator
- **Admin Panel**: User management, KYC review queue, portal links, system settings
- **Client Portal**: Secure external client access with onboarding and document management
- **Social Hub**: Team collaboration features (in development)

### Client Relationship Management
- ✅ Client profiles with contact management
- ✅ Director and PSC tracking
- ✅ Service assignment and tracking
- ✅ Document management
- ✅ Compliance monitoring with reminders
- ✅ Activity logging for all client interactions
- ✅ Client portal invitations and access management

### Proposal & Pricing
- ✅ Lead capture and management
- ✅ Comprehensive pricing calculator (28 services, 138+ rules)
- ✅ Complexity multipliers (Model A & B)
- ✅ Industry-specific pricing
- ✅ Discount rules (volume, rush, new client)
- ✅ PDF proposal generation with S3 storage
- ✅ Proposal tracking and status management

### Operations & Workflow
- ✅ Task management with assignments
- ✅ Time tracking and timesheet management
- ✅ Custom workflow creation
- ✅ Invoice generation and tracking
- ✅ Activity logging and audit trails
- ✅ Portal links management for client resources

### Technical Features
- ✅ Type-safe APIs with tRPC
- ✅ Real-time data with React Query
- ✅ Optimized database queries with Drizzle ORM
- ✅ S3-compatible object storage (MinIO/Hetzner)
- ✅ Webhook handlers with HMAC signature verification
- ✅ Rate limiting on critical endpoints
- ✅ In-memory caching for performance
- ✅ Comprehensive testing suite (58 tests passing)
- ✅ Production-ready monitoring and operations documentation

## Getting Started

### Prerequisites

- Node.js 18+ (with pnpm)
- PostgreSQL 14+
- Docker (for database)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd practice-hub
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your values:
   ```env
   # Database
   DATABASE_URL="postgresql://postgres:password@localhost:5432/practice_hub"

   # Better Auth
   BETTER_AUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32
   BETTER_AUTH_URL="http://localhost:3000"
   NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

   # Microsoft OAuth (Optional)
   MICROSOFT_CLIENT_ID="your-microsoft-client-id"
   MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"

   # KYC/AML (Optional - for onboarding features)
   LEMVERIFY_API_KEY="your-api-key"
   LEMVERIFY_ACCOUNT_ID="your-account-id"
   LEMVERIFY_WEBHOOK_SECRET="your-webhook-secret"
   GOOGLE_AI_API_KEY="your-gemini-api-key"

   # Email (Optional - for notifications)
   RESEND_API_KEY="your-resend-api-key"

   # Storage (MinIO for local development)
   S3_ENDPOINT="http://localhost:9000"
   S3_ACCESS_KEY_ID="minioadmin"
   S3_SECRET_ACCESS_KEY="minioadmin"
   S3_BUCKET_NAME="practice-hub-proposals"
   ```

   For a complete list of all environment variables with descriptions, see [`/docs/ENVIRONMENT_VARIABLES.md`](/docs/ENVIRONMENT_VARIABLES.md) (Coming soon).

4. **Start PostgreSQL database**
   ```bash
   docker compose up -d
   ```

5. **Initialize database**
   ```bash
   pnpm db:reset
   ```
   This command:
   - Drops and recreates the schema
   - Pushes the schema to database
   - Runs migrations (creates views)
   - Seeds the database with sample data

6. **Run development server**
   ```bash
   pnpm dev
   ```

7. **Open the application**

   Navigate to [http://localhost:3000](http://localhost:3000)

### Default Users

After seeding, you can log in with:

**Admin User:**
- Email: `joe@pageivy.com`
- Password: `PageIvy2024!`

**Other Test Users:**
- `sarah.accountant@pageivy.com` / `PageIvy2024!`
- `mike.manager@pageivy.com` / `PageIvy2024!`

## Microsoft OAuth Setup

To enable Microsoft OAuth authentication:

1. **Register application in Microsoft Entra ID**
   - Full guide: [`/docs/MICROSOFT_OAUTH_SETUP.md`](/docs/MICROSOFT_OAUTH_SETUP.md)
   - Get Client ID and Client Secret from Azure Portal
   - Configure redirect URIs

2. **Add credentials to `.env.local`**
   ```env
   MICROSOFT_CLIENT_ID="f9e3ca9e-0f80-4ffc-a216-951146248899"
   MICROSOFT_CLIENT_SECRET="your-secret-value"
   ```

3. **Restart dev server**
   ```bash
   pnpm dev
   ```

For detailed setup instructions, see [`/docs/MICROSOFT_OAUTH_SETUP.md`](/docs/MICROSOFT_OAUTH_SETUP.md).

## Development

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server with Turbopack
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm db:reset         # Drop, recreate, push, migrate, and seed database
pnpm db:push          # Push schema changes to database
pnpm db:studio        # Open Drizzle Studio (database GUI)

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Run tests in watch mode
pnpm test:ui          # Open Vitest UI
pnpm test:coverage    # Generate coverage report

# Code Quality
pnpm lint             # Run Biome linter
pnpm format           # Format code with Biome
```

### Project Structure

```
practice-hub/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Authentication pages
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   └── oauth-setup/         # Microsoft OAuth setup
│   ├── api/                     # API routes
│   │   ├── auth/                # Better Auth endpoints
│   │   ├── oauth-setup/         # OAuth tenant assignment
│   │   └── trpc/                # tRPC endpoints
│   ├── admin/                   # Admin panel
│   ├── client-hub/              # Client management
│   ├── practice-hub/            # Main dashboard
│   ├── proposal-hub/            # Proposals and leads
│   └── server/                  # Server-side code
│       └── routers/             # tRPC routers
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   └── ...                      # Custom components
├── lib/                         # Shared utilities
│   ├── auth.ts                  # Better Auth configuration
│   ├── auth-client.ts           # Better Auth client
│   └── db/                      # Database configuration
│       ├── index.ts             # Drizzle client
│       └── schema.ts            # Database schema
├── scripts/                     # Utility scripts
│   ├── seed.ts                  # Database seeding
│   └── seed-auth-users.ts       # Auth user seeding
├── docs/                        # Documentation
│   └── MICROSOFT_OAUTH_SETUP.md # OAuth setup guide
├── drizzle/                     # Database migrations
├── middleware.ts                # Next.js middleware
├── CLAUDE.md                    # Development guidelines
└── package.json
```

### Database Schema

The application uses a comprehensive PostgreSQL schema with:

- **Core Tables**: users, tenants, sessions, accounts
- **CRM Tables**: clients, contacts, directors, PSCs
- **Operations**: tasks, time_entries, documents, workflows
- **Financial**: invoices, invoice_items, services, pricing
- **Proposals**: leads, proposals, proposal_services
- **Compliance**: compliance, onboarding_sessions
- **Portal**: portal_categories, portal_links
- **Views**: Optimized views for dashboards and reporting

Schema is defined in `lib/db/schema.ts`.

### Authentication Architecture

- **Better Auth** handles all authentication operations
- **Multi-tenant** context provided via `getAuthContext()` helper
- **Microsoft OAuth** flow includes tenant assignment step
- **Session management** with 7-day expiration
- **Password hashing** with bcrypt (10 rounds)

See [`CLAUDE.md`](/CLAUDE.md) for detailed patterns.

## Code Guidelines

Please read [`CLAUDE.md`](/CLAUDE.md) for:
- Critical development rules
- Design system standards
- Authentication patterns
- Database procedures
- Multi-tenancy implementation

## Deployment

### Environment Variables

Ensure these are set in production:

```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="..."  # Use different secret than dev
BETTER_AUTH_URL="https://app.innspiredaccountancy.com"
NEXT_PUBLIC_BETTER_AUTH_URL="https://app.innspiredaccountancy.com"

# Optional: Microsoft OAuth
MICROSOFT_CLIENT_ID="..."
MICROSOFT_CLIENT_SECRET="..."
```

### Build

```bash
pnpm build
```

### Microsoft OAuth Configuration

Before deploying, ensure:
- Production redirect URI added to Azure Portal
- Environment variables configured in hosting platform
- SSL/HTTPS enabled for production domain

## Testing

Practice Hub has a comprehensive test suite covering critical backend functionality.

### Test Statistics
- **58 tests passing** across 5 test files
- **Execution time**: <3 seconds
- **Coverage**: Unit tests + API route tests
- **Framework**: Vitest

### Running Tests

```bash
# Run all tests
pnpm test

# Watch mode (re-run on changes)
pnpm test:watch

# Interactive UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

### Test Coverage

- **Unit Tests** (42 tests):
  - Configuration loading and validation
  - In-memory caching with TTL
  - Rate limiting and IP tracking
  - S3 URL parsing and key extraction

- **API Route Tests** (16 tests):
  - LEM Verify webhook signature verification
  - Request validation and error handling
  - HTTP status codes (401, 400, 500, 200)
  - Event processing and security

See [`__tests__/README.md`](./__tests__/README.md) for detailed testing documentation.

---

## Documentation

### For Users
- **Staff User Guide**: Coming soon
- **Client Onboarding Guide**: Coming soon
- **Admin Training**: Coming soon
- **FAQ**: Coming soon

### For Developers
- **Development Guidelines**: [`CLAUDE.md`](/CLAUDE.md)
- **API Reference**: [`/docs/API_REFERENCE.md`](/docs/API_REFERENCE.md)
- **System Architecture**: [`/docs/SYSTEM_ARCHITECTURE.md`](/docs/SYSTEM_ARCHITECTURE.md)
- **Testing Guide**: [`__tests__/README.md`](./__tests__/README.md)
- **Database Schema**: [`/docs/DATABASE_SCHEMA.md`](/docs/DATABASE_SCHEMA.md) (Coming soon)
- **Environment Variables**: [`/docs/ENVIRONMENT_VARIABLES.md`](/docs/ENVIRONMENT_VARIABLES.md) (Coming soon)

### For Operations
- **Deployment Checklist**: [`/docs/DEPLOYMENT_CHECKLIST.md`](/docs/DEPLOYMENT_CHECKLIST.md)
- **Operational Runbooks**: [`/docs/operations/RUNBOOKS.md`](/docs/operations/RUNBOOKS.md)
- **Monitoring Strategy**: [`/docs/operations/MONITORING.md`](/docs/operations/MONITORING.md)
- **Backup & Recovery**: [`/docs/operations/BACKUP_RECOVERY.md`](/docs/operations/BACKUP_RECOVERY.md)

### Authentication & Security
- **Microsoft OAuth Setup**: [`/docs/MICROSOFT_OAUTH_SETUP.md`](/docs/MICROSOFT_OAUTH_SETUP.md)
- **Authentication Overview**: [`/docs/AUTHENTICATION_OVERVIEW.md`](/docs/AUTHENTICATION_OVERVIEW.md)
- **CSRF Protection**: [`/docs/security/CSRF_PROTECTION.md`](/docs/security/CSRF_PROTECTION.md)
- **Security Policy**: [`SECURITY.md`](/SECURITY.md) (Coming soon)

### Integrations
- **LEM Verify (KYC/AML)**: [`/docs/kyc/LEMVERIFY_INTEGRATION.md`](/docs/kyc/LEMVERIFY_INTEGRATION.md)
- **Integrations Reference**: [`/docs/INTEGRATIONS_REFERENCE.md`](/docs/INTEGRATIONS_REFERENCE.md) (Coming soon)

### Proposal Hub
- **Calculator Logic**: [`/docs/proposal-reference/CALCULATOR_LOGIC.md`](/docs/proposal-reference/CALCULATOR_LOGIC.md)
- **Pricing Structure**: [`/docs/proposal-reference/PRICING_STRUCTURE_2025.md`](/docs/proposal-reference/PRICING_STRUCTURE_2025.md)
- **Service Components**: [`/docs/proposal-reference/SERVICE_COMPONENTS.md`](/docs/proposal-reference/SERVICE_COMPONENTS.md)
- **Staff Quick Guide**: [`/docs/proposal-reference/STAFF_QUICK_GUIDE.md`](/docs/proposal-reference/STAFF_QUICK_GUIDE.md)

### External Resources
- **Better Auth Docs**: https://www.better-auth.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Drizzle ORM Docs**: https://orm.drizzle.team/docs
- **tRPC Docs**: https://trpc.io/docs

---

## Support & Contributing

### Getting Help
For issues, questions, or support:
- Check the [FAQ](/docs/user-guides/FAQ.md) (Coming soon)
- Review the [Troubleshooting Guide](/docs/TROUBLESHOOTING_DEV.md) (Coming soon)
- Contact the development team

### Contributing
Interested in contributing? See our [Contributing Guide](/CONTRIBUTING.md) (Coming soon) for:
- Code review process
- Branch naming conventions
- Commit message format
- Testing requirements
- Documentation requirements

## License

Proprietary - All rights reserved

---

Built with ❤️ using Next.js, Better Auth, and modern web technologies.
