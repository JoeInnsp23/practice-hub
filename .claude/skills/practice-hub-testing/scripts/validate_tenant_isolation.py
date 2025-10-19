#!/usr/bin/env python3
"""
Validate multi-tenant data isolation in Practice Hub database queries.

Scans TypeScript files for database queries and checks if they properly scope by tenantId.

Usage:
    python scripts/validate_tenant_isolation.py
    python scripts/validate_tenant_isolation.py --path app/server/routers
    python scripts/validate_tenant_isolation.py --fix
"""

import argparse
import os
import re
import sys
from pathlib import Path
from typing import List, Dict, Tuple


class TenantIsolationValidator:
    def __init__(self, root_path: str = 'app/server/routers'):
        self.root_path = root_path
        self.issues = []
        self.warnings = []
        self.scanned_files = 0

    def scan_directory(self) -> None:
        """Scan all TypeScript files in directory."""
        for root, _, files in os.walk(self.root_path):
            for file in files:
                if file.endswith('.ts') and not file.endswith('.test.ts'):
                    file_path = os.path.join(root, file)
                    self.scan_file(file_path)

    def scan_file(self, file_path: str) -> None:
        """Scan a single file for tenant isolation issues."""
        self.scanned_files += 1

        with open(file_path, 'r') as f:
            content = f.read()
            lines = content.split('\n')

        # Pattern 1: db.select() without .where(eq(...tenantId))
        select_pattern = r'db\s*\.\s*select\([^)]*\)\s*\.from\((\w+)\)'

        for i, line in enumerate(lines, 1):
            # Check for select queries
            select_match = re.search(select_pattern, line)
            if select_match:
                table_name = select_match.group(1)

                # Look ahead ~5 lines for .where clause
                context_lines = '\n'.join(lines[i-1:min(i+5, len(lines))])

                # Check if tenantId is in the where clause
                has_tenant_filter = (
                    'tenantId' in context_lines or
                    'ctx.authContext.tenantId' in context_lines or
                    'authContext.tenantId' in context_lines
                )

                # Exceptions: system tables that don't need tenant scoping
                system_tables = ['tenants', 'sessions', 'accounts', 'verifications']
                if table_name in system_tables:
                    continue

                if not has_tenant_filter:
                    self.issues.append({
                        'file': file_path,
                        'line': i,
                        'table': table_name,
                        'type': 'missing_tenant_filter',
                        'code': line.strip()
                    })

        # Pattern 2: Hard-coded tenant IDs
        hardcoded_pattern = r'tenantId\s*[:=]\s*["\'][\w-]+["\']'
        for i, line in enumerate(lines, 1):
            if re.search(hardcoded_pattern, line) and 'test' not in line.lower():
                self.warnings.append({
                    'file': file_path,
                    'line': i,
                    'type': 'hardcoded_tenant_id',
                    'code': line.strip()
                })

    def print_report(self) -> None:
        """Print validation report."""
        print(f"\n{'='*70}")
        print(f"Practice Hub Multi-Tenant Isolation Validation")
        print(f"{'='*70}\n")

        print(f"📊 Scanned {self.scanned_files} files\n")

        if not self.issues and not self.warnings:
            print("✅ No tenant isolation issues found!\n")
            return

        # Print critical issues
        if self.issues:
            print(f"🚨 CRITICAL ISSUES ({len(self.issues)}):")
            print(f"{'─'*70}\n")

            for issue in self.issues:
                print(f"📄 {issue['file']}:{issue['line']}")
                print(f"   Table: {issue['table']}")
                print(f"   Issue: Query missing tenant filter")
                print(f"   Code:  {issue['code']}")
                print(f"   Fix:   Add .where(eq({issue['table']}.tenantId, ctx.authContext.tenantId))")
                print()

        # Print warnings
        if self.warnings:
            print(f"\n⚠️  WARNINGS ({len(self.warnings)}):")
            print(f"{'─'*70}\n")

            for warning in self.warnings:
                print(f"📄 {warning['file']}:{warning['line']}")
                print(f"   Issue: Hard-coded tenant ID")
                print(f"   Code:  {warning['code']}")
                print(f"   Fix:   Use ctx.authContext.tenantId instead")
                print()

        # Summary
        print(f"{'='*70}")
        print(f"Summary:")
        print(f"  🚨 Critical Issues: {len(self.issues)}")
        print(f"  ⚠️  Warnings: {len(self.warnings)}")
        print(f"{'='*70}\n")

        if self.issues:
            print("❌ FAILED: Fix critical issues before deploying to production!")
            sys.exit(1)
        elif self.warnings:
            print("⚠️  WARNINGS: Review warnings before deploying to production")
            sys.exit(0)

def main():
    parser = argparse.ArgumentParser(
        description='Validate multi-tenant data isolation in Practice Hub'
    )
    parser.add_argument(
        '--path',
        default='app/server/routers',
        help='Path to scan (default: app/server/routers)'
    )
    parser.add_argument(
        '--strict',
        action='store_true',
        help='Treat warnings as errors'
    )

    args = parser.parse_args()

    # Validate path exists
    if not os.path.exists(args.path):
        print(f"Error: Path '{args.path}' not found", file=sys.stderr)
        sys.exit(1)

    # Run validation
    validator = TenantIsolationValidator(args.path)
    validator.scan_directory()
    validator.print_report()

    # In strict mode, warnings are errors
    if args.strict and validator.warnings:
        sys.exit(1)


if __name__ == '__main__':
    main()
