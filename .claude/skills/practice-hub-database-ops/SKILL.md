---
name: practice-hub-database-ops
description: Safe database operations for Practice Hub following strict conventions. NO MIGRATIONS during development - direct schema updates only. Includes scripts to validate schema, check seed data consistency, and safely reset database. Critical for pre-production optimization.
---

# Practice Hub Database Operations Skill

## Overview

Safe and correct database operations for Practice Hub's multi-tenant PostgreSQL database using Drizzle ORM.

**Powerful automation scripts included** - see `scripts/` directory.

**Keywords**: database, schema, migrations, seed data, multi-tenant, Drizzle ORM, PostgreSQL, database reset

## CRITICAL: Database Reset Procedure

**THE ONLY CORRECT WAY TO RESET THE DATABASE:**

```bash
pnpm db:reset
```

**OR use the safe wrapper:**

```bash
bash scripts/safe_reset.sh
```

### What `pnpm db:reset` Does (in order):

1. **Drops and recreates schema** - Removes ALL tables/views
2. **Pushes schema** - Creates tables from `lib/db/schema.ts`
3. **Runs migrations** - Creates views from `drizzle/*.sql`
4. **Seeds database** - Runs `scripts/seed.ts`
5. **Seeds auth users** - Runs `scripts/seed-auth-users.ts`

### What NOT to Do

❌ **NEVER** run these commands individually:
```bash
# DON'T DO THIS:
pnpm db:migrate:reset
pnpm db:push:dev
pnpm db:seed
# These don't work in the correct order!
```

❌ **NEVER** create migration files - database is in development
❌ **NEVER** talk about migrations - we update schema directly

✅ **ALWAYS** use `pnpm db:reset` - it does EVERYTHING correctly

## Automation Scripts

**IMPORTANT: Always run scripts with `--help` first** to understand usage.

### 1. Validate Schema
```bash
python scripts/validate_schema.py
python scripts/validate_schema.py --strict
```
**Features:**
- Checks all tables have `tenantId` (except system tables)
- Validates timestamps (`createdAt`, `updatedAt`)
- Ensures primary keys exist
- Validates foreign key references
- Identifies schema convention violations

### 2. Check Seed Consistency
```bash
python scripts/check_seed_consistency.py
python scripts/check_seed_consistency.py --verbose
```
**Features:**
- Compares schema.ts with seed.ts
- Finds tables without seed data
- Detects missing required fields in seed data
- Ensures schema changes are reflected in seeds

### 3. Safe Reset
```bash
bash scripts/safe_reset.sh
```
**Features:**
- Checks Docker is running
- Starts database container if needed
- Shows what will be deleted
- Requires confirmation
- Runs `pnpm db:reset` correctly
- Production safety warnings

## Development Workflow

### Making Schema Changes

**Step 1: Update Schema**
```typescript
// lib/db/schema.ts

// Add new table
export const newTable = pgTable("new_table", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id")
    .references(() => tenants.id)
    .notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
```

**Step 2: Validate Schema**
```bash
python .claude/skills/practice-hub-database-ops/scripts/validate_schema.py
```

**Step 3: Update Seed Data**
```typescript
// scripts/seed.ts

// Add seed data for new table
await db.insert(newTable).values([
  {
    id: "item-1",
    tenantId: TENANT_ID,
    name: "Test Item 1",
  },
  {
    id: "item-2",
    tenantId: TENANT_ID,
    name: "Test Item 2",
  },
]);
```

**Step 4: Check Seed Consistency**
```bash
python .claude/skills/practice-hub-database-ops/scripts/check_seed_consistency.py
```

**Step 5: Reset Database**
```bash
pnpm db:reset
```

**Step 6: Verify**
```bash
pnpm db:studio  # Open Drizzle Studio
```

## Schema Conventions

### Multi-Tenant Pattern

**REQUIRED for all tables (except system tables):**

