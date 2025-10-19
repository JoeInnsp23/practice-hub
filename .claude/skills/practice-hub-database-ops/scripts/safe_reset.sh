#!/bin/bash
# Safe database reset wrapper for Practice Hub
#
# Enforces the ONLY correct way to reset the database:
#   pnpm db:reset
#
# This script adds safety checks and confirmations.

set -e

echo "🔄 Practice Hub Database Reset"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Must run from project root directory"
  exit 1
fi

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Error: Docker is not running"
  echo "   Start Docker first: docker compose up -d"
  exit 1
fi

# Check if database container is running
if ! docker ps | grep -q practice-hub-db; then
  echo "⚠️  Warning: Database container not running"
  echo "   Starting database..."
  docker compose up -d
  echo "   Waiting for database to be ready..."
  sleep 5
fi

# Show what will happen
echo "This will:"
echo "  1. Drop and recreate the schema (removes ALL tables/views)"
echo "  2. Push the schema (creates tables from lib/db/schema.ts)"
echo "  3. Run migrations (creates views from drizzle/*.sql)"
echo "  4. Seed the database (runs scripts/seed.ts)"
echo "  5. Seed auth users (runs scripts/seed-auth-users.ts)"
echo ""

# Warning if not in development
if [ "$NODE_ENV" = "production" ]; then
  echo "🚨 WARNING: NODE_ENV is set to 'production'"
  echo "   This operation will DESTROY ALL PRODUCTION DATA!"
  echo ""
  read -p "Type 'DESTROY PRODUCTION DATA' to continue: " confirm
  if [ "$confirm" != "DESTROY PRODUCTION DATA" ]; then
    echo "Cancelled."
    exit 0
  fi
else
  # Development confirmation
  echo "⚠️  This will DELETE ALL DATA in your local database."
  read -p "Continue? [y/N]: " confirm
  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Cancelled."
    exit 0
  fi
fi

echo ""
echo "🔄 Running database reset..."
echo "========================================"

# Run the ONE correct command
pnpm db:reset

echo ""
echo "✅ Database reset complete!"
echo ""
echo "Next steps:"
echo "  • Verify seed data: pnpm db:studio"
echo "  • Start dev server: pnpm dev"
echo ""
