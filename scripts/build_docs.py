#!/usr/bin/env python3
"""
Documentation Builder

Reads doclets.yaml and books.yaml, then merges extracted documentation
content into target markdown files between CODE-EXTRACT markers.

Usage: python3 scripts/build_docs.py
Requires: docs/dev/doclets.yaml, docs/books.yaml
"""

import os
import re
import yaml
from pathlib import Path
from typing import Dict, List, Any, Optional

DOCLETS_FILE = "docs/dev/doclets.yaml"
BOOKS_FILE = "docs/books.yaml"

class DocumentBuilder:
    """Builds unified documentation from extracted doclets"""

    def __init__(self):
        self.doclets: Dict[str, List[Dict[str, Any]]] = {}
        self.targets: Dict[str, Dict[str, str]] = {}
        self.stats = {
            "files_updated": 0,
            "sections_updated": 0,
            "errors": []
        }

    def load_doclets(self) -> bool:
        """Load extracted doclets from YAML"""
        if not os.path.exists(DOCLETS_FILE):
            print(f"❌ Doclets file not found: {DOCLETS_FILE}")
            print("   Run: pnpm docs:extract")
            return False

        try:
            with open(DOCLETS_FILE, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
                self.doclets = data.get("doclets", {})
                print(f"✅ Loaded {len(self.doclets)} target(s) from doclets.yaml")
                return True
        except Exception as e:
            print(f"❌ Error loading {DOCLETS_FILE}: {e}")
            return False

    def load_targets(self) -> bool:
        """Load target mappings from books.yaml"""
        if not os.path.exists(BOOKS_FILE):
            print(f"❌ Target mapping file not found: {BOOKS_FILE}")
            return False

        try:
            with open(BOOKS_FILE, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
                self.targets = data.get("targets", {})
                print(f"✅ Loaded {len(self.targets)} target mapping(s) from books.yaml")
                return True
        except Exception as e:
            print(f"❌ Error loading {BOOKS_FILE}: {e}")
            return False

    def build_section_content(self, target: str) -> str:
        """
        Build markdown content for a target from all its doclets.
        Returns formatted markdown string.
        """
        if target not in self.doclets:
            return "**No documentation tags found for this section.**\n"

        doclets = self.doclets[target]
        lines = []

        for doclet in doclets:
            # Add section heading if available
            section = doclet.get("section")
            if section:
                lines.append(f"### {section}\n")

            # Add summary as bold text
            summary = doclet.get("summary")
            if summary:
                lines.append(f"**{summary}**\n")

            # Add metadata
            audience = doclet.get("audience", [])
            tags = doclet.get("tags", [])

            if audience or tags:
                lines.append("")
                if audience:
                    lines.append(f"**Audience**: {', '.join(audience)}")
                if tags:
                    lines.append(f"**Tags**: {', '.join(tags)}")
                lines.append("")

            # Add main content
            content = doclet.get("content", "")
            if content:
                lines.append(content)
                lines.append("")

            # Add source reference
            source = doclet.get("source", {})
            source_file = source.get("file", "unknown")
            source_line = source.get("line", 0)
            lines.append(f"*Source: `{source_file}:{source_line}`*\n")
            lines.append("---\n")

        return "\n".join(lines)

    def update_document(self, target: str, target_config: Dict[str, str]) -> bool:
        """
        Update a single documentation file with extracted content.
        Returns True if successful.
        """
        file_path = target_config.get("file")
        section_marker = target_config.get("section")

        if not file_path or not section_marker:
            self.stats["errors"].append(f"Invalid target config for {target}")
            return False

        if not os.path.exists(file_path):
            self.stats["errors"].append(f"Target file not found: {file_path}")
            return False

        # Read current content
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            self.stats["errors"].append(f"Error reading {file_path}: {e}")
            return False

        # Find extraction markers
        begin_marker = f"<!-- BEGIN CODE-EXTRACT: {target} -->"
        end_marker = f"<!-- END CODE-EXTRACT: {target} -->"

        if begin_marker not in content or end_marker not in content:
            self.stats["errors"].append(
                f"Extraction markers not found in {file_path} for target '{target}'"
            )
            return False

        # Build new section content
        new_content = self.build_section_content(target)

        # Replace content between markers
        pattern = re.compile(
            re.escape(begin_marker) + r'.*?' + re.escape(end_marker),
            re.DOTALL
        )

        replacement = f"{begin_marker}\n\n{new_content}\n{end_marker}"
        updated_content = pattern.sub(replacement, content)

        # Write updated content
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            print(f"   ✅ Updated {file_path} (target: {target})")
            self.stats["sections_updated"] += 1
            return True
        except Exception as e:
            self.stats["errors"].append(f"Error writing {file_path}: {e}")
            return False

    def build(self) -> bool:
        """
        Main build process: merge all doclets into target documents.
        Returns True if successful.
        """
        print("\n🔨 Building documentation...\n")

        # Track which files we've updated (to count unique files)
        updated_files = set()

        # Process each target
        for target, config in self.targets.items():
            if target in self.doclets:
                success = self.update_document(target, config)
                if success:
                    updated_files.add(config.get("file"))
            else:
                print(f"   ℹ️  No doclets found for target: {target}")

        self.stats["files_updated"] = len(updated_files)

        # Print summary
        print("\n" + "=" * 60)
        print("📊 Build Summary")
        print("=" * 60)
        print(f"Files updated: {self.stats['files_updated']}")
        print(f"Sections updated: {self.stats['sections_updated']}")
        print(f"Errors: {len(self.stats['errors'])}")

        if self.stats["errors"]:
            print("\n⚠️  Errors encountered:")
            for error in self.stats["errors"]:
                print(f"   - {error}")
            return False

        print("\n✅ Documentation build complete!")
        return True

def main():
    """Main entry point"""
    print("=" * 60)
    print("📚 Practice Hub Documentation Builder")
    print("=" * 60)

    builder = DocumentBuilder()

    # Load inputs
    if not builder.load_doclets():
        return 1
    if not builder.load_targets():
        return 1

    # Build documentation
    if not builder.build():
        return 1

    return 0

if __name__ == "__main__":
    exit(main())
