# proposal-hub

**Location**: `app/proposal-hub`
**Type**: Hub Module
**Status**: Active

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
|------|| Table | Purpose | Multi-Tenant | Client-Isolated |
|-------|---------|--------------|----------------|
| `taskTemplates` | [Auto-detected] | ✅ tenantId | See schema |
| `clientTaskTemplateOverrides` | [Auto-detected] | ✅ tenantId | See schema |
| `workflowTemplates` | [Auto-detected] | ✅ tenantId | See schema |
| `pricingRules` | [Auto-detected] | ✅ tenantId | See schema |
| `leads` | [Auto-detected] | ✅ tenantId | See schema |
| `proposals` | [Auto-detected] | ✅ tenantId | See schema |
| `proposalServices` | [Auto-detected] | ✅ tenantId | See schema |
| `proposalVersions` | [Auto-detected] | ✅ tenantId | See schema |
| `proposalNotes` | [Auto-detected] | ✅ tenantId | See schema |
| `proposalTemplates` | [Auto-detected] | ✅ tenantId | See schema |
| `proposalSignatures` | [Auto-detected] | ✅ tenantId | See schema |
| `onboardingSessions` | [Auto-detected] | ✅ tenantId | See schema |
| `onboardingTasks` | [Auto-detected] | ✅ tenantId | See schema |
| `onboardingResponses` | [Auto-detected] | ✅ tenantId | See schema |
| `emailTemplates` | [Auto-detected] | ✅ tenantId | See schema ||-------|
| `page.tsx` | Main dashboard | [Description] |
| `layout.tsx` | Layout wrapper | Uses GlobalHeader + GlobalSidebar |
| [file] | [Purpose] | [Notes] |

## Routes

| Route | Description | Access Level |
|-------|| Router | Procedures | Purpose |
|--------|-----------|--------|
| `activities.ts` | [Auto-detected] | See file |
| `admin-kyc.ts` | [Auto-detected] | See file |
| `analytics.ts` | [Auto-detected] | See file |
| `clientPortal.ts` | [Auto-detected] | See file |
| `clients.ts` | [Auto-detected] | See file |
| `documents.ts` | [Auto-detected] | See file |
| `email-templates.ts` | [Auto-detected] | See file |
| `invoices.ts` | [Auto-detected] | See file |
| `leads.ts` | [Auto-detected] | See file |
| `onboarding.ts` | [Auto-detected] | See file |
| `pipeline.ts` | [Auto-detected] | See file |
| `pricing.ts` | [Auto-detected] | See file |
| `pricingAdmin.ts` | [Auto-detected] | See file |
| `pricingConfig.ts` | [Auto-detected] | See file |
| `proposalTemplates.ts` | [Auto-detected] | See file |
| `proposals.ts` | [Auto-detected] | See file |
| `services.ts` | [Auto-detected] | See file |
| `task-generation.ts` | [Auto-detected] | See file |
| `taskTemplates.ts` | [Auto-detected] | See file |
| `tasks.ts` | [Auto-detected] | See file |--|-------------|
| `/proposal-hub/` | [Auto-detected] | Member |
| `/proposal-hub/admin/pricing` | [Auto-detected] | Member |
| `/proposal-hub/admin/templates` | [Auto-detected] | Member |
| `/proposal-hub/analytics` | [Auto-detected] | Member |
| `/proposal-hub/analytics/pricing` | [Auto-detected] | Member |
| `/proposal-hub/calculator` | [Auto-detected] | Member |
| `/proposal-hub/leads` | [Auto-detected] | Member |
| `/proposal-hub/leads/[id]` | [Auto-detected] | Member |
| `/proposal-hub/leads/new` | [Auto-detected] | Member |
| `/proposal-hub/onboarding` | [Auto-detected] | Member |
| `/proposal-hub/onboarding/[id]` | [Auto-detected] | Member |
| `/proposal-hub/pipeline` | [Auto-detected] | Member |
| `/proposal-hub/proposals` | [Auto-detected] | Member |
| `/proposal-hub/proposals/[id]` | [Auto-detected] | Member |
| `/proposal-hub/proposals/pipeline` | [Auto-detected] | Member |
| `/proposal-hub/reports` | [Auto-detected] | Member ||-------------|--------------|
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

**Last Updated**: 2025-11-02
**Primary Maintainer**: [Team/Person]
**Review Cycle**: [Monthly | Quarterly]

