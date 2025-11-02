#!/usr/bin/env python3
"""
Taggable Items Audit

Scans the codebase for items that should have @doc tags but currently don't.
Generates an inventory report with recommendations for tagging.

Usage: python3 scripts/audit_taggable_items.py
Output: docs/dev/taggable_items_report.json
"""

import os
import re
import json
from pathlib import Path
from typing import List, Dict, Set, Optional

class TaggableItemsAuditor:
    """Audits codebase for items needing documentation tags"""

    def __init__(self):
        self.items: List[Dict] = []
        self.existing_tags: Set[str] = set()

    def scan_existing_tags(self):
        """Scan for existing @doc tags to avoid duplicates"""
        print("🔍 Scanning for existing @doc tags...")

        scan_dirs = ["app", "components", "lib", "server"]
        tag_count = 0

        for scan_dir in scan_dirs:
            if not os.path.exists(scan_dir):
                continue

            for file_path in Path(scan_dir).rglob("*.ts*"):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()

                    # Find @doc: tags
                    tags = re.findall(r'@doc:([^\s]+)', content)
                    for tag in tags:
                        self.existing_tags.add(tag)
                        tag_count += 1

                except Exception as e:
                    pass  # Skip files with read errors

        print(f"   Found {tag_count} existing tags ({len(self.existing_tags)} unique)")
        print()

    def scan_trpc_routers(self):
        """Scan for tRPC router procedures"""
        print("📡 Scanning tRPC routers...")

        routers_dir = Path("app/server/routers")

        if not routers_dir.exists():
            print("   ⚠️  Routers directory not found")
            return

        procedure_count = 0

        for router_file in routers_dir.glob("*.ts"):
            try:
                with open(router_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Find export const procedureName = ...procedure.query/mutation
                pattern = r'export const (\w+)\s*=\s*\w+\.(?:query|mutation)'
                procedures = re.findall(pattern, content)

                router_name = router_file.stem

                for procedure_name in procedures:
                    # Check if already tagged
                    tag_target = f"api/{router_name}#{procedure_name}"

                    if tag_target in self.existing_tags:
                        continue  # Already tagged

                    self.items.append({
                        "type": "trpc_procedure",
                        "category": "api",
                        "file": str(router_file),
                        "name": procedure_name,
                        "router": router_name,
                        "suggested_tag": tag_target,
                        "priority": "high"
                    })

                    procedure_count += 1

            except Exception as e:
                print(f"   ⚠️  Error reading {router_file}: {e}")

        print(f"   Found {procedure_count} untagged procedures")

    def scan_database_tables(self):
        """Scan for database table definitions"""
        print("🗄️  Scanning database schema...")

        schema_file = Path("lib/db/schema.ts")

        if not schema_file.exists():
            print("   ⚠️  Schema file not found")
            return

        try:
            with open(schema_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Find export const tableName = pgTable(...)
            pattern = r'export const (\w+)\s*=\s*pgTable\('
            tables = re.findall(pattern, content)

            table_count = 0

            for table_name in tables:
                # Check if already tagged
                tag_target = f"db/schema#{table_name}"

                if tag_target in self.existing_tags:
                    continue

                self.items.append({
                    "type": "database_table",
                    "category": "db",
                    "file": str(schema_file),
                    "name": table_name,
                    "suggested_tag": tag_target,
                    "priority": "medium"
                })

                table_count += 1

            print(f"   Found {table_count} untagged tables")

        except Exception as e:
            print(f"   ⚠️  Error reading schema: {e}")

    def scan_components(self):
        """Scan for React components"""
        print("🧩 Scanning components...")

        components_dir = Path("components")

        if not components_dir.exists():
            print("   ⚠️  Components directory not found")
            return

        component_count = 0

        for component_file in components_dir.rglob("*.tsx"):
            # Skip node_modules and ui components (already documented)
            if "node_modules" in component_file.parts or component_file.parts[1] == "ui":
                continue

            try:
                with open(component_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Find export function ComponentName or export const ComponentName
                pattern = r'export (?:function|const) (\w+)'
                components = re.findall(pattern, content)

                for component_name in components:
                    # Only tag if it's a React component (starts with uppercase)
                    if not component_name[0].isupper():
                        continue

                    # Determine category
                    if "components/ui" in str(component_file):
                        category = "components/ui"
                    else:
                        category = "components/custom"

                    # Check if already tagged
                    tag_target = f"{category}#{component_name}"

                    if tag_target in self.existing_tags:
                        continue

                    # Only tag reusable components (not page-specific ones)
                    # Skip if file has "page" in name
                    if "page" in component_file.stem.lower():
                        continue

                    self.items.append({
                        "type": "react_component",
                        "category": category,
                        "file": str(component_file),
                        "name": component_name,
                        "suggested_tag": tag_target,
                        "priority": "low"
                    })

                    component_count += 1

            except Exception as e:
                pass  # Skip files with errors

        print(f"   Found {component_count} untagged components")

    def scan_env_vars(self):
        """Scan for environment variables"""
        print("🔧 Scanning environment variables...")

        env_example = Path(".env.example")

        if not env_example.exists():
            print("   ⚠️  .env.example not found")
            return

        try:
            with open(env_example, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            env_count = 0

            for line in lines:
                # Skip comments and empty lines
                if line.strip().startswith("#") or not line.strip():
                    continue

                # Parse VAR_NAME=value
                match = re.match(r'([A-Z_][A-Z0-9_]*)=', line)
                if not match:
                    continue

                var_name = match.group(1)

                # Determine category
                if "DATABASE" in var_name or "DB_" in var_name:
                    category = "env/database"
                elif "AUTH" in var_name:
                    category = "env/auth"
                elif "S3_" in var_name or "STORAGE" in var_name:
                    category = "env/storage"
                elif "SENTRY" in var_name:
                    category = "env/sentry"
                else:
                    category = "env/general"

                # Check if already tagged
                tag_target = f"{category}#{var_name}"

                if tag_target in self.existing_tags:
                    continue

                self.items.append({
                    "type": "environment_variable",
                    "category": category,
                    "file": str(env_example),
                    "name": var_name,
                    "suggested_tag": tag_target,
                    "priority": "medium"
                })

                env_count += 1

            print(f"   Found {env_count} untagged environment variables")

        except Exception as e:
            print(f"   ⚠️  Error reading .env.example: {e}")

    def generate_report(self):
        """Generate audit report"""
        print()
        print("=" * 60)
        print("📊 Audit Summary")
        print("=" * 60)
        print()

        # Count by type
        by_type = {}
        for item in self.items:
            item_type = item["type"]
            by_type[item_type] = by_type.get(item_type, 0) + 1

        print(f"Total untagged items: {len(self.items)}")
        print()
        print("By type:")
        for item_type, count in sorted(by_type.items()):
            print(f"  {item_type}: {count}")

        print()

        # Count by priority
        by_priority = {}
        for item in self.items:
            priority = item["priority"]
            by_priority[priority] = by_priority.get(priority, 0) + 1

        print("By priority:")
        for priority in ["high", "medium", "low"]:
            count = by_priority.get(priority, 0)
            if count > 0:
                print(f"  {priority}: {count}")

        print()

        # Write JSON report
        report = {
            "generated": "AUTO-GENERATED by scripts/audit_taggable_items.py",
            "total_items": len(self.items),
            "existing_tags": len(self.existing_tags),
            "by_type": by_type,
            "by_priority": by_priority,
            "items": sorted(self.items, key=lambda x: (
                {"high": 0, "medium": 1, "low": 2}[x["priority"]],
                x["type"],
                x["name"]
            ))
        }

        os.makedirs("docs/dev", exist_ok=True)
        output_path = "docs/dev/taggable_items_report.json"

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2)

        print(f"✅ Report generated: {output_path}")
        print()

        # Generate markdown summary
        self.generate_markdown_summary(report)

    def generate_markdown_summary(self, report: Dict):
        """Generate markdown summary"""
        lines = [
            "# Taggable Items Audit Report",
            "",
            f"**Generated**: {report['generated']}",
            "",
            "## Summary",
            "",
            f"- **Total untagged items**: {report['total_items']}",
            f"- **Existing tags**: {report['existing_tags']}",
            "",
            "## By Type",
            "",
            "| Type | Count |",
            "|------|-------|",
        ]

        for item_type, count in sorted(report["by_type"].items()):
            lines.append(f"| {item_type} | {count} |")

        lines.extend([
            "",
            "## By Priority",
            "",
            "| Priority | Count |",
            "|----------|-------|",
        ])

        for priority in ["high", "medium", "low"]:
            count = report["by_priority"].get(priority, 0)
            if count > 0:
                lines.append(f"| {priority} | {count} |")

        lines.extend([
            "",
            "## Next Steps",
            "",
            "1. Review high-priority items (tRPC procedures)",
            "2. Run tagging plan generator: `pnpm docs:tag-plan`",
            "3. Review and approve generated tagging plan",
            "4. Apply tags: `pnpm docs:tag-apply`",
            "",
            "## Details",
            "",
            f"See full report: `docs/dev/taggable_items_report.json`",
            "",
        ])

        output_path = "docs/dev/TAGGABLE_ITEMS_REPORT.md"

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(lines))

        print(f"✅ Summary generated: {output_path}")
        print()

    def run(self):
        """Main audit execution"""
        print("=" * 60)
        print("🔍 Taggable Items Auditor")
        print("=" * 60)
        print()

        # Scan for existing tags first
        self.scan_existing_tags()

        # Scan for taggable items
        self.scan_trpc_routers()
        self.scan_database_tables()
        self.scan_components()
        self.scan_env_vars()

        # Generate report
        self.generate_report()

        return 0

def main():
    auditor = TaggableItemsAuditor()
    return auditor.run()

if __name__ == "__main__":
    exit(main())
