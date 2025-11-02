# Documentation Tagging Specification

**Version**: 1.0.0
**Last Updated**: 2025-11-02
**Status**: Active

---

## Purpose

This specification defines how to tag code with documentation annotations that get extracted and merged into unified documentation files.

## Tag Format

### Basic Syntax

```typescript
/**
 * @doc:path#section
 * @doc-summary Brief one-line description
 * @doc-audience dev|ops|user
 * @doc-tags tag1,tag2,tag3
 *
 * Detailed documentation content goes here.
 * This will be extracted and inserted into the target document.
 */
```

### Path-Based Targeting

The `@doc:path#section` format specifies where the extracted content should be inserted:

- **path**: Target documentation file (without `docs/` prefix or `.md` extension)
- **section**: Section identifier within the target file

**Examples**:
```typescript
@doc:api/clients#createClient           // → docs/api/API_REFERENCE.md, section "createClient"
@doc:db/schema#clients-table            // → docs/database/SCHEMA.md, section "clients-table"
@doc:patterns/router-setup#basic-setup  // → docs/development/CREATING_ROUTERS.md
```

### Metadata Fields

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `@doc:path#section` | ✅ Yes | Target location | `@doc:api/clients#list` |
| `@doc-summary` | ✅ Yes | One-line summary | `Lists all clients for tenant` |
| `@doc-audience` | ⚠️ Recommended | Target audience | `dev`, `ops`, `dev,ops` |
| `@doc-tags` | ⚠️ Recommended | Searchable tags | `query,clients,trpc` |

---

## Target Mapping

Documentation targets are defined in `docs/books.yaml`:

```yaml
targets:
  api/clients:
    file: docs/reference/api/routers.md
    section: "## Clients Router"
    type: code-extract

  db/schema:
    file: docs/reference/database/schema.md
    section: "## Tables"
    type: code-extract
```

---

## Extraction Zones

Target documents must have extraction zones marked with HTML comments:

```markdown
<!-- BEGIN CODE-EXTRACT: api/clients -->
**Placeholder**: Code-extracted documentation will appear here.
<!-- END CODE-EXTRACT: api/clients -->
```

**Important**:
- Extraction zones are **REPLACED** during builds
- Content between markers is **NOT PRESERVED**
- Never manually edit inside extraction zones

---

## Examples

### tRPC Router Procedure

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
 * **Input**: CreateClientInput
 * **Output**: { success: boolean, client: Client }
 *
 * **Example**:
 * ```typescript
 * const result = await trpc.clients.create.mutate({
 *   name: "John Doe",
 *   email: "john@example.com",
 *   phone: "+44 20 1234 5678"
 * });
 * ```
 */
export const createClient = protectedProcedure
  .input(createClientSchema)
  .mutation(async ({ ctx, input }) => {
    // Implementation...
  });
```

### Database Table

```typescript
/**
 * @doc:db/schema#clients-table
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

### Environment Variable

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

---

## Extraction Pipeline

### 1. Tag Scanning

```bash
python3 scripts/extract_doclets.py
```

Scans all source files for `@doc:*` tags and outputs `docs/dev/doclets.yaml`.

### 2. Documentation Building

```bash
python3 scripts/build_docs.py
```

Reads `doclets.yaml` and `docs/books.yaml`, then merges content into target files between extraction markers.

### 3. Validation

```bash
pnpm docs:validate
```

Checks:
- All `@doc:*` tags reference valid targets (defined in `books.yaml`)
- All extraction zones have corresponding tags
- No orphaned extraction zones

---

## Best Practices

### ✅ DO

- Place tags immediately above the code they document
- Keep summaries to one line (< 100 characters)
- Use specific, descriptive section identifiers
- Update tags when refactoring code
- Run extraction before committing

### ❌ DON'T

- Don't manually edit CODE-EXTRACT zones in docs
- Don't use vague section names like "misc" or "other"
- Don't duplicate documentation between tags and regular comments
- Don't forget to run `pnpm docs:build` after tagging

---

## Workflow

### Adding New Documentation Tags

1. **Tag the code**:
   ```typescript
   /**
    * @doc:api/new-feature#method-name
    * @doc-summary Brief description
    * @doc-audience dev
    * @doc-tags relevant,tags
    *
    * Detailed documentation...
    */
   ```

2. **Add extraction zone** to target document:
   ```markdown
   <!-- BEGIN CODE-EXTRACT: api/new-feature -->
   Placeholder
   <!-- END CODE-EXTRACT: api/new-feature -->
   ```

3. **Run extraction**:
   ```bash
   pnpm docs:extract  # Extract tags
   pnpm docs:build    # Merge into docs
   ```

4. **Verify**:
   ```bash
   pnpm docs:validate  # Check for errors
   ```

### Pre-commit Hook

The extraction pipeline runs automatically on commit via pre-commit hook (`.git/hooks/pre-commit`):

```bash
#!/bin/bash
pnpm docs:facts      # Update repo facts
pnpm docs:extract    # Extract doc tags
pnpm docs:build      # Build unified docs
pnpm docs:validate   # Validate
```

---

## Troubleshooting

### Tag Not Extracted

**Problem**: Tag exists but doesn't appear in docs.

**Solutions**:
1. Check target exists in `docs/books.yaml`
2. Verify extraction zone exists in target file
3. Run `pnpm docs:extract` manually
4. Check `docs/dev/doclets.yaml` for errors

### Extraction Zone Overwritten

**Problem**: Manual edits to CODE-EXTRACT zones get replaced.

**Solution**: Never edit CODE-EXTRACT zones. Use HUMAN-AUTHORED sections instead:

```markdown
<!-- END CODE-EXTRACT: api/clients -->

<!-- HUMAN-AUTHORED SECTION -->
## Additional Notes

Your custom content here (won't be overwritten).
```

### Validation Errors

**Problem**: `pnpm docs:validate` reports errors.

**Common Issues**:
- Orphaned extraction zones (no matching tags)
- Invalid target paths (not in `books.yaml`)
- Duplicate section identifiers

**Solution**: Fix the specific error reported, then re-run validation.

---

## Reference

- **Extraction Script**: `scripts/extract_doclets.py`
- **Builder Script**: `scripts/build_docs.py`
- **Target Mapping**: `docs/books.yaml`
- **Extracted Data**: `docs/dev/doclets.yaml`
- **Validation**: `scripts/validate_doc_tags.py`

---

**Questions?** See `docs/dev/README.md` or contact the development team.
