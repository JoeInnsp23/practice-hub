# [Module Name]

**Location**: `[path/to/module]`
**Type**: [Hub Module | Admin Panel | Client Portal | Integration Library]
**Status**: [Active | In Development | Deprecated]

## Overview

[2-3 sentence description of what this module does and its primary purpose in the Practice Hub system]

## Directory Structure

```
[module-name]/
├── page.tsx              # Main module page
├── layout.tsx            # Module layout
├── [feature]/            # Feature subdirectory
│   └── page.tsx
└── components/           # Module-specific components
```

## Key Files

| File | Purpose | Notes |
|------|---------|-------|
| `page.tsx` | Main dashboard | [Description] |
| `layout.tsx` | Layout wrapper | Uses GlobalHeader + GlobalSidebar |
| [file] | [Purpose] | [Notes] |

## Routes

| Route | Description | Access Level |
|-------|-------------|--------------|
| `/[module]` | Main page | [Admin \| Member \| Client] |
| `/[module]/[feature]` | Feature page | [Access level] |

## Components

See `components/[module]/README.md` for component library documentation.

**Key Components:**
- `[ComponentName]` - [Brief description]
- `[ComponentName]` - [Brief description]

## API Endpoints (tRPC)

| Router | Procedures | Purpose |
|--------|-----------|---------|
| `[router].ts` | `list`, `create`, `update`, `delete` | [Purpose] |

## Database Tables

| Table | Purpose | Multi-Tenant | Client-Isolated |
|-------|---------|--------------|-----------------|
| `[table]` | [Purpose] | ✅ tenantId | [✅ clientId or ❌] |

## Key Dependencies

- **[Dependency name]** - [Purpose and usage]
- **[Dependency name]** - [Purpose and usage]

## Related Documentation

- [Architecture Doc](../../docs/architecture/...)
- [API Reference](../../docs/reference/api/...)
- [Integration Guide](../../docs/guides/integrations/...)

## Development

### Running Locally

```bash
pnpm dev
# Navigate to: http://localhost:3000/[module]
```

### Adding a New Feature

1. Create route directory: `app/[module]/[feature]/`
2. Add page.tsx with component
3. Update router with tRPC procedures
4. Add database tables if needed
5. Write tests in `__tests__/routers/[module].test.ts`
6. Update this README

### Common Tasks

- **Add a new route** → See [Creating Routes](../../docs/development/creating-routers.md)
- **Add database table** → See [Adding Tables](../../docs/development/adding-tables.md)
- **Create component** → See [Creating Components](../../docs/development/creating-components.md)

## Known Issues

See [Known Issues](../../docs/known-issues.md#[module-name])

## Testing

- **Unit tests**: `__tests__/routers/[module].test.ts`
- **E2E tests**: `__tests__/e2e/[module]/*.spec.ts`
- **Coverage target**: 80%+ for core business logic

**Run tests:**
```bash
pnpm test __tests__/routers/[module].test.ts
pnpm test:e2e __tests__/e2e/[module]/
```

## Maintenance

**Last Updated**: [Date]
**Primary Maintainer**: [Team/Person]
**Review Cycle**: [Monthly | Quarterly]
