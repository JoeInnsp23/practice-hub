#!/bin/bash
# Update README Placeholders
#
# Replaces {{repo-facts.*}} and {{package.json:*}} placeholders in README files
# with actual values from repo-facts.json and package.json.
#
# Usage: bash scripts/update_readme_placeholders.sh

set -e

REPO_FACTS="docs/dev/repo-facts.json"
PACKAGE_JSON="package.json"

echo "========================================"
echo "📝 Update README Placeholders"
echo "========================================"
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "❌ Error: jq is not installed"
    echo "   Install: brew install jq (macOS) or apt-get install jq (Linux)"
    exit 1
fi

# Check if files exist
if [ ! -f "$REPO_FACTS" ]; then
    echo "❌ Error: repo-facts.json not found"
    echo "   Run: pnpm docs:facts"
    exit 1
fi

if [ ! -f "$PACKAGE_JSON" ]; then
    echo "❌ Error: package.json not found"
    exit 1
fi

echo "✅ Found required files"
echo ""

# Function to replace placeholders in a file
update_file() {
    local file=$1
    local temp_file="${file}.tmp"
    local changes=0

    echo "📄 Processing $file"

    # Copy file to temp
    cp "$file" "$temp_file"

    # Replace {{repo-facts.*}} placeholders
    while IFS= read -r line; do
        if [[ $line =~ \{\{repo-facts\.([^}]+)\}\} ]]; then
            placeholder="${BASH_REMATCH[0]}"
            path="${BASH_REMATCH[1]}"

            # Query repo-facts.json using jq
            value=$(jq -r ".$path" "$REPO_FACTS" 2>/dev/null || echo "ERROR")

            if [ "$value" != "ERROR" ] && [ "$value" != "null" ]; then
                sed -i.bak "s|$placeholder|$value|g" "$temp_file"
                echo "   ✅ Replaced: $placeholder -> $value"
                ((changes++))
            else
                echo "   ⚠️  Invalid path: $placeholder"
            fi
        fi
    done < "$file"

    # Replace {{package.json:*}} placeholders
    while IFS= read -r line; do
        if [[ $line =~ \{\{package\.json:([^}]+)\}\} ]]; then
            placeholder="${BASH_REMATCH[0]}"
            path="${BASH_REMATCH[1]}"

            # Query package.json using jq
            value=$(jq -r ".$path" "$PACKAGE_JSON" 2>/dev/null || echo "ERROR")

            if [ "$value" != "ERROR" ] && [ "$value" != "null" ]; then
                sed -i.bak "s|$placeholder|$value|g" "$temp_file"
                echo "   ✅ Replaced: $placeholder -> $value"
                ((changes++))
            else
                echo "   ⚠️  Invalid path: $placeholder"
            fi
        fi
    done < "$file"

    # Apply changes if any were made
    if [ $changes -gt 0 ]; then
        mv "$temp_file" "$file"
        rm -f "${temp_file}.bak"
        echo "   📊 Total replacements: $changes"
    else
        rm -f "$temp_file" "${temp_file}.bak"
        echo "   ℹ️  No placeholders found"
    fi

    echo ""
}

# Find all README.md files (excluding node_modules and .archive)
echo "🔍 Scanning for README files..."
echo ""

readme_files=$(find docs -name "README.md" -not -path "*/node_modules/*" -not -path "*/.archive/*")

if [ -z "$readme_files" ]; then
    echo "⚠️  No README files found"
    exit 0
fi

# Update each README
for readme in $readme_files; do
    update_file "$readme"
done

echo "========================================"
echo "✅ README placeholder update complete!"
echo "========================================"
