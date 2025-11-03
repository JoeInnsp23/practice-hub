#!/usr/bin/env python3
"""
Documentation Tag Extractor

Scans all TypeScript/TSX files for @doc:path#section tags and extracts
documentation content into docs/dev/doclets.yaml.

Usage: python3 scripts/extract_doclets.py
Output: docs/dev/doclets.yaml
"""

import os
import re
import yaml
from pathlib import Path
from typing import List, Dict, Any, Optional

# Directories to scan for doc tags
SCAN_DIRS = [
    "app",
    "components",
    "lib",
    "server"
]

# File extensions to process
EXTENSIONS = [".ts", ".tsx"]

# Regex patterns
DOC_TAG_PATTERN = re.compile(r'@doc:([^\s]+)(?:#([^\s]+))?')
DOC_SUMMARY_PATTERN = re.compile(r'@doc-summary\s+(.+)')
DOC_AUDIENCE_PATTERN = re.compile(r'@doc-audience\s+(.+)')
DOC_TAGS_PATTERN = re.compile(r'@doc-tags\s+(.+)')

class Doclet:
    """Represents a single documentation tag extraction"""

    def __init__(self, file_path: str, line_number: int):
        self.file_path = file_path
        self.line_number = line_number
        self.target: Optional[str] = None
        self.section: Optional[str] = None
        self.summary: Optional[str] = None
        self.audience: List[str] = []
        self.tags: List[str] = []
        self.content: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for YAML serialization"""
        return {
            "source": {
                "file": self.file_path,
                "line": self.line_number
            },
            "target": self.target,
            "section": self.section,
            "summary": self.summary,
            "audience": self.audience,
            "tags": self.tags,
            "content": self.content.strip()
        }

def extract_doc_comment(lines: List[str], start_idx: int) -> Optional[str]:
    """
    Extract JSDoc comment content starting from start_idx.
    Returns the comment content without /** and */ markers.
    """
    if not lines[start_idx].strip().startswith("/**"):
        return None

    comment_lines = []
    idx = start_idx

    while idx < len(lines):
        line = lines[idx].strip()

        # Remove leading /** or *
        if line.startswith("/**"):
            line = line[3:].strip()
        elif line.startswith("*"):
            line = line[1:].strip()

        # Check for end of comment
        if "*/" in line:
            # Add content before */
            before_end = line.split("*/")[0].strip()
            if before_end:
                comment_lines.append(before_end)
            break

        comment_lines.append(line)
        idx += 1

    return "\n".join(comment_lines)

def parse_doclet(comment_content: str, file_path: str, line_number: int) -> Optional[Doclet]:
    """
    Parse a JSDoc comment for @doc tags and create a Doclet.
    Returns None if no @doc tag is found.
    """
    # Check for @doc tag
    doc_match = DOC_TAG_PATTERN.search(comment_content)
    if not doc_match:
        return None

    doclet = Doclet(file_path, line_number)

    # Extract target and section
    doclet.target = doc_match.group(1)
    doclet.section = doc_match.group(2) if doc_match.group(2) else None

    # Extract summary
    summary_match = DOC_SUMMARY_PATTERN.search(comment_content)
    if summary_match:
        doclet.summary = summary_match.group(1).strip()

    # Extract audience (comma-separated list)
    audience_match = DOC_AUDIENCE_PATTERN.search(comment_content)
    if audience_match:
        doclet.audience = [a.strip() for a in audience_match.group(1).split(",")]

    # Extract tags (comma-separated list)
    tags_match = DOC_TAGS_PATTERN.search(comment_content)
    if tags_match:
        doclet.tags = [t.strip() for t in tags_match.group(1).split(",")]

    # Extract content (everything after metadata lines)
    content_lines = []
    in_content = False

    for line in comment_content.split("\n"):
        # Skip metadata lines
        if line.startswith("@doc"):
            in_content = False
            continue

        # After first non-metadata line, we're in content
        if not line.startswith("@"):
            in_content = True

        if in_content:
            content_lines.append(line)

    doclet.content = "\n".join(content_lines).strip()

    return doclet

def scan_file(file_path: str) -> List[Doclet]:
    """
    Scan a single TypeScript file for @doc tags.
    Returns list of Doclets found.
    """
    doclets = []

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        for i, line in enumerate(lines):
            if line.strip().startswith("/**"):
                # Extract full JSDoc comment
                comment_content = extract_doc_comment(lines, i)
                if comment_content:
                    # Parse for @doc tags
                    doclet = parse_doclet(comment_content, file_path, i + 1)
                    if doclet:
                        doclets.append(doclet)

    except Exception as e:
        print(f"⚠️  Error reading {file_path}: {e}")

    return doclets

def scan_directory(base_dir: str) -> List[Doclet]:
    """
    Recursively scan directory for TypeScript files with @doc tags.
    """
    all_doclets = []
    base_path = Path(base_dir)

    if not base_path.exists():
        print(f"⚠️  Directory not found: {base_dir}")
        return all_doclets

    # Find all TS/TSX files
    for ext in EXTENSIONS:
        for file_path in base_path.rglob(f"*{ext}"):
            doclets = scan_file(str(file_path))
            if doclets:
                all_doclets.extend(doclets)
                print(f"   Found {len(doclets)} tag(s) in {file_path}")

    return all_doclets

def main():
    """Main extraction pipeline"""
    print("🔍 Scanning codebase for @doc tags...\n")

    all_doclets = []

    # Scan each directory
    for scan_dir in SCAN_DIRS:
        print(f"📁 Scanning {scan_dir}/")
        doclets = scan_directory(scan_dir)
        all_doclets.extend(doclets)
        print(f"   Total: {len(doclets)} tag(s)\n")

    # Group by target
    by_target: Dict[str, List[Doclet]] = {}
    for doclet in all_doclets:
        target_key = doclet.target
        if target_key not in by_target:
            by_target[target_key] = []
        by_target[target_key].append(doclet)

    # Build output structure
    output = {
        "generated": "AUTO-GENERATED by scripts/extract_doclets.py",
        "total_tags": len(all_doclets),
        "targets": len(by_target),
        "doclets": {}
    }

    # Convert to dict format
    for target, doclets in sorted(by_target.items()):
        output["doclets"][target] = [d.to_dict() for d in doclets]

    # Ensure output directory exists
    os.makedirs("docs/dev", exist_ok=True)

    # Write YAML output
    output_path = "docs/dev/doclets.yaml"
    with open(output_path, 'w', encoding='utf-8') as f:
        yaml.dump(output, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

    print(f"✅ Extraction complete!")
    print(f"   Total tags: {len(all_doclets)}")
    print(f"   Unique targets: {len(by_target)}")
    print(f"   Output: {output_path}\n")

    # Show targets summary
    if by_target:
        print("📊 Tags by target:")
        for target in sorted(by_target.keys()):
            count = len(by_target[target])
            print(f"   - {target}: {count} tag(s)")

if __name__ == "__main__":
    main()