```typescript
export const myTable = pgTable("my_table", {
  id: text("id").primaryKey(),

  // REQUIRED: Every table must have tenantId
  tenantId: text("tenant_id")
    .references(() => tenants.id)
    .notNull(),

  // Your fields here
  name: text("name").notNull(),

  // RECOMMENDED: Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
```

### System Tables (No tenantId needed)

- `tenants` - The tenant table itself
- `session` - Better Auth sessions
- `account` - Better Auth accounts
- `verification` - Better Auth verifications
- `drizzle_migrations` - Drizzle system table

### Timestamp Pattern

```typescript
createdAt: timestamp("created_at").defaultNow().notNull(),
updatedAt: timestamp("updated_at")
  .defaultNow()
  .$onUpdate(() => new Date())  // Auto-update on changes
  .notNull(),
```

### Foreign Keys

```typescript
// Reference another table
clientId: text("client_id")
  .references(() => clients.id)
  .notNull(),  // or omit .notNull() for optional

// With cascading delete
userId: text("user_id")
  .references(() => users.id, { onDelete: "cascade" })
  .notNull(),
```

### Indexes

```typescript
export const clients = pgTable(
  "clients",
  {
    // ... fields
  },
  (table) => ({
    tenantIdx: index("idx_client_tenant").on(table.tenantId),
    nameIdx: index("idx_client_name").on(table.name),
    emailIdx: uniqueIndex("idx_client_email").on(table.tenantId, table.email),
  })
);
```

## Seed Data Patterns

### Basic Seed Structure

```typescript
// scripts/seed.ts

const TENANT_ID = "acme-corp";

async function seed() {
  console.log("🌱 Seeding database...");

  // 1. Create tenant
  await db.insert(tenants).values({
    id: TENANT_ID,
    name: "Acme Corporation",
    slug: "acme-corp",
  });

  // 2. Create users
  await db.insert(users).values([
    {
      id: "user-1",
      tenantId: TENANT_ID,
      email: "admin@acme.com",
      role: "admin",
      firstName: "Admin",
      lastName: "User",
    },
  ]);

  // 3. Create clients
  await db.insert(clients).values([
    {
      id: "client-1",
      tenantId: TENANT_ID,
      name: "Client Company",
      email: "contact@client.com",
      accountManagerId: "user-1",
    },
  ]);

  console.log("✅ Seeding complete!");
}
```

### Seed Data Best Practices

1. **Use consistent IDs** - Makes debugging easier
2. **Maintain relationships** - Ensure foreign keys are valid
3. **Cover all scenarios** - Different client types, statuses, etc.
4. **Realistic data** - Use @faker-js/faker for variety
5. **Always set tenantId** - Every record needs tenant

### Seed Data for Testing

```typescript
// Create multiple tenants for testing isolation
await db.insert(tenants).values([
  { id: "tenant-1", name: "Tenant 1", slug: "tenant-1" },
  { id: "tenant-2", name: "Tenant 2", slug: "tenant-2" },
]);

// Create data in different tenants
await db.insert(clients).values([
  { id: "client-1", tenantId: "tenant-1", name: "Tenant 1 Client" },
  { id: "client-2", tenantId: "tenant-2", name: "Tenant 2 Client" },
]);
```

## SQL Views (drizzle/*.sql)

Create views for complex queries:

```sql
-- drizzle/0001_client_details_view.sql
CREATE VIEW client_details_view AS
SELECT
  c.*,
  u.first_name AS account_manager_first_name,
  u.last_name AS account_manager_last_name,
  CONCAT(u.first_name, ' ', u.last_name) AS account_manager_name,
  u.email AS account_manager_email
FROM clients c
LEFT JOIN users u ON c.account_manager_id = u.id;
```

Views are created during `pnpm db:reset` (migrations step).

## Database Utilities

### Drizzle Studio
```bash
pnpm db:studio
```
- Visual database browser
- Edit data directly
- View relationships
- localhost:4983

