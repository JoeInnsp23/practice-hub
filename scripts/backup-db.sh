#!/bin/bash

################################################################################
# Database Backup Script for Practice Hub
#
# This script creates a PostgreSQL backup using pg_dump and stores it in
# the backups/ directory with a timestamp. Optionally uploads to S3.
#
# Usage:
#   ./scripts/backup-db.sh              # Local backup only
#   ./scripts/backup-db.sh --upload-s3  # Backup and upload to S3
#
# Requirements:
#   - Docker container 'practice-hub-db' running
#   - PostgreSQL credentials in .env.local
#   - (Optional) AWS CLI configured for S3 upload
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
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="practice_hub_backup_${TIMESTAMP}.sql"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

# Parse command line arguments
UPLOAD_S3=false
if [[ "$1" == "--upload-s3" ]]; then
    UPLOAD_S3=true
fi

echo -e "${GREEN}Practice Hub Database Backup${NC}"
echo "=============================="
echo ""

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${YELLOW}Creating backup directory: $BACKUP_DIR${NC}"
    mkdir -p "$BACKUP_DIR"
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

# Create backup
echo "Creating database backup..."
echo "Database: $DB_NAME"
echo "Output: $BACKUP_FILE"
echo ""

PGPASSWORD="$DB_PASSWORD" docker exec -i "$CONTAINER_NAME" \
    pg_dump -U "$DB_USER" -d "$DB_NAME" \
    --format=plain \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    > "$BACKUP_PATH"

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
    echo -e "${GREEN}✓ Backup created successfully${NC}"
    echo "  File: $BACKUP_FILE"
    echo "  Size: $BACKUP_SIZE"
    echo "  Path: $BACKUP_PATH"
else
    echo -e "${RED}✗ Backup failed${NC}"
    exit 1
fi
echo ""

# Compress backup
echo "Compressing backup..."
gzip "$BACKUP_PATH"
COMPRESSED_FILE="${BACKUP_FILE}.gz"
COMPRESSED_PATH="${BACKUP_PATH}.gz"
COMPRESSED_SIZE=$(du -h "$COMPRESSED_PATH" | cut -f1)
echo -e "${GREEN}✓ Backup compressed${NC}"
echo "  File: $COMPRESSED_FILE"
echo "  Size: $COMPRESSED_SIZE"
echo ""

# Upload to S3 if requested
if [ "$UPLOAD_S3" = true ]; then
    echo "Uploading to S3..."

    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        echo -e "${YELLOW}Warning: AWS CLI not found, skipping S3 upload${NC}"
        echo "Install with: sudo apt-get install awscli"
    else
        # Replace with your S3 bucket name
        S3_BUCKET="${S3_BUCKET_NAME:-practice-hub-backups}"
        S3_PATH="s3://$S3_BUCKET/database/$COMPRESSED_FILE"

        aws s3 cp "$COMPRESSED_PATH" "$S3_PATH"

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Uploaded to S3: $S3_PATH${NC}"
        else
            echo -e "${YELLOW}Warning: S3 upload failed${NC}"
        fi
    fi
    echo ""
fi

# Cleanup old backups (keep last 7 days)
echo "Cleaning up old backups (keeping last 7 days)..."
find "$BACKUP_DIR" -name "practice_hub_backup_*.sql.gz" -mtime +7 -delete
REMAINING_BACKUPS=$(ls -1 "$BACKUP_DIR"/practice_hub_backup_*.sql.gz 2>/dev/null | wc -l)
echo -e "${GREEN}✓ Cleanup complete ($REMAINING_BACKUPS backups retained)${NC}"
echo ""

echo -e "${GREEN}Backup completed successfully!${NC}"
echo ""
echo "To restore this backup, run:"
echo "  ./scripts/restore-db.sh $COMPRESSED_FILE"
