#!/bin/bash
set -e

echo "Searching for orphaned documentation files..."

# Find all .md files in docs/
docs_files=$(find docs/ -name "*.md" -not -path "*/node_modules/*" -not -path "*/.archive/*" -not -path "*/reference/typescript/*")

orphaned=()

for file in $docs_files; do
  filename=$(basename "$file")

  # Skip README files (never orphaned)
  if [[ "$filename" == "README.md" ]]; then
    continue
  fi

  # Check if file is linked from any other doc
  relative_path="${file#docs/}"
  linked=$(grep -r "$relative_path" docs/ --include="*.md" -l 2>/dev/null | wc -l)

  if [ "$linked" -eq 0 ]; then
    orphaned+=("$file")
  fi
done

if [ ${#orphaned[@]} -eq 0 ]; then
  echo "✅ No orphaned documentation files found"
  exit 0
else
  echo "⚠️ Found ${#orphaned[@]} orphaned documentation files:"
  for file in "${orphaned[@]}"; do
    echo "  - $file"
  done
  echo ""
  echo "These files are not linked from any other documentation."
  echo "Consider adding links or moving to docs/.archive/"
  exit 0  # Don't fail CI, just warn
fi