### Docker Commands
```bash
# Start database
docker compose up -d

# Stop database
docker compose down

# View logs
docker compose logs -f practice-hub-db

# Connect to psql
PGPASSWORD='PgHub2024$Secure#DB!9kL' docker exec -it practice-hub-db psql -U postgres -d practice_hub
```

### Direct SQL Queries
```bash
# List all tables
PGPASSWORD='PgHub2024$Secure#DB!9kL' docker exec -i practice-hub-db psql -U postgres -d practice_hub -c "\dt"

# List all views
PGPASSWORD='PgHub2024$Secure#DB!9kL' docker exec -i practice-hub-db psql -U postgres -d practice_hub -c "SELECT table_name FROM information_schema.views WHERE table_schema = 'public';"

# Check table structure
PGPASSWORD='PgHub2024$Secure#DB!9kL' docker exec -i practice-hub-db psql -U postgres -d practice_hub -c "\d clients"
```

## Troubleshooting

### Database Won't Start

```bash
# Check if Docker is running
docker info

# Check database logs
docker compose logs practice-hub-db

# Restart database
docker compose down
docker compose up -d
```

### Schema Push Fails

```bash
# Validate schema first
python .claude/skills/practice-hub-database-ops/scripts/validate_schema.py

# Drop and recreate
pnpm db:reset
```

### Seed Data Errors

```bash
# Check consistency
python .claude/skills/practice-hub-database-ops/scripts/check_seed_consistency.py

# Fix seed.ts, then reset
pnpm db:reset
```

### Migration Errors

**Remember:** We don't use migrations during development!

If you see migration errors:
1. Ignore them (we're not using migrations)
2. Just run `pnpm db:reset`
3. Database is dev-only with test data

## Pre-Production Checklist

Before importing live data:

### Schema Validation
- [ ] Run `python scripts/validate_schema.py --strict`
- [ ] All tables have `tenantId` (except system tables)
- [ ] All tables have timestamps
- [ ] Foreign keys are correct
- [ ] Indexes on frequently queried fields

### Seed Data Validation
- [ ] Run `python scripts/check_seed_consistency.py`
- [ ] All tables have seed data
- [ ] Seed data covers common scenarios
- [ ] Foreign keys in seed data are valid
- [ ] Multi-tenant test data exists

### Testing
- [ ] Multi-tenant isolation validated (see practice-hub-testing skill)
- [ ] All queries scoped by tenantId
- [ ] Foreign key constraints working
- [ ] Views returning correct data

### Backup Plan
- [ ] Document current schema version
- [ ] Export schema: `pg_dump --schema-only`
- [ ] Test restore procedure
- [ ] Have rollback plan

## Production Migration

When ready for production:

1. **Freeze schema** - No more direct schema changes
2. **Create migrations** - Use `drizzle-kit generate`
3. **Test migrations** - On staging environment
4. **Document changes** - Migration notes
5. **Plan rollback** - Backup + revert procedure
6. **Execute migration** - During maintenance window
7. **Verify** - Check data integrity

## Quick Reference

```bash
# Validate schema
python .claude/skills/practice-hub-database-ops/scripts/validate_schema.py

# Check seed consistency
python .claude/skills/practice-hub-database-ops/scripts/check_seed_consistency.py

# Safe database reset
bash .claude/skills/practice-hub-database-ops/scripts/safe_reset.sh

# Or direct reset
pnpm db:reset

# Open Drizzle Studio
pnpm db:studio

# View database in terminal
docker exec -it practice-hub-db psql -U postgres -d practice_hub
```

## Remember

✅ **DO:**
- Update schema.ts directly
- Update seed.ts after schema changes
- Run `pnpm db:reset` after changes
- Validate schema and seeds
- Always include tenantId

❌ **DON'T:**
- Create migration files (dev only)
- Run individual database commands
- Skip seed data updates
- Forget tenantId field
- Hard-code tenant IDs in queries
