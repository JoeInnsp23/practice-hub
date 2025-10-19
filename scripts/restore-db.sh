#!/bin/bash

################################################################################
# Database Restore Script for Practice Hub
#
# This script restores a PostgreSQL backup from the backups/ directory.
# WARNING: This will DROP and RECREATE the database, destroying all current data!
#
# Usage:
#   ./scripts/restore-db.sh <backup_file>
#
# Example:
#   ./scripts/restore-db.sh practice_hub_backup_20250119_143022.sql.gz
#   ./scripts/restore-db.sh practice_hub_backup_20250119_143022.sql
#
# Requirements:
#   - Docker container 'practice-hub-db' running
#   - PostgreSQL credentials in .env.local
#   - Backup file in backups/ directory
################################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
CONTAINER_NAME="practice-hub-db"
DB_NAME="practice_hub"
DB_USER="postgres"
DB_PASSWORD="PgHub2024\$Secure#DB!9kL"

echo -e "${GREEN}Practice Hub Database Restore${NC}"
echo "==============================="
echo ""

# Check if backup file was provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: No backup file specified${NC}"
    echo ""
    echo "Usage: ./scripts/restore-db.sh <backup_file>"
    echo ""
    echo "Available backups:"
    ls -1t "$BACKUP_DIR"/practice_hub_backup_*.sql.gz 2>/dev/null | head -10 || echo "  No backups found"
    exit 1
fi

BACKUP_FILENAME="$1"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILENAME"

# Check if backup file exists
if [ ! -f "$BACKUP_PATH" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_PATH${NC}"
    echo ""
    echo "Available backups:"
    ls -1t "$BACKUP_DIR"/practice_hub_backup_*.sql.gz 2>/dev/null | head -10 || echo "  No backups found"
    exit 1
fi

# Check if Docker container is running
echo "Checking database container status..."
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}Error: Database container '$CONTAINER_NAME' is not running${NC}"
    echo "Start it with: docker compose up -d"
    exit 1
fi
echo -e "${GREEN}✓ Container is running${NC}"
echo ""

# Display backup info
BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
BACKUP_DATE=$(stat -c %y "$BACKUP_PATH" | cut -d' ' -f1,2 | cut -d'.' -f1)
echo "Backup file: $BACKUP_FILENAME"
echo "Size: $BACKUP_SIZE"
echo "Created: $BACKUP_DATE"
echo ""

# Confirmation prompt
echo -e "${YELLOW}WARNING: This will completely replace the current database!${NC}"
echo -e "${YELLOW}All existing data will be lost.${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi
echo ""

# Create a safety backup of current database
SAFETY_BACKUP="practice_hub_before_restore_$(date +"%Y%m%d_%H%M%S").sql.gz"
SAFETY_BACKUP_PATH="$BACKUP_DIR/$SAFETY_BACKUP"

echo "Creating safety backup of current database..."
PGPASSWORD="$DB_PASSWORD" docker exec -i "$CONTAINER_NAME" \
    pg_dump -U "$DB_USER" -d "$DB_NAME" \
    --format=plain \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    | gzip > "$SAFETY_BACKUP_PATH"

if [ $? -eq 0 ]; then
    SAFETY_SIZE=$(du -h "$SAFETY_BACKUP_PATH" | cut -f1)
    echo -e "${GREEN}✓ Safety backup created: $SAFETY_BACKUP ($SAFETY_SIZE)${NC}"
else
    echo -e "${YELLOW}Warning: Safety backup failed, continuing anyway...${NC}"
fi
echo ""

# Decompress if needed
TEMP_SQL=""
if [[ "$BACKUP_FILENAME" == *.gz ]]; then
    echo "Decompressing backup..."
    TEMP_SQL="$(mktemp)"
    gunzip -c "$BACKUP_PATH" > "$TEMP_SQL"
    SQL_FILE="$TEMP_SQL"
    echo -e "${GREEN}✓ Decompressed${NC}"
else
    SQL_FILE="$BACKUP_PATH"
fi
echo ""

# Drop existing connections
echo "Terminating existing database connections..."
PGPASSWORD="$DB_PASSWORD" docker exec -i "$CONTAINER_NAME" \
    psql -U "$DB_USER" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DB_NAME' AND pid <> pg_backend_pid();" \
    > /dev/null 2>&1 || true
echo -e "${GREEN}✓ Connections terminated${NC}"
echo ""

# Restore database
echo "Restoring database from backup..."
echo "This may take several minutes depending on the database size..."
echo ""

PGPASSWORD="$DB_PASSWORD" docker exec -i "$CONTAINER_NAME" \
    psql -U "$DB_USER" -d "$DB_NAME" < "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Database restored successfully!${NC}"
else
    echo ""
    echo -e "${RED}✗ Restore failed${NC}"
    echo ""
    echo "To restore from safety backup, run:"
    echo "  ./scripts/restore-db.sh $SAFETY_BACKUP"

    # Cleanup temp file
    if [ -n "$TEMP_SQL" ] && [ -f "$TEMP_SQL" ]; then
        rm "$TEMP_SQL"
    fi

    exit 1
fi

# Cleanup temp file
if [ -n "$TEMP_SQL" ] && [ -f "$TEMP_SQL" ]; then
    rm "$TEMP_SQL"
fi
echo ""

# Verify restore
echo "Verifying database integrity..."
TABLE_COUNT=$(PGPASSWORD="$DB_PASSWORD" docker exec -i "$CONTAINER_NAME" \
    psql -U "$DB_USER" -d "$DB_NAME" -t -c \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';")

echo -e "${GREEN}✓ Found $TABLE_COUNT tables${NC}"
echo ""

echo -e "${GREEN}Restore completed successfully!${NC}"
echo ""
echo "Safety backup preserved at:"
echo "  $SAFETY_BACKUP"
echo ""
echo "To verify the restore, check:"
echo "  - Application functionality"
echo "  - Data integrity"
echo "  - User authentication"
