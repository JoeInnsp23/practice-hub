# Practice Hub

A modern, multi-tenant practice management platform built with Next.js 15, Better Auth, and PostgreSQL.

## Overview

Practice Hub is a comprehensive practice management system designed for accounting firms and professional services organizations. It provides client management, task tracking, time management, compliance monitoring, and proposal generation capabilities.

## Tech Stack

- **Framework**: Next.js 15 with App Router and Turbopack
- **Authentication**: Better Auth with email/password and Microsoft OAuth
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Forms**: React Hook Form with Zod validation
- **Notifications**: react-hot-toast
- **Code Quality**: Biome for linting and formatting

## Features

### Authentication & Multi-Tenancy
- ✅ Email/password authentication with bcrypt hashing
- ✅ Microsoft OAuth (personal and work accounts)
- ✅ Multi-tenant architecture with organization management
- ✅ Role-based access control (Admin, Member)
- ✅ Session management with Better Auth

### Core Modules
- **Practice Hub**: Main dashboard and overview
- **Client Hub**: Client management, contacts, services
- **Proposal Hub**: Lead management, proposal generation, pricing calculator
- **Admin Panel**: User management, portal links, system settings
- **Client Portal**: External client access
- **Social Hub**: Team collaboration features

### Key Capabilities
- Client relationship management (CRM)
- Task and workflow management
- Time tracking and timesheet management
- Compliance tracking and reminders
- Invoice generation and tracking
- Document management
- Activity logging and audit trails
- Custom workflow creation
- Onboarding management

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
   ```

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

## Documentation

- **Microsoft OAuth Setup**: [`/docs/MICROSOFT_OAUTH_SETUP.md`](/docs/MICROSOFT_OAUTH_SETUP.md)
- **Development Guidelines**: [`CLAUDE.md`](/CLAUDE.md)
- **Better Auth Docs**: https://www.better-auth.com/docs
- **Next.js Docs**: https://nextjs.org/docs

## Support & Contributing

For issues, questions, or contributions, please contact the development team.

## License

Proprietary - All rights reserved

---

Built with ❤️ using Next.js, Better Auth, and modern web technologies.
