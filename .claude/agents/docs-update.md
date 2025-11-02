---
name: docs-update
type: subagent
purpose: Autonomous documentation updates for code changes
triggers:
  - Router procedure added/modified
  - Database table/column added/modified
  - Component created/modified
  - Environment variable added
  - Architecture decision made
---

# Documentation Update Subagent

Automatically updates documentation when code changes are detected, ensuring docs stay in sync with the codebase.

## Purpose

This subagent runs autonomously after code changes to:
1. Detect what changed (router, table, component, etc.)
2. Find or create appropriate `@doc` tags in the code
3. Update AI-GENERATED sections in documentation files
4. Trigger extraction pipeline to rebuild unified docs

## Triggers

### 1. Router Procedure Changes
**Detection**: New or modified `.query()` or `.mutation()` calls in `app/server/routers/*.ts`

**Action**:
- Add `@doc:api/{router}#{procedure}` tag if missing
- Extract: summary, input schema, output type, usage example
- Target: `docs/reference/api/routers.md`

**Example**:
```typescript
/**
 * @doc:api/clients#createClient
 * @doc-summary Creates a new client record with multi-tenant isolation
 * @doc-audience dev
 * @doc-tags mutation,clients,trpc
 *
 * Creates a client record linked to the authenticated user's tenant.
 * Validates email uniqueness within tenant scope.
 *
 * **Input**: CreateClientInput (name, email, phone, address)
 * **Output**: { success: boolean, client: Client }
 *
 * **Example**:
 * ```typescript
 * const result = await trpc.clients.create.mutate({
 *   name: "John Doe",
 *   email: "john@example.com"
 * });
 * ```
 */
export const createClient = protectedProcedure
  .input(createClientSchema)
  .mutation(async ({ ctx, input }) => {
    // Implementation...
  });
```

### 2. Database Schema Changes
**Detection**: New or modified `pgTable()` calls in `lib/db/schema.ts`

**Action**:
- Add `@doc:db/schema#{table}` tag if missing
- Extract: table purpose, columns, relationships, indexes
- Target: `docs/reference/database/schema.md`

**Example**:
```typescript
/**
 * @doc:db/schema#clients
 * @doc-summary Clients table stores customer business information
 * @doc-audience dev,ops
 * @doc-tags database,schema,multi-tenant
 *
 * Main CRM table for client (customer business) records.
 * Implements tenant-level isolation via `tenantId` foreign key.
 *
 * **Relationships**:
 * - belongs_to: tenants (via tenantId)
 * - has_many: contacts, directors, compliance
 *
 * **Indexes**:
 * - PRIMARY KEY: id
 * - UNIQUE: (tenantId, email)
 * - INDEX: tenantId, createdAt
 */
export const clients = pgTable("clients", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull(),
  // ... fields
});
```

### 3. Component Creation/Changes
**Detection**: New or significantly modified components in `components/**/*.tsx`

**Action**:
- Add `@doc:components/{category}#{name}` tag for reusable components
- Extract: purpose, props, usage example
- Target: `docs/development/components.md`

**Example**:
```typescript
/**
 * @doc:components/ui#GlassCard
 * @doc-summary Glass-morphism card component with consistent styling
 * @doc-audience dev
 * @doc-tags ui,component,design-system
 *
 * Wrapper around shadcn/ui Card with Practice Hub's glass-card styling.
 * Automatically applies solid backgrounds (no transparency).
 *
 * **Props**: Extends CardProps from shadcn/ui
 * **Styling**: Uses `.glass-card` class from globals.css
 *
 * **Example**:
 * ```tsx
 * <GlassCard>
 *   <CardHeader>
 *     <CardTitle>Client Details</CardTitle>
 *   </CardHeader>
 *   <CardContent>
 *     Content here...
 *   </CardContent>
 * </GlassCard>
 * ```
 */
export function GlassCard({ children, ...props }: CardProps) {
  return <Card className="glass-card" {...props}>{children}</Card>;
}
```

### 4. Environment Variable Changes
**Detection**: New `process.env.*` references or `.env.example` updates

**Action**:
- Add `@doc:env/{category}#{variable}` tag
- Extract: purpose, format, required/optional, default value
- Target: `docs/reference/configuration/environment.md`

**Example**:
```typescript
/**
 * @doc:env/database#DATABASE_URL
 * @doc-summary PostgreSQL connection string
 * @doc-audience ops
 * @doc-tags environment,database,required
 *
 * **Required**: Yes
 * **Format**: `postgresql://user:password@host:port/database`
 *
 * **Development**:
 * ```
 * DATABASE_URL="postgresql://postgres:password@localhost:5432/practice_hub"
 * ```
 *
 * **Production**:
 * ```
 * DATABASE_URL="postgresql://prod_user:strong_pass@db.example.com:5432/practice_hub_prod"
 * ```
 *
 * **Security**: Never commit this value. Use environment-specific `.env` files.
 */
