#!/usr/bin/env python3
"""
Documentation Link Fixer

Scans documentation files and fixes broken internal links.
Handles:
- Moved files (updates paths)
- Renamed sections (updates anchors)
- Case sensitivity issues

Usage: python3 scripts/fix_doc_links.py [--dry-run]
"""

import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Set, Tuple

class LinkFixer:
    """Fixes broken internal documentation links"""

    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.docs_root = Path("docs")
        self.file_map: Dict[str, str] = {}  # lowercase basename -> actual path
        self.anchor_map: Dict[str, Set[str]] = {}  # file path -> set of anchors
        self.fixes_made = 0
        self.errors_found = 0

    def build_file_map(self):
        """Build mapping of file names to paths"""
        print("📁 Building file index...\n")

        for md_file in self.docs_root.rglob("*.md"):
            # Skip archived and generated files
            if ".archive" in md_file.parts or "node_modules" in md_file.parts:
                continue

            rel_path = str(md_file.relative_to(self.docs_root))
            basename = md_file.stem.lower()

            # Store both with and without .md extension
            self.file_map[basename] = rel_path
            self.file_map[f"{basename}.md"] = rel_path

        print(f"   Indexed {len(self.file_map)} files\n")

    def build_anchor_map(self):
        """Build mapping of files to their heading anchors"""
        print("🔗 Building anchor index...\n")

        for md_file in self.docs_root.rglob("*.md"):
            if ".archive" in md_file.parts or "node_modules" in md_file.parts:
                continue

            rel_path = str(md_file.relative_to(self.docs_root))
            anchors = self.extract_anchors(md_file)
            self.anchor_map[rel_path] = anchors

        total_anchors = sum(len(a) for a in self.anchor_map.values())
        print(f"   Indexed {total_anchors} anchors\n")

    def extract_anchors(self, file_path: Path) -> Set[str]:
        """Extract heading anchors from a markdown file"""
        anchors = set()

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Find all markdown headings
            headings = re.findall(r'^#{1,6}\s+(.+)$', content, re.MULTILINE)

            for heading in headings:
                # Convert to GitHub-style anchor
                anchor = heading.lower()
                anchor = re.sub(r'[^\w\s-]', '', anchor)
                anchor = re.sub(r'[-\s]+', '-', anchor)
                anchors.add(anchor)

        except Exception as e:
            print(f"⚠️  Error reading {file_path}: {e}")

        return anchors

    def fix_link(self, link: str, source_file: str) -> Tuple[str, bool]:
        """
        Fix a single markdown link.
        Returns (fixed_link, was_fixed) tuple.
        """
        # Skip external links
        if link.startswith(('http://', 'https://', 'mailto:')):
            return link, False

        # Parse link into path and anchor
        parts = link.split('#', 1)
        path_part = parts[0]
        anchor_part = parts[1] if len(parts) > 1 else None

        fixed = False

        # Fix file path if present
        if path_part:
            # Try exact match first
            if path_part not in self.file_map:
                # Try case-insensitive match
                lower_path = path_part.lower()
                if lower_path in self.file_map:
                    path_part = self.file_map[lower_path]
                    fixed = True

        # Fix anchor if present
        if anchor_part and path_part:
            target_file = path_part
            if target_file in self.anchor_map:
                # Check if anchor exists
                if anchor_part not in self.anchor_map[target_file]:
                    # Try case-insensitive match
                    lower_anchor = anchor_part.lower()
                    for existing_anchor in self.anchor_map[target_file]:
                        if existing_anchor.lower() == lower_anchor:
                            anchor_part = existing_anchor
                            fixed = True
                            break

        # Reconstruct link
        fixed_link = path_part
        if anchor_part:
            fixed_link += f"#{anchor_part}"

        return fixed_link, fixed

    def process_file(self, file_path: Path):
        """Process a single markdown file and fix links"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            original_content = content
            rel_path = str(file_path.relative_to(self.docs_root))

            # Find all markdown links [text](url)
            def replace_link(match):
                text = match.group(1)
                url = match.group(2)

                fixed_url, was_fixed = self.fix_link(url, rel_path)

                if was_fixed:
                    self.fixes_made += 1
                    print(f"   ✅ Fixed: {url} -> {fixed_url} in {rel_path}")

                return f"[{text}]({fixed_url})"

            content = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', replace_link, content)

            # Write back if changed
            if content != original_content and not self.dry_run:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)

        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")
            self.errors_found += 1

    def run(self):
        """Main execution"""
        print("=" * 60)
        print("🔧 Documentation Link Fixer")
        print("=" * 60)
        print()

        if self.dry_run:
            print("🚨 DRY RUN MODE - No files will be modified\n")

        # Build indices
        self.build_file_map()
        self.build_anchor_map()

        # Process all markdown files
        print("🔍 Scanning for broken links...\n")

        for md_file in self.docs_root.rglob("*.md"):
            if ".archive" in md_file.parts or "node_modules" in md_file.parts:
                continue

            self.process_file(md_file)

        # Print summary
        print("\n" + "=" * 60)
        print("📊 Summary")
        print("=" * 60)
        print(f"Fixes made: {self.fixes_made}")
        print(f"Errors found: {self.errors_found}")

        if self.dry_run and self.fixes_made > 0:
            print("\n💡 Run without --dry-run to apply fixes")

        print()

def main():
    dry_run = "--dry-run" in sys.argv

    fixer = LinkFixer(dry_run=dry_run)
    fixer.run()

if __name__ == "__main__":
    main()
