#!/usr/bin/env python3
"""
Generate Tagging Plan

Reads taggable_items_report.json and generates a detailed tagging plan
with exact line numbers and tag content for each item.

Usage: python3 scripts/generate_tagging_plan.py [--priority high|medium|low]
Output: docs/dev/tagging_plan.json
"""

import os
import re
import json
import sys
from pathlib import Path
from typing import List, Dict, Optional

class TaggingPlanGenerator:
    """Generates detailed tagging plan from audit report"""

    def __init__(self, priority_filter: Optional[str] = None):
        self.priority_filter = priority_filter
        self.report: Dict = {}
        self.plan_items: List[Dict] = []

    def load_report(self) -> bool:
        """Load taggable items report"""
        report_file = "docs/dev/taggable_items_report.json"

        if not os.path.exists(report_file):
            print(f"❌ Report not found: {report_file}")
            print("   Run: pnpm docs:audit-tags")
            return False

        try:
            with open(report_file, 'r', encoding='utf-8') as f:
                self.report = json.load(f)
            return True
        except Exception as e:
            print(f"❌ Error loading report: {e}")
            return False

    def find_line_number(self, file_path: str, search_pattern: str) -> Optional[int]:
        """Find line number where tag should be inserted"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            for i, line in enumerate(lines):
                if re.search(search_pattern, line):
                    # Return line number (1-indexed)
                    # Tag should be inserted BEFORE this line
                    return i + 1

            return None

        except Exception as e:
            print(f"⚠️  Error reading {file_path}: {e}")
            return None

    def generate_tag_content(self, item: Dict) -> str:
        """Generate the JSDoc comment with @doc tag"""
        item_type = item["type"]
        name = item["name"]
        category = item["category"]
        suggested_tag = item["suggested_tag"]

        # Base template
        lines = [
            "/**",
            f" * @doc:{suggested_tag}",
            f" * @doc-summary TODO: Add summary for {name}",
        ]

        # Audience based on type
        if item_type == "trpc_procedure":
            lines.append(" * @doc-audience dev")
            lines.append(" * @doc-tags TODO,api,trpc")
        elif item_type == "database_table":
            lines.append(" * @doc-audience dev,ops")
            lines.append(" * @doc-tags TODO,database,schema")
        elif item_type == "react_component":
            lines.append(" * @doc-audience dev")
            lines.append(" * @doc-tags TODO,component,ui")
        elif item_type == "environment_variable":
            lines.append(" * @doc-audience ops")
            lines.append(" * @doc-tags TODO,environment,config")

        lines.extend([
            " *",
            f" * TODO: Add detailed documentation for {name}",
            " *",
            " * **Purpose**: TODO",
            " *",
        ])

        # Type-specific sections
        if item_type == "trpc_procedure":
            lines.extend([
                " * **Input**: TODO",
                " * **Output**: TODO",
                " *",
                " * **Example**:",
                " * ```typescript",
                " * // TODO: Add usage example",
                " * ```",
            ])
        elif item_type == "database_table":
            lines.extend([
                " * **Relationships**: TODO",
                " * **Indexes**: TODO",
            ])
        elif item_type == "react_component":
            lines.extend([
                " * **Props**: TODO",
                " *",
                " * **Example**:",
                " * ```tsx",
                " * // TODO: Add usage example",
                " * ```",
            ])
        elif item_type == "environment_variable":
            lines.extend([
                " * **Required**: Yes/No",
                " * **Format**: TODO",
                " * **Default**: TODO",
            ])

        lines.append(" */")

        return "\n".join(lines)

    def generate_plan_for_item(self, item: Dict) -> Optional[Dict]:
        """Generate tagging plan for a single item"""
        file_path = item["file"]
        name = item["name"]
        item_type = item["type"]

        # Determine search pattern based on type
        if item_type == "trpc_procedure":
            search_pattern = rf'export const {re.escape(name)}\s*='
        elif item_type == "database_table":
            search_pattern = rf'export const {re.escape(name)}\s*=\s*pgTable\('
        elif item_type == "react_component":
            search_pattern = rf'export (?:function|const) {re.escape(name)}'
        elif item_type == "environment_variable":
            # For env vars, tag goes in .env.example as a comment
            search_pattern = rf'^{re.escape(name)}='
        else:
            return None

        # Find line number
        line_number = self.find_line_number(file_path, search_pattern)

        if line_number is None:
            return {
                "item": item,
                "status": "not_found",
                "error": f"Could not find '{name}' in {file_path}"
            }

        # Generate tag content
        tag_content = self.generate_tag_content(item)

        return {
            "item": item,
            "status": "ready",
            "file": file_path,
            "line_number": line_number,
            "insert_before_line": line_number,
            "tag_content": tag_content,
            "action": "insert_tag"
        }

    def generate_plan(self):
        """Generate complete tagging plan"""
        print("📝 Generating tagging plan...\n")

        items = self.report.get("items", [])

        # Filter by priority if specified
        if self.priority_filter:
            items = [i for i in items if i["priority"] == self.priority_filter]
            print(f"   Filtering by priority: {self.priority_filter}")

        print(f"   Processing {len(items)} items\n")

        # Generate plan for each item
        ready_count = 0
        not_found_count = 0

        for item in items:
            plan_item = self.generate_plan_for_item(item)

            if plan_item:
                self.plan_items.append(plan_item)

                if plan_item["status"] == "ready":
                    ready_count += 1
                elif plan_item["status"] == "not_found":
                    not_found_count += 1

        # Print summary
        print("=" * 60)
        print("📊 Plan Generation Summary")
        print("=" * 60)
        print(f"Total items: {len(self.plan_items)}")
        print(f"Ready to tag: {ready_count}")
        print(f"Not found: {not_found_count}")
        print()

        # Write plan
        plan = {
            "generated": "AUTO-GENERATED by scripts/generate_tagging_plan.py",
            "priority_filter": self.priority_filter,
            "total_items": len(self.plan_items),
            "ready": ready_count,
            "not_found": not_found_count,
            "items": self.plan_items
        }

        output_path = "docs/dev/tagging_plan.json"
        os.makedirs("docs/dev", exist_ok=True)

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(plan, f, indent=2)

        print(f"✅ Plan generated: {output_path}")
        print()

        # Generate markdown summary
        self.generate_markdown_summary(plan)

        return plan

    def generate_markdown_summary(self, plan: Dict):
        """Generate markdown summary of tagging plan"""
        lines = [
            "# Tagging Plan",
            "",
            f"**Generated**: {plan['generated']}",
            "",
        ]

        if plan["priority_filter"]:
            lines.append(f"**Priority Filter**: {plan['priority_filter']}")
            lines.append("")

        lines.extend([
            "## Summary",
            "",
            f"- **Total items**: {plan['total_items']}",
            f"- **Ready to tag**: {plan['ready']}",
            f"- **Not found**: {plan['not_found']}",
            "",
            "## Items by Status",
            "",
            "### Ready to Tag",
            "",
        ])

        ready_items = [i for i in plan["items"] if i["status"] == "ready"]
        not_found_items = [i for i in plan["items"] if i["status"] == "not_found"]

        if ready_items:
            lines.append("| File | Name | Type | Line |")
            lines.append("|------|------|------|------|")

            for item in ready_items[:50]:  # Limit to first 50
                file_path = item["file"]
                name = item["item"]["name"]
                item_type = item["item"]["type"]
                line = item["line_number"]

                lines.append(f"| {file_path} | {name} | {item_type} | {line} |")

            if len(ready_items) > 50:
                lines.append("")
                lines.append(f"...and {len(ready_items) - 50} more")
        else:
            lines.append("No items ready to tag.")

        lines.extend([
            "",
            "### Not Found",
            "",
        ])

        if not_found_items:
            for item in not_found_items[:20]:
                name = item["item"]["name"]
                error = item.get("error", "Unknown error")
                lines.append(f"- **{name}**: {error}")

            if len(not_found_items) > 20:
                lines.append(f"- ...and {len(not_found_items) - 20} more")
        else:
            lines.append("No items with errors.")

        lines.extend([
            "",
            "## Next Steps",
            "",
            "1. Review this plan: `docs/dev/tagging_plan.json`",
            "2. Manually verify a few items (check line numbers are correct)",
            "3. Apply tags: `pnpm docs:tag-apply` (DRY RUN first)",
            "4. Review applied tags",
            "5. Run extraction pipeline: `pnpm docs:extract && pnpm docs:build`",
            "",
            "## Manual Application",
            "",
            "To manually apply tags, copy the `tag_content` from `tagging_plan.json`",
            "and insert it at the `insert_before_line` number in each file.",
            "",
        ])

        output_path = "docs/dev/TAGGING_PLAN.md"

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(lines))

        print(f"✅ Summary generated: {output_path}")
        print()

    def run(self):
        """Main execution"""
        print("=" * 60)
        print("📋 Tagging Plan Generator")
        print("=" * 60)
        print()

        # Load report
        if not self.load_report():
            return 1

        print(f"✅ Loaded report: {self.report['total_items']} items\n")

        # Generate plan
        self.generate_plan()

        return 0

def main():
    priority_filter = None

    # Parse arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "--priority" and len(sys.argv) > 2:
            priority_filter = sys.argv[2]
            if priority_filter not in ["high", "medium", "low"]:
                print(f"❌ Invalid priority: {priority_filter}")
                print("   Valid: high, medium, low")
                return 1

    generator = TaggingPlanGenerator(priority_filter=priority_filter)
    return generator.run()

if __name__ == "__main__":
    sys.exit(main())
