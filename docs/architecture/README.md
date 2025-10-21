# Architecture Documentation

This directory contains comprehensive architecture documentation for Practice Hub.

## Documents

### Core Architecture
- **[System Overview](system-overview.md)** - Complete brownfield architecture reference including tech stack, database schema, integrations, and known issues
- **[Multi-Tenancy Architecture](multi-tenancy.md)** - Dual-level data isolation (tenant + client) patterns and security requirements
- **[Authentication & Authorization](authentication.md)** - Dual Better Auth system for staff and client portal
- **[API Design & tRPC Patterns](api-design.md)** - Type-safe API architecture, query/mutation patterns, and rate limiting
- **[Design System & UI Patterns](design-system.md)** - Glass-card design system, shadcn/ui components, and layout patterns

### Development Reference
- **[Tech Stack & Dependencies](tech-stack.md)** - Complete technology inventory with versions, purposes, and configurations
- **[Source Tree & Directory Structure](source-tree.md)** - Comprehensive directory reference and file organization
- **[Coding Standards & Conventions](coding-standards.md)** - TypeScript, React, tRPC, and database coding standards

## Quick Navigation

**By Topic**:
- Database Architecture → [System Overview](system-overview.md#database-schema-overview) + [Multi-Tenancy](multi-tenancy.md)
- Authentication → [Authentication & Authorization](authentication.md)
- APIs → [API Design](api-design.md)
- Frontend → [Design System](design-system.md)
- Tech Stack → [Tech Stack](tech-stack.md)
- File Organization → [Source Tree](source-tree.md)
- Coding Standards → [Coding Standards](coding-standards.md)
- Technical Debt → [System Overview](system-overview.md#technical-debt-and-known-issues)

**By Role**:
- **New Developer** → Start with [System Overview](system-overview.md), then [Coding Standards](coding-standards.md) and [Source Tree](source-tree.md)
- **Frontend Developer** → [Design System](design-system.md) + [Coding Standards](coding-standards.md)
- **Backend Developer** → [API Design](api-design.md) + [Multi-Tenancy](multi-tenancy.md) + [Coding Standards](coding-standards.md)
- **DevOps** → [Tech Stack](tech-stack.md) + [System Overview](system-overview.md)
- **AI Agent** → Load [System Overview](system-overview.md) for complete context, reference [Coding Standards](coding-standards.md) for patterns

## Related Documentation

- [Database Schema Reference](../reference/database/schema.md) - Complete table definitions
- [API Reference](../reference/api/routers.md) - All 29 tRPC routers
- [Development Guide](../guides/development/) - How-to guides for common tasks
