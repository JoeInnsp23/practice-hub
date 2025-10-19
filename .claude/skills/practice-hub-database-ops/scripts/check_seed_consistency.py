#!/usr/bin/env python3
"""
Check that seed data in scripts/seed.ts matches database schema.

Helps catch issues where schema was updated but seed data wasn't.

Usage:
    python scripts/check_seed_consistency.py
    python scripts/check_seed_consistency.py --verbose
"""

import argparse
import os
import re
import sys
from typing import List, Dict, Set


class SeedConsistencyChecker:
    def __init__(self, schema_file: str = 'lib/db/schema.ts', seed_file: str = 'scripts/seed.ts'):
        self.schema_file = schema_file
        self.seed_file = seed_file
        self.schema_tables = {}
        self.seed_tables = set()
        self.issues = []
        self.warnings = []

    def check(self) -> None:
        """Run consistency checks."""
        if not os.path.exists(self.schema_file):
            print(f"Error: Schema file '{self.schema_file}' not found", file=sys.stderr)
            sys.exit(1)

        if not os.path.exists(self.seed_file):
            print(f"Error: Seed file '{self.seed_file}' not found", file=sys.stderr)
            sys.exit(1)

        self.parse_schema()
        self.parse_seed()
        self.check_coverage()
        self.check_fields()

    def parse_schema(self) -> None:
        """Extract table definitions from schema."""
        with open(self.schema_file, 'r') as f:
            content = f.read()

        # Pattern: export const tableName = pgTable("table_name", { ... })
        pattern = r'export const (\w+) = pgTable\("(\w+)",\s*\{([^}]+)\}'

        matches = re.finditer(pattern, content, re.DOTALL)

        for match in matches:
            const_name = match.group(1)
            table_name = match.group(2)
            fields_block = match.group(3)

            # Extract field names (excluding functions/methods)
            field_pattern = r'(\w+):\s*(?:text|varchar|uuid|integer|boolean|timestamp|decimal|jsonb|date)\('
            fields = re.findall(field_pattern, fields_block)

            # Required fields (exclude auto-generated ones)
            required_fields = [
                f for f in fields
                if f not in ['id', 'createdAt', 'updatedAt'] and not f.endswith('At')
            ]

            self.schema_tables[const_name] = {
                'table_name': table_name,
                'fields': fields,
                'required_fields': required_fields
            }

    def parse_seed(self) -> None:
        """Extract tables being seeded."""
        with open(self.seed_file, 'r') as f:
            content = f.read()

        # Pattern: db.insert(tableName).values(...)
        pattern = r'db\.insert\((\w+)\)\.values'

        matches = re.findall(pattern, content)
        self.seed_tables = set(matches)

    def check_coverage(self) -> None:
        """Check that all tables are being seeded."""
        # Tables that don't need seed data
        skip_tables = {
            'sessions',  # Better Auth - runtime only
            'accounts',  # Better Auth - runtime only
            'verifications',  # Better Auth - runtime only
            'drizzleMigrations',  # Drizzle system table
        }

        for table_const, table_info in self.schema_tables.items():
            if table_const in skip_tables:
                continue

            if table_const not in self.seed_tables:
                self.warnings.append({
                    'table': table_const,
                    'type': 'not_seeded',
                    'message': f"Table '{table_const}' ({table_info['table_name']}) has no seed data",
                    'fix': f"Add db.insert({table_const}).values([...]) to scripts/seed.ts"
                })

    def check_fields(self) -> None:
        """Check that seed data includes all required fields."""
        with open(self.seed_file, 'r') as f:
            seed_content = f.read()

        for table_const in self.seed_tables:
            if table_const not in self.schema_tables:
                self.issues.append({
                    'table': table_const,
                    'type': 'unknown_table',
                    'message': f"Seed data references unknown table '{table_const}'",
                    'fix': "Remove from seed.ts or add to schema.ts"
                })
                continue

            table_info = self.schema_tables[table_const]

            # Extract seed values block for this table
            pattern = rf'db\.insert\({table_const}\)\.values\((.*?)\)'
            match = re.search(pattern, seed_content, re.DOTALL)

            if match:
                values_block = match.group(1)

                # Check for required fields
                missing_fields = []
                for field in table_info['required_fields']:
                    if field + ':' not in values_block and f'"{field}"' not in values_block:
                        missing_fields.append(field)

                if missing_fields:
                    self.warnings.append({
                        'table': table_const,
                        'type': 'missing_fields',
                        'message': f"Seed data for '{table_const}' may be missing fields: {', '.join(missing_fields)}",
                        'fix': "Add missing fields to seed data or mark as optional in schema"
                    })

    def print_report(self) -> None:
        """Print consistency report."""
        print(f"\n{'='*70}")
        print(f"Practice Hub Seed Data Consistency Check")
        print(f"{'='*70}\n")

        print(f"📊 Schema tables: {len(self.schema_tables)}")
        print(f"📊 Seeded tables: {len(self.seed_tables)}\n")

        if not self.issues and not self.warnings:
            print("✅ Seed data is consistent with schema!\n")
            return

        # Print critical issues
        if self.issues:
            print(f"🚨 CRITICAL ISSUES ({len(self.issues)}):")
            print(f"{'─'*70}\n")

            for issue in self.issues:
                print(f"Table: {issue['table']}")
                print(f"Issue: {issue['message']}")
                print(f"Fix:   {issue['fix']}")
                print()

        # Print warnings
        if self.warnings:
            print(f"⚠️  WARNINGS ({len(self.warnings)}):")
            print(f"{'─'*70}\n")

            for warning in self.warnings:
                print(f"Table: {warning['table']}")
                print(f"Issue: {warning['message']}")
                print(f"Fix:   {warning['fix']}")
                print()

        # Summary
        print(f"{'='*70}")
        print(f"Summary:")
        print(f"  🚨 Issues:   {len(self.issues)}")
        print(f"  ⚠️  Warnings: {len(self.warnings)}")
        print(f"{'='*70}\n")

        if self.issues:
            print("❌ FAILED: Fix critical issues before resetting database")
            sys.exit(1)
        elif self.warnings:
            print("⚠️  WARNINGS: Review before finalizing seed data")
            sys.exit(0)


def main():
    parser = argparse.ArgumentParser(
        description='Check seed data consistency with schema'
    )
    parser.add_argument(
        '--schema',
        default='lib/db/schema.ts',
        help='Path to schema file (default: lib/db/schema.ts)'
    )
    parser.add_argument(
        '--seed',
        default='scripts/seed.ts',
        help='Path to seed file (default: scripts/seed.ts)'
    )
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Verbose output'
    )

    args = parser.parse_args()

    # Run check
    checker = SeedConsistencyChecker(args.schema, args.seed)
    checker.check()
    checker.print_report()


if __name__ == '__main__':
    main()
