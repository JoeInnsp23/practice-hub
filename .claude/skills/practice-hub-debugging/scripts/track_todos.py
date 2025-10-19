#!/usr/bin/env python3
"""
Track and categorize TODO/FIXME/HACK/XXX comments in Practice Hub codebase.

Helps identify technical debt and incomplete features before production.

Usage:
    python scripts/track_todos.py                    # List all TODOs
    python scripts/track_todos.py --by-priority      # Group by priority
    python scripts/track_todos.py --export todos.md  # Export to markdown
"""

import argparse
import os
import re
import sys
from pathlib import Path
from typing import List, Dict
from collections import defaultdict


class TodoTracker:
    def __init__(self, root_path: str = '.'):
        self.root_path = root_path
        self.todos = []
        self.priority_map = {
            'FIXME': 1,      # Critical - breaks functionality
            'HACK': 2,       # High - needs refactoring
            'TODO': 3,       # Medium - planned feature
            'XXX': 4,        # Low - minor improvement
            'NOTE': 5,       # Info - documentation
        }

    def should_skip_directory(self, path: str) -> bool:
        """Skip node_modules, .next, and other non-source directories."""
        skip_dirs = ['node_modules', '.next', 'dist', 'build', 'coverage', '.git', '.claude']
        return any(skip_dir in path for skip_dir in skip_dirs)

    def scan_directory(self) -> None:
        """Scan all source files for TODO comments."""
        extensions = ('.ts', '.tsx', '.js', '.jsx', '.py', '.sh', '.md')

        for root, dirs, files in os.walk(self.root_path):
            if self.should_skip_directory(root):
                continue

            for file in files:
                if file.endswith(extensions):
                    file_path = os.path.join(root, file)
                    self.scan_file(file_path)

    def scan_file(self, file_path: str) -> None:
        """Scan a single file for TODO comments."""
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()

        # Patterns: TODO:, FIXME:, HACK:, XXX:, NOTE:
        pattern = r'(TODO|FIXME|HACK|XXX|NOTE):\s*(.+)'

        for i, line in enumerate(lines, 1):
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                todo_type = match.group(1).upper()
                description = match.group(2).strip()

                # Extract context (previous line if available)
                context = ''
                if i > 1:
                    prev_line = lines[i-2].strip()
                    if prev_line and not re.search(pattern, prev_line):
                        context = prev_line

                self.todos.append({
                    'file': file_path,
                    'line': i,
                    'type': todo_type,
                    'description': description,
                    'code': line.strip(),
                    'context': context,
                    'priority': self.priority_map.get(todo_type, 5)
                })

    def print_report(self, by_priority: bool = False) -> None:
        """Print TODO report."""
        print(f"\n{'='*70}")
        print(f"Practice Hub TODO Tracker")
        print(f"{'='*70}\n")

        if not self.todos:
            print("✅ No TODOs found!\n")
            return

        print(f"Found {len(self.todos)} TODOs:\n")

        if by_priority:
            self._print_by_priority()
        else:
            self._print_by_file()

        # Summary by type
        print(f"\n{'='*70}")
        print("Summary by Type:")
        print(f"{'='*70}")

        by_type = defaultdict(int)
        for todo in self.todos:
            by_type[todo['type']] += 1

        for todo_type in sorted(by_type.keys(), key=lambda x: self.priority_map[x]):
            emoji = self._get_emoji(todo_type)
            print(f"  {emoji} {todo_type:6s}: {by_type[todo_type]:3d}")

        print(f"{'='*70}\n")

        # Recommendations
        self._print_recommendations()

    def _print_by_file(self) -> None:
        """Print TODOs grouped by file."""
        by_file = defaultdict(list)
        for todo in self.todos:
            by_file[todo['file']].append(todo)

        for file, todos in sorted(by_file.items()):
            print(f"\n📄 {file} ({len(todos)} items)")
            print(f"{'─'*70}")

            for todo in todos:
                emoji = self._get_emoji(todo['type'])
                print(f"   {emoji} Line {todo['line']:4d} [{todo['type']}]: {todo['description']}")

    def _print_by_priority(self) -> None:
        """Print TODOs grouped by priority."""
        by_priority = defaultdict(list)
        for todo in self.todos:
            by_priority[todo['priority']].append(todo)

        priority_names = {
            1: "🚨 CRITICAL (FIXME)",
            2: "⚠️  HIGH (HACK)",
            3: "📝 MEDIUM (TODO)",
            4: "💡 LOW (XXX)",
            5: "📌 INFO (NOTE)"
        }

        for priority in sorted(by_priority.keys()):
            todos = by_priority[priority]
            print(f"\n{priority_names[priority]} - {len(todos)} items")
            print(f"{'─'*70}")

            for todo in todos:
                print(f"   📄 {todo['file']}:{todo['line']}")
                print(f"      {todo['description']}")

    def _get_emoji(self, todo_type: str) -> str:
        """Get emoji for TODO type."""
        emojis = {
            'FIXME': '🚨',
            'HACK': '⚠️ ',
            'TODO': '📝',
            'XXX': '💡',
            'NOTE': '📌'
        }
        return emojis.get(todo_type, '📝')

    def _print_recommendations(self) -> None:
        """Print actionable recommendations."""
        critical_count = sum(1 for t in self.todos if t['priority'] == 1)
        high_count = sum(1 for t in self.todos if t['priority'] == 2)

        print("💡 Recommendations:")

        if critical_count > 0:
            print(f"   🚨 {critical_count} FIXME items - Address before production!")

        if high_count > 0:
            print(f"   ⚠️  {high_count} HACK items - Refactor when possible")

        if len(self.todos) > 50:
            print("   📊 High TODO count - Consider sprint planning to address backlog")

        print()

    def export_markdown(self, output_file: str) -> None:
        """Export TODOs to markdown file."""
        with open(output_file, 'w') as f:
            f.write("# Practice Hub TODOs\n\n")
            f.write(f"**Total Items:** {len(self.todos)}\n\n")

            # By priority
            f.write("## By Priority\n\n")

            by_priority = defaultdict(list)
            for todo in self.todos:
                by_priority[todo['priority']].append(todo)

            priority_names = {
                1: "🚨 CRITICAL (FIXME)",
                2: "⚠️ HIGH (HACK)",
                3: "📝 MEDIUM (TODO)",
                4: "💡 LOW (XXX)",
                5: "📌 INFO (NOTE)"
            }

            for priority in sorted(by_priority.keys()):
                todos = by_priority[priority]
                f.write(f"### {priority_names[priority]} ({len(todos)} items)\n\n")

                for todo in todos:
                    f.write(f"- **{todo['file']}:{todo['line']}**\n")
                    f.write(f"  - {todo['description']}\n")

                f.write("\n")

        print(f"✅ Exported to {output_file}")


def main():
    parser = argparse.ArgumentParser(
        description='Track TODO/FIXME/HACK comments in Practice Hub'
    )
    parser.add_argument(
        '--path',
        default='.',
        help='Root path to scan (default: current directory)'
    )
    parser.add_argument(
        '--by-priority',
        action='store_true',
        help='Group by priority instead of file'
    )
    parser.add_argument(
        '--export',
        metavar='FILE',
        help='Export to markdown file'
    )

    args = parser.parse_args()

    # Validate path
    if not os.path.exists(args.path):
        print(f"Error: Path '{args.path}' not found", file=sys.stderr)
        sys.exit(1)

    # Scan for TODOs
    tracker = TodoTracker(args.path)
    print("🔍 Scanning for TODOs...")
    tracker.scan_directory()

    # Print report
    tracker.print_report(by_priority=args.by_priority)

    # Export if requested
    if args.export:
        tracker.export_markdown(args.export)

    # Exit with error if critical TODOs found
    critical_todos = [t for t in tracker.todos if t['priority'] == 1]
    if critical_todos:
        print("❌ CRITICAL TODOs found - address before production deployment!")
        sys.exit(1)


if __name__ == '__main__':
    main()