const DATABASE_URL = process.env.DATABASE_URL!;
```

### 5. Architecture Decisions
**Detection**: New or modified ADR files in `docs/decisions/*.md`

**Action**:
- Update `docs/architecture/tech-stack.md` AI-GENERATED section
- Update module-specific architecture docs
- Cross-reference related routers, tables, components

## Workflow

```mermaid
graph TD
    A[Code Change Detected] --> B{Change Type?}
    B -->|Router| C[Add @doc:api tag]
    B -->|Table| D[Add @doc:db tag]
    B -->|Component| E[Add @doc:components tag]
    B -->|Env Var| F[Add @doc:env tag]

    C --> G[Run Extraction Pipeline]
    D --> G
    E --> G
    F --> G

    G --> H[pnpm docs:extract]
    H --> I[pnpm docs:build]
    I --> J[pnpm docs:validate]

    J --> K{Valid?}
    K -->|Yes| L[Update doc-index.json]
    K -->|No| M[Report Errors]

    L --> N[Commit Changes]
    M --> O[Request Human Review]
```

## Autonomous Operation

### Pre-Commit Hook Integration
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Stage 1: Derive facts
pnpm docs:facts

# Stage 2: Extract tags
pnpm docs:extract

# Stage 3: Build docs
pnpm docs:build

# Stage 4: Validate
pnpm docs:validate || {
  echo "❌ Documentation validation failed"
  echo "   Review and fix errors, then commit again"
  exit 1
}

# Stage 5: Auto-stage generated files
git add docs/dev/repo-facts.json
git add docs/dev/doclets.yaml
git add docs/reference/**/*.md
git add .claude/skills/practice-hub-docs-search/doc-index.json
```

### CI/CD Integration
```yaml
name: Documentation Update

on:
  push:
    branches: [main, develop]
    paths:
      - "app/server/routers/**"
      - "lib/db/schema.ts"
      - "components/**"

jobs:
  update-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup environment
        # ... setup Node, pnpm, Python

      - name: Run documentation update
        run: |
          pnpm docs:facts
          pnpm docs:extract
          pnpm docs:build
          pnpm docs:validate

      - name: Commit updated docs
        run: |
          git config user.name "docs-update-bot"
          git config user.email "bot@practice-hub.local"
          git add docs/
          git commit -m "docs: auto-update from code changes [skip ci]" || true
          git push
```

## Quality Gates

### 1. Tag Validation
- **Required fields**: `@doc:path#section`, `@doc-summary`, `@doc-audience`
- **Valid targets**: Path must exist in `docs/books.yaml`
- **Section naming**: Must use kebab-case (e.g., `create-client`, not `createClient`)

### 2. Content Quality
- **Minimum length**: At least 50 words for non-stub content
- **Examples required**: For routers and components
- **Input/Output specs**: For all tRPC procedures
- **Relationships**: For database tables

### 3. Drift Detection
- **Threshold**: 5% content change triggers review
- **Auto-update**: If change <5% and high confidence
- **Human review**: If change >5% or low confidence

## Error Handling

### Missing Target in books.yaml
```
❌ Invalid tag target: @doc:api/new-router#procedure
   Target 'api/new-router' not found in docs/books.yaml

Action:
1. Add target to books.yaml
2. Create extraction zone in target doc
3. Re-run extraction pipeline
```

### Orphaned Extraction Zone
```
⚠️  Orphaned CODE-EXTRACT zone: api/old-router
   No @doc:api/old-router tags found in codebase

Action:
1. Remove extraction zone from docs, OR
2. Add tags to code if still relevant
```

### Documentation Drift
```
⚠️  Drift detected in docs/architecture/tech-stack.md
   AI-GENERATED section changed by 12% since last build

Action:
1. Review changes in git diff
2. Accept changes and update, OR
3. Revert to source-of-truth (repo-facts.json)
```

## Best Practices

1. **Tag as you code**: Add `@doc` tags when writing new code, not as afterthought
2. **Keep tags close**: Place tags directly above the code they document
3. **Use clear summaries**: One-line summary should be descriptive and specific
4. **Provide examples**: Always include usage examples for routers and components
5. **Link related items**: Cross-reference related routers, tables, components

## Integration with Other Tools

- **practice-hub-docs-search**: Consumes updated doc-index.json for AI search
- **practice-hub-testing**: Uses repo-facts.json to discover new routers for test generation
- **docs-maintainer skill**: Orchestrates full maintenance cycle including this subagent

## Metrics

Track documentation coverage and quality:
- **Coverage**: % of routers/tables/components with @doc tags
- **Staleness**: Time since last update for each doc section
- **Drift**: % of AI-GENERATED content that has drifted from source
- **Orphans**: Number of orphaned extraction zones

```bash
# Generate coverage report
pnpm docs:audit-tags

# Check drift
pnpm docs:validate:drift

# Find orphans
pnpm docs:validate:orphans
```

---

**Subagent Type**: Autonomous (runs via pre-commit hook and CI)
**Human Intervention**: Only required for validation errors or high drift (>5%)
**Maintained by**: Practice Hub Documentation Team
**Version**: 1.0.0
