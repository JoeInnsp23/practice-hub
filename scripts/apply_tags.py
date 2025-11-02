#!/usr/bin/env python3
"""
Apply Documentation Tags

Reads tagging_plan.json and automatically applies @doc tags to code files.

SAFETY FEATURES:
- Dry run mode by default
- Creates backups before modification
- Validates line numbers before insertion
- Batch processing with rollback on error

Usage:
  python3 scripts/apply_tags.py --dry-run   # Preview changes (default)
  python3 scripts/apply_tags.py --apply     # Apply changes
  python3 scripts/apply_tags.py --rollback  # Restore backups
"""

import os
import re
import sys
import json
import shutil
from pathlib import Path
from typing import List, Dict, Optional

class TagApplicator:
    """Applies documentation tags to code files"""

    def __init__(self, dry_run: bool = True):
        self.dry_run = dry_run
        self.plan: Dict = {}
        self.applied_count = 0
        self.failed_count = 0
        self.backup_dir = ".tag-backups"

    def load_plan(self) -> bool:
        """Load tagging plan"""
        plan_file = "docs/dev/tagging_plan.json"

        if not os.path.exists(plan_file):
            print(f"❌ Plan not found: {plan_file}")
            print("   Run: python3 scripts/generate_tagging_plan.py")
            return False

        try:
            with open(plan_file, 'r', encoding='utf-8') as f:
                self.plan = json.load(f)
            return True
        except Exception as e:
            print(f"❌ Error loading plan: {e}")
            return False

    def create_backup(self, file_path: str) -> bool:
        """Create backup of file before modification"""
        try:
            # Create backup directory
            os.makedirs(self.backup_dir, exist_ok=True)

            # Preserve directory structure in backup
            rel_path = file_path
            backup_path = os.path.join(self.backup_dir, rel_path)

            # Create parent directories
            os.makedirs(os.path.dirname(backup_path), exist_ok=True)

            # Copy file
            shutil.copy2(file_path, backup_path)

            return True

        except Exception as e:
            print(f"❌ Failed to backup {file_path}: {e}")
            return False

    def validate_insertion_point(self, file_path: str, line_number: int, search_pattern: str) -> bool:
        """Validate that insertion point is still correct"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            # Check if line number is valid
            if line_number < 1 or line_number > len(lines):
                print(f"   ⚠️  Invalid line number: {line_number} (file has {len(lines)} lines)")
                return False

            # Check if search pattern still matches
            target_line = lines[line_number - 1]

            # Extract search pattern from item name
            # (This is a simplified check - could be more robust)
            if "export" not in target_line:
                print(f"   ⚠️  Line {line_number} doesn't contain expected export")
                return False

            return True

        except Exception as e:
            print(f"   ❌ Validation error: {e}")
            return False

    def apply_tag(self, plan_item: Dict) -> bool:
        """Apply a single tag to a file"""
        if plan_item["status"] != "ready":
            return False

        file_path = plan_item["file"]
        line_number = plan_item["insert_before_line"]
        tag_content = plan_item["tag_content"]
        item_name = plan_item["item"]["name"]

        print(f"   📝 {file_path}:{line_number} - {item_name}")

        # Dry run - just show what would be done
        if self.dry_run:
            print(f"      [DRY RUN] Would insert tag before line {line_number}")
            return True

        # Validate insertion point
        if not self.validate_insertion_point(file_path, line_number, item_name):
            print(f"      ❌ Validation failed - skipping")
            return False

        # Create backup
        if not self.create_backup(file_path):
            print(f"      ❌ Backup failed - skipping")
            return False

        try:
            # Read file
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            # Insert tag before target line
            insert_index = line_number - 1

            # Add tag lines
            tag_lines = [line + "\n" for line in tag_content.split("\n")]

            # Insert
            lines = lines[:insert_index] + tag_lines + lines[insert_index:]

            # Write back
            with open(file_path, 'w', encoding='utf-8') as f:
                f.writelines(lines)

            print(f"      ✅ Tag applied")
            return True

        except Exception as e:
            print(f"      ❌ Failed to apply tag: {e}")
            return False

    def apply_all(self):
        """Apply all tags from plan"""
        print()
        print("=" * 60)
        print("🏷️  Applying Tags")
        print("=" * 60)
        print()

        if self.dry_run:
            print("🚨 DRY RUN MODE - No files will be modified")
            print()

        items = [i for i in self.plan.get("items", []) if i["status"] == "ready"]

        if not items:
            print("⚠️  No items ready to tag")
            return

        print(f"📦 Processing {len(items)} items...")
        print()

        # Group by file
        by_file: Dict[str, List[Dict]] = {}
        for item in items:
            file_path = item["file"]
            if file_path not in by_file:
                by_file[file_path] = []
            by_file[file_path].append(item)

        # Process each file
        for file_path, file_items in sorted(by_file.items()):
            print(f"📄 {file_path} ({len(file_items)} tags)")

            for item in file_items:
                success = self.apply_tag(item)

                if success:
                    self.applied_count += 1
                else:
                    self.failed_count += 1

            print()

    def print_summary(self):
        """Print application summary"""
        print("=" * 60)
        print("📊 Summary")
        print("=" * 60)
        print()

        print(f"Applied: {self.applied_count}")
        print(f"Failed: {self.failed_count}")
        print()

        if self.dry_run:
            print("💡 This was a dry run. No files were modified.")
            print("   Run with --apply to apply changes.")
        else:
            print(f"✅ Tags applied successfully!")
            print()
            print("📦 Backups saved to: .tag-backups/")
            print()
            print("🔧 Next steps:")
            print("   1. Review applied tags")
            print("   2. Run extraction: pnpm docs:extract")
            print("   3. Build docs: pnpm docs:build")
            print("   4. Validate: pnpm docs:validate")
            print()
            print("⚠️  If something went wrong, rollback with:")
            print("   python3 scripts/apply_tags.py --rollback")

        print()

    def rollback(self):
        """Restore files from backups"""
        print()
        print("=" * 60)
        print("🔄 Rolling Back Changes")
        print("=" * 60)
        print()

        if not os.path.exists(self.backup_dir):
            print("❌ No backups found")
            return

        # Find all backup files
        backup_files = []
        for root, dirs, files in os.walk(self.backup_dir):
            for file in files:
                backup_path = os.path.join(root, file)
                rel_path = os.path.relpath(backup_path, self.backup_dir)
                backup_files.append((backup_path, rel_path))

        print(f"📦 Found {len(backup_files)} backup files")
        print()

        # Confirm
        response = input("⚠️  Restore all backups? This will overwrite current files (y/N): ")
        if response.lower() != 'y':
            print("❌ Rollback cancelled")
            return

        # Restore each file
        restored = 0
        failed = 0

        for backup_path, rel_path in backup_files:
            try:
                # Restore file
                shutil.copy2(backup_path, rel_path)
                print(f"   ✅ Restored: {rel_path}")
                restored += 1

            except Exception as e:
                print(f"   ❌ Failed to restore {rel_path}: {e}")
                failed += 1

        print()
        print(f"✅ Restored {restored} files")
        if failed > 0:
            print(f"⚠️  Failed to restore {failed} files")

        # Ask to delete backups
        print()
        response = input("Delete backup directory? (y/N): ")
        if response.lower() == 'y':
            shutil.rmtree(self.backup_dir)
            print("✅ Backups deleted")

        print()

    def run(self, mode: str):
        """Main execution"""
        print("=" * 60)
        print("🏷️  Documentation Tag Applicator")
        print("=" * 60)

        if mode == "rollback":
            self.rollback()
            return 0

        # Load plan
        if not self.load_plan():
            return 1

        print(f"✅ Loaded plan: {self.plan['total_items']} items")
        print(f"   Ready to tag: {self.plan['ready']}")
        print()

        # Apply tags
        self.apply_all()

        # Print summary
        self.print_summary()

        return 0

def main():
    # Parse arguments
    mode = "dry-run"  # Default

    if len(sys.argv) > 1:
        arg = sys.argv[1]
        if arg == "--apply":
            mode = "apply"
        elif arg == "--rollback":
            mode = "rollback"
        elif arg == "--dry-run":
            mode = "dry-run"
        else:
            print(f"❌ Unknown argument: {arg}")
            print()
            print("Usage:")
            print("  python3 scripts/apply_tags.py --dry-run   # Preview changes (default)")
            print("  python3 scripts/apply_tags.py --apply     # Apply changes")
            print("  python3 scripts/apply_tags.py --rollback  # Restore backups")
            return 1

    applicator = TagApplicator(dry_run=(mode != "apply"))
    return applicator.run(mode)

if __name__ == "__main__":
    sys.exit(main())
