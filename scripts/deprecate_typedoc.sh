#!/bin/bash
# Deprecate TypeDoc Generated Documentation
#
# Archives the TypeDoc-generated documentation to .archive/ and updates
# .gitignore to prevent accidental restoration.
#
# This is a ONE-TIME operation to transition from TypeDoc to the new
# code-extract documentation system.
#
# Usage: bash scripts/deprecate_typedoc.sh [--dry-run]

set -e

TYPEDOC_DIR="docs/reference/typescript"
ARCHIVE_DIR="docs/.archive/typedoc-$(date +%Y%m%d)"
DRY_RUN=false

# Parse arguments
if [ "$1" = "--dry-run" ]; then
    DRY_RUN=true
fi

echo "========================================"
echo "🗄️  TypeDoc Deprecation Script"
echo "========================================"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo "🚨 DRY RUN MODE - No files will be moved"
    echo ""
fi

# Check if TypeDoc directory exists
if [ ! -d "$TYPEDOC_DIR" ]; then
    echo "✅ TypeDoc directory not found: $TYPEDOC_DIR"
    echo "   Already deprecated or never generated"
    exit 0
fi

# Count files and calculate size
echo "📊 Analyzing TypeDoc documentation..."
FILE_COUNT=$(find "$TYPEDOC_DIR" -type f | wc -l)
DIR_SIZE=$(du -sh "$TYPEDOC_DIR" | cut -f1)

echo "   Files: $FILE_COUNT"
echo "   Size: $DIR_SIZE"
echo ""

# Confirm operation (skip in dry-run)
if [ "$DRY_RUN" = false ]; then
    echo "⚠️  This will archive the TypeDoc documentation to:"
    echo "   $ARCHIVE_DIR"
    echo ""
    read -p "Continue? (y/N): " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Operation cancelled"
        exit 1
    fi
    echo ""
fi

# Create archive directory
if [ "$DRY_RUN" = false ]; then
    echo "📁 Creating archive directory..."
    mkdir -p "$ARCHIVE_DIR"
    echo "   ✅ Created: $ARCHIVE_DIR"
    echo ""
fi

# Move TypeDoc files to archive
echo "🚚 Archiving TypeDoc documentation..."

if [ "$DRY_RUN" = true ]; then
    echo "   [DRY RUN] Would move: $TYPEDOC_DIR -> $ARCHIVE_DIR"
else
    mv "$TYPEDOC_DIR" "$ARCHIVE_DIR/"
    echo "   ✅ Moved: $TYPEDOC_DIR -> $ARCHIVE_DIR/typescript"
fi

echo ""

# Update .gitignore to exclude TypeDoc directory
GITIGNORE_ENTRY="docs/reference/typescript/"

if [ -f "docs/.gitignore" ]; then
    if grep -q "^${GITIGNORE_ENTRY}$" "docs/.gitignore"; then
        echo "ℹ️  .gitignore already excludes TypeDoc directory"
    else
        if [ "$DRY_RUN" = false ]; then
            echo "$GITIGNORE_ENTRY" >> "docs/.gitignore"
            echo "✅ Updated docs/.gitignore"
        else
            echo "[DRY RUN] Would add '$GITIGNORE_ENTRY' to docs/.gitignore"
        fi
    fi
else
    if [ "$DRY_RUN" = false ]; then
        echo "# Archived TypeDoc (deprecated)" > "docs/.gitignore"
        echo "$GITIGNORE_ENTRY" >> "docs/.gitignore"
        echo "✅ Created docs/.gitignore"
    else
        echo "[DRY RUN] Would create docs/.gitignore with '$GITIGNORE_ENTRY'"
    fi
fi

echo ""

# Update package.json to comment out TypeDoc script
if [ "$DRY_RUN" = false ]; then
    echo "📝 Updating package.json..."

    # Use sed to comment out the docs:generate script
    # (This is a simple approach; more robust would use jq)
    if grep -q '"docs:generate": "typedoc' package.json; then
        sed -i.bak 's/"docs:generate": "typedoc/"_docs:generate_deprecated": "typedoc/' package.json
        rm package.json.bak
        echo "   ✅ Commented out 'docs:generate' script"
    else
        echo "   ℹ️  TypeDoc script not found or already updated"
    fi
else
    echo "[DRY RUN] Would comment out TypeDoc script in package.json"
fi

echo ""

# Create deprecation notice
NOTICE_FILE="docs/reference/TYPEDOC_DEPRECATED.md"

if [ "$DRY_RUN" = false ]; then
    cat > "$NOTICE_FILE" << 'EOF'
# TypeDoc Deprecated

**Date**: $(date +%Y-%m-%d)

The TypeDoc-generated TypeScript API documentation has been **deprecated** and archived.

## Why?

TypeDoc generated **1,399 files (9.8MB)** of documentation that:
- Was never used or referenced
- Consumed significant storage and indexing resources
- Created noise in documentation searches
- Duplicated information available in the codebase

## Migration

The project has transitioned to a **code-extract documentation system**:
- Documentation is embedded in code using `@doc:path#section` tags
- Extraction pipeline generates unified docs from tagged code
- Documentation stays in sync with code automatically

## Archive Location

The archived TypeDoc documentation is available at:
```
docs/.archive/typedoc-YYYYMMDD/
```

## References

- **DOC_TAGGING_SPEC.md**: Documentation tagging specification
- **books.yaml**: Target mapping configuration
- **repo-facts.json**: Current codebase statistics

---

*This deprecation was performed by `scripts/deprecate_typedoc.sh`*
EOF

    # Replace YYYYMMDD with actual date
    sed -i.bak "s/YYYYMMDD/$(date +%Y%m%d)/g" "$NOTICE_FILE"
    rm "${NOTICE_FILE}.bak"

    # Replace $(date +%Y-%m-%d) with actual date
    sed -i.bak "s/\$(date +%Y-%m-%d)/$(date +%Y-%m-%d)/g" "$NOTICE_FILE"
    rm "${NOTICE_FILE}.bak"

    echo "✅ Created deprecation notice: $NOTICE_FILE"
else
    echo "[DRY RUN] Would create $NOTICE_FILE"
fi

echo ""
echo "========================================"
echo "✅ TypeDoc Deprecation Complete"
echo "========================================"
echo ""
echo "📊 Summary:"
echo "   Archived: $FILE_COUNT files ($DIR_SIZE)"
echo "   Location: $ARCHIVE_DIR"
echo ""

if [ "$DRY_RUN" = false ]; then
    echo "🔧 Next steps:"
    echo "   1. Run: pnpm docs:facts"
    echo "   2. Run: pnpm docs:generate:doc-index"
    echo "   3. Commit changes with: git add . && git commit -m 'chore: deprecate TypeDoc documentation'"
else
    echo "💡 Run without --dry-run to apply changes"
fi

echo ""
