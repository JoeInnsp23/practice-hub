# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server with Turbopack
pnpm dev

# Build for production with Turbopack
pnpm build

# Start production server
pnpm start

# Code quality checks
pnpm lint        # Run Biome linter
pnpm format      # Format code with Biome

# Database management
docker-compose up -d  # Start PostgreSQL database
```

## Architecture Overview

This is a multi-tenant practice management platform built with Next.js 15, using the App Router architecture.

### Core Technology Stack
- **Framework**: Next.js 15 with Turbopack
- **Authentication**: Clerk (integrated at middleware level)
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS v4
- **Code Quality**: Biome for linting and formatting
- **UI Components**: Radix UI primitives with custom components in `components/ui/`
- **Forms**: React Hook Form with Zod validation

### Multi-Tenancy Architecture
The application implements multi-tenancy through:
- `tenants` table with unique slugs for each organization
- `users` table linking Clerk authentication to tenant membership
- All database entities should reference `tenantId` for data isolation

### Application Modules
The app is organized into distinct hub modules under `app/`:
- `client-hub/` - Client management functionality
- `practice-hub/` - Core practice management
- `proposal-hub/` - Proposal management
- `social-hub/` - Social features
- `client-portal/` - External client access
- `(auth)/` - Authentication pages (sign-in/sign-up)

### Database Configuration
- Schema defined in `lib/db/schema.ts`
- Database client initialized in `lib/db/index.ts`
- Migrations managed via Drizzle Kit in `drizzle/` directory
- Requires `DATABASE_URL` environment variable

### Authentication Flow
- Clerk middleware protects all routes except `/`, `/sign-in`, `/sign-up`
- User session linked to tenant context
- Protected routes automatically enforce authentication via middleware

## Environment Setup

Required environment variables in `.env.local`:
- `DATABASE_URL` - PostgreSQL connection string (format: `postgresql://postgres:password@localhost:5432/practice_hub`)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key

## Code Conventions

- Use Biome for all formatting and linting (configured in `biome.json`)
- 2-space indentation
- Component files use `.tsx` extension
- Server actions and API routes follow Next.js 15 patterns
- All new features should maintain multi-tenant isolation