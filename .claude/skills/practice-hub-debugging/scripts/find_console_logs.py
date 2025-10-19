#!/usr/bin/env python3
"""
Find and optionally remove console.log statements from Practice Hub codebase.

Production code should not contain console.log - use proper logging instead.

Usage:
    python scripts/find_console_logs.py                    # List all console.logs
    python scripts/find_console_logs.py --remove          # Remove all console.logs
    python scripts/find_console_logs.py --interactive     # Interactively remove
"""

import argparse
import os
import re
import sys
from pathlib import Path
from typing import List, Dict, Tuple


class ConsoleLogFinder:
    def __init__(self, root_path: str = '.'):
        self.root_path = root_path
        self.findings = []
        self.removed_count = 0
        self.kept_count = 0

    def should_skip_directory(self, path: str) -> bool:
        """Skip node_modules, .next, and other non-source directories."""
        skip_dirs = ['node_modules', '.next', 'dist', 'build', 'coverage', '.git']
        return any(skip_dir in path for skip_dir in skip_dirs)

    def scan_directory(self) -> None:
        """Scan all TypeScript/JavaScript files."""
        extensions = ('.ts', '.tsx', '.js', '.jsx')

        for root, dirs, files in os.walk(self.root_path):
            # Skip directories
            if self.should_skip_directory(root):
                continue

            for file in files:
                if file.endswith(extensions):
                    file_path = os.path.join(root, file)
                    self.scan_file(file_path)

    def scan_file(self, file_path: str) -> None:
        """Scan a single file for console.log statements."""
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            lines = content.split('\n')

        # Patterns to match
        patterns = [
            r'console\.log\(',
            r'console\.warn\(',
            r'console\.error\(',
            r'console\.debug\(',
            r'console\.info\(',
        ]

        for i, line in enumerate(lines, 1):
            for pattern in patterns:
                if re.search(pattern, line):
                    # Skip if it's a comment
                    stripped = line.strip()
                    if stripped.startswith('//') or stripped.startswith('*'):
                        continue

                    self.findings.append({
                        'file': file_path,
                        'line': i,
                        'code': line.strip(),
                        'type': pattern.replace('\\', '').replace('(', '')
                    })

    def print_report(self) -> None:
        """Print findings report."""
        print(f"\n{'='*70}")
        print(f"Practice Hub Console Statement Finder")
        print(f"{'='*70}\n")

        if not self.findings:
            print("✅ No console statements found!\n")
            return

        print(f"Found {len(self.findings)} console statements:\n")

        # Group by file
        by_file = {}
        for finding in self.findings:
            file = finding['file']
            if file not in by_file:
                by_file[file] = []
            by_file[file].append(finding)

        for file, findings in sorted(by_file.items()):
            print(f"\n📄 {file} ({len(findings)} statements)")
            print(f"{'─'*70}")

            for finding in findings:
                print(f"   Line {finding['line']:4d}: {finding['code']}")

        print(f"\n{'='*70}")
        print(f"Summary: {len(self.findings)} console statements in {len(by_file)} files")
        print(f"{'='*70}\n")

        print("💡 Recommendations:")
        print("   • Remove console.log from production code")
        print("   • Use console.error for genuine errors only")
        print("   • Consider proper logging library for production")
        print("\nRun with --remove to automatically remove console.log statements")
        print()

    def remove_console_logs(self, interactive: bool = False) -> None:
        """Remove console.log statements from files."""
        print(f"\n🧹 Removing console statements...\n")

        files_to_process = {}
        for finding in self.findings:
            file = finding['file']
            if file not in files_to_process:
                files_to_process[file] = []
            files_to_process[file].append(finding)

        for file_path, findings in files_to_process.items():
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            lines_to_remove = set()

            for finding in findings:
                line_idx = finding['line'] - 1  # Convert to 0-indexed

                if interactive:
                    print(f"\n📄 {file_path}:{finding['line']}")
                    print(f"   {finding['code']}")
                    response = input("   Remove this line? [y/N]: ").strip().lower()

                    if response == 'y':
                        lines_to_remove.add(line_idx)
                        self.removed_count += 1
                    else:
                        self.kept_count += 1
                else:
                    # Auto-remove only console.log, keep console.error
                    if 'console.log' in finding['code']:
                        lines_to_remove.add(line_idx)
                        self.removed_count += 1
                    else:
                        self.kept_count += 1

            if lines_to_remove:
                # Remove lines (in reverse order to maintain indices)
                for idx in sorted(lines_to_remove, reverse=True):
                    del lines[idx]

                # Write back
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.writelines(lines)

                print(f"   ✅ Removed {len(lines_to_remove)} lines from {file_path}")

        print(f"\n{'='*70}")
        print(f"Cleanup Summary:")
        print(f"  Removed: {self.removed_count}")
        print(f"  Kept:    {self.kept_count}")
        print(f"{'='*70}\n")


def main():
    parser = argparse.ArgumentParser(
        description='Find and remove console statements from Practice Hub'
    )
    parser.add_argument(
        '--path',
        default='.',
        help='Root path to scan (default: current directory)'
    )
    parser.add_argument(
        '--remove',
        action='store_true',
        help='Automatically remove console.log statements'
    )
    parser.add_argument(
        '--interactive',
        action='store_true',
        help='Interactively choose which statements to remove'
    )

    args = parser.parse_args()

    # Validate path
    if not os.path.exists(args.path):
        print(f"Error: Path '{args.path}' not found", file=sys.stderr)
        sys.exit(1)

    # Scan for console statements
    finder = ConsoleLogFinder(args.path)
    print("🔍 Scanning for console statements...")
    finder.scan_directory()

    # Print report
    finder.print_report()

    # Remove if requested
    if args.remove or args.interactive:
        if finder.findings:
            if not args.interactive:
                confirm = input("\n⚠️  This will modify files. Continue? [y/N]: ").strip().lower()
                if confirm != 'y':
                    print("Cancelled.")
                    sys.exit(0)

            finder.remove_console_logs(interactive=args.interactive)
        else:
            print("Nothing to remove.")

    # Exit with error code if console statements found
    if finder.findings and not (args.remove or args.interactive):
        sys.exit(1)


if __name__ == '__main__':
    main()
