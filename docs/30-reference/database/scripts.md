# Database Management Scripts

## Available Commands

### Container Management
- `pnpm db:up` - Start PostgreSQL container (data persists in Docker volume)
- `pnpm db:down` - Stop PostgreSQL container (data is preserved)

### Schema Management

#### For Production (Recommended)
- `pnpm db:generate` - Generate migration files from schema changes
- `pnpm db:migrate` - Apply migrations to database (safe, preserves data)

#### For Development Only
- `pnpm db:push:dev` - **⚠️ WARNING: Development only!** Directly syncs schema to database. Can cause data loss if schema changes are destructive.

### Utilities
- `pnpm db:studio` - Open Drizzle Studio GUI for database exploration

## Best Practices

1. **Production Workflow**: Always use `db:generate` → `db:migrate`
2. **Development Workflow**: Can use `db:push:dev` for rapid prototyping
3. **Data Persistence**: Docker volume `postgres_data` ensures data persists between container restarts
4. **Never use `db:push:dev` in production** - It can drop/recreate tables causing data loss

## Migration Workflow Example

```bash
# 1. Make schema changes in lib/db/schema.ts
# 2. Generate migration files
pnpm db:generate
# 3. Review generated SQL files in drizzle/ directory
# 4. Apply migrations
pnpm db:migrate
```